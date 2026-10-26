<?php
/**
 * Codle admin — configuration template.
 *
 * Copy this file to admin/config.php (ignored by git), fill in the database
 * login and set the admin password with:
 *
 *   php admin/tools/set-password.php
 *
 * To keep the config outside the web root, point the CODLE_ADMIN_CONFIG
 * environment variable at it instead.
 */
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'codle',
        'user' => 'root',
        'pass' => '',
    ],

    // password_hash() of the admin password. Empty = nobody can log in.
    'admin_password_hash' => '',

    // "Today" for the Wordle schedule and the dashboard.
    'timezone' => 'Europe/Prague',

    // Date of Wordle puzzle #1 (must match LAUNCH in js/practice.js).
    'wordle_launch' => '2026-10-13',
];
