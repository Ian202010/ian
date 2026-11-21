// Integration test: drives src/channel.js the way Claude Code does (stdio MCP client).
// Needs Postgres at DATABASE_URL (default postgres://hub:hub@localhost:5432/hub).
import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ensureSchema, HUB_ROOT, pool } from '../src/db.js';
import * as ops from '../src/ops.js';

const NAME = `test-${process.pid}`;
const notes = [];
let client;

const waitFor = async (fn, ms = 5000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 50)); }
  throw new Error('timed out');
};
const call = async (name, args = {}) => (await client.callTool({ name, arguments: args })).content[0].text;

before(async () => {
  await ensureSchema();
  // queued before the session exists: must be delivered on connect
  await ops.sendMessage({ from: 'user', to: NAME, body: 'queued hello' });
  client = new Client({ name: 'fake-claude', version: '0' });
  client.fallbackNotificationHandler = async (n) => { notes.push(n); };
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: [path.join(HUB_ROOT, 'src', 'channel.js')],
    env: { ...process.env, HUB_SESSION: NAME },
    stderr: 'inherit',
  }));
});

after(async () => {
  await client?.close();
  await pool.query('DELETE FROM messages WHERE from_name=$1 OR to_name=$1', [NAME]);
  await pool.query('DELETE FROM tasks WHERE created_by=$1', [NAME]);
  await pool.query('DELETE FROM sessions WHERE name=$1', [NAME]);
  await pool.end();
});

test('declares itself a channel with permission relay', () => {
  const caps = client.getServerCapabilities();
  assert.deepEqual(caps.experimental['claude/channel'], {});
  assert.deepEqual(caps.experimental['claude/channel/permission'], {});
  assert.match(client.getInstructions(), /<channel source="hub"/);
});

test('queued message is pushed after connect, then live messages are pushed', async () => {
  const first = await waitFor(() => notes.find((n) => n.params?.content === 'queued hello'));
  assert.equal(first.method, 'notifications/claude/channel');
  assert.equal(first.params.meta.from, 'user');
  assert.match(first.params.meta.msg_id, /^\d+$/);
  await waitFor(async () => (await ops.getSession(NAME))?.status === 'online');

  const m = await ops.sendMessage({ from: 'user', to: NAME, body: 'live ping', meta: { via: 'voice', 'bad-key': 'x' } });
  const live = await waitFor(() => notes.find((n) => n.params?.content === 'live ping'));
  assert.equal(live.params.meta.via, 'voice');
  assert.ok(!('bad-key' in live.params.meta));
  assert.ok((await ops.getMessage(m.id)).delivered_at, 'marked delivered');
});

test('reply goes back to the last sender and is stored', async () => {
  const text = await call('reply', { text: 'pong from test' });
  assert.match(text, /sent to user/);
  const [last] = (await ops.getMessages({ with: NAME, limit: 1 }));
  assert.equal(last.from_name, NAME);
  assert.equal(last.to_name, 'user');
  assert.equal(last.body, 'pong from test');
});

test('send_message rejects unknown sessions', async () => {
  const r = await client.callTool({ name: 'send_message', arguments: { to: 'nobody-here', text: 'hi' } });
  assert.equal(r.isError, true);
});

test('search_history finds old messages', async () => {
  assert.match(await call('search_history', { query: 'pong', with: NAME }), /pong\*\* from test/);
});

test('task tools', async () => {
  const added = await call('task_add', { title: 'Write tests', project: 'hub-test', priority: 1 });
  const id = Number(added.match(/#(\d+)/)[1]);
  assert.match(await call('task_list', { project: 'hub-test' }), /Write tests/);
  assert.match(await call('task_update', { id, status: 'in progress', append_note: 'started' }), /in_progress/);
  assert.match(await call('task_projects'), /hub-test: in_progress 1/);
  await call('task_update', { id, status: 'done' });
  assert.ok((await ops.getTask(id)).completed_at);
  await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
});

test('permission relay round trip', async () => {
  await client.notification({
    method: 'notifications/claude/channel/permission_request',
    params: { request_id: 'abcde', tool_name: 'Bash', description: 'run ls', input_preview: 'ls -la' },
  });
  const req = await waitFor(async () => (await ops.getMessages({ with: NAME, limit: 5 })).find((m) => m.kind === 'permission'));
  assert.equal(req.meta.request_id, 'abcde');
  await ops.sendMessage({ from: 'user', to: NAME, kind: 'permission_verdict', body: 'allow abcde', meta: { request_id: 'abcde', behavior: 'allow' } });
  const verdict = await waitFor(() => notes.find((n) => n.method === 'notifications/claude/channel/permission'));
  assert.deepEqual(verdict.params, { request_id: 'abcde', behavior: 'allow' });
});
