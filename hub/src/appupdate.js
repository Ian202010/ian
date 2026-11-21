// Ship a new version of the phone app over the air, then tell every connected app to fetch it.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { HUB_ROOT, pool } from './db.js';

export const MOBILE_DIR = path.join(HUB_ROOT, 'mobile');
const CHANNEL = process.env.HUB_APP_CHANNEL || 'production';

function run(cmd, args, opts) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { ...opts, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const timer = setTimeout(() => child.kill('SIGTERM'), 15 * 60 * 1000);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, out }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out: String(e) }); });
  });
}

/** Tell connected apps (via the hub server's WebSocket) to check for an update now. */
export async function announceAppUpdate(message = '') {
  await pool.query(`SELECT pg_notify('hub_app', $1)`, [JSON.stringify({ message })]);
}

/**
 * Typecheck, publish with `eas update`, and announce. Needs EXPO_TOKEN (or a logged-in eas-cli)
 * and a project initialised with `eas init` (see mobile/README.md).
 */
export async function shipAppUpdate({ message, platform = 'all', skipTypecheck = false }) {
  if (!message?.trim()) throw new Error('message required (describe what changed)');
  const env = { ...process.env, CI: '1' };
  if (!skipTypecheck) {
    const tsc = await run('npx', ['tsc', '--noEmit'], { cwd: MOBILE_DIR, env });
    if (tsc.code !== 0) throw new Error(`typecheck failed, not shipping:\n${tsc.out.slice(-3000)}`);
  }
  const eas = await run('npx', ['--yes', 'eas-cli@^27', 'update',
    '--channel', CHANNEL, '--environment', 'production', '--platform', platform,
    '--message', message, '--non-interactive'], { cwd: MOBILE_DIR, env });
  if (eas.code !== 0) throw new Error(`eas update failed (exit ${eas.code}):\n${eas.out.slice(-3000)}`);
  await announceAppUpdate(message);
  return eas.out.slice(-1500);
}
