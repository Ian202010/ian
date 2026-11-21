#!/usr/bin/env node
// Stand-in for `claude` when testing tmux orchestration without spending tokens.
// Mimics the dev-channel warning dialog, then connects to the hub channel from --mcp-config
// and echoes every channel message back with the reply tool.
import fs from 'node:fs';
import readline from 'node:readline';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const args = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(args[args.indexOf('--mcp-config') + 1], 'utf8')).mcpServers.hub;

console.log('WARNING: Loading development channels\n\n  1. I am using this for local development\n  2. Exit');
process.stdin.setRawMode?.(true);
readline.emitKeypressEvents(process.stdin);
await new Promise((resolve) => process.stdin.on('keypress', (s) => { if (s === '1') resolve(); if (s === '2') process.exit(0); }));
console.log('\n> fake claude ready');

const client = new Client({ name: 'fake-claude', version: '0' });
client.fallbackNotificationHandler = async (n) => {
  if (n.method !== 'notifications/claude/channel') return;
  console.log(`<channel from="${n.params.meta.from}"> ${n.params.content}`);
  await client.callTool({ name: 'reply', arguments: { text: `echo: ${n.params.content}`, to: n.params.meta.from } });
};
await client.connect(new StdioClientTransport({ command: cfg.command, args: cfg.args, env: { ...process.env, ...cfg.env }, stderr: 'inherit' }));
setInterval(() => {}, 1 << 30);
