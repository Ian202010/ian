#!/usr/bin/env node
// Claude Hub web server: REST + WebSocket API and the browser/phone UI.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { announceAppUpdate } from './appupdate.js';
import { ensureSchema, HUB_ROOT, listen } from './db.js';
import * as ops from './ops.js';
import { captureScreen, sendKeys, spawnSession, stopSession, tmuxSessions } from './tmux.js';

const PORT = Number(process.env.HUB_PORT || 8787);
const HOST = process.env.HUB_HOST || '0.0.0.0';
const TOKEN_FILE = path.join(HUB_ROOT, '.hub-token');
const PUBLIC = path.join(HUB_ROOT, 'public');

async function loadToken() {
  if (process.env.HUB_TOKEN) return process.env.HUB_TOKEN;
  try { return (await fs.readFile(TOKEN_FILE, 'utf8')).trim(); } catch {}
  const t = crypto.randomBytes(18).toString('base64url');
  await fs.writeFile(TOKEN_FILE, t + '\n', { mode: 0o600 });
  return t;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'content-type': isObj ? 'application/json' : 'text/plain', 'cache-control': 'no-store', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) { data += chunk; if (data.length > 1e6) throw new Error('body too large'); }
  return data ? JSON.parse(data) : {};
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function sessionsWithTmux() {
  const [rows, live] = await Promise.all([ops.listSessions(), tmuxSessions()]);
  const map = new Map(live.map((t) => [t.name, t]));
  const out = rows.map((s) => ({ ...s, tmux: map.has(s.name), tmux_dead: map.get(s.name)?.dead || false }));
  return out;
}

async function main() {
  await ensureSchema();
  const TOKEN = await loadToken();
  const authed = (req, url) => {
    const h = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    return safeEqual(h || url.searchParams.get('token'), TOKEN);
  };

  // ---- routes ----
  const routes = [];
  const route = (method, pattern, fn) => routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), fn });

  route('GET', '/api/me', async () => ({ ok: true, user: ops.USER }));
  route('GET', '/api/sessions', sessionsWithTmux);
  route('POST', '/api/sessions', async ({ body }) => spawnSession({ ...body, launchedBy: ops.USER }));
  route('DELETE', '/api/sessions/:name', async ({ p }) => stopSession(p.name));
  route('GET', '/api/sessions/:name/screen', async ({ p, url }) => ({ screen: await captureScreen(p.name, url.searchParams.get('lines') || 120) }));
  route('POST', '/api/sessions/:name/keys', async ({ p, body }) => sendKeys(p.name, body));

  route('GET', '/api/messages', async ({ url }) => ops.getMessages({
    with: url.searchParams.get('with') || undefined,
    beforeId: url.searchParams.get('before') || undefined,
    limit: url.searchParams.get('limit') || 60,
  }));
  route('POST', '/api/messages', async ({ body }) => {
    if (!body.to) throw new Error('to required');
    return ops.sendMessage({ from: ops.USER, to: body.to, body: body.body, meta: body.via ? { via: body.via } : {} });
  });
  route('GET', '/api/search', async ({ url }) => ops.searchMessages({ query: url.searchParams.get('q'), with: url.searchParams.get('with') || undefined, limit: 50 }));
  route('POST', '/api/permission', async ({ body }) => {
    if (!['allow', 'deny'].includes(body.behavior)) throw new Error('behavior must be allow or deny');
    return ops.sendMessage({
      from: ops.USER, to: body.session, kind: 'permission_verdict',
      body: `${body.behavior} ${body.request_id}`, meta: { request_id: body.request_id, behavior: body.behavior },
    });
  });

  route('GET', '/api/tasks', async ({ url }) => ops.listTasks({
    project: url.searchParams.get('project') || undefined,
    status: url.searchParams.get('status') || undefined,
    includeDone: url.searchParams.get('done') === '1',
    query: url.searchParams.get('q') || undefined,
  }));
  route('GET', '/api/tasks/summary', async () => ops.taskSummary());
  route('POST', '/api/tasks', async ({ body }) => ops.addTask({ ...body, createdBy: ops.USER }));
  route('PATCH', '/api/tasks/:id', async ({ p, body }) => ops.updateTask(Number(p.id), body));
  route('DELETE', '/api/tasks/:id', async ({ p }) => { await ops.deleteTask(Number(p.id)); return { ok: true }; });
  // For CI or a manual `eas update`: tell connected phone apps to fetch the new bundle now.
  route('POST', '/api/app/announce', async ({ body }) => { await announceAppUpdate(body.message); return { ok: true }; });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (url.pathname.startsWith('/api/')) {
        // CORS so the app's web build (and other tools) can call the API; auth is the bearer token, not cookies.
        res.setHeader('access-control-allow-origin', '*');
        res.setHeader('access-control-allow-headers', 'authorization, content-type');
        res.setHeader('access-control-allow-methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
        if (!authed(req, url)) return send(res, 401, { error: 'unauthorized' });
        for (const r of routes) {
          const m = r.method === req.method && url.pathname.match(r.re);
          if (!m) continue;
          const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readJson(req) : {};
          const p = Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)]));
          return send(res, 200, (await r.fn({ req, url, body, p })) ?? { ok: true });
        }
        return send(res, 404, { error: 'not found' });
      }
      // static files
      const rel = url.pathname === '/' ? 'index.html' : path.normalize(url.pathname).replace(/^[/\\]+/, '');
      const file = path.join(PUBLIC, rel);
      if (!file.startsWith(PUBLIC)) return send(res, 403, 'forbidden');
      const data = await fs.readFile(file).catch(() => null);
      if (!data) return send(res, 404, 'not found');
      return send(res, 200, data, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
  });

  // ---- live updates over WebSocket ----
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname !== '/ws' || !authed(req, url)) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });
  setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false; ws.ping();
    }
  }, 25_000);
  const broadcast = (ev) => { const s = JSON.stringify(ev); for (const ws of wss.clients) if (ws.readyState === 1) ws.send(s); };

  listen(['hub_message', 'hub_session', 'hub_task', 'hub_app'], async (ch, p) => {
    if (ch === 'hub_app') {
      broadcast({ type: 'app_update', message: p?.message || '' });
    } else if (ch === 'hub_message') {
      const m = await ops.getMessage(p.id);
      if (m) broadcast({ type: p.op === 'INSERT' ? 'message' : 'message_update', message: m });
    } else if (ch === 'hub_session') {
      broadcast({ type: 'sessions', sessions: await sessionsWithTmux() });
    } else if (ch === 'hub_task') {
      broadcast({ type: 'task', op: p.op, id: p.id, task: p.op === 'DELETE' ? null : await ops.getTask(p.id) });
    }
  });

  setInterval(() => ops.reapStale(90).catch(() => {}), 30_000);

  server.listen(PORT, HOST, () => {
    console.log(`Claude Hub listening on http://${HOST}:${PORT}`);
    console.log(`Access token: ${TOKEN}   (open http://<this-machine>:${PORT}/?token=${TOKEN} once on each device)`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
