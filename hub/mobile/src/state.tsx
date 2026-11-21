// App-wide state: hub connection, sessions, unread counts, live event fan-out, spoken replies.
import * as Speech from 'expo-speech';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Hub, HubEvent, Message, Session } from './api';
import { saveSettings, Settings } from './settings';
import { checkAndApply } from './updates';

type Listener = (e: HubEvent) => void;
type Ctx = {
  hub: Hub;
  settings: Settings;
  setSettings: (s: Settings) => Promise<void>;
  sessions: Session[];
  connected: boolean;
  unread: Record<string, number>;
  current: string | null; // session whose chat is open
  setCurrent: (name: string | null) => void;
  on: (fn: Listener) => () => void;
  updateStatus: string;
  checkUpdates: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  logout: () => void;
};

const HubCtx = createContext<Ctx | null>(null);
export const useHub = () => {
  const c = useContext(HubCtx);
  if (!c) throw new Error('useHub outside provider');
  return c;
};

export function speakable(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' (code omitted) ')
    .replace(/https?:\/\/\S+/g, 'a link')
    .replace(/[`*#_>|]/g, '');
}

export function HubProvider({ settings: initial, onLogout, children }: { settings: Settings; onLogout: () => void; children: ReactNode }) {
  const [settings, setSettingsState] = useState(initial);
  const hub = useMemo(() => new Hub(settings.url, settings.token), [settings.url, settings.token]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [current, setCurrentState] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const listeners = useRef(new Set<Listener>());
  const currentRef = useRef<string | null>(null);
  const speakRef = useRef(settings.speak);
  speakRef.current = settings.speak;

  const setSettings = useCallback(async (s: Settings) => { await saveSettings(s); setSettingsState(s); }, []);
  const setCurrent = useCallback((name: string | null) => {
    currentRef.current = name;
    setCurrentState(name);
    if (name) setUnread((u) => ({ ...u, [name]: 0 }));
  }, []);
  const on = useCallback((fn: Listener) => { listeners.current.add(fn); return () => { listeners.current.delete(fn); }; }, []);
  const refreshSessions = useCallback(async () => { setSessions(await hub.sessions()); }, [hub]);

  const checkUpdates = useCallback(async () => {
    const r = await checkAndApply(setUpdateStatus);
    setUpdateStatus(`${r} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  const onMessage = useCallback((m: Message) => {
    if (m.to_name !== 'user' || m.from_name === 'user') return;
    if (m.from_name !== currentRef.current) setUnread((u) => ({ ...u, [m.from_name]: (u[m.from_name] || 0) + 1 }));
    if (speakRef.current && m.kind === 'chat') {
      const prefix = m.from_name === currentRef.current ? '' : `${m.from_name} says: `;
      Speech.speak(prefix + speakable(m.body));
    }
    if (speakRef.current && m.kind === 'permission') Speech.speak(`${m.from_name} is asking for permission.`);
  }, []);

  useEffect(() => {
    refreshSessions().catch(() => {});
    return hub.subscribe((e) => {
      if (e.type === 'sessions') setSessions(e.sessions);
      if (e.type === 'message') onMessage(e.message);
      if (e.type === 'app_update') checkUpdates();
      listeners.current.forEach((fn) => fn(e));
    }, (ok) => {
      setConnected(ok);
      if (ok) refreshSessions().catch(() => {});
    });
  }, [hub, onMessage, refreshSessions, checkUpdates]);

  // Self-update: on launch, on returning to foreground, and every 15 minutes.
  useEffect(() => {
    checkUpdates();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') checkUpdates(); });
    const iv = setInterval(checkUpdates, 15 * 60 * 1000);
    return () => { sub.remove(); clearInterval(iv); };
  }, [checkUpdates]);

  const value: Ctx = { hub, settings, setSettings, sessions, connected, unread, current, setCurrent, on, updateStatus, checkUpdates, refreshSessions, logout: onLogout };
  return <HubCtx.Provider value={value}>{children}</HubCtx.Provider>;
}
