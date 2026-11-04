-- 005: the placement quiz has an effect. Lessons in the units before the
-- learner's level are marked "skipped": open, but not blocking the path.
-- Run once on a database created before this migration:
--   mysql -u <user> -p codle < database/migrations/005_placement.sql

ALTER TABLE lesson_progress
  MODIFY status ENUM('in_progress','completed','skipped') NOT NULL DEFAULT 'in_progress';
