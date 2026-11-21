// Claude Hub web UI (no build step).
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

const state = {
  token: new URLSearchParams(location.search).get('token') || store.get('hubToken', ''),
  sessions: [],
  current: store.get('hubCurrent', ''), // '' = all messages
  view: 'chat', // chat | screen | tasks | search
  messages: [],
  tasks: [],
  unread: {},
  ws: null,
};
if (new URLSearchParams(location.search).has('token')) {
  store.set('hubToken', state.token);
  history.replaceState(null, '', location.pathname);
}

// ---------- api ----------
async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${state.token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { showLogin('Token rejected'); throw new Error('unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ---------- rendering helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function md(text) {
  const parts = String(text ?? '').split(/```(?:[\w-]*)\n?([\s\S]*?)```/g);
  return parts.map((p, i) => {
    if (i % 2) return `<pre><code>${esc(p.replace(/\n$/, ''))}</code></pre>`;
    return esc(p)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .split(/\n{2,}/).map((para) => para.trim() ? `<p>${para.replace(/\n/g, '<br>')}</p>` : '').join('');
  }).join('');
}
const timeOf = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dayOf = (d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

// ---------- login ----------
function showLogin(err = '') {
  $('#app').classList.add('hidden');
  $('#login').classList.remove('hidden');
  $('#loginErr').textContent = err;
}
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  state.token = $('#tokenInput').value.trim();
  store.set('hubToken', state.token);
  start();
});

// ---------- sessions ----------
function renderSessions() {
  const items = [{ name: '', label: 'All messages', status: 'all' }, ...state.sessions];
  $('#sessionList').innerHTML = items.map((s) => {
    const label = s.label || s.name;
    const unread = state.unread[s.name] ? `<span class="badge">${state.unread[s.name]}</span>` : '';
    const meta = s.status === 'all' ? '' : `<span class="meta">${esc(s.status)}${s.queued ? ` · ${s.queued} queued` : ''}</span>`;
    return `<button class="session-item ${s.name === state.current ? 'active' : ''}" data-name="${esc(s.name)}">
      <span class="status ${esc(s.status)}"></span><span class="name">${esc(label)}</span>${meta}${unread}</button>`;
  }).join('');
  const cur = state.sessions.find((s) => s.name === state.current);
  $('#title').textContent = state.view === 'tasks' ? 'Backlog' : state.view === 'search' ? 'Search history' : (state.current || 'All messages');
  $('#subtitle').textContent = ['chat', 'screen'].includes(state.view) && cur ? `${cur.status} · ${cur.cwd || ''}${cur.description ? ' · ' + cur.description : ''}` : '';
  $('#convTabs').classList.toggle('hidden', !state.current || !['chat', 'screen'].includes(state.view));
  $('#stopBtn').classList.toggle('hidden', !cur?.tmux || !['chat', 'screen'].includes(state.view));
  $('#input').placeholder = state.current ? `Message ${state.current}…` : 'Pick a session to message it';
  $('#input').disabled = $('#sendBtn').disabled = !state.current;
}
$('#sessionList').addEventListener('click', (e) => {
  const b = e.target.closest('.session-item');
  if (!b) return;
  selectSession(b.dataset.name);
  $('#sidebar').classList.remove('open');
});
async function selectSession(name) {
  state.current = name;
  store.set('hubCurrent', name);
  delete state.unread[name];
  setView(state.view === 'screen' && name ? 'screen' : 'chat');
  await loadMessages();
}
$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#stopBtn').addEventListener('click', async () => {
  if (!confirm(`Stop session ${state.current}?`)) return;
  await api('DELETE', `/api/sessions/${encodeURIComponent(state.current)}`).catch((e) => alert(e.message));
});

