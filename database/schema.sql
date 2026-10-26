-- =============================================================
--  Codle — database schema (proposal)
--  Target: MariaDB 10.4+ (XAMPP) and MySQL 8.0+
--  Engine InnoDB, charset utf8mb4.
--
--  Areas
--    1. Accounts      users, username_history, oauth_accounts, email_verifications, sessions,
--                     user_settings, auth_throttle
--    2. Content       courses, units, lessons, quests, quest_files, quest_objectives,
--                     questions, question_answers, badges
--    3. Progress      enrollments, placement_attempts, placement_answers, lesson_progress,
--                     quest_saves, xp_events, daily_activity, user_badges
--    4. Practice      wordle_words, wordle_puzzles, wordle_plays,
--                     history_cards, older_younger_runs, history_stories,
--                     history_story_options, history_story_answers
--    5. Views         v_leaderboard_weekly, v_user_today, v_wordle_stats
--
--  Conventions
--    * Every table has a surrogate BIGINT/INT id unless a natural composite key fits better.
--    * Personal data hangs off users.id with ON DELETE CASCADE, so deleting a user
--      removes everything about them (GDPR right to erasure).
--    * Passwords, verification codes and session tokens are stored only as hashes.
--    * "Day" columns are the learner's local date (users.timezone). Streaks, the daily
--      XP goal and the daily Wordle all roll over at local midnight.
--    * Cached counters on users (xp_total, streak_*) are a speed-up only; the source
--      of truth is xp_events / daily_activity.
-- =============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS codle
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE codle;

-- -------------------------------------------------------------
-- 1. ACCOUNTS
-- -------------------------------------------------------------

CREATE TABLE users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username          VARCHAR(20)     NOT NULL,                 -- 3–20 chars: letters, digits, underscore
  email             VARCHAR(254)    NOT NULL,
  password_hash     VARCHAR(255)    NULL,                     -- bcrypt/argon2; NULL for OAuth-only accounts
  email_verified_at DATETIME        NULL,
  role              ENUM('learner','admin') NOT NULL DEFAULT 'learner',
  timezone          VARCHAR(64)     NOT NULL DEFAULT 'Europe/Prague',
  daily_goal_xp     SMALLINT UNSIGNED NOT NULL DEFAULT 200,
  bio               VARCHAR(300)    NULL,                     -- shown on the profile, plain text
  avatar_file       VARCHAR(64)     NULL,                     -- file name in uploads/avatars/; NULL = gradient from the username
  profile_public    TINYINT(1)      NOT NULL DEFAULT 1,       -- 0 = other learners see only name, avatar and level

  -- Cached counters (rebuildable from xp_events / daily_activity)
  xp_total          INT UNSIGNED    NOT NULL DEFAULT 0,
  streak_current    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  streak_best       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  streak_last_day   DATE            NULL,                     -- last local day with activity

  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at     DATETIME        NULL,
  username_changed_at DATETIME      NULL,                     -- the profile allows one change per cooldown period
  password_changed_at DATETIME      NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_xp (xp_total),
  CONSTRAINT ck_users_username CHECK (username REGEXP '^[A-Za-z0-9_]{3,20}$'),
  CONSTRAINT ck_users_goal CHECK (daily_goal_xp BETWEEN 10 AND 2000)
) ENGINE=InnoDB;

