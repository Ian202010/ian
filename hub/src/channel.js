#!/usr/bin/env node
// Claude Hub channel: an MCP server Claude Code spawns over stdio.
// Messages addressed to this session in Postgres are PUSHED into the conversation as
// <channel source="hub" ...> events (Claude Code channels), so Claude never has to poll.
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ensureSchema, listen, pool } from './db.js';
import * as ops from './ops.js';
import { captureScreen, sendKeys, spawnSession, stopSession, tmuxSessions } from './tmux.js';

// stdout belongs to the MCP protocol; send all logging to stderr.
console.log = console.error;

const NAME = process.env.HUB_SESSION || `cli-${path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30)}`;
const RELAY_PERMISSIONS = process.env.HUB_PERMISSION_RELAY !== '0';
let lastFrom = ops.USER;

const instructions = `You are the Claude Code session named "${NAME}", connected to Claude Hub.
Messages from your human ("user") and from other Claude sessions are pushed into this conversation as
<channel source="hub" from="..." msg_id="..."> events. Treat a message from "user" exactly like something they typed to you.
The human is usually NOT watching this terminal: they read your replies in the hub web UI / phone app, often by voice.
- Answer every channel message with the reply tool (to = the "from" attribute). Keep replies short and speakable; put detail in files.
- Use send_message to talk to other sessions, and list_sessions to see who exists. Messages to offline sessions are queued.
- Every message ever sent is stored permanently. When you are missing context, call search_history before asking the human.
- Track work in the task backlog (task_add / task_list / task_update), categorised by project, status and priority (0 urgent … 3 someday).
- You can start, watch, drive and stop other Claude sessions with spawn_session, read_screen, send_keys and stop_session.`;

const capabilities = { tools: {}, experimental: { 'claude/channel': {} } };
if (RELAY_PERMISSIONS) capabilities.experimental['claude/channel/permission'] = {};

const mcp = new Server({ name: 'hub', version: '0.1.0' }, { capabilities, instructions });

// ---------- tools ----------

const str = (description) => ({ type: 'string', description });
const int = (description) => ({ type: 'integer', description });
const tool = (name, description, properties = {}, required = []) => ({
  name, description, inputSchema: { type: 'object', properties, required },
});

const TOOLS = [
  tool('reply', 'Reply to whoever messaged you (defaults to the sender of the latest channel message, usually "user").',
    { text: str('Message text (markdown ok, keep it speakable)'), to: str('Recipient: "user" or a session name') }, ['text']),
  tool('send_message', 'Send a message to another Claude session (pushed into its conversation) or to "user".',
    { to: str('Session name or "user"'), text: str('Message text') }, ['to', 'text']),
  tool('list_sessions', 'List all hub sessions with status, working directory and queued message count.'),
  tool('search_history', 'Full-text search the permanent history of every message between the human and all sessions.',
    { query: str('Search terms (web-search syntax: "exact phrase", -exclude, or)'), with: str('Only messages to/from this participant'), limit: int('Max results (default 20)') }, ['query']),
  tool('get_messages', 'Read recent messages, optionally only those to/from one participant.',
    { with: str('Participant name ("user" or a session)'), before_id: int('Page backwards from this message id'), limit: int('Max messages (default 30)') }),
  tool('spawn_session', 'Start a new Claude Code session in tmux, connected to the hub. The prompt is delivered once it is up.',
    { name: str('Short unique name, e.g. "api-refactor"'), cwd: str('Working directory (created if missing)'), prompt: str('Initial task for the session'), extra_args: str('Extra claude CLI args, e.g. "--permission-mode acceptEdits"'), description: str('One-line description shown in the UI') }, ['name', 'cwd']),
  tool('stop_session', 'Stop (kill) a hub session\'s tmux window.', { name: str('Session name') }, ['name']),
  tool('read_screen', 'Read the current terminal screen of a session (to see dialogs, progress or errors).',
    { name: str('Session name'), lines: int('Lines of scrollback (default 80)') }, ['name']),
  tool('send_keys', 'Type into another session\'s terminal: literal text and/or named keys (Enter, Escape, Up, Down, Tab, C-c, ...). Use to answer dialogs.',
    { name: str('Session name'), text: str('Literal text to type'), keys: { type: 'array', items: { type: 'string' }, description: 'Named keys pressed after the text' }, enter: { type: 'boolean', description: 'Press Enter at the end' } }, ['name']),
  tool('task_add', 'Add a task to the backlog.',
    { title: str('Short title'), project: str('Project name (default "general")'), notes: str('Details'), status: str('backlog | todo | in_progress | blocked | done'), priority: int('0 urgent, 1 high, 2 normal (default), 3 someday'), assignee: str('Session name or "user"') }, ['title']),
  tool('task_list', 'List tasks, sorted by status then priority. Done/cancelled are hidden unless include_done or status is given.',
    { project: str('Filter by project'), status: str('Filter by status'), assignee: str('Filter by assignee'), query: str('Text search in title/notes'), include_done: { type: 'boolean' } }),
  tool('task_update', 'Update a task (status, priority, project, title, notes, assignee) or append a progress note.',
    { id: int('Task id'), status: str('New status'), priority: int('0-3'), project: str('Project'), title: str('Title'), notes: str('Replace notes'), append_note: str('Append a line to notes'), assignee: str('Assignee') }, ['id']),
  tool('task_projects', 'Summarise the backlog: task counts per project and status.'),
];

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

