// Shared data operations used by the web server, the channel MCP server and the CLI.
import { pool } from './db.js';

export const USER = 'user'; // the human
export const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/i;
export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled'];

export function assertName(name) {
  if (!NAME_RE.test(name || '')) throw new Error(`invalid session name "${name}" (letters, digits, - and _, max 40)`);
  if (name === USER) throw new Error(`"${USER}" is reserved for you, the human`);
}

// ---------- messages ----------

export async function sendMessage({ from, to, body, kind = 'chat', meta = {} }) {
  if (!body?.trim() && kind === 'chat') throw new Error('empty message');
  const { rows } = await pool.query(
    `INSERT INTO messages (from_name, to_name, kind, body, meta) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, from_name, to_name, kind, body, meta, created_at, delivered_at`,
    [from, to, kind, body ?? '', meta],
  );
  return rows[0];
}

export async function getMessage(id) {
  const { rows } = await pool.query('SELECT id, from_name, to_name, kind, body, meta, created_at, delivered_at FROM messages WHERE id=$1', [id]);
  return rows[0];
}

/** Messages involving `with` (or all, if omitted), newest last. */
export async function getMessages({ with: who, beforeId, limit = 50 } = {}) {
  const params = [];
  const where = [];
  if (who) { params.push(who); where.push(`(from_name=$${params.length} OR to_name=$${params.length})`); }
  if (beforeId) { params.push(beforeId); where.push(`id < $${params.length}`); }
  params.push(Math.min(Number(limit) || 50, 500));
  const { rows } = await pool.query(
    `SELECT id, from_name, to_name, kind, body, meta, created_at, delivered_at FROM messages
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT $${params.length}`,
    params,
  );
  return rows.reverse();
}

/** Full-text search over the permanent history, with a substring fallback. */
export async function searchMessages({ query, with: who, limit = 20 }) {
  if (!query?.trim()) throw new Error('query required');
  const params = [query, Math.min(Number(limit) || 20, 200)];
  let whoSql = '';
  if (who) { params.push(who); whoSql = `AND (from_name=$3 OR to_name=$3)`; }
  let { rows } = await pool.query(
    `SELECT id, from_name, to_name, kind, created_at,
            ts_headline('english', body, websearch_to_tsquery('english', $1),
                        'MaxFragments=2, MaxWords=30, MinWords=10, StartSel=**, StopSel=**') AS snippet,
            ts_rank(search, websearch_to_tsquery('english', $1)) AS rank
     FROM messages WHERE search @@ websearch_to_tsquery('english', $1) ${whoSql}
     ORDER BY rank DESC, id DESC LIMIT $2`,
    params,
  );
  if (!rows.length) {
    ({ rows } = await pool.query(
      `SELECT id, from_name, to_name, kind, created_at, left(body, 300) AS snippet
       FROM messages WHERE body ILIKE '%' || $1 || '%' ${whoSql} ORDER BY id DESC LIMIT $2`,
      params,
    ));
  }
  return rows;
}

/** Atomically claim an undelivered message for delivery. Returns the row or undefined. */
export async function claimMessage(id, to) {
  const { rows } = await pool.query(
    `UPDATE messages SET delivered_at=now() WHERE id=$1 AND to_name=$2 AND delivered_at IS NULL
     RETURNING id, from_name, to_name, kind, body, meta, created_at, delivered_at`,
    [id, to],
  );
  return rows[0];
}

export async function unclaimMessage(id) {
  await pool.query('UPDATE messages SET delivered_at=NULL WHERE id=$1', [id]);
}

export async function pendingFor(to) {
  const { rows } = await pool.query('SELECT id FROM messages WHERE to_name=$1 AND delivered_at IS NULL ORDER BY id', [to]);
  return rows.map((r) => r.id);
}

// ---------- sessions ----------

export async function upsertSession({ name, cwd, status, launchedBy, description }) {
  const { rows } = await pool.query(
    `INSERT INTO sessions (name, cwd, status, launched_by, description, last_seen)
     VALUES ($1,$2,COALESCE($3,'starting'),$4,COALESCE($5,''), now())
     ON CONFLICT (name) DO UPDATE SET
       cwd = COALESCE(EXCLUDED.cwd, sessions.cwd),
       status = COALESCE($3, sessions.status),
       launched_by = COALESCE($4, sessions.launched_by),
       description = COALESCE($5, sessions.description),
       last_seen = now()
     RETURNING *`,
    [name, cwd ?? null, status ?? null, launchedBy ?? null, description ?? null],
  );
  return rows[0];
}

export async function setSessionStatus(name, status) {
  await pool.query('UPDATE sessions SET status=$2, last_seen=now() WHERE name=$1', [name, status]);
}

export async function heartbeat(name) {
  await pool.query(`UPDATE sessions SET last_seen=now(), status='online' WHERE name=$1`, [name]);
}

