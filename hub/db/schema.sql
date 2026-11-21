-- Claude Hub schema. Idempotent: safe to run on every start.

CREATE TABLE IF NOT EXISTS sessions (
  name        text PRIMARY KEY,
  cwd         text,
  description text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'starting',   -- starting | online | offline | stopped
  launched_by text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz
);

-- Every message between you and any session, and between sessions, forever.
CREATE TABLE IF NOT EXISTS messages (
  id           bigserial PRIMARY KEY,
  from_name    text NOT NULL,
  to_name      text NOT NULL,
  kind         text NOT NULL DEFAULT 'chat',      -- chat | permission | permission_verdict | system
  body         text NOT NULL,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  search       tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(body, ''))) STORED
);
CREATE INDEX IF NOT EXISTS messages_undelivered ON messages (to_name, id) WHERE delivered_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_from ON messages (from_name, id);
CREATE INDEX IF NOT EXISTS messages_to ON messages (to_name, id);
CREATE INDEX IF NOT EXISTS messages_search ON messages USING gin (search);

-- Backlog / todo system, categorised by project, status and priority.
CREATE TABLE IF NOT EXISTS tasks (
  id           bigserial PRIMARY KEY,
  project      text NOT NULL DEFAULT 'general',
  title        text NOT NULL,
  notes        text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'backlog'
               CHECK (status IN ('backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority     smallint NOT NULL DEFAULT 2 CHECK (priority BETWEEN 0 AND 3),  -- 0 = urgent … 3 = someday
  assignee     text,
  created_by   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS tasks_board ON tasks (project, status, priority);

-- LISTEN/NOTIFY fan-out: payloads carry only ids, listeners fetch the row.
CREATE OR REPLACE FUNCTION hub_notify_message() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('hub_message', json_build_object(
    'op', TG_OP, 'id', NEW.id, 'to', NEW.to_name, 'from', NEW.from_name, 'kind', NEW.kind)::text);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hub_notify_session() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('hub_session', json_build_object(
    'op', TG_OP, 'name', COALESCE(NEW.name, OLD.name))::text);
  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hub_notify_task() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('hub_task', json_build_object(
    'op', TG_OP, 'id', COALESCE(NEW.id, OLD.id))::text);
  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_notify ON messages;
CREATE TRIGGER messages_notify AFTER INSERT OR UPDATE OF delivered_at ON messages
  FOR EACH ROW EXECUTE FUNCTION hub_notify_message();

DROP TRIGGER IF EXISTS sessions_notify ON sessions;
CREATE TRIGGER sessions_notify AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION hub_notify_session();

DROP TRIGGER IF EXISTS tasks_notify ON tasks;
CREATE TRIGGER tasks_notify AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION hub_notify_task();
