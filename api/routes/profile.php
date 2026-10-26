<?php
/**
 * Codle API — the Profile tab: profile data, avatar, username, e-mail, devices, export.
 * Bio, visibility, daily goal and time zone are saved by PATCH me (routes/me.php).
 */

function route_profile_get(): array
{
    $user = require_user();
    return ['profile' => profile_payload($user, true, $user), 'user' => user_summary($user)];
}

/** Another learner's profile (from the leaderboard). */
function route_user_profile(): array
{
    $viewer = require_user();
    $name = query_str('u');
    $user = preg_match('/^[A-Za-z0-9_]{3,20}$/', $name) ? q_row('SELECT * FROM users WHERE username = ?', [$name]) : null;
    if (!$user) fail(404, 'unknown_user', 'There is no learner with this name.');
    $own = (int) $user['id'] === (int) $viewer['id'];
    return ['profile' => profile_payload($user, $own, $viewer)];
}

/* ---------------------------------------------------------------
   Avatar — multipart/form-data with one file field "avatar"
--------------------------------------------------------------- */

function route_avatar_upload(): array
{
    $user = require_user();
    throttle('avatar', (string) $user['id'], 20, 3600);

    $maxBytes = profile_config('avatar_max_bytes', 5 * 1024 * 1024);
    $f = $_FILES['avatar'] ?? null;
    if (!$f || !is_array($f) || is_array($f['error'])) {
        // PHP drops the whole body when it is over post_max_size, so a huge file lands here too.
        fail(422, 'missing_file', 'Choose an image to upload (at most ' . round($maxBytes / 1048576) . ' MB).');
    }
    if (in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $f['size'] > $maxBytes) {
        fail(413, 'file_too_large', 'The image can be at most ' . round($maxBytes / 1048576) . ' MB.');
    }
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        fail(422, 'upload_failed', 'The upload did not finish. Try again.');
    }

    $file = store_avatar((int) $user['id'], avatar_jpeg($f['tmp_name']));
    q('UPDATE users SET avatar_file = ? WHERE id = ?', [$file, $user['id']]);
    delete_avatar_file($user['avatar_file'] ?? null);
    return ['user' => user_summary($user)];
}

function route_avatar_delete(): array
{
    $user = require_user();
    q('UPDATE users SET avatar_file = NULL WHERE id = ?', [$user['id']]);
    delete_avatar_file($user['avatar_file'] ?? null);
    return ['user' => user_summary($user)];
}

/* ---------------------------------------------------------------
   Username — needs the password, once per cooldown period
--------------------------------------------------------------- */

function route_me_username(): array
{
    $user = require_user();
    throttle('login', $user['email'], 10, 15 * 60);
    if (!password_verify(in_raw('password', 200), (string) $user['password_hash'])) fail(401, 'wrong_password', 'The password is wrong.');

    $name = in_str('username', 40);
    if ($name === $user['username']) fail(422, 'same_username', 'That already is your username.');
    // Changing only the letter case (codemaster → CodeMaster) is free and leaves the old name to nobody.
    $caseOnly = strcasecmp($name, $user['username']) === 0;

    if (!$caseOnly && ($next = username_next_change($user))) {
        fail(429, 'username_cooldown', 'You can change your username again on ' . date('j M Y', strtotime($next)) . '.',
            ['availableAt' => iso($next)]);
    }
    if ($problem = username_problem($name, (int) $user['id'])) {
        fail(409, 'username_' . $problem, match ($problem) {
            'taken'          => 'This username is already taken.',
            'invalid_format' => 'Use 3–20 letters, numbers or underscores.',
            default          => 'This username isn\'t allowed.',
        });
    }

    try {
        tx(function () use ($user, $name, $caseOnly) {
            if ($caseOnly) {
                q('UPDATE users SET username = ? WHERE id = ?', [$name, $user['id']]);
                return;
            }
            q('INSERT INTO username_history (user_id, old_username, new_username) VALUES (?, ?, ?)', [$user['id'], $user['username'], $name]);
            q('UPDATE users SET username = ?, username_changed_at = NOW() WHERE id = ?', [$name, $user['id']]);
        });
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') fail(409, 'username_taken', 'This username is already taken.');   // lost a race
        throw $e;
    }
    clear_throttle('login', $user['email']);
    return ['user' => user_summary($user)];
}

/* ---------------------------------------------------------------
   E-mail — password, then a code sent to the new address
--------------------------------------------------------------- */

function route_email_code(): array
{
    $user = require_user();
    throttle('login', $user['email'], 10, 15 * 60);
    if (!password_verify(in_raw('password', 200), (string) $user['password_hash'])) fail(401, 'wrong_password', 'The password is wrong.');

    $email = normalize_email(in_str('email', 254));
    if (!valid_email($email)) fail(422, 'invalid_email', 'Please enter a valid e-mail.');
    if ($email === $user['email']) fail(422, 'same_email', 'That already is your e-mail.');
    if (q_val('SELECT 1 FROM users WHERE email = ?', [$email])) fail(409, 'email_taken', 'Another account already uses this e-mail.');
    throttle('email_change', (string) $user['id'], 5, 3600);
    throttle('send_code', $email, 5, 3600);
    clear_throttle('login', $user['email']);
    return issue_code($email, 'email_change', (int) $user['id']);
}

function route_email_change(): array
{
    $user = require_user();
    $email = normalize_email(in_str('email', 254));
    if (!valid_email($email)) fail(422, 'invalid_email', 'Please enter a valid e-mail.');
    throttle('verify_code', $email, 20, 15 * 60);
    $code = verify_code($email, 'email_change', in_str('code', 6));
    // The code must have been asked for by this account.
    if ((int) $code['user_id'] !== (int) $user['id']) fail(410, 'code_expired', 'The code has expired. Ask for a new one.');

    try {
        q('UPDATE users SET email = ?, email_verified_at = NOW() WHERE id = ?', [$email, $user['id']]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') fail(409, 'email_taken', 'Another account already uses this e-mail.');
        throw $e;
    }
    notify_mail($user['email'], 'Your Codle e-mail was changed',
        'The e-mail of your Codle account ' . $user['username'] . ' was changed to ' . $email . '.');
    return ['user' => user_summary($user)];
}

/* ---------------------------------------------------------------
   Devices (login sessions)
--------------------------------------------------------------- */

function route_sessions_get(): array
{
    return ['sessions' => session_list(require_user())];
}

/** {id} signs out one other device; no id signs out every other device. */
function route_sessions_delete(): array
{
    $user = require_user();
    $current = current_token_hash();
    $id = in_str('id', 16);
    if ($id === '') {
        q('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', [$user['id'], $current]);
    } else {
        if (!preg_match('/^[0-9a-f]{16}$/', $id)) fail(422, 'invalid_id');
        if (str_starts_with($current, $id)) fail(422, 'current_session', 'This is the device you are using. Use Log out instead.');
        q('DELETE FROM sessions WHERE user_id = ? AND token_hash LIKE ? AND token_hash <> ?', [$user['id'], $id . '%', $current]);
    }
    return ['sessions' => session_list($user)];
}

/* ---------------------------------------------------------------
   Data export
--------------------------------------------------------------- */

function route_me_export(): array
{
    $user = require_user();
    throttle('export', (string) $user['id'], 10, 3600);
    return user_export($user);
}
