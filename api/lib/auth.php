<?php
/**
 * Codle API — accounts: login sessions, rate limits, e-mail codes.
 *
 * The session cookie holds a random token; the database keeps only its SHA-256
 * (sessions.token_hash). State-changing requests must carry the X-Codle header,
 * which a cross-site form cannot send, so the cookie alone is not enough (CSRF).
 */

const SESSION_COOKIE = 'codle_session';
const CODE_TTL_MINUTES = 15;
const CODE_MAX_ATTEMPTS = 5;
const VERIFIED_TOKEN_TTL = 3600;          // registration step 3 → step 4

const RESERVED_USERNAMES = [
    'admin', 'administrator', 'codle', 'root', 'system', 'moderator', 'support',
    'null', 'undefined', 'me', 'you', 'api',
];
// Terms that may not appear anywhere in a username (matched as a substring).
const BLOCKED_USERNAME_TERMS = ['nigger'];

/* ---------------------------------------------------------------
   Session cookie
--------------------------------------------------------------- */

function is_https(): bool
{
    return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}

function set_session_cookie(string $token, int $expires): void
{
    setcookie(SESSION_COOKIE, $token, [
        'expires'  => $expires,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => is_https(),
    ]);
}

function device_label(): string
{
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    $browser = match (true) {
        str_contains($ua, 'Edg/')     => 'Edge',
        str_contains($ua, 'OPR/')     => 'Opera',
        str_contains($ua, 'Firefox/') => 'Firefox',
        str_contains($ua, 'Chrome/')  => 'Chrome',
        str_contains($ua, 'Safari/')  => 'Safari',
        default                       => 'Browser',
    };
    $os = match (true) {
        str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') => 'iOS',
        str_contains($ua, 'Android')  => 'Android',
        str_contains($ua, 'CrOS')     => 'ChromeOS',
        str_contains($ua, 'Mac OS X') => 'macOS',
        str_contains($ua, 'Windows')  => 'Windows',
        str_contains($ua, 'Linux')    => 'Linux',
        default                       => 'unknown OS',
    };
    return "$browser on $os";
}

function start_session(int $userId): void
{
    $token = bin2hex(random_bytes(32));
    $days = max(1, (int) (config()['session_days'] ?? 30));
    $expires = time() + $days * 86400;
    q('INSERT INTO sessions (token_hash, user_id, expires_at, device_label) VALUES (?, ?, ?, ?)',
        [hash('sha256', $token), $userId, date('Y-m-d H:i:s', $expires), device_label()]);
    q('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$userId]);
    // Housekeeping: drop expired sessions now and then.
    if (random_int(1, 20) === 1) q('DELETE FROM sessions WHERE expires_at < NOW()');
    set_session_cookie($token, $expires);
}

function end_session(): void
{
    $token = (string) ($_COOKIE[SESSION_COOKIE] ?? '');
    if ($token !== '') q('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
    set_session_cookie('', time() - 3600);
}

/** The logged-in user row, or null. */
function current_user(): ?array
{
    static $user = false;
    if ($user !== false) return $user;

    $token = (string) ($_COOKIE[SESSION_COOKIE] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $token)) return $user = null;
    $hash = hash('sha256', $token);
    $user = q_row('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
                   WHERE s.token_hash = ? AND s.expires_at > NOW()', [$hash]);
    if ($user) {
        // Touch at most once a minute so every request is not a write.
        q('UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = ? AND last_seen_at < NOW() - INTERVAL 1 MINUTE', [$hash]);
    }
    return $user;
}

function require_user(): array
{
    return current_user() ?? fail(401, 'not_logged_in', 'Log in first.');
}

/* ---------------------------------------------------------------
   Rate limits (auth_throttle) — keyed by a hash, never by IP
--------------------------------------------------------------- */

/**
 * Counts one hit in the bucket for $key and fails with 429 once more than $max
 * hits happened inside $windowSecs.
 */
function throttle(string $bucket, string $key, int $max, int $windowSecs): void
{
    $hash = keyed_hash($bucket . '|' . $key);
    $row = q_row('SELECT hits, window_start FROM auth_throttle WHERE bucket = ? AND key_hash = ?', [$bucket, $hash]);
    $now = time();
    if (!$row || strtotime($row['window_start']) + $windowSecs <= $now) {
        q('REPLACE INTO auth_throttle (bucket, key_hash, hits, window_start) VALUES (?, ?, 1, NOW())', [$bucket, $hash]);
        if (random_int(1, 50) === 1) q('DELETE FROM auth_throttle WHERE window_start < NOW() - INTERVAL 1 DAY');
        return;
    }
    if ((int) $row['hits'] >= $max) {
        $wait = strtotime($row['window_start']) + $windowSecs - $now;
        fail(429, 'too_many_attempts', 'Too many attempts. Try again in ' . max(1, (int) ceil($wait / 60)) . ' min.', ['retryAfter' => $wait]);
    }
    q('UPDATE auth_throttle SET hits = hits + 1 WHERE bucket = ? AND key_hash = ?', [$bucket, $hash]);
}

function clear_throttle(string $bucket, string $key): void
{
    q('DELETE FROM auth_throttle WHERE bucket = ? AND key_hash = ?', [$bucket, keyed_hash($bucket . '|' . $key)]);
}

/* ---------------------------------------------------------------
   Usernames + passwords
--------------------------------------------------------------- */

/**
 * Returns an error code for an unusable username, or '' when it is free.
 * $selfId is the account asking (profile rename): its own current and earlier
 * names do not count as taken, so it can change only the letter case or go back.
 */
function username_problem(string $username, ?int $selfId = null): string
{
    if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $username)) return 'invalid_format';
    $lower = strtolower($username);
    foreach (BLOCKED_USERNAME_TERMS as $t) {
        if (str_contains($lower, $t)) return 'not_allowed';
    }
    if (in_array($lower, RESERVED_USERNAMES, true)) return 'taken';
    // The unicode_ci collation makes these case-insensitive.
    if (q_val('SELECT 1 FROM users WHERE username = ? AND id <> ?', [$username, $selfId ?? 0])) return 'taken';
    // A name someone gave up recently stays theirs for a while (no impersonation).
    $hold = username_hold_days();
    if (q_val('SELECT 1 FROM username_history WHERE old_username = ? AND user_id <> ? AND changed_at > NOW() - INTERVAL ' . $hold . ' DAY',
        [$username, $selfId ?? 0])) return 'taken';
    return '';
}

