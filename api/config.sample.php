<?php
/**
 * Codle API — configuration template.
 *
 * Create api/config.php (ignored by git) with:
 *
 *   php api/tools/setup.php
 *
 * It copies this file and fills in a random secret. To keep the config outside
 * the web root, point the CODLE_API_CONFIG environment variable at it instead.
 */
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'codle',
        'user' => 'root',
        'pass' => '',
    ],

    // Random string used to hash verification codes and rate-limit keys.
    // Changing it invalidates codes that were already sent.
    'secret' => '',

    // Default time zone for new accounts and for the server clock.
    'timezone' => 'Europe/Prague',

    // Date of Wordle puzzle #1 (must match LAUNCH in js/practice.js and admin/config.php).
    'wordle_launch' => '2026-10-13',

    // How verification codes reach the learner:
    //   'dev'  — no e-mail; the API returns the code and the page shows it (local XAMPP only)
    //   'mail' — PHP mail() with the sender below (needs a working mail setup on the server)
    'mail' => [
        'mode' => 'dev',
        'from' => 'Codle <no-reply@example.com>',
    ],

    // Login session lifetime in days.
    'session_days' => 30,

    // Profile tab
    'profile' => [
        'username_cooldown_days' => 30,              // one rename per this many days (letter case changes are free)
        'username_hold_days'     => 90,              // a released name stays reserved for its old owner this long
        'avatar_max_bytes'       => 5 * 1024 * 1024, // upload limit; the stored avatar is a 320 × 320 JPEG
        // 'avatar_dir' => '/path/to/uploads/avatars',   // default: uploads/avatars next to index.html
        // 'avatar_url' => 'uploads/avatars/',           // how the pages reach that folder
    ],

    // XP for practice games. Lessons give lessons.xp_reward (set in the admin).
    'xp' => [
        'wordle_win'        => 10,
        'wordle_win_hint'   => 5,
        'daily_story'       => 10,
        'older_younger_max' => 20,   // per day; 1 XP per correct answer in a run
    ],
];
