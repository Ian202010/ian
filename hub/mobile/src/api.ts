// Client for the Claude Hub server (REST + WebSocket).
export type Session = {
  name: string; cwd: string | null; description: string; status: 'starting' | 'online' | 'offline' | 'stopped';
  queued: number; tmux: boolean; last_seen: string | null;
};
export type Message = {
  id: number; from_name: string; to_name: string; kind: string; body: string;
  meta: Record<string, string>; created_at: string; delivered_at: string | null;
};
export type Task = {
  id: number; project: string; title: string; notes: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  priority: number; assignee: string | null; created_by: string | null; updated_at: string;
};
export type SearchHit = { id: number; from_name: string; to_name: string; created_at: string; snippet: string };

export type HubEvent =
  | { type: 'message'; message: Message }
  | { type: 'message_update'; message: Message }
  | { type: 'sessions'; sessions: Session[] }
  | { type: 'task'; op: string; id: number; task: Task | null }
  | { type: 'app_update'; message?: string }
  | { type: 'ptt'; action: 'toggle' | 'start' | 'stop' | 'replay' };

export class Hub {
  constructor(public baseUrl: string, public token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method,
      headers: { authorization: `Bearer ${this.token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data as T;
  }

  me = () => this.req<{ ok: boolean }>('GET', '/api/me');
  sessions = () => this.req<Session[]>('GET', '/api/sessions');
  spawn = (s: { name: string; cwd: string; prompt?: string; description?: string; args?: string }) => this.req('POST', '/api/sessions', s);
  stop = (name: string) => this.req('DELETE', `/api/sessions/${encodeURIComponent(name)}`);
  screen = (name: string) => this.req<{ screen: string }>('GET', `/api/sessions/${encodeURIComponent(name)}/screen?lines=150`);
  keys = (name: string, body: { text?: string; keys?: string[]; enter?: boolean }) => this.req('POST', `/api/sessions/${encodeURIComponent(name)}/keys`, body);
  messages = (withName?: string, before?: number) => {
    const q = new URLSearchParams();
    if (withName) q.set('with', withName);
    if (before) q.set('before', String(before));
    return this.req<Message[]>('GET', `/api/messages?${q}`);
  };
  send = (to: string, body: string, via?: string) => this.req<Message>('POST', '/api/messages', { to, body, via });
  permission = (session: string, request_id: string, behavior: 'allow' | 'deny') => this.req('POST', '/api/permission', { session, request_id, behavior });
  search = (q: string) => this.req<SearchHit[]>('GET', `/api/search?q=${encodeURIComponent(q)}`);
  tasks = (done = false) => this.req<Task[]>('GET', `/api/tasks?done=${done ? 1 : 0}`);
  addTask = (t: Partial<Task>) => this.req<Task>('POST', '/api/tasks', t);
  updateTask = (id: number, t: Partial<Task>) => this.req<Task>('PATCH', `/api/tasks/${id}`, t);

  /** Live events with automatic reconnect. Returns a function that closes the connection. */
  subscribe(onEvent: (e: HubEvent) => void, onStatus: (connected: boolean) => void): () => void {
    let ws: WebSocket | null = null;
    let closed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      const url = this.baseUrl.replace(/^http/, 'ws') + `/ws?token=${encodeURIComponent(this.token)}`;
      ws = new WebSocket(url);
      ws.onopen = () => onStatus(true);
      ws.onmessage = (e) => { try { onEvent(JSON.parse(String(e.data))); } catch {} };
      ws.onclose = () => {
        onStatus(false);
        if (!closed) timer = setTimeout(open, 2000);
      };
      ws.onerror = () => {};
    };
    open();
    return () => { closed = true; clearTimeout(timer); ws?.close(); };
  }
}