function username_hold_days(): int
{
    return max(0, (int) (config()['profile']['username_hold_days'] ?? 90));
}

/** Same rules as the strength meter in register.js: 8+ chars, upper, lower, digit, symbol. */
function password_problem(string $password): string
{
    if (strlen($password) < 8) return 'Password must be at least 8 characters.';
    if (strlen($password) > 200) return 'Password is too long.';
    if (!preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password)
        || !preg_match('/[0-9]/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) {
        return 'Password needs an upper-case letter, a lower-case letter, a number and a symbol.';
    }
    return '';
}

/* ---------------------------------------------------------------
   E-mail codes (email_verifications)
--------------------------------------------------------------- */

function code_hash(string $email, string $purpose, string $code): string
{
    return keyed_hash("code|$purpose|$email|$code");
}

/**
 * Creates a 6-digit code for $email, sends it and returns what the API may tell
 * the client (in dev mode that includes the code itself).
 */
function issue_code(string $email, string $purpose, ?int $userId = null): array
{
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    // A new code replaces every older unused one.
    q('UPDATE email_verifications SET consumed_at = NOW() WHERE email = ? AND purpose = ? AND consumed_at IS NULL', [$email, $purpose]);
    q('INSERT INTO email_verifications (email, user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?, NOW() + INTERVAL ' . CODE_TTL_MINUTES . ' MINUTE)',
        [$email, $userId, $purpose, code_hash($email, $purpose, $code)]);
    if (random_int(1, 20) === 1) q('DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL 1 DAY');

    $mode = config()['mail']['mode'] ?? 'dev';
    if ($mode === 'mail') {
        send_code_mail($email, $purpose, $code);
        return ['sent' => true, 'expiresInMinutes' => CODE_TTL_MINUTES];
    }
    return ['sent' => true, 'expiresInMinutes' => CODE_TTL_MINUTES, 'devCode' => $code];
}

function send_code_mail(string $email, string $purpose, string $code): void
{
    $subject = match ($purpose) {
        'password_reset' => 'Your Codle password reset code',
        'email_change'   => 'Confirm your new Codle e-mail',
        default          => 'Your Codle verification code',
    };
    $text = "Your code is: $code\n\nIt is valid for " . CODE_TTL_MINUTES . " minutes. If you did not ask for it, ignore this e-mail.\n\nCodle";
    $from = (string) (config()['mail']['from'] ?? 'Codle <no-reply@example.com>');
    $headers = "From: $from\r\nContent-Type: text/plain; charset=utf-8\r\n";
    if (!@mail($email, $subject, $text, $headers)) {
        error_log('Codle API: mail() failed for a ' . $purpose . ' code');
        fail(502, 'mail_failed', 'The e-mail could not be sent. Try again later.');
    }
}

/** Checks a code; consumes it on success. Fails with a client error otherwise. */
function verify_code(string $email, string $purpose, string $code): array
{
    if (!preg_match('/^\d{6}$/', $code)) fail(422, 'invalid_code', 'The code has 6 digits.');
    $row = q_row('SELECT * FROM email_verifications
                  WHERE email = ? AND purpose = ? AND consumed_at IS NULL
                  ORDER BY created_at DESC, id DESC LIMIT 1', [$email, $purpose]);
    if (!$row || strtotime($row['expires_at']) <= time()) fail(410, 'code_expired', 'The code has expired. Ask for a new one.');
    if ((int) $row['attempts'] >= CODE_MAX_ATTEMPTS) fail(429, 'too_many_attempts', 'Too many wrong codes. Ask for a new one.');
    if (!hash_equals($row['code_hash'], code_hash($email, $purpose, $code))) {
        q('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?', [$row['id']]);
        $left = CODE_MAX_ATTEMPTS - (int) $row['attempts'] - 1;
        fail(422, 'wrong_code', 'Incorrect code.', ['attemptsLeft' => max(0, $left)]);
    }
    q('UPDATE email_verifications SET consumed_at = NOW() WHERE id = ?', [$row['id']]);
    return $row;
}

/* ---------------------------------------------------------------
   Signed "this e-mail was verified" token (step 3 → step 4)
--------------------------------------------------------------- */

function verified_token(string $email): string
{
    $payload = rtrim(strtr(base64_encode(json_encode(['e' => $email, 'x' => time() + VERIFIED_TOKEN_TTL])), '+/', '-_'), '=');
    return $payload . '.' . keyed_hash('verified|' . $payload);
}

/** Returns the e-mail inside a valid token, or fails. */
function verified_email(string $token): string
{
    $parts = explode('.', $token);
    if (count($parts) !== 2 || !hash_equals(keyed_hash('verified|' . $parts[0]), $parts[1])) {
        fail(403, 'email_not_verified', 'Verify your e-mail first.');
    }
    $data = json_decode((string) base64_decode(strtr($parts[0], '-_', '+/')), true);
    if (!is_array($data) || ($data['x'] ?? 0) < time()) fail(403, 'email_not_verified', 'The verification has expired. Verify your e-mail again.');
    return (string) $data['e'];
}
