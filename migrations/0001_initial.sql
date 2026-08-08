-- Site-only content, ported from the Replit Postgres database to D1.
--
-- Differences from the original DDL, all forced by SQLite:
--   TIMESTAMPTZ DEFAULT NOW()  ->  TEXT DEFAULT CURRENT_TIMESTAMP
--       SQLite has no timestamp type. Stored as ISO-8601 text, which sorts
--       correctly as a string, so ORDER BY created_at still behaves.
--   NUMERIC(10,2)              ->  REAL
--   BOOLEAN                    ->  INTEGER (0/1)
--   $1, $2 placeholders        ->  ? (in the query code, not here)
--
-- Foreign keys are declared, but SQLite only enforces them when
-- `PRAGMA foreign_keys = ON`. D1 enables this by default; the ON DELETE
-- CASCADE clauses below are what clean up likes when a parent is removed.

CREATE TABLE IF NOT EXISTS supporters (
  id         TEXT PRIMARY KEY,
  name       TEXT    NOT NULL,
  amount     REAL    NOT NULL DEFAULT 0,
  currency   TEXT    NOT NULL DEFAULT 'EUR',
  coffees    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_commands (
  id             TEXT    PRIMARY KEY,
  category_id    TEXT    NOT NULL,
  category_label TEXT    NOT NULL,
  category_color TEXT    NOT NULL,
  name           TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  usage_text     TEXT,
  command_type   TEXT    NOT NULL CHECK (command_type IN ('slash', 'prefix')),
  is_admin       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lore_books (
  server_id       TEXT PRIMARY KEY,
  server_name     TEXT NOT NULL,
  server_icon     TEXT,
  invite_link     TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  icon_checked_at TEXT
);

CREATE TABLE IF NOT EXISTS lore_chapters (
  id            TEXT    PRIMARY KEY,
  server_id     TEXT    NOT NULL REFERENCES lore_books(server_id) ON DELETE CASCADE,
  discord_id    TEXT,
  display_name  TEXT    NOT NULL,
  content       TEXT    NOT NULL,
  chapter_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lore_chapter_likes (
  chapter_id TEXT NOT NULL REFERENCES lore_chapters(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chapter_id, user_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id               TEXT    PRIMARY KEY,
  discord_id       TEXT    NOT NULL UNIQUE,
  discord_username TEXT    NOT NULL,
  discord_avatar   TEXT,
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content          TEXT    NOT NULL,
  created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_likes (
  review_id  TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id)
);

-- The original relied on sequential scans; at D1's row-read billing these are
-- worth having from the start.
CREATE INDEX IF NOT EXISTS idx_lore_chapters_server ON lore_chapters (server_id, chapter_order);
CREATE INDEX IF NOT EXISTS idx_review_likes_review  ON review_likes (review_id);
CREATE INDEX IF NOT EXISTS idx_chapter_likes_chapter ON lore_chapter_likes (chapter_id);
