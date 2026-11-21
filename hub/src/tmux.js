// Start, drive and stop Claude Code sessions inside tmux.
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { DATABASE_URL, HUB_ROOT } from './db.js';
import { assertName, getSession, sendMessage, setSessionStatus, upsertSession, USER } from './ops.js';

const run = promisify(execFile);
export const PREFIX = process.env.HUB_TMUX_PREFIX || 'hub-';
const CLAUDE_BIN = process.env.HUB_CLAUDE_BIN || 'claude';
const DEFAULT_ARGS = process.env.HUB_CLAUDE_ARGS || ''; // e.g. "--permission-mode acceptEdits"
const MCP_CONFIG = path.join(HUB_ROOT, '.hub-mcp.json');

const target = (name) => `=${PREFIX}${name}`; // "=" forces an exact session-name match
const pane = (name) => `=${PREFIX}${name}:`; // active pane of that session

export async function tmux(...args) {
  const { stdout } = await run('tmux', args, { maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}

/** Quote a string for /bin/sh. */
export const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** Split a user-supplied argument string, honouring simple quotes. */
export function splitArgs(str) {
  if (Array.isArray(str)) return str;
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(str || ''))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

/** The MCP config every hub-launched session gets, so the channel works from any directory. */
export async function writeMcpConfig() {
  const config = {
    mcpServers: {
      hub: {
        command: process.execPath,
        args: [path.join(HUB_ROOT, 'src', 'channel.js')],
        env: { DATABASE_URL },
      },
    },
  };
  await fs.writeFile(MCP_CONFIG, JSON.stringify(config, null, 2));
  return MCP_CONFIG;
}

export async function tmuxSessions() {
  try {
    const out = await tmux('list-sessions', '-F', '#{session_name}\t#{pane_dead}\t#{session_created}');
    return out.trim().split('\n').filter(Boolean).map((l) => {
      const [tname, dead, created] = l.split('\t');
      return { tname, dead: dead === '1', created: Number(created) };
    }).filter((s) => s.tname.startsWith(PREFIX)).map((s) => ({ ...s, name: s.tname.slice(PREFIX.length) }));
  } catch {
    return []; // no tmux server running
  }
}

export async function hasTmux(name) {
  try { await tmux('has-session', '-t', target(name)); return true; } catch { return false; }
}

/**
 * Launch `claude` in a detached tmux session with the hub channel attached.
 * The prompt (if any) is queued in Postgres and pushed in by the channel once it connects.
 */
export async function spawnSession({ name, cwd, prompt, args, launchedBy = USER, description }) {
  assertName(name);
  if (await hasTmux(name)) throw new Error(`session "${name}" is already running (tmux ${PREFIX}${name})`);
  const dir = path.resolve((cwd || os.homedir()).replace(/^~(?=$|\/)/, os.homedir()));
  await fs.mkdir(dir, { recursive: true });
  const mcpConfig = await writeMcpConfig();

  const argv = [
    CLAUDE_BIN,
    '--mcp-config', mcpConfig,
    '--dangerously-load-development-channels', 'server:hub',
    ...splitArgs(DEFAULT_ARGS),
    ...splitArgs(args),
  ];
  const shellCmd = argv.map(shq).join(' ');

  await upsertSession({ name, cwd: dir, status: 'starting', launchedBy, description });
  await tmux(
    'new-session', '-d', '-s', `${PREFIX}${name}`, '-c', dir, '-x', '220', '-y', '50',
    '-e', `HUB_SESSION=${name}`, '-e', `DATABASE_URL=${DATABASE_URL}`,
    // Lets sessions ship phone-app updates with `eas update`.
    ...(process.env.EXPO_TOKEN ? ['-e', `EXPO_TOKEN=${process.env.EXPO_TOKEN}`] : []),
    shellCmd,
  );
  // Keep a crashed pane around so its last output can still be read.
  await tmux('set-option', '-w', '-t', pane(name), 'remain-on-exit', 'on').catch(() => {});

  if (prompt?.trim()) await sendMessage({ from: launchedBy, to: name, body: prompt });
  const startup = autoAcceptStartup(name).catch((e) => console.error(`[hub] startup watcher for ${name}:`, e.message));
  const result = { name, cwd: dir, tmux: `${PREFIX}${name}`, command: shellCmd };
  // Short-lived callers (the CLI) await this so dialogs still get answered; non-enumerable so it isn't serialised.
  Object.defineProperty(result, 'startup', { value: startup, enumerable: false });
  return result;
}

/**
 * Claude Code shows interactive dialogs before a dev-channel session is usable
 * (development-channel warning, folder trust). Answer them until the channel reports online.
 */
async function autoAcceptStartup(name, timeoutMs = 90_000) {
  const rules = [
    { re: /local development/i, choose: /local development/i },
    { re: /trust (this|the) (folder|files|project)|do you trust/i, choose: /yes|trust|proceed/i },
  ];
  const answered = new Set();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000));
    const s = await getSession(name);
    if (s?.status === 'online') return;
    if (!(await hasTmux(name))) return;
    const screen = await captureScreen(name, 60).catch(() => '');
    for (const [i, rule] of rules.entries()) {
      if (answered.has(i) || !rule.re.test(screen)) continue;
      // Prefer pressing the option's number ("1. I am using this for local development").
      const line = screen.split('\n').find((l) => rule.choose.test(l) && /^\W*\d+[.)]/.test(l.trim()));
      const digit = line?.trim().replace(/^\W*/, '').match(/^(\d+)/)?.[1];
      if (digit) await tmux('send-keys', '-t', pane(name), digit);
      else await tmux('send-keys', '-t', pane(name), 'Enter');
      answered.add(i);
      await new Promise((r) => setTimeout(r, 800));
      // Some menus need a confirming Enter after the number.
      const after = await captureScreen(name, 60).catch(() => '');
      if (rule.re.test(after)) await tmux('send-keys', '-t', pane(name), 'Enter');
    }
  }
}

export async function stopSession(name) {
  assertName(name);
  if (await hasTmux(name)) await tmux('kill-session', '-t', target(name));
  await setSessionStatus(name, 'stopped');
  return { name, stopped: true };
}

export async function captureScreen(name, lines = 80) {
  assertName(name);
  const n = Math.max(10, Math.min(Number(lines) || 80, 2000));
  const out = await tmux('capture-pane', '-p', '-J', '-t', pane(name), '-S', String(-n));
  return out.replace(/\s+$/, '');
}

const SPECIAL = new Set(['Enter', 'Escape', 'Tab', 'BTab', 'Up', 'Down', 'Left', 'Right', 'BSpace', 'C-c', 'C-d', 'C-l', 'C-o', 'C-r', 'S-Tab', 'Space']);

/** Type literal text into a session (optionally followed by Enter), or press named keys like Escape / C-c. */
export async function sendKeys(name, { text, keys, enter = false }) {
  assertName(name);
  if (!(await hasTmux(name))) throw new Error(`session "${name}" is not running in tmux`);
  if (text) await tmux('send-keys', '-t', pane(name), '-l', text);
  for (const k of [].concat(keys || [])) {
    if (!SPECIAL.has(k)) throw new Error(`unknown key "${k}"; allowed: ${[...SPECIAL].join(' ')}`);
    await tmux('send-keys', '-t', pane(name), k);
  }
  if (enter) await tmux('send-keys', '-t', pane(name), 'Enter');
  return { ok: true };
}
