-- 001_initial.sql : Memos Cloudflare Edition baseline DDL
PRAGMA foreign_keys = ON;

CREATE TABLE user (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uid           TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'USER', -- HOST | USER
  email         TEXT,
  avatar_url    TEXT,
  password_hash TEXT,
  row_status    TEXT NOT NULL DEFAULT 'NORMAL',
  created_ts    INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_ts    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE memo (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uid         TEXT NOT NULL UNIQUE,
  creator_id  INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'PRIVATE',
  row_status  TEXT NOT NULL DEFAULT 'NORMAL',
  created_ts  INTEGER NOT NULL,
  updated_ts  INTEGER NOT NULL
);
CREATE INDEX idx_memo_creator ON memo(creator_id);
CREATE INDEX idx_memo_visibility ON memo(visibility);

CREATE TABLE tag (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id  INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_ts  INTEGER NOT NULL
);

CREATE TABLE memo_tag (
  memo_id INTEGER NOT NULL REFERENCES memo(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, tag_id)
);

CREATE TABLE resource (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  uid          TEXT NOT NULL UNIQUE,
  creator_id   INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size         INTEGER NOT NULL,
  external_uri TEXT NOT NULL,
  created_ts   INTEGER NOT NULL
);

CREATE TABLE memo_resource (
  memo_id     INTEGER NOT NULL REFERENCES memo(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, resource_id)
);

CREATE TABLE activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id  INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  level       TEXT NOT NULL, -- INFO|WARN|ERROR
  message     TEXT NOT NULL,
  payload     TEXT,
  created_ts  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE shortcut (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id  INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  memo_id     INTEGER NOT NULL REFERENCES memo(id) ON DELETE CASCADE,
  created_ts  INTEGER NOT NULL
);

CREATE TABLE webhook (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  secret      TEXT,
  events      TEXT NOT NULL, -- JSON array
  created_ts  INTEGER NOT NULL
);

CREATE TABLE workspace_setting (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  created_ts  INTEGER NOT NULL
);

CREATE TABLE migration_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  version    TEXT NOT NULL,
  applied_ts INTEGER NOT NULL
);