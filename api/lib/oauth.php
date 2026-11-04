<?php
/**
 * Codle API — "Continue with Google / GitHub" (OAuth 2.0 authorization code flow).
 *
 *   GET auth/oauth/{provider}/start?course=    → redirects to the provider
 *   GET auth/oauth/{provider}/callback         → the provider sends the browser back here
 *   GET auth/oauth/pending?token=              → who is about to register (register.html)
 *
 * After the callback:
 *   - a known provider identity            → logged in, sent to index.html
 *   - a logged-in learner linking a provider → linked, sent to index.html#profile
 *   - an account with the same verified e-mail → linked and logged in
 *   - nobody yet                           → register.html?oauth=<signed token>, where the
 *                                            wizard asks for the language, the quiz, a
 *                                            username and a password (no e-mail code)
 *
 * The CSRF state lives in a short-lived signed cookie. Provider secrets stay in
 * api/config.php under 'oauth'.
 */

const OAUTH_STATE_COOKIE = 'codle_oauth';
const OAUTH_STATE_TTL = 600;        // seconds the learner has to come back from the provider
const OAUTH_TOKEN_TTL = 3600;       // seconds the registration wizard may take after the callback

const OAUTH_PROVIDERS = [
    'google' => [
        'name'      => 'Google',
        'authorize' => 'https://accounts.google.com/o/oauth2/v2/auth',
        'token'     => 'https://oauth2.googleapis.com/token',
        'scope'     => 'openid email profile',
    ],
    'github' => [
        'name'      => 'GitHub',
        'authorize' => 'https://github.com/login/oauth/authorize',
        'token'     => 'https://github.com/login/oauth/access_token',
        'scope'     => 'read:user user:email',
    ],
];

/* ---------------------------------------------------------------
   URLs
--------------------------------------------------------------- */

/** Public URL of the app root with a trailing slash (config 'app_url', or derived from the request). */
function app_url(): string
{
    $url = (string) (config()['app_url'] ?? '');
    if ($url !== '') return rtrim($url, '/') . '/';
    $scheme = is_https() ? 'https' : 'http';
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    // SCRIPT_NAME is …/api/index.php; the app root is one level up.
    $root = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'))), '/');
    return "$scheme://$host$root/";
}

function oauth_redirect_uri(string $provider): string
{
    return app_url() . "api/auth/oauth/$provider/callback";
}

function oauth_settings(string $provider): array
{
    $meta = OAUTH_PROVIDERS[$provider] ?? fail(404, 'unknown_provider');
    $c = config()['oauth'][$provider] ?? [];
    if (empty($c['client_id']) || empty($c['client_secret'])) {
        fail(503, 'provider_not_configured', $meta['name'] . ' sign-in is not set up on this server.');
    }
    return $meta + ['client_id' => (string) $c['client_id'], 'client_secret' => (string) $c['client_secret']];
}

/** Sends the browser to a page of the app (never to another site). */
function redirect_to_app(string $page, array $query = []): never
{
    $url = app_url() . $page;
    if ($query) $url .= '?' . http_build_query($query);
    http_response_code(302);
    header('Location: ' . $url);
    exit;
}

/* ---------------------------------------------------------------
   HTTP to the provider
--------------------------------------------------------------- */

function oauth_http(string $method, string $url, array $headers = [], ?array $form = null): array
{
    $ch = curl_init($url);
    $headers[] = 'Accept: application/json';
    $headers[] = 'User-Agent: Codle';
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER     => $headers,
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($form ?? []);
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $data = $body === false ? null : json_decode((string) $body, true);
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        error_log("Codle API: OAuth request to $url failed ($status): " . substr((string) $body, 0, 300));
        return [];
    }
    return $data;
}

/* ---------------------------------------------------------------
   Step 1: start
--------------------------------------------------------------- */

/** oauth_settings() for browser navigations: a provider without keys sends the learner back with a message. */
function oauth_settings_or_back(string $provider): array
{
    try {
        return oauth_settings($provider);
    } catch (ApiError $e) {
        if ($e->errorCode !== 'provider_not_configured') throw $e;
        redirect_to_app(current_user() ? 'index.html' : 'register.html', ['oauth_error' => 'not_configured', 'provider' => $provider]);
    }
}

