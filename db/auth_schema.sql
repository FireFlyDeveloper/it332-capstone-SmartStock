-- =============================================================
-- SECTION :: Auth — users table for SmartStock
-- Author: Kim Eduard Saludes <saludeskimdev@gmail.com>
-- Last touched: 2026-06-29
-- =============================================================
--
-- In-memory user store. Will be swapped for Postgres in v2.
-- password_hash is bcrypt(plain, rounds=10).

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