export async function listSessions() {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT count(*) FROM messages m WHERE m.to_name=s.name AND m.delivered_at IS NULL)::int AS queued,
       (SELECT max(id) FROM messages m WHERE m.from_name=s.name OR m.to_name=s.name) AS last_message_id
     FROM sessions s ORDER BY (s.status='online') DESC, s.last_seen DESC NULLS LAST`,
  );
  return rows;
}

export async function getSession(name) {
  const { rows } = await pool.query('SELECT * FROM sessions WHERE name=$1', [name]);
  return rows[0];
}

/** Sessions whose channel server stopped heart-beating are marked offline. */
export async function reapStale(seconds = 90) {
  await pool.query(
    `UPDATE sessions SET status='offline' WHERE status='online' AND last_seen < now() - make_interval(secs => $1)`,
    [seconds],
  );
}

// ---------- tasks ----------

function normPriority(p) {
  if (p === undefined || p === null || p === '') return undefined;
  if (typeof p === 'string') {
    const m = p.match(/^p?([0-3])$/i);
    if (m) return Number(m[1]);
    const named = { urgent: 0, high: 1, normal: 2, medium: 2, low: 3, someday: 3 }[p.toLowerCase()];
    if (named !== undefined) return named;
  }
  const n = Number(p);
  if (!Number.isInteger(n) || n < 0 || n > 3) throw new Error('priority must be 0-3 (0 = urgent)');
  return n;
}

function normStatus(s) {
  if (s === undefined || s === null || s === '') return undefined;
  const v = String(s).toLowerCase().replace(/[\s-]+/g, '_');
  if (!TASK_STATUSES.includes(v)) throw new Error(`status must be one of ${TASK_STATUSES.join(', ')}`);
  return v;
}

export async function addTask({ title, project, notes, status, priority, assignee, createdBy }) {
  if (!title?.trim()) throw new Error('title required');
  const { rows } = await pool.query(
    `INSERT INTO tasks (title, project, notes, status, priority, assignee, created_by)
     VALUES ($1, COALESCE($2,'general'), COALESCE($3,''), COALESCE($4,'backlog'), COALESCE($5,2), $6, $7) RETURNING *`,
    [title.trim(), project?.trim() || null, notes ?? null, normStatus(status) ?? null, normPriority(priority) ?? null, assignee || null, createdBy || null],
  );
  return rows[0];
}

export async function updateTask(id, fields) {
  const allowed = { title: (v) => v, project: (v) => v, notes: (v) => v, status: normStatus, priority: normPriority, assignee: (v) => v || null };
  const sets = [];
  const params = [id];
  let statusParam;
  for (const [k, fn] of Object.entries(allowed)) {
    if (fields[k] === undefined) continue;
    params.push(fn(fields[k]));
    sets.push(`${k}=$${params.length}`);
    if (k === 'status') statusParam = `$${params.length}`;
  }
  if (fields.append_note) {
    params.push(fields.append_note);
    sets.push(`notes = CASE WHEN notes='' THEN $${params.length} ELSE notes || E'\\n' || $${params.length} END`);
  }
  if (!sets.length) throw new Error('nothing to update');
  sets.push('updated_at=now()');
  // SET expressions see the old row, so compare against the new status when one is being set.
  const newStatus = statusParam ? `${statusParam}::text` : 'status';
  sets.push(`completed_at = CASE WHEN ${newStatus}='done' THEN COALESCE(completed_at, now()) ELSE NULL END`);
  const { rows } = await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id=$1 RETURNING *`, params);
  if (!rows[0]) throw new Error(`task ${id} not found`);
  return rows[0];
}

export async function getTask(id) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [id]);
  return rows[0];
}

export async function deleteTask(id) {
  await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
}

export async function listTasks({ project, status, assignee, includeDone = false, query, limit = 200 } = {}) {
  const params = [];
  const where = [];
  if (project) { params.push(project); where.push(`project=$${params.length}`); }
  if (status) { params.push(normStatus(status)); where.push(`status=$${params.length}`); }
  else if (!includeDone) where.push(`status NOT IN ('done','cancelled')`);
  if (assignee) { params.push(assignee); where.push(`assignee=$${params.length}`); }
  if (query) { params.push(`%${query}%`); where.push(`(title ILIKE $${params.length} OR notes ILIKE $${params.length})`); }
  params.push(Math.min(Number(limit) || 200, 1000));
  const { rows } = await pool.query(
    `SELECT * FROM tasks ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'blocked' THEN 1 WHEN 'todo' THEN 2 WHEN 'backlog' THEN 3 ELSE 4 END,
              priority, updated_at DESC LIMIT $${params.length}`,
    params,
  );
  return rows;
}

export async function taskSummary() {
  const { rows } = await pool.query(
    `SELECT project, status, count(*)::int AS n FROM tasks GROUP BY project, status ORDER BY project, status`,
  );
  const out = {};
  for (const r of rows) (out[r.project] ??= {})[r.status] = r.n;
  return out;
}