const fmtTime = (d) => new Date(d).toISOString().replace('T', ' ').slice(0, 16);
const fmtMsg = (m) => `#${m.id} ${fmtTime(m.created_at)} ${m.from_name} → ${m.to_name}${m.kind !== 'chat' ? ` [${m.kind}]` : ''}: ${m.body ?? m.snippet}`;
const fmtTask = (t) => `#${t.id} [${t.project}] P${t.priority} ${t.status}${t.assignee ? ` @${t.assignee}` : ''} — ${t.title}${t.notes ? `\n    ${t.notes.replace(/\n/g, '\n    ')}` : ''}`;

async function knownParticipant(to) {
  if (to === ops.USER) return true;
  return Boolean(await ops.getSession(to));
}

const handlers = {
  async reply({ text, to }) {
    const dest = to || lastFrom || ops.USER;
    const m = await ops.sendMessage({ from: NAME, to: dest, body: text });
    return `sent to ${dest} (#${m.id})`;
  },
  async send_message({ to, text }) {
    if (to === NAME) throw new Error('that is you');
    if (!(await knownParticipant(to))) {
      const names = (await ops.listSessions()).map((s) => s.name).join(', ');
      throw new Error(`no session named "${to}". Known: user, ${names}`);
    }
    const m = await ops.sendMessage({ from: NAME, to, body: text });
    const s = to === ops.USER ? null : await ops.getSession(to);
    return `sent to ${to} (#${m.id})${s && s.status !== 'online' ? ` — ${to} is ${s.status}, message queued` : ''}`;
  },
  async list_sessions() {
    const [rows, live] = await Promise.all([ops.listSessions(), tmuxSessions()]);
    const liveSet = new Map(live.map((t) => [t.name, t]));
    if (!rows.length) return 'no sessions yet';
    return rows.map((s) => {
      const t = liveSet.get(s.name);
      return `${s.name}${s.name === NAME ? ' (you)' : ''}: ${s.status}${t ? (t.dead ? ', tmux pane exited' : ', tmux') : ''}${s.queued ? `, ${s.queued} queued` : ''} — ${s.cwd || '?'}${s.description ? ` — ${s.description}` : ''}`;
    }).join('\n');
  },
  async search_history({ query, with: who, limit }) {
    const rows = await ops.searchMessages({ query, with: who, limit });
    return rows.length ? rows.map(fmtMsg).join('\n') : 'no matches';
  },
  async get_messages({ with: who, before_id, limit = 30 }) {
    const rows = await ops.getMessages({ with: who, beforeId: before_id, limit });
    return rows.length ? rows.map(fmtMsg).join('\n') : 'no messages';
  },
  async spawn_session({ name, cwd, prompt, extra_args, description }) {
    const r = await spawnSession({ name, cwd, prompt, args: extra_args, launchedBy: NAME, description });
    return `started ${r.name} in ${r.cwd} (tmux ${r.tmux}). ${prompt ? 'Prompt queued; it is delivered when the session connects.' : ''} Its replies to you arrive as channel messages.`;
  },
  async stop_session({ name }) {
    if (name === NAME) throw new Error('refusing to stop yourself');
    await stopSession(name);
    return `stopped ${name}`;
  },
  async read_screen({ name, lines }) {
    return (await captureScreen(name, lines)) || '(blank screen)';
  },
  async send_keys({ name, text, keys, enter }) {
    if (name === NAME) throw new Error('refusing to type into yourself');
    await sendKeys(name, { text, keys, enter });
    return 'keys sent';
  },
  async task_add(a) {
    return `added ${fmtTask(await ops.addTask({ ...a, createdBy: NAME }))}`;
  },
  async task_list({ project, status, assignee, query, include_done }) {
    const rows = await ops.listTasks({ project, status, assignee, query, includeDone: include_done });
    return rows.length ? rows.map(fmtTask).join('\n') : 'no matching tasks';
  },
  async task_update({ id, ...fields }) {
    return `updated ${fmtTask(await ops.updateTask(id, fields))}`;
  },
  async task_projects() {
    const s = await ops.taskSummary();
    const lines = Object.entries(s).map(([p, c]) => `${p}: ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    return lines.length ? lines.join('\n') : 'backlog is empty';
  },
};

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  const fn = handlers[req.params.name];
  if (!fn) return { isError: true, content: [{ type: 'text', text: `unknown tool ${req.params.name}` }] };
  try {
    const text = await fn(req.params.arguments || {});
    return { content: [{ type: 'text', text: String(text) }] };
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: `error: ${e.message}` }] };
  }
});

// ---------- permission relay: approve tool use from the web UI / phone ----------

mcp.fallbackNotificationHandler = async (n) => {
  if (n.method !== 'notifications/claude/channel/permission_request') return;
  const { request_id, tool_name, description, input_preview } = n.params || {};
  await ops.sendMessage({
    from: NAME, to: ops.USER, kind: 'permission',
    body: `${NAME} wants to use ${tool_name}: ${description || ''}${input_preview ? `\n\n${input_preview}` : ''}`,
    meta: { request_id, tool_name, description, input_preview },
  });
};

// ---------- delivery: Postgres → channel notification ----------

const META_KEY = /^[A-Za-z0-9_]+$/;
let ready = false;

async function deliver(id) {
  if (!ready) return;
  const m = await ops.claimMessage(id, NAME);
  if (!m) return; // already delivered (or not ours)
  try {
    if (m.kind === 'permission_verdict') {
      await mcp.notification({
        method: 'notifications/claude/channel/permission',
        params: { request_id: m.meta.request_id, behavior: m.meta.behavior },
      });
      return;
    }
    const meta = { from: m.from_name, msg_id: String(m.id), sent_at: fmtTime(m.created_at) };
    if (m.kind !== 'chat') meta.kind = m.kind;
    for (const [k, v] of Object.entries(m.meta || {})) if (META_KEY.test(k) && !(k in meta)) meta[k] = String(v);
    await mcp.notification({ method: 'notifications/claude/channel', params: { content: m.body, meta } });
    if (m.kind === 'chat') lastFrom = m.from_name;
  } catch (e) {
    console.error('[hub] delivery failed, re-queueing', id, e.message);
    await ops.unclaimMessage(id);
  }
}

async function deliverPending() {
  for (const id of await ops.pendingFor(NAME)) await deliver(id);
}

async function main() {
  await ensureSchema();
  await ops.upsertSession({ name: NAME, cwd: process.cwd(), status: 'starting' });

  const listener = listen(['hub_message'], async (_ch, p) => {
    if (p?.op === 'INSERT' && p.to === NAME) await deliver(p.id);
  }, { onReconnect: () => deliverPending() });
  await listener.ready;

  mcp.oninitialized = () => {
    // Give Claude Code a moment to register the channel listener before the first push.
    setTimeout(async () => {
      ready = true;
      await ops.setSessionStatus(NAME, 'online');
      await deliverPending();
    }, 1500);
  };
  await mcp.connect(new StdioServerTransport());

  const beat = setInterval(() => ops.heartbeat(NAME).catch(() => {}), 30_000);
  const shutdown = async () => {
    clearInterval(beat);
    try { await ops.setSessionStatus(NAME, 'offline'); await listener.stop(); await pool.end(); } catch {}
    process.exit(0);
  };
  process.stdin.on('close', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((e) => { console.error('[hub] channel failed to start:', e); process.exit(1); });