-- Earlier usernames. A released name stays reserved for its old owner for a while,
-- so nobody can take it over and pose as them.
CREATE TABLE username_history (
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

-- "Continue with Google / GitHub"
CREATE TABLE oauth_accounts (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  provider         ENUM('google','github') NOT NULL,
  provider_user_id VARCHAR(191)    NOT NULL,                 -- the provider's stable user id
  linked_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_provider_user (provider, provider_user_id),
  UNIQUE KEY uq_oauth_user_provider (user_id, provider),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6-digit codes for registration, password reset and email change.
-- Registration codes exist before the user row does, so they are keyed by email.
CREATE TABLE email_verifications (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email        VARCHAR(254)    NOT NULL,
  user_id      BIGINT UNSIGNED NULL,
  purpose      ENUM('register','password_reset','email_change') NOT NULL,
  code_hash    CHAR(64)        NOT NULL,                     -- SHA-256 of code + server secret, never the code itself
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,          -- lock after e.g. 5 wrong tries
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME        NOT NULL,
  consumed_at  DATETIME        NULL,
  PRIMARY KEY (id),
  KEY ix_ev_lookup (email, purpose, created_at),
  KEY ix_ev_expires (expires_at),
  CONSTRAINT fk_ev_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Login sessions. Only the hash of the cookie token is stored. No IP address on purpose.
CREATE TABLE sessions (
  token_hash   CHAR(64)        NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME        NOT NULL,
  device_label VARCHAR(100)    NULL,                         -- e.g. "Chrome on ChromeOS", for a "your devices" list
  PRIMARY KEY (token_hash),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Rate limits for login, verification codes and password reset.
-- Keyed by a hash of the e-mail (or another key), never by IP address.
CREATE TABLE auth_throttle (
  bucket        VARCHAR(32)       NOT NULL,                  -- login, send_code, verify_code …
  key_hash      CHAR(64)          NOT NULL,                  -- SHA-256 of the key + server secret
  hits          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  window_start  DATETIME          NOT NULL,
  PRIMARY KEY (bucket, key_hash),
  KEY ix_throttle_window (window_start)
) ENGINE=InnoDB;

-- Code editor workspace + performance preferences (one row per user, shared by all lessons)
CREATE TABLE user_settings (
  user_id          BIGINT UNSIGNED NOT NULL,
  editor_layout    ENUM('split','swap','stacked') NOT NULL DEFAULT 'split',
  editor_split     DECIMAL(3,2)    NOT NULL DEFAULT 0.50,    -- editor share of the work area
  quest_panel_open TINYINT(1)      NOT NULL DEFAULT 1,
  console_visible  TINYINT(1)      NOT NULL DEFAULT 1,
  font_size        TINYINT UNSIGNED NOT NULL DEFAULT 14,
  tab_size         TINYINT UNSIGNED NOT NULL DEFAULT 2,
  word_wrap        TINYINT(1)      NOT NULL DEFAULT 0,
  line_numbers     TINYINT(1)      NOT NULL DEFAULT 1,
  autorun          TINYINT(1)      NOT NULL DEFAULT 1,
  editor_theme     ENUM('codle','ember','paper') NOT NULL DEFAULT 'codle',
  effects_mode     ENUM('auto','full','lite') NOT NULL DEFAULT 'auto',   -- visual effects / low-end devices
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT ck_settings_split CHECK (editor_split BETWEEN 0.20 AND 0.80),
  CONSTRAINT ck_settings_font CHECK (font_size BETWEEN 11 AND 22),
  CONSTRAINT ck_settings_tab CHECK (tab_size IN (2,4))
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. CONTENT
-- -------------------------------------------------------------

CREATE TABLE courses (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(32)     NOT NULL,                     -- python, javascript, html, css, php
  name         VARCHAR(64)     NOT NULL,
  description  VARCHAR(500)    NULL,
  is_published TINYINT(1)      NOT NULL DEFAULT 0,
  sort_order   SMALLINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE units (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  course_id   SMALLINT UNSIGNED NOT NULL,
  position    SMALLINT UNSIGNED NOT NULL,                    -- 1-based order inside the course
  title       VARCHAR(120)     NOT NULL,                     -- "Variables & Types"
  PRIMARY KEY (id),
  UNIQUE KEY uq_units_order (course_id, position),
  CONSTRAINT fk_units_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  unit_id     INT UNSIGNED     NOT NULL,
  position    SMALLINT UNSIGNED NOT NULL,                    -- 1-based order inside the unit
  slug        VARCHAR(64)      NOT NULL,
  title       VARCHAR(120)     NOT NULL,
  kind        ENUM('lesson','quest','quiz','exam') NOT NULL DEFAULT 'lesson',
  xp_reward   SMALLINT UNSIGNED NOT NULL DEFAULT 20,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lessons_order (unit_id, position),
  UNIQUE KEY uq_lessons_slug (unit_id, slug),
  CONSTRAINT fk_lessons_unit FOREIGN KEY (unit_id) REFERENCES units (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- A coding task shown in the editor (editor.html). One quest per lesson at most.
CREATE TABLE quests (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  lesson_id        INT UNSIGNED  NOT NULL,
  title            VARCHAR(120)  NOT NULL,
  description_html TEXT          NOT NULL,                   -- trusted, authored content
  PRIMARY KEY (id),
  UNIQUE KEY uq_quests_lesson (lesson_id),
  CONSTRAINT fk_quests_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Starter code per editor tab
CREATE TABLE quest_files (
  quest_id  INT UNSIGNED NOT NULL,
  language  ENUM('html','css','js') NOT NULL,
  starter   MEDIUMTEXT   NOT NULL,
  PRIMARY KEY (quest_id, language),
  CONSTRAINT fk_qfiles_quest FOREIGN KEY (quest_id) REFERENCES quests (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Objectives checked against the live output. check_js is the body of
-- function (doc) { ... } and runs inside the sandboxed preview iframe.
CREATE TABLE quest_objectives (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  quest_id   INT UNSIGNED     NOT NULL,
  position   TINYINT UNSIGNED NOT NULL,
  language   ENUM('html','css','js') NOT NULL,               -- which tab the objective is about
  text_html  VARCHAR(1000)    NOT NULL,
  hint_html  VARCHAR(2000)    NULL,
  check_js   TEXT             NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qobj_order (quest_id, position),
  CONSTRAINT fk_qobj_quest FOREIGN KEY (quest_id) REFERENCES quests (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Multiple-choice questions: the registration placement quiz and unit quizzes.
CREATE TABLE questions (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  course_id     SMALLINT UNSIGNED NOT NULL,
  lesson_id     INT UNSIGNED     NULL,                       -- set for quiz/exam lessons, NULL for placement
  purpose       ENUM('placement','lesson') NOT NULL,
  difficulty    TINYINT UNSIGNED NOT NULL,                   -- 1 Beginner … 5 Master
  prompt        VARCHAR(1000)    NOT NULL,
  code_snippet  TEXT             NULL,
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY ix_questions_pick (course_id, purpose, difficulty, is_active),
  KEY ix_questions_lesson (lesson_id),
  CONSTRAINT fk_questions_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_questions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
  CONSTRAINT ck_questions_difficulty CHECK (difficulty BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE question_answers (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  question_id  INT UNSIGNED     NOT NULL,
  position     TINYINT UNSIGNED NOT NULL,
  answer_text  VARCHAR(500)     NOT NULL,
  is_correct   TINYINT(1)       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_answers_order (question_id, position),
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE badges (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(64)     NOT NULL,                     -- pythonista-1
  name         VARCHAR(80)     NOT NULL,                     -- "Pythonista I"
  description  VARCHAR(255)    NOT NULL,                     -- "Complete Unit 2"
  unit_id      INT UNSIGNED    NULL,                         -- awarded for finishing this unit, if any
  PRIMARY KEY (id),
  UNIQUE KEY uq_badges_slug (slug),
  CONSTRAINT fk_badges_unit FOREIGN KEY (unit_id) REFERENCES units (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. PROGRESS
-- -------------------------------------------------------------

-- A learner taking a course. current_lesson_id drives the "Continue" node on the path;
-- lessons before it are completed, lessons after it are locked.
CREATE TABLE enrollments (
  user_id            BIGINT UNSIGNED   NOT NULL,
  course_id          SMALLINT UNSIGNED NOT NULL,
  placement_level    TINYINT UNSIGNED  NULL,                 -- result of the placement quiz, 1–5
  current_lesson_id  INT UNSIGNED      NULL,
  is_active          TINYINT(1)        NOT NULL DEFAULT 1,   -- the course selected in the sidebar
  enrolled_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  KEY ix_enroll_course (course_id),
  CONSTRAINT fk_enroll_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_lesson FOREIGN KEY (current_lesson_id) REFERENCES lessons (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- One run of the adaptive placement quiz (registration step 2)
CREATE TABLE placement_attempts (
  id            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED   NOT NULL,
  course_id     SMALLINT UNSIGNED NOT NULL,
  started_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at   DATETIME          NULL,
  correct_count TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  wrong_count   TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  result_level  TINYINT UNSIGNED  NULL,
  PRIMARY KEY (id),
  KEY ix_placement_user (user_id, course_id),
  CONSTRAINT fk_placement_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_placement_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE placement_answers (
  attempt_id   BIGINT UNSIGNED  NOT NULL,
  position     TINYINT UNSIGNED NOT NULL,                    -- question number 1–10
  question_id  INT UNSIGNED     NOT NULL,
  answer_id    INT UNSIGNED     NULL,                        -- NULL = "I don't know"
  is_correct   TINYINT(1)       NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, position),
  CONSTRAINT fk_pa_attempt FOREIGN KEY (attempt_id) REFERENCES placement_attempts (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_answer FOREIGN KEY (answer_id) REFERENCES question_answers (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE lesson_progress (
  user_id       BIGINT UNSIGNED  NOT NULL,
  lesson_id     INT UNSIGNED     NOT NULL,
  status        ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
  progress_pct  TINYINT UNSIGNED NOT NULL DEFAULT 0,         -- ring around the current milestone
  best_score    TINYINT UNSIGNED NULL,                       -- quizzes/exams, 0–100
  attempts      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  started_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  DATETIME         NULL,
  PRIMARY KEY (user_id, lesson_id),
  KEY ix_lp_lesson (lesson_id),
  CONSTRAINT fk_lp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_lp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
  CONSTRAINT ck_lp_pct CHECK (progress_pct <= 100)
) ENGINE=InnoDB;

-- The learner's own code in the editor, autosaved per quest
CREATE TABLE quest_saves (
  user_id          BIGINT UNSIGNED  NOT NULL,
  quest_id         INT UNSIGNED     NOT NULL,
  html             MEDIUMTEXT       NOT NULL,
  css              MEDIUMTEXT       NOT NULL,
  js               MEDIUMTEXT       NOT NULL,
  objectives_done  SMALLINT UNSIGNED NOT NULL DEFAULT 0,     -- bit n = objective at position n+1 passed
  completed_at     DATETIME         NULL,
  updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, quest_id),
  CONSTRAINT fk_qs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_qs_quest FOREIGN KEY (quest_id) REFERENCES quests (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- XP ledger: every XP gain is one row. Daily XP, levels and leaderboards come from here.
CREATE TABLE xp_events (
  id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED  NOT NULL,
  amount      SMALLINT         NOT NULL,                     -- negative only for admin corrections
  source      ENUM('lesson','quest','quiz','exam','wordle','older_younger','daily_story','streak_bonus','badge','admin') NOT NULL,
  ref_id      BIGINT UNSIGNED  NULL,                         -- lesson id, puzzle number, badge id … depending on source
  local_day   DATE             NOT NULL,                     -- learner's local date when it happened
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_xp_user_day (user_id, local_day),
  KEY ix_xp_day (local_day, user_id),
  CONSTRAINT fk_xp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One row per learner per active day: streak flame + daily goal ring
CREATE TABLE daily_activity (
  user_id            BIGINT UNSIGNED  NOT NULL,
  local_day          DATE             NOT NULL,
  xp                 SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  lessons_completed  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  goal_reached       TINYINT(1)       NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, local_day),
  CONSTRAINT fk_da_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_badges (
  user_id    BIGINT UNSIGNED   NOT NULL,
  badge_id   SMALLINT UNSIGNED NOT NULL,
  earned_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  CONSTRAINT fk_ub_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ub_badge FOREIGN KEY (badge_id) REFERENCES badges (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. PRACTICE — daily Wordle
-- -------------------------------------------------------------

CREATE TABLE wordle_words (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  word       CHAR(5) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,  -- binary: the check below is case-sensitive
  hint       VARCHAR(255)     NOT NULL,
  is_active  TINYINT(1)       NOT NULL DEFAULT 1,
  added_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wordle_word (word),
  CONSTRAINT ck_wordle_word CHECK (word REGEXP '^[A-Z]{5}$')
) ENGINE=InnoDB;

-- The schedule: which word is the answer on which day. Keeping it on the server
-- means the browser no longer needs to know the answer before the game ends.
CREATE TABLE wordle_puzzles (
  puzzle_no    INT UNSIGNED      NOT NULL,                   -- #1 = 2026-10-13
  puzzle_date  DATE              NOT NULL,
  word_id      SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (puzzle_no),
  UNIQUE KEY uq_puzzle_date (puzzle_date),
  CONSTRAINT fk_puzzle_word FOREIGN KEY (word_id) REFERENCES wordle_words (id)
) ENGINE=InnoDB;

CREATE TABLE wordle_plays (
  user_id      BIGINT UNSIGNED  NOT NULL,
  puzzle_no    INT UNSIGNED     NOT NULL,
  guesses      VARCHAR(35)      NOT NULL DEFAULT '',         -- comma separated, up to 6 × 5 letters
  guess_count  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('playing','won','lost') NOT NULL DEFAULT 'playing',
  hint_used    TINYINT(1)       NOT NULL DEFAULT 0,
  started_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at  DATETIME         NULL,
  PRIMARY KEY (user_id, puzzle_no),
  KEY ix_wp_puzzle (puzzle_no, status),
  CONSTRAINT fk_wp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_wp_puzzle FOREIGN KEY (puzzle_no) REFERENCES wordle_puzzles (puzzle_no) ON DELETE CASCADE,
  CONSTRAINT ck_wp_count CHECK (guess_count <= 6)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4b. PRACTICE — programming history games
-- -------------------------------------------------------------

-- "Older or Younger": moments from computing history with their year
CREATE TABLE history_cards (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(80)      NOT NULL,
  year        SMALLINT         NOT NULL,
  category    ENUM('lang','hw','web','sw','event','game') NOT NULL,
  fact        VARCHAR(255)     NOT NULL,
  source_url  VARCHAR(500)     NOT NULL,                     -- every fact must be checkable
  is_active   TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_history_card_name (name),
  KEY ix_history_card_year (year),
  CONSTRAINT ck_history_card_year CHECK (year BETWEEN 1800 AND 2100)
) ENGINE=InnoDB;

-- One finished run (streak) of Older or Younger. Best streak = MAX(score).
CREATE TABLE older_younger_runs (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED  NOT NULL,
  score        SMALLINT UNSIGNED NOT NULL,
  finished_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_oy_user_score (user_id, score),
  KEY ix_oy_score (score),
  CONSTRAINT fk_oy_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- "Daily Story": a short story with one multiple-choice question
CREATE TABLE history_stories (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(120)     NOT NULL,
  year         SMALLINT         NOT NULL,
  body         TEXT             NOT NULL,
  question     VARCHAR(255)     NOT NULL,
  explanation  VARCHAR(500)     NOT NULL,                    -- shown after answering
  source_url   VARCHAR(500)     NOT NULL,
  story_date   DATE             NULL,                        -- the day it is shown; NULL = not scheduled yet
  PRIMARY KEY (id),
  UNIQUE KEY uq_story_date (story_date)
) ENGINE=InnoDB;

CREATE TABLE history_story_options (
  id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  story_id    SMALLINT UNSIGNED NOT NULL,
  position    TINYINT UNSIGNED  NOT NULL,
  option_text VARCHAR(255)      NOT NULL,
  is_correct  TINYINT(1)        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_story_option_order (story_id, position),
  CONSTRAINT fk_story_option_story FOREIGN KEY (story_id) REFERENCES history_stories (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One answer per learner per day; drives the "day streak"
CREATE TABLE history_story_answers (
  user_id      BIGINT UNSIGNED   NOT NULL,
  story_id     SMALLINT UNSIGNED NOT NULL,
  option_id    INT UNSIGNED      NOT NULL,
  is_correct   TINYINT(1)        NOT NULL,
  local_day    DATE              NOT NULL,
  answered_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, local_day),                            -- stories rotate, so one answer per day
  KEY ix_story_answers_story (story_id),
  CONSTRAINT fk_sa_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_story FOREIGN KEY (story_id) REFERENCES history_stories (id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_option FOREIGN KEY (option_id) REFERENCES history_story_options (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 5. VIEWS
-- -------------------------------------------------------------

-- XP over the last 7 days (the leaderboard card and the Ranks tab)
CREATE VIEW v_leaderboard_weekly AS
SELECT u.id AS user_id,
       u.username,
       COALESCE(SUM(x.amount), 0) AS xp_week
FROM users u
LEFT JOIN xp_events x
       ON x.user_id = u.id
      AND x.local_day >= CURRENT_DATE - INTERVAL 6 DAY
GROUP BY u.id, u.username;

-- Sidebar numbers for "today": XP so far against the daily goal, plus the streak.
-- Uses the server date; the API should query daily_activity with the learner's local day
-- instead when users are spread across time zones.
CREATE VIEW v_user_today AS
SELECT u.id AS user_id,
       u.daily_goal_xp,
       COALESCE(d.xp, 0) AS xp_today,
       u.streak_current,
       (u.streak_last_day >= CURRENT_DATE - INTERVAL 1 DAY) AS streak_alive
FROM users u
LEFT JOIN daily_activity d
       ON d.user_id = u.id
      AND d.local_day = CURRENT_DATE;

-- Wordle statistics modal: played, wins, and the guess distribution
CREATE VIEW v_wordle_stats AS
SELECT user_id,
       COUNT(*)                                  AS played,
       SUM(status = 'won')                       AS won,
       SUM(status = 'won' AND guess_count = 1)   AS dist_1,
       SUM(status = 'won' AND guess_count = 2)   AS dist_2,
       SUM(status = 'won' AND guess_count = 3)   AS dist_3,
       SUM(status = 'won' AND guess_count = 4)   AS dist_4,
       SUM(status = 'won' AND guess_count = 5)   AS dist_5,
       SUM(status = 'won' AND guess_count = 6)   AS dist_6
FROM wordle_plays
WHERE status <> 'playing'
GROUP BY user_id;
