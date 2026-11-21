// Push notifications to the phone app through Expo's push service.
import { pool } from './db.js';

const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export async function registerDevice({ token, platform, name }) {
  if (!/^Expo(nent)?PushToken\[.+\]$/.test(token || '')) throw new Error('not an Expo push token');
  await pool.query(
    `INSERT INTO devices (token, platform, name) VALUES ($1,$2,$3)
     ON CONFLICT (token) DO UPDATE SET platform=EXCLUDED.platform, name=EXCLUDED.name, last_seen=now()`,
    [token, platform || null, name || null],
  );
}

export async function removeDevice(token) {
  await pool.query('DELETE FROM devices WHERE token=$1', [token]);
}

/** Notify every registered phone about a message addressed to the human. */
export async function pushMessage(m) {
  if (process.env.HUB_PUSH === '0') return;
  const { rows } = await pool.query('SELECT token FROM devices');
  if (!rows.length) return;
  const body = m.body.replace(/```[\s\S]*?```/g, '[code]').slice(0, 300);
  const messages = rows.map(({ token }) => ({
    to: token,
    title: m.kind === 'permission' ? `${m.from_name} needs approval` : m.from_name,
    body,
    sound: 'default',
    priority: 'high',
    channelId: 'replies',
    data: { msgId: m.id, from: m.from_name, kind: m.kind },
  }));
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  const data = await res.json().catch(() => ({}));
  // Forget phones that uninstalled the app.
  (data.data || []).forEach((r, i) => {
    if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') removeDevice(rows[i].token).catch(() => {});
  });
}