function route_oauth_start(string $provider): never
{
    $s = oauth_settings_or_back($provider);
    $course = preg_match('/^[a-z0-9_-]{1,32}$/', query_str('course')) ? query_str('course') : '';
    $nonce = bin2hex(random_bytes(16));
    $state = sign_payload('oauth_state', ['p' => $provider, 'n' => $nonce, 'c' => $course, 't' => time()]);

    setcookie(OAUTH_STATE_COOKIE, $state, [
        'expires'  => time() + OAUTH_STATE_TTL,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => is_https(),
    ]);

    $params = [
        'client_id'     => $s['client_id'],
        'redirect_uri'  => oauth_redirect_uri($provider),
        'response_type' => 'code',
        'scope'         => $s['scope'],
        'state'         => $nonce,
    ];
    if ($provider === 'google') {
        $params['access_type'] = 'online';
        $params['prompt'] = 'select_account';
    }
    http_response_code(302);
    header('Location: ' . $s['authorize'] . '?' . http_build_query($params));
    exit;
}

/* ---------------------------------------------------------------
   Step 2: callback
--------------------------------------------------------------- */

function route_oauth_callback(string $provider): never
{
    $s = oauth_settings_or_back($provider);
    $meta = OAUTH_PROVIDERS[$provider];

    // The state cookie proves this browser started the flow (CSRF / login CSRF).
    $saved = read_payload('oauth_state', (string) ($_COOKIE[OAUTH_STATE_COOKIE] ?? ''));
    setcookie(OAUTH_STATE_COOKIE, '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => is_https()]);
    $course = (string) ($saved['c'] ?? '');

    if (query_str('error') !== '') {
        // The learner cancelled on the provider's page.
        redirect_to_app('register.html', ['oauth_error' => 'cancelled', 'provider' => $provider]);
    }
    if (!$saved || ($saved['p'] ?? '') !== $provider || !hash_equals((string) ($saved['n'] ?? ''), query_str('state'))
        || time() - (int) ($saved['t'] ?? 0) > OAUTH_STATE_TTL) {
        redirect_to_app('register.html', ['oauth_error' => 'state', 'provider' => $provider]);
    }
    $code = query_str('code');
    if ($code === '') redirect_to_app('register.html', ['oauth_error' => 'failed', 'provider' => $provider]);

    $token = oauth_http('POST', $s['token'], [], [
        'client_id'     => $s['client_id'],
        'client_secret' => $s['client_secret'],
        'code'          => $code,
        'redirect_uri'  => oauth_redirect_uri($provider),
        'grant_type'    => 'authorization_code',
    ]);
    $access = (string) ($token['access_token'] ?? '');
    if ($access === '') redirect_to_app('register.html', ['oauth_error' => 'failed', 'provider' => $provider]);

    $identity = $provider === 'google' ? google_identity($access) : github_identity($access);
    if (!$identity) redirect_to_app('register.html', ['oauth_error' => 'failed', 'provider' => $provider]);
    if ($identity['email'] === '') redirect_to_app('register.html', ['oauth_error' => 'no_email', 'provider' => $provider]);

    $existing = q_row('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?', [$provider, $identity['id']]);
    $me = current_user();

    if ($me) {
        // Linking from the profile. The identity must not belong to someone else.
        if ($existing && (int) $existing['user_id'] !== (int) $me['id']) {
            redirect_to_app('index.html', ['oauth_error' => 'linked_elsewhere', 'provider' => $provider]);
        }
        if (!$existing) link_oauth((int) $me['id'], $provider, $identity['id']);
        redirect_to_app('index.html', ['linked' => $provider]);
    }

    if ($existing) {
        start_session((int) $existing['user_id']);
        redirect_to_app('index.html');
    }

    // Same verified e-mail as an existing account: that is the same person.
    $byEmail = q_row('SELECT id FROM users WHERE email = ?', [$identity['email']]);
    if ($byEmail) {
        link_oauth((int) $byEmail['id'], $provider, $identity['id']);
        q('UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [$byEmail['id']]);
        start_session((int) $byEmail['id']);
        redirect_to_app('index.html');
    }

    // New learner: the wizard finishes the account.
    $pending = sign_payload('oauth_pending', [
        'p' => $provider,
        'i' => $identity['id'],
        'e' => $identity['email'],
        'u' => suggest_username($identity['username'] ?: $identity['name'] ?: strstr($identity['email'], '@', true)),
        'x' => time() + OAUTH_TOKEN_TTL,
    ]);
    $query = ['oauth' => $pending];
    if ($course !== '') $query['course'] = $course;
    redirect_to_app('register.html', $query);
}

function link_oauth(int $userId, string $provider, string $providerUserId): void
{
    q('INSERT IGNORE INTO oauth_accounts (user_id, provider, provider_user_id) VALUES (?, ?, ?)', [$userId, $provider, $providerUserId]);
}

/** ['id', 'email' (verified, lower-case, '' when none), 'name', 'username'] */
function google_identity(string $access): ?array
{
    $u = oauth_http('GET', 'https://openidconnect.googleapis.com/v1/userinfo', ['Authorization: Bearer ' . $access]);
    if (empty($u['sub'])) return null;
    $verified = !empty($u['email']) && !empty($u['email_verified']) && valid_email((string) $u['email']);
    return [
        'id'       => (string) $u['sub'],
        'email'    => $verified ? normalize_email((string) $u['email']) : '',
        'name'     => (string) ($u['given_name'] ?? $u['name'] ?? ''),
        'username' => '',
    ];
}

function github_identity(string $access): ?array
{
    $u = oauth_http('GET', 'https://api.github.com/user', ['Authorization: Bearer ' . $access]);
    if (empty($u['id'])) return null;
    $email = '';
    $list = oauth_http('GET', 'https://api.github.com/user/emails', ['Authorization: Bearer ' . $access]);
    // oauth_http() returns [] for a non-object answer; the emails endpoint answers with a list.
    foreach (is_array($list) ? $list : [] as $e) {
        if (!is_array($e) || empty($e['verified']) || empty($e['email']) || !valid_email((string) $e['email'])) continue;
        if (str_ends_with((string) $e['email'], '@users.noreply.github.com')) continue;
        if (!empty($e['primary'])) { $email = (string) $e['email']; break; }
        if ($email === '') $email = (string) $e['email'];
    }
    return [
        'id'       => (string) $u['id'],
        'email'    => $email !== '' ? normalize_email($email) : '',
        'name'     => (string) ($u['name'] ?? ''),
        'username' => (string) ($u['login'] ?? ''),
    ];
}

/** A free username made from the provider's name: letters, digits and underscores, 3–20 chars. */
function suggest_username(string $seed): string
{
    // Transliteration marks accents with ' " ^ ~ ` on some systems: drop those.
    $ascii = (string) preg_replace('/[\'"`^~]/', '', (string) @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $seed));
    $base = substr((string) preg_replace('/[^A-Za-z0-9_]+/', '_', $ascii !== '' ? $ascii : $seed), 0, 16);
    $base = trim($base, '_');
    if (strlen($base) < 3) $base = 'coder';
    if (username_problem($base) === '') return $base;
    for ($i = 0; $i < 20; $i++) {
        $try = substr($base, 0, 14) . '_' . random_int(10, 9999);
        if (username_problem($try) === '') return $try;
    }
    return '';
}

/* ---------------------------------------------------------------
   The pending registration (register.html?oauth=…)
--------------------------------------------------------------- */

/** The identity inside a valid pending token, or fails. */
function oauth_pending(string $token): array
{
    $d = read_payload('oauth_pending', $token);
    if (!$d || ($d['x'] ?? 0) < time()) fail(403, 'oauth_expired', 'The sign-in has expired. Start again with Google or GitHub.');
    if (!isset(OAUTH_PROVIDERS[$d['p']]) || empty($d['i']) || empty($d['e'])) fail(403, 'oauth_expired', 'The sign-in has expired.');
    return ['provider' => $d['p'], 'id' => (string) $d['i'], 'email' => (string) $d['e'], 'username' => (string) ($d['u'] ?? '')];
}

function route_oauth_pending(): array
{
    $p = oauth_pending(query_str('token'));
    if (q_val('SELECT 1 FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?', [$p['provider'], $p['id']])
        || q_val('SELECT 1 FROM users WHERE email = ?', [$p['email']])) {
        fail(409, 'already_registered', 'This account already exists. Log in instead.');
    }
    return [
        'provider'     => $p['provider'],
        'providerName' => OAUTH_PROVIDERS[$p['provider']]['name'],
        'email'        => $p['email'],
        'username'     => $p['username'],
    ];
}

/** Providers linked to the account, for the profile. */
function linked_providers(int $userId): array
{
    return array_column(q('SELECT provider FROM oauth_accounts WHERE user_id = ? ORDER BY provider', [$userId])->fetchAll(), 'provider');
}
