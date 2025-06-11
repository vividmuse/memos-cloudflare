-- Memos Cloudflare D1 Database Schema
-- Compatible with original Memos v0.24.x

-- 用户表
CREATE TABLE user (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uid           TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'USER', -- HOST | USER
  email         TEXT,
  avatar_url    TEXT,
  password_hash TEXT,
  row_status    TEXT NOT NULL DEFAULT 'NORMAL',
  created_ts    INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_ts    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- 笔记表
CREATE TABLE memo (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uid         TEXT NOT NULL UNIQUE,
  creator_id  INTEGER NOT NULL REFERENCES user(id),
  content     TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'PRIVATE', -- PRIVATE | PROTECTED | PUBLIC
  row_status  TEXT NOT NULL DEFAULT 'NORMAL', -- NORMAL | ARCHIVED
  created_ts  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_ts  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX idx_memo_creator ON memo(creator_id);
CREATE INDEX idx_memo_visibility ON memo(visibility);
CREATE INDEX idx_memo_created_ts ON memo(created_ts);

-- 标签表
CREATE TABLE tag (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id  INTEGER NOT NULL REFERENCES user(id),
  name        TEXT NOT NULL,
  created_ts  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(creator_id, name)
);

-- 笔记标签关联表
CREATE TABLE memo_tag (
  memo_id INTEGER NOT NULL REFERENCES memo(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, tag_id)
);

-- 附件资源表
CREATE TABLE resource (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  uid          TEXT NOT NULL UNIQUE,
  creator_id   INTEGER NOT NULL REFERENCES user(id),
  filename     TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size         INTEGER NOT NULL,
  external_uri TEXT NOT NULL, -- r2://bucket/key
  created_ts   INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- 笔记附件关联表
CREATE TABLE memo_resource (
  memo_id     INTEGER NOT NULL REFERENCES memo(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  PRIMARY KEY (memo_id, resource_id)
);

-- 活动记录表
CREATE TABLE activity (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL REFERENCES user(id),
  type       TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'INFO',
  payload    TEXT, -- JSON
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX idx_activity_creator ON activity(creator_id);
CREATE INDEX idx_activity_created_ts ON activity(created_ts);

-- Webhook 表
CREATE TABLE webhook (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL REFERENCES user(id),
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_ts INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- 工作区设置表
CREATE TABLE workspace_setting (
  name       TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_ts INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- 用户设置表
CREATE TABLE user_setting (
  user_id    INTEGER NOT NULL REFERENCES user(id),
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_ts INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (user_id, key)
);

-- 数据库迁移历史表
CREATE TABLE migration_history (
  version    TEXT PRIMARY KEY,
  created_ts INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- 插入初始迁移记录
INSERT INTO migration_history (version) VALUES ('v0.24.0'); 