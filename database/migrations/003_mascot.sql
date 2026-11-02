-- =============================================================
--  Codle — migration 003: Curly's look and behaviour (Profile → Curly).
--  For a database created from schema.sql before 2 Nov 2026.
--  schema.sql already contains this change for fresh installs.
--
--    /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/003_mascot.sql
--
--  Until it runs, the API keeps working and the look stays only in the browser.
-- =============================================================

SET NAMES utf8mb4;
USE codle;

ALTER TABLE user_settings
  ADD COLUMN mascot TEXT NULL AFTER effects_mode;   -- JSON: name, color, eyes, hat, face, neck, fx, size, tips, autohide, follow, visible; NULL = defaults
