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
   Workspace settings (user_settings) — the editor keys as in js/editor.js,
   the effects mode, and Curly's look (mascot, see below)
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
    ] + (array_key_exists('mascot', $s)   // the column exists once migration 003 ran
        ? ['mascot' => $s['mascot'] !== null ? mascot_clean(json_decode($s['mascot'], true)) : null]
        : [])
      + (array_key_exists('app_theme', $s)   // migration 004
        ? ['appTheme'       => $s['app_theme'],   // null = never chosen, the browser's look stays
           'appThemeCustom' => $s['app_theme_custom'] !== null ? theme_custom_clean(json_decode($s['app_theme_custom'], true)) : null]
        : []);
}

/* ---------------------------------------------------------------
   App theme (Profile → Theme) — same ids and options as js/theme.js.
   The "codle" theme can be customised; the custom mix is stored as JSON.
--------------------------------------------------------------- */

const APP_THEMES = ['codle', 'overworld', 'nightcity', 'aperture', 'hallownest', 'outrun', 'hyrule'];
const THEME_OPTIONS = [
    'glass'   => ['normal', 'clear', 'frosted'],
    'corners' => ['soft', 'sharp', 'round'],
    'scene'   => ['none', 'aurora', 'stars', 'grid'],
];

/** The Codle theme's custom mix, made safe. Null when it is not an object at all. */
function theme_custom_clean($c): ?array
{
    if (!is_array($c)) return null;
    $hex = fn($v, $default) => is_string($v) && preg_match('/^#[0-9a-f]{6}$/i', $v) ? strtolower($v) : $default;
    $out = [
        'accent' => $hex($c['accent'] ?? null, '#0a84ff'),
        'bg'     => $hex($c['bg'] ?? null, '#08090c'),
    ];
    foreach (THEME_OPTIONS as $key => $ids) {
        $out[$key] = in_array($c[$key] ?? null, $ids, true) ? $c[$key] : $ids[0];
    }
    $out['grain'] = is_bool($c['grain'] ?? null) ? $c['grain'] : true;
    return $out;
}

/* ---------------------------------------------------------------
   Curly's look and behaviour (Profile → Curly) — same ids as js/mascot.js.
   The first id of each list is the default. Unlocks (level, streak) are only
   cosmetic, so they are checked in the browser, not here.
--------------------------------------------------------------- */

const MASCOT_CHOICES = [
    'color' => ['frost', 'ocean', 'mint', 'rose', 'grape', 'lemon', 'sky', 'peach', 'lime', 'coral', 'lavender', 'teal',
                'gold', 'ruby', 'emerald', 'ghost', 'prism', 'obsidian', 'neon', 'lava'],
    'eyes'  => ['ink', 'blue', 'green', 'amber', 'hazel', 'gray', 'violet', 'teal', 'ruby', 'gold', 'galaxy', 'ice', 'ember'],
    'hat'   => ['none', 'beanie', 'cap', 'headphones', 'propeller', 'graduation', 'party', 'tophat', 'crown', 'cowboy', 'chef',
                'viking', 'pirate', 'wizard', 'bunny', 'flowers', 'santa', 'halo'],
    'face'  => ['none', 'glasses', 'freckles', 'hipster', 'mustache', 'bandaid', 'star', 'shades', 'monocle', 'pixel', 'eyepatch', 'nose'],
    'neck'  => ['none', 'necktie', 'bowtie', 'scarf', 'bandana', 'medal', 'badge', 'chain'],
    'fx'    => ['none', 'sparkles', 'hearts', 'notes', 'code', 'bubbles', 'stars', 'confetti', 'snow', 'fire'],
    'size'  => ['m', 'xs', 's', 'l', 'xl'],
];
const MASCOT_SWITCHES = ['tips', 'autohide', 'follow', 'visible'];
const MASCOT_NAME_MAX = 12;

/** A look from the browser or the database, made safe. Null when it is not an object at all. */
function mascot_clean($m): ?array
{
    if (!is_array($m)) return null;
    // the first version had one "extra" slot: glasses/shades are face items now, the bow tie a neck item
    if (isset($m['extra']) && !isset($m['face']) && !isset($m['neck'])) {
        $m[$m['extra'] === 'bowtie' ? 'neck' : 'face'] = $m['extra'];
    }
    $name = is_string($m['name'] ?? null) ? $m['name'] : '';
    $name = preg_replace('/[^\p{L}\p{N} ._-]/u', '', $name) ?? '';
    $name = trim(mb_substr(trim(preg_replace('/\s+/u', ' ', $name) ?? ''), 0, MASCOT_NAME_MAX));
    $out = ['name' => $name !== '' ? $name : 'Curly'];
    foreach (MASCOT_CHOICES as $key => $ids) {
        $out[$key] = in_array($m[$key] ?? null, $ids, true) ? $m[$key] : $ids[0];
    }
    foreach (MASCOT_SWITCHES as $key) {
        $out[$key] = is_bool($m[$key] ?? null) ? $m[$key] : true;
    }
    return $out;
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
    $mascot = null;
    if (array_key_exists('mascot', body())) {
        $mascot = mascot_clean(body()['mascot']);
        if ($mascot === null) fail(422, 'invalid_mascot', 'mascot must be an object.');
    }
    $current = user_settings($user);
    $s = array_merge($current, body());
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
    // Curly: only once migration 003 added the column; until then the browser keeps it
    if ($mascot !== null && array_key_exists('mascot', $current)) {
        q('UPDATE user_settings SET mascot = ? WHERE user_id = ?', [json_encode($mascot, JSON_UNESCAPED_UNICODE), $user['id']]);
    }
    // App theme: only once migration 004 added the columns; until then the browser keeps it
    $b = body();
    if ((array_key_exists('appTheme', $b) || array_key_exists('appThemeCustom', $b)) && array_key_exists('appTheme', $current)) {
        $appTheme = $b['appTheme'] ?? $current['appTheme'] ?? 'codle';
        if (!in_array($appTheme, APP_THEMES, true)) $appTheme = 'codle';
        $custom = array_key_exists('appThemeCustom', $b) ? theme_custom_clean($b['appThemeCustom']) : $current['appThemeCustom'];
        q('UPDATE user_settings SET app_theme = ?, app_theme_custom = ? WHERE user_id = ?',
          [$appTheme, $custom !== null ? json_encode($custom) : null, $user['id']]);
    }
    return ['settings' => user_settings($user)];
}