// ---------- views ----------
function setView(view) {
  state.view = view;
  $('#chatView').classList.toggle('hidden', view !== 'chat');
  $('#screenView').classList.toggle('hidden', view !== 'screen');
  $('#tasksView').classList.toggle('hidden', view !== 'tasks');
  $('#searchView').classList.toggle('hidden', view !== 'search');
  $$('#convTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === view));
  renderSessions();
  if (view === 'screen') refreshScreen();
  if (view === 'tasks') loadTasks();
  if (view === 'search') $('#searchInput').focus();
}
$('#convTabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) setView(t.dataset.tab); });
$$('.nav-btn').forEach((b) => b.addEventListener('click', () => { setView(b.dataset.view); $('#sidebar').classList.remove('open'); }));

// ---------- messages ----------
function msgHtml(m) {
  const mine = m.from_name === 'user';
  const peer = m.from_name !== 'user' && m.to_name !== 'user';
  if (m.kind === 'permission_verdict') {
    return `<div class="msg mine" data-id="${m.id}"><div class="who">you → ${esc(m.to_name)} · ${timeOf(m.created_at)}</div>${esc(m.meta.behavior)}ed request ${esc(m.meta.request_id)}</div>`;
  }
  const answered = m.kind === 'permission' && state.messages.some((x) => x.kind === 'permission_verdict' && x.meta?.request_id === m.meta?.request_id);
  const actions = m.kind === 'permission' && !answered
    ? `<div class="actions"><button class="primary" data-perm="allow" data-session="${esc(m.from_name)}" data-req="${esc(m.meta.request_id)}">Allow</button><button data-perm="deny" data-session="${esc(m.from_name)}" data-req="${esc(m.meta.request_id)}">Deny</button></div>` : '';
  const ticks = mine ? (m.delivered_at ? ' · ✓ delivered' : ' · queued') : '';
  return `<div class="msg ${mine ? 'mine' : ''} ${peer ? 'peer' : ''} ${m.kind === 'permission' ? 'permission' : ''}" data-id="${m.id}">
    <div class="who">${esc(m.from_name)} → ${esc(m.to_name)} · ${dayOf(m.created_at)} ${timeOf(m.created_at)}${ticks}${m.meta?.via === 'voice' ? ' · 🎤' : ''}</div>${md(m.body)}${audioHtml(m)}${actions}</div>`;
}
function audioHtml(m) {
  if (!m.meta?.audio) return '';
  return `<audio controls preload="none" src="/api/voice/${encodeURIComponent(m.meta.audio)}?token=${encodeURIComponent(state.token)}"></audio>`;
}
function renderMessages({ keepScroll = false } = {}) {
  const box = $('#messages');
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const more = state.messages.length >= 60 ? '<button class="load-more" id="loadMore">Load earlier</button>' : '';
  box.innerHTML = more + (state.messages.length ? state.messages.map(msgHtml).join('') : '<p class="who" style="text-align:center">No messages yet.</p>');
  if (!keepScroll || atBottom) box.scrollTop = box.scrollHeight;
}
async function loadMessages() {
  const q = state.current ? `?with=${encodeURIComponent(state.current)}` : '';
  state.messages = await api('GET', `/api/messages${q}`);
  renderMessages();
}
$('#messages').addEventListener('click', async (e) => {
  if (e.target.id === 'loadMore') {
    const first = state.messages[0];
    const older = await api('GET', `/api/messages?before=${first.id}${state.current ? `&with=${encodeURIComponent(state.current)}` : ''}`);
    const box = $('#messages'); const h = box.scrollHeight;
    state.messages = [...older, ...state.messages];
    renderMessages({ keepScroll: true });
    box.scrollTop = box.scrollHeight - h;
  }
  const p = e.target.closest('[data-perm]');
  if (p) await api('POST', '/api/permission', { session: p.dataset.session, request_id: p.dataset.req, behavior: p.dataset.perm }).catch((err) => alert(err.message));
});
function involves(m, name) { return !name || m.from_name === name || m.to_name === name; }
function onMessage(m) {
  if (involves(m, state.current) && state.view === 'chat') {
    state.messages.push(m);
    renderMessages({ keepScroll: true });
  } else if (m.to_name === 'user') {
    state.unread[m.from_name] = (state.unread[m.from_name] || 0) + 1;
    renderSessions();
  }
  if (m.to_name === 'user' && m.from_name !== 'user') speak(m);
}
function onMessageUpdate(m) {
  const i = state.messages.findIndex((x) => x.id === m.id);
  if (i >= 0) { state.messages[i] = m; renderMessages({ keepScroll: true }); }
}

// ---------- composer ----------
const input = $('#input');
input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px'; });
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); $('#composer').requestSubmit(); }
});
async function sendText(text, via) {
  if (!text.trim() || !state.current) return;
  await api('POST', '/api/messages', { to: state.current, body: text, via });
}
$('#composer').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value;
  input.value = ''; input.style.height = 'auto';
  try { await sendText(text); } catch (err) { input.value = text; alert(err.message); }
});

