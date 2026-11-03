-- =============================================================
--  Codle — migration 004: the app theme (Profile → Theme).
--  For a database created from schema.sql before 3 Nov 2026.
--  schema.sql already contains this change for fresh installs.
--
--    /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/004_theme.sql
--
--  Until it runs, the API keeps working and the theme stays only in the browser.
-- =============================================================

SET NAMES utf8mb4;
USE codle;

ALTER TABLE user_settings
  ADD COLUMN app_theme        VARCHAR(24) NULL AFTER mascot,       -- codle, overworld, nightcity, aperture, hallownest, outrun, hyrule; NULL = never chosen
  ADD COLUMN app_theme_custom TEXT        NULL AFTER app_theme;    -- JSON, the Codle theme's own mix: accent, bg, glass, corners, scene, grain
