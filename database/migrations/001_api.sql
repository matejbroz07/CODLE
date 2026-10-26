-- =============================================================
--  Codle — migration 001: what the learner API (api/) needs.
--  For a database created from schema.sql before 23 Oct 2026.
--  schema.sql already contains these changes for fresh installs.
--
--    /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/001_api.sql
-- =============================================================

SET NAMES utf8mb4;
USE codle;

-- Rate limits for login, verification codes and password reset.
-- Keyed by a hash of the e-mail (or another key), never by IP address.
CREATE TABLE IF NOT EXISTS auth_throttle (
  bucket        VARCHAR(32)       NOT NULL,                  -- login, send_code, verify_code …
  key_hash      CHAR(64)          NOT NULL,                  -- SHA-256 of the key + server secret
  hits          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  window_start  DATETIME          NOT NULL,
  PRIMARY KEY (bucket, key_hash),
  KEY ix_throttle_window (window_start)
) ENGINE=InnoDB;

-- Daily Story: one answer per learner per day. Stories rotate, so the same story
-- comes back after a while and must not collide with the earlier answer.
ALTER TABLE history_story_answers
  DROP PRIMARY KEY,
  DROP INDEX ix_story_answers_day,
  ADD PRIMARY KEY (user_id, local_day),
  ADD KEY ix_story_answers_story (story_id);
