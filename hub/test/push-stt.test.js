// Push notification payloads/cleanup and the command speech-to-text provider. Needs Postgres.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { ensureSchema, pool } from '../src/db.js';
import { pushMessage, registerDevice } from '../src/push.js';
import { transcribe } from '../src/stt.js';

const GOOD = 'ExponentPushToken[test-good]';
const GONE = 'ExponentPushToken[test-gone]';
const realFetch = globalThis.fetch;

before(async () => { await ensureSchema(); await pool.query('DELETE FROM devices'); });
after(async () => { globalThis.fetch = realFetch; await pool.query('DELETE FROM devices'); await pool.end(); });

test('rejects things that are not Expo push tokens', async () => {
  await assert.rejects(registerDevice({ token: 'nope' }), /not an Expo push token/);
});

test('pushes replies to every phone and forgets uninstalled ones', async () => {
  await registerDevice({ token: GOOD, platform: 'ios' });
  await registerDevice({ token: GONE, platform: 'android' });
  let sent;
  globalThis.fetch = async (url, init) => {
    sent = { url, body: JSON.parse(init.body) };
    const data = sent.body.map((m) => (m.to === GONE ? { status: 'error', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: 'x' }));
    return new Response(JSON.stringify({ data }), { status: 200 });
  };
  await pushMessage({ id: 7, from_name: 'boss', kind: 'chat', body: 'Done. ```\ncode\n``` All tests pass.' });
  assert.equal(sent.url, 'https://exp.host/--/api/v2/push/send');
  assert.equal(sent.body.length, 2);
  assert.equal(sent.body[0].title, 'boss');
  assert.equal(sent.body[0].body, 'Done. [code] All tests pass.');
  assert.deepEqual(sent.body[0].data, { msgId: 7, from: 'boss', kind: 'chat' });
  await new Promise((r) => setTimeout(r, 100));
  const { rows } = await pool.query('SELECT token FROM devices ORDER BY token');
  assert.deepEqual(rows.map((r) => r.token), [GOOD]);
});

test('permission requests get an approval title', async () => {
  let sent;
  globalThis.fetch = async (_u, init) => { sent = JSON.parse(init.body); return new Response('{"data":[]}'); };
  await pushMessage({ id: 8, from_name: 'api', kind: 'permission', body: 'api wants to use Bash' });
  assert.equal(sent[0].title, 'api needs approval');
});

test('command speech-to-text passes the file safely and returns stdout', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stt-'));
  const file = path.join(dir, "it's a $(test).m4a");
  await fs.writeFile(file, 'x');
  process.env.HUB_STT = 'command';
  process.env.HUB_STT_CMD = 'printf "heard %s\\n" "$(basename {file})"';
  assert.equal(await transcribe(file), "heard it's a $(test).m4a");
  delete process.env.HUB_STT; delete process.env.HUB_STT_CMD;
  await fs.rm(dir, { recursive: true });
});