// ---------- voice: speak replies, hold-to-talk ----------
$('#speakToggle').checked = store.get('hubSpeak', '0') === '1';
$('#speakToggle').addEventListener('change', (e) => {
  store.set('hubSpeak', e.target.checked ? '1' : '0');
  if (e.target.checked && 'speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance('Speaking replies.'));
});
function speak(m) {
  if (!$('#speakToggle').checked || !('speechSynthesis' in window)) return;
  const plain = m.body.replace(/```[\s\S]*?```/g, ' (code omitted) ').replace(/[`*#_>]/g, '').replace(/https?:\/\/\S+/g, 'a link');
  const prefix = m.from_name === state.current ? '' : `${m.from_name} says: `;
  speechSynthesis.speak(new SpeechSynthesisUtterance(prefix + plain));
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = $('#micBtn');
if (!SR) mic.classList.add('hidden');
let rec = null, heard = '';
function startListening() {
  if (!SR || rec || !state.current) return;
  speechSynthesis?.cancel();
  heard = '';
  rec = new SR();
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (e) => {
    heard = [...e.results].map((r) => r[0].transcript).join(' ');
    input.value = heard;
  };
  rec.onend = async () => {
    mic.classList.remove('listening');
    rec = null;
    const text = heard.trim();
    if (text) { input.value = ''; await sendText(text, 'voice').catch((err) => { input.value = text; alert(err.message); }); }
  };
  rec.onerror = () => {};
  rec.start();
  mic.classList.add('listening');
}
const stopListening = () => rec?.stop();
mic.addEventListener('pointerdown', (e) => { e.preventDefault(); startListening(); });
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => mic.addEventListener(ev, stopListening));

// ---------- screen ----------
let screenTimer;
async function refreshScreen() {
  clearTimeout(screenTimer);
  if (state.view !== 'screen' || !state.current) return;
  try {
    const { screen } = await api('GET', `/api/sessions/${encodeURIComponent(state.current)}/screen?lines=200`);
    const el = $('#screen');
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    el.textContent = screen;
    if (atBottom) el.scrollTop = el.scrollHeight;
  } catch (e) { $('#screen').textContent = `(${e.message})`; }
  screenTimer = setTimeout(refreshScreen, document.hidden ? 10000 : 2000);
}
async function keys(body) {
  await api('POST', `/api/sessions/${encodeURIComponent(state.current)}/keys`, body).catch((e) => alert(e.message));
  setTimeout(refreshScreen, 300);
}
$('.keys').addEventListener('click', (e) => {
  const k = e.target.dataset?.key;
  if (!k) return;
  /^\d$/.test(k) ? keys({ text: k }) : keys({ keys: [k] });
});
$('#keysText').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  keys({ text: e.target.value, enter: true });
  e.target.value = '';
});

// ---------- tasks ----------
const COLS = [['in_progress', 'In progress'], ['blocked', 'Blocked'], ['todo', 'To do'], ['backlog', 'Backlog'], ['done', 'Done'], ['cancelled', 'Cancelled']];
async function loadTasks() {
  state.tasks = await api('GET', `/api/tasks?done=${$('#showDone').checked ? 1 : 0}`);
  renderTasks();
}
function renderTasks() {
  const projects = [...new Set(state.tasks.map((t) => t.project))].sort();
  const pf = $('#projFilter');
  const cur = pf.value;
  pf.innerHTML = '<option value="">All projects</option>' + projects.map((p) => `<option ${p === cur ? 'selected' : ''}>${esc(p)}</option>`).join('');
  $('#projectList').innerHTML = projects.map((p) => `<option value="${esc(p)}">`).join('');
  const tasks = state.tasks.filter((t) => !pf.value || t.project === pf.value);
  $('#board').innerHTML = COLS.map(([status, label]) => {
    const list = tasks.filter((t) => t.status === status).sort((a, b) => a.priority - b.priority);
    if (!list.length && ['done', 'cancelled', 'blocked'].includes(status)) return '';
    return `<div class="col"><h3>${label} · ${list.length}</h3>${list.map(taskHtml).join('')}</div>`;
  }).join('');
}
function taskHtml(t) {
  return `<div class="task" data-id="${t.id}">
    <div class="t-head"><span class="prio p${t.priority}">P${t.priority}</span><span class="t-title">${esc(t.title)}</span></div>
    <div class="t-meta">#${t.id} · ${esc(t.project)}${t.assignee ? ' · @' + esc(t.assignee) : ''}${t.created_by ? ' · by ' + esc(t.created_by) : ''}</div>
    ${t.notes ? `<div class="t-notes">${esc(t.notes)}</div>` : ''}
    <div class="t-head">
      <select data-field="status">${COLS.map(([s, l]) => `<option value="${s}" ${s === t.status ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select data-field="priority">${[0, 1, 2, 3].map((p) => `<option value="${p}" ${p === t.priority ? 'selected' : ''}>P${p}</option>`).join('')}</select>
    </div></div>`;
}
$('#board').addEventListener('change', async (e) => {
  const f = e.target.dataset.field;
  const id = e.target.closest('.task')?.dataset.id;
  if (f && id) await api('PATCH', `/api/tasks/${id}`, { [f]: e.target.value }).catch((err) => alert(err.message));
});
$('#projFilter').addEventListener('change', renderTasks);
$('#showDone').addEventListener('change', loadTasks);
$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  await api('POST', '/api/tasks', { ...fd, priority: Number(fd.priority) }).catch((err) => alert(err.message));
  e.target.title.value = '';
});
function onTask(ev) {
  if (state.view !== 'tasks') return;
  state.tasks = state.tasks.filter((t) => t.id !== ev.id);
  if (ev.task && ($('#showDone').checked || !['done', 'cancelled'].includes(ev.task.status))) state.tasks.push(ev.task);
  renderTasks();
}

// ---------- search ----------
$('#searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  if (!q) return;
  const rows = await api('GET', `/api/search?q=${encodeURIComponent(q)}`);
  $('#results').innerHTML = rows.length ? rows.map((r) => `<div class="msg"><div class="who">#${r.id} ${esc(r.from_name)} → ${esc(r.to_name)} · ${dayOf(r.created_at)} ${timeOf(r.created_at)}</div>${md(r.snippet)}</div>`).join('') : '<p class="who">No matches.</p>';
});

// ---------- new session ----------
$('#newBtn').addEventListener('click', () => { $('#newErr').textContent = ''; $('#newDialog').showModal(); });
$('#newForm').addEventListener('submit', async (e) => {
  if (e.submitter?.value !== 'ok') return;
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    await api('POST', '/api/sessions', fd);
    $('#newDialog').close();
    e.target.reset();
    selectSession(fd.name);
  } catch (err) { $('#newErr').textContent = err.message; }
});

// ---------- live connection ----------
function connect() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?token=${encodeURIComponent(state.token)}`);
  state.ws = ws;
  ws.onopen = () => { $('#conn').classList.add('on'); refreshAll(); };
  ws.onclose = () => { $('#conn').classList.remove('on'); setTimeout(connect, 2000); };
  ws.onmessage = (e) => {
    const ev = JSON.parse(e.data);
    if (ev.type === 'message') onMessage(ev.message);
    else if (ev.type === 'message_update') onMessageUpdate(ev.message);
    else if (ev.type === 'sessions') { state.sessions = ev.sessions; renderSessions(); }
    else if (ev.type === 'task') onTask(ev);
    else if (ev.type === 'ptt' && !document.hidden) {
      // Hardware push-to-talk (e.g. a Flic button hitting /api/ptt) drives the mic here too.
      if (ev.action === 'start' || (ev.action === 'toggle' && !rec)) startListening();
      else if (ev.action === 'stop' || ev.action === 'toggle') stopListening();
    }
  };
}
async function refreshAll() {
  state.sessions = await api('GET', '/api/sessions');
  renderSessions();
  if (state.view === 'chat') await loadMessages();
  if (state.view === 'tasks') await loadTasks();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && state.view === 'screen') refreshScreen(); });

async function start() {
  if (!state.token) return showLogin();
  try { await api('GET', '/api/me'); } catch { return; }
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  setView('chat');
  if (!state.ws) connect(); else refreshAll();
}
start();
