#!/usr/bin/env node
// Terminal control for Claude Hub: hub ls | spawn | stop | screen | send | search | tasks | attach
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { announceAppUpdate, shipAppUpdate } from './appupdate.js';
import { ensureSchema, pool } from './db.js';
import * as ops from './ops.js';
import { captureScreen, PREFIX, spawnSession, stopSession, tmuxSessions } from './tmux.js';

const [cmd, ...rest] = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) { const k = rest[i].slice(2); flags[k] = rest[i + 1]?.startsWith('--') || rest[i + 1] === undefined ? true : rest[++i]; }
  else pos.push(rest[i]);
}

const usage = `usage:
  hub ls                                   list sessions
  hub spawn <name> [--cwd DIR] [--prompt TEXT | --prompt-file FILE] [--args "..."] [--desc TEXT]
  hub stop <name>
  hub screen <name> [--lines N]
  hub attach <name>                        attach your terminal to the session's tmux window
  hub send <to> <text...>                  send as "user"
  hub log [<name>] [--limit N]
  hub search <query...>
  hub tasks [--project P] [--status S] [--all]
  hub task-add <title...> [--project P] [--priority 0-3] [--status S]
  hub ship-app <message...> [--platform android|ios]   publish the phone app over the air
  hub announce-app [message]                           tell connected apps to update now`;

async function main() {
  await ensureSchema();
  switch (cmd) {
    case 'ls': {
      const live = new Set((await tmuxSessions()).map((t) => t.name));
      for (const s of await ops.listSessions()) console.log(`${s.name.padEnd(20)} ${s.status.padEnd(9)} ${live.has(s.name) ? 'tmux' : '    '} ${s.queued ? `${s.queued} queued ` : ''}${s.cwd || ''}`);
      break;
    }
    case 'spawn': {
      const prompt = flags['prompt-file'] ? fs.readFileSync(flags['prompt-file'], 'utf8') : flags.prompt;
      const r = await spawnSession({ name: pos[0], cwd: flags.cwd || process.cwd(), prompt, args: flags.args, description: flags.desc });
      console.log(`started ${r.name} in ${r.cwd}\n  tmux attach -t ${r.tmux}\nwaiting for it to come online…`);
      await r.startup;
      console.log(`${r.name} is ${(await ops.getSession(r.name))?.status}`);
      break;
    }
    case 'stop': await stopSession(pos[0]); console.log('stopped', pos[0]); break;
    case 'screen': console.log(await captureScreen(pos[0], flags.lines)); break;
    case 'attach': await pool.end(); spawnSync('tmux', ['attach', '-t', `=${PREFIX}${pos[0]}`], { stdio: 'inherit' }); return;
    case 'send': { const m = await ops.sendMessage({ from: ops.USER, to: pos[0], body: pos.slice(1).join(' ') }); console.log('sent #' + m.id); break; }
    case 'log':
      for (const m of await ops.getMessages({ with: pos[0], limit: flags.limit || 30 })) console.log(`#${m.id} ${m.from_name} → ${m.to_name}: ${m.body}`);
      break;
    case 'search':
      for (const m of await ops.searchMessages({ query: pos.join(' ') })) console.log(`#${m.id} ${m.from_name} → ${m.to_name}: ${m.snippet}`);
      break;
    case 'tasks':
      for (const t of await ops.listTasks({ project: flags.project, status: flags.status, includeDone: Boolean(flags.all) })) console.log(`#${t.id} [${t.project}] P${t.priority} ${t.status.padEnd(11)} ${t.title}`);
      break;
    case 'task-add': { const t = await ops.addTask({ title: pos.join(' '), project: flags.project, priority: flags.priority, status: flags.status, createdBy: ops.USER }); console.log('added #' + t.id); break; }
    case 'ship-app': console.log(await shipAppUpdate({ message: pos.join(' '), platform: flags.platform })); break;
    case 'announce-app': await announceAppUpdate(pos.join(' ')); console.log('announced'); break;
    default: console.log(usage);
  }
  await pool.end();
}
main().catch(async (e) => { console.error('error:', e.message); await pool.end().catch(() => {}); process.exit(1); });
