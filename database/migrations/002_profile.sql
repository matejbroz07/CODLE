-- =============================================================
--  Codle — migration 002: the Profile tab.
--  For a database created from schema.sql before 26 Oct 2026.
--  schema.sql already contains these changes for fresh installs.
--
--    /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/002_profile.sql
-- =============================================================

SET NAMES utf8mb4;
USE codle;

ALTER TABLE users
  ADD COLUMN bio                 VARCHAR(300) NULL AFTER daily_goal_xp,
  ADD COLUMN avatar_file         VARCHAR(64)  NULL AFTER bio,           -- file name in uploads/avatars/; NULL = gradient
  ADD COLUMN profile_public      TINYINT(1)   NOT NULL DEFAULT 1 AFTER avatar_file,
  ADD COLUMN username_changed_at DATETIME     NULL AFTER last_login_at,
  ADD COLUMN password_changed_at DATETIME     NULL AFTER username_changed_at;

-- Earlier usernames. A released name stays reserved for its old owner for a while,
-- so nobody can take it over and pose as them.
CREATE TABLE IF NOT EXISTS username_history (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  old_username  VARCHAR(20)     NOT NULL,
  new_username  VARCHAR(20)     NOT NULL,
  changed_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_uh_user (user_id, changed_at),
  KEY ix_uh_old (old_username, changed_at),
  CONSTRAINT fk_uh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
