<?php
/**
 * Codle API — the learning page on load, profile, settings, leaderboard.
 */

/** Everything index.html needs on load, in the shape of window.CodleData. */
function route_app(): array
{
    $user = require_user();
    $course = active_course($user);
    if (!$course) {
        // Every account gets a course at registration; this only covers accounts made elsewhere.
        $course = q_row('SELECT * FROM courses WHERE is_published = 1 ORDER BY sort_order, id LIMIT 1') ?? fail(503, 'no_courses', 'No course is published yet.');
        activate_course($user, $course);
    }
    $path = course_path($user, $course);
    return [
        'user'         => user_summary($user),
        'courses'      => course_list($user),
        'activeCourse' => $course['slug'],
        'path'         => $path,
        'progress'     => [$course['slug'] => $path['progress']],
        'leaderboard'  => leaderboard($user, 5),
    ];
}

function route_me_update(): array
{
    $user = require_user();
    $b = body();
    if (array_key_exists('dailyGoal', $b)) {
        $goal = in_int('dailyGoal');
        if ($goal < 10 || $goal > 2000) fail(422, 'invalid_dailyGoal', 'The daily goal must be between 10 and 2000 XP.');
        q('UPDATE users SET daily_goal_xp = ? WHERE id = ?', [$goal, $user['id']]);
        // Today's ring follows the new goal.
        q('UPDATE daily_activity SET goal_reached = (xp >= ?) WHERE user_id = ? AND local_day = ?', [$goal, $user['id'], local_today($user['timezone'])]);
    }
    if (array_key_exists('timezone', $b)) {
        $tz = in_str('timezone', 64);
        if (!in_array($tz, timezone_identifiers_list(), true)) fail(422, 'invalid_timezone');
        q('UPDATE users SET timezone = ? WHERE id = ?', [$tz, $user['id']]);
    }
    if (array_key_exists('bio', $b)) {
        $bio = clean_bio(in_raw('bio', 2000));
        if (mb_strlen($bio) > 300) fail(422, 'invalid_bio', 'The bio can be at most 300 characters.');
        q('UPDATE users SET bio = ? WHERE id = ?', [$bio === '' ? null : $bio, $user['id']]);
    }
    if (array_key_exists('profilePublic', $b)) {
        if (!is_bool($b['profilePublic'])) fail(422, 'invalid_profilePublic');
        q('UPDATE users SET profile_public = ? WHERE id = ?', [(int) $b['profilePublic'], $user['id']]);
    }
    return ['user' => user_summary($user)];
}

function route_me_password(): array
{
    $user = require_user();
    throttle('login', $user['email'], 10, 15 * 60);
    if (!password_verify(in_raw('current', 200), (string) $user['password_hash'])) fail(401, 'wrong_password', 'The current password is wrong.');
    $password = in_raw('password', 200);
    if ($problem = password_problem($password)) fail(422, 'weak_password', $problem);
    if (password_verify($password, (string) $user['password_hash'])) fail(422, 'same_password', 'The new password must be different from the current one.');
    q('UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    // Every other device has to log in again with the new password.
    q('DELETE FROM sessions WHERE user_id = ?', [$user['id']]);
    clear_throttle('login', $user['email']);
    start_session((int) $user['id']);
    notify_mail($user['email'], 'Your Codle password was changed', 'The password of your Codle account ' . $user['username'] . ' was just changed.');
    return ['ok' => true, 'user' => user_summary($user)];
}

/** Deletes the account and, by ON DELETE CASCADE, everything stored about it (GDPR). */
function route_me_delete(): array
{
    $user = require_user();
    throttle('login', $user['email'], 10, 15 * 60);
    if (!password_verify(in_raw('password', 200), (string) $user['password_hash'])) fail(401, 'wrong_password', 'The password is wrong.');
    end_session();
    q('DELETE FROM users WHERE id = ?', [$user['id']]);
    delete_avatar_file($user['avatar_file'] ?? null);
    return ['deleted' => true];
}

function route_me_course(): array
{
    $user = require_user();
    $course = find_course_by_slug(in_str('course', 32)) ?? fail(404, 'unknown_course');
    $enrolled = q_val('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?', [$user['id'], $course['id']]);
    if (!$course['is_published'] && !$enrolled) fail(404, 'unknown_course');
    activate_course($user, $course);
    $path = course_path($user, $course);
    return ['user' => user_summary($user), 'courses' => course_list($user), 'activeCourse' => $course['slug'],
            'path' => $path, 'progress' => [$course['slug'] => $path['progress']]];
}

function route_leaderboard(): array
{
    return leaderboard(require_user(), 50);
}

/* ---------------------------------------------------------------
   Editor workspace settings (user_settings) — same keys as js/editor.js
--------------------------------------------------------------- */

function settings_out(array $s): array
{
    return [
        'layout'   => $s['editor_layout'],
        'split'    => (float) $s['editor_split'],
        'quest'    => (bool) $s['quest_panel_open'],
        'console'  => (bool) $s['console_visible'],
        'fontSize' => (int) $s['font_size'],
        'tabSize'  => (int) $s['tab_size'],
        'wrap'     => (bool) $s['word_wrap'],
        'lines'    => (bool) $s['line_numbers'],
        'autorun'  => (bool) $s['autorun'],
        'theme'    => $s['editor_theme'],
        'effects'  => $s['effects_mode'],
    ];
}

function user_settings(array $user): array
{
    $s = q_row('SELECT * FROM user_settings WHERE user_id = ?', [$user['id']]);
    if (!$s) {
        q('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [$user['id']]);
        $s = q_row('SELECT * FROM user_settings WHERE user_id = ?', [$user['id']]);
    }
    return settings_out($s);
}

function route_settings_get(): array
{
    return ['settings' => user_settings(require_user())];
}

function route_settings_put(): array
{
    $user = require_user();
    $s = array_merge(user_settings($user), body());
    $layout = in_array($s['layout'], ['split', 'swap', 'stacked'], true) ? $s['layout'] : 'split';
    $theme = in_array($s['theme'], ['codle', 'ember', 'paper'], true) ? $s['theme'] : 'codle';
    $effects = in_array($s['effects'], ['auto', 'full', 'lite'], true) ? $s['effects'] : 'auto';
    q('UPDATE user_settings SET editor_layout = ?, editor_split = ?, quest_panel_open = ?, console_visible = ?, font_size = ?,
                                tab_size = ?, word_wrap = ?, line_numbers = ?, autorun = ?, editor_theme = ?, effects_mode = ?
       WHERE user_id = ?', [
        $layout,
        round(min(0.8, max(0.2, (float) $s['split'])), 2),
        (int) (bool) $s['quest'],
        (int) (bool) $s['console'],
        min(22, max(11, (int) $s['fontSize'])),
        (int) $s['tabSize'] === 4 ? 4 : 2,
        (int) (bool) $s['wrap'],
        (int) (bool) $s['lines'],
        (int) (bool) $s['autorun'],
        $theme,
        $effects,
        $user['id'],
    ]);
    return ['settings' => user_settings($user)];
}
