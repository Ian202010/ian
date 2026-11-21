import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export const HUB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://hub:hub@localhost:5432/hub';

export const pool = new pg.Pool({ connectionString: DATABASE_URL, max: Number(process.env.HUB_DB_POOL || 5) });
pool.on('error', (err) => console.error('[hub] pg pool error:', err.message));

let schemaReady;
/** Apply db/schema.sql once per process, serialised across processes with an advisory lock. */
export function ensureSchema() {
  schemaReady ??= (async () => {
    const sql = await fs.readFile(path.join(HUB_ROOT, 'db', 'schema.sql'), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock(424242)');
      await client.query(sql);
    } finally {
      await client.query('SELECT pg_advisory_unlock(424242)').catch(() => {});
      client.release();
    }
  })();
  return schemaReady;
}

/**
 * LISTEN on Postgres channels with automatic reconnect.
 * onNotify(channel, payloadObject) is called for each NOTIFY.
 */
export function listen(channels, onNotify, { onReconnect } = {}) {
  let stopped = false;
  let client;
  const connect = async () => {
    client = new pg.Client({ connectionString: DATABASE_URL });
    client.on('notification', (n) => {
      let payload;
      try { payload = JSON.parse(n.payload); } catch { payload = n.payload; }
      Promise.resolve(onNotify(n.channel, payload)).catch((e) => console.error('[hub] notify handler:', e));
    });
    client.on('error', (err) => {
      console.error('[hub] listen connection error:', err.message);
      retry();
    });
    await client.connect();
    for (const ch of channels) await client.query(`LISTEN ${ch}`);
  };
  let retrying = false;
  const retry = () => {
    if (stopped || retrying) return;
    retrying = true;
    client?.end().catch(() => {});
    setTimeout(async () => {
      retrying = false;
      try { await connect(); onReconnect?.(); } catch (e) { console.error('[hub] reconnect failed:', e.message); retry(); }
    }, 2000);
  };
  const ready = connect().catch((e) => { console.error('[hub] listen failed:', e.message); retry(); });
  return { ready, stop: () => { stopped = true; return client?.end(); } };
}
