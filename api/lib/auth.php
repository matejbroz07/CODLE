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
const CHALLENGE_TTL = 2 * 3600;           // a page may sit open this long before it registers
const CHALLENGE_MIN_AGE = 3;              // seconds: nobody fills the wizard faster than this
const POW_BITS = 16;                      // leading zero bits the browser has to find (≈65k hashes, well under a second)

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
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
    // Behind a proxy that terminates TLS (most hosting): trust it only when configured.
    return !empty(config()['behind_proxy']) && strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
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

/** Creates a 6-digit code for $email, e-mails it and returns what the API may tell the client. */
function issue_code(string $email, string $purpose, ?int $userId = null): array
{
    // Site-wide ceiling, so a flood of fresh addresses cannot burn the mail quota.
    $cap = (int) (config()['mail']['max_per_hour'] ?? 300);
    if ($cap > 0) throttle('send_code_all', 'all', $cap, 3600);
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    // A new code replaces every older unused one.
    q('UPDATE email_verifications SET consumed_at = NOW() WHERE email = ? AND purpose = ? AND consumed_at IS NULL', [$email, $purpose]);
    q('INSERT INTO email_verifications (email, user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?, NOW() + INTERVAL ' . CODE_TTL_MINUTES . ' MINUTE)',
        [$email, $userId, $purpose, code_hash($email, $purpose, $code)]);
    if (random_int(1, 20) === 1) q('DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL 1 DAY');

    send_code_mail($email, $purpose, $code);
    return ['sent' => true, 'expiresInMinutes' => CODE_TTL_MINUTES];
}

function send_code_mail(string $email, string $purpose, string $code): void
{
    [$subject, $text, $html] = code_mail($purpose, $code, CODE_TTL_MINUTES);
    send_mail($email, $subject, $text, $html);
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

/* ---------------------------------------------------------------
   Signed tokens (base64url payload + HMAC), shared by the flows below
--------------------------------------------------------------- */

function sign_payload(string $kind, array $data): string
{
    $payload = rtrim(strtr(base64_encode(json_encode($data, JSON_UNESCAPED_UNICODE)), '+/', '-_'), '=');
    return $payload . '.' . keyed_hash($kind . '|' . $payload);
}

/** The payload of a token signed with sign_payload($kind), or null when forged or malformed. */
function read_payload(string $kind, string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 2 || !preg_match('/^[A-Za-z0-9_-]+$/', $parts[0])) return null;
    if (!hash_equals(keyed_hash($kind . '|' . $parts[0]), $parts[1])) return null;
    $data = json_decode((string) base64_decode(strtr($parts[0], '-_', '+/')), true);
    return is_array($data) ? $data : null;
}

/* ---------------------------------------------------------------
   Bot check: a signed challenge the browser must "work" on (proof of work)
   plus a honeypot field. Nothing to click, nothing to read, well under a second.
--------------------------------------------------------------- */

function issue_challenge(): array
{
    return ['challenge' => sign_payload('challenge', ['t' => time(), 'n' => bin2hex(random_bytes(8))]), 'bits' => POW_BITS];
}

/**
 * Verifies the bot check sent with a form: the honeypot must be empty, the
 * challenge must be ours and old enough, and sha256(challenge|subject|nonce)
 * must start with POW_BITS zero bits. $subject ties the work to one e-mail
 * (or OAuth token), so one solution cannot be reused for another address.
 */
function require_human(string $subject): void
{
    $b = body();
    // Honeypot: a real browser leaves this invisible field empty.
    if (!empty($b['website'])) fail(422, 'bot_suspected', 'Something went wrong. Reload the page and try again.');

    $token = is_string($b['challenge'] ?? null) ? $b['challenge'] : '';
    $nonce = $b['nonce'] ?? null;
    $data = read_payload('challenge', $token);
    if (!$data || !is_int($data['t'] ?? null)) fail(422, 'bad_challenge', 'Reload the page and try again.');
    $age = time() - $data['t'];
    if ($age > CHALLENGE_TTL) fail(422, 'challenge_expired', 'This page sat open too long. Reload it and try again.');
    if ($age < CHALLENGE_MIN_AGE) fail(422, 'bot_suspected', 'Something went wrong. Reload the page and try again.');
    if (!is_int($nonce) && !(is_string($nonce) && preg_match('/^\d{1,12}$/', $nonce))) fail(422, 'bad_challenge', 'Reload the page and try again.');
    if (!pow_ok(hash('sha256', $token . '|' . $subject . '|' . $nonce, true))) {
        fail(422, 'bot_suspected', 'Something went wrong. Reload the page and try again.');
    }
}

function pow_ok(string $binaryHash): bool
{
    $bits = POW_BITS;
    for ($i = 0; $bits > 0; $i++, $bits -= 8) {
        $byte = ord($binaryHash[$i]);
        if ($bits >= 8) { if ($byte !== 0) return false; }
        elseif ($byte >> (8 - $bits) !== 0) return false;
    }
    return true;
}
