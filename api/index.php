<?php
/**
 * Codle API — front controller. Every request under api/ lands here (.htaccess).
 *
 *   GET  api/app                     everything the learning page needs on load
 *   POST api/auth/login              …
 *
 * The full list is in $ROUTES below and in api/README.md. Without mod_rewrite,
 * call api/index.php?r=app instead.
 */

declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/progress.php';
require __DIR__ . '/lib/wordle.php';
require __DIR__ . '/lib/history.php';
require __DIR__ . '/lib/profile.php';
require __DIR__ . '/routes/auth.php';
require __DIR__ . '/routes/me.php';
require __DIR__ . '/routes/learn.php';
require __DIR__ . '/routes/practice.php';
require __DIR__ . '/routes/profile.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

// "METHOD path" => handler. {id} matches a positive integer and is passed as an int.
$ROUTES = [
    'GET session'                => 'route_session',
    'POST auth/login'            => 'route_login',
    'POST auth/logout'           => 'route_logout',
    'GET auth/username'          => 'route_username_check',
    'POST auth/register/code'    => 'route_register_code',
    'POST auth/register/verify'  => 'route_register_verify',
    'POST auth/register'         => 'route_register',
    'POST auth/password/code'    => 'route_password_code',
    'POST auth/password/reset'   => 'route_password_reset',
    'GET placement/questions'    => 'route_placement_questions',

    'GET app'                    => 'route_app',
    'PATCH me'                   => 'route_me_update',
    'DELETE me'                  => 'route_me_delete',
    'POST me/password'           => 'route_me_password',
    'POST me/course'             => 'route_me_course',
    'GET me/settings'            => 'route_settings_get',
    'PUT me/settings'            => 'route_settings_put',
    'GET leaderboard'            => 'route_leaderboard',

    'GET me/profile'             => 'route_profile_get',
    'GET users/profile'          => 'route_user_profile',
    'POST me/avatar'             => 'route_avatar_upload',
    'DELETE me/avatar'           => 'route_avatar_delete',
    'POST me/username'           => 'route_me_username',
    'POST me/email/code'         => 'route_email_code',
    'POST me/email'              => 'route_email_change',
    'GET me/sessions'            => 'route_sessions_get',
    'DELETE me/sessions'         => 'route_sessions_delete',
    'GET me/export'              => 'route_me_export',

    'GET path'                   => 'route_path',
    'GET lessons/{id}'           => 'route_lesson_get',
    'PUT lessons/{id}/save'      => 'route_lesson_save',
    'POST lessons/{id}/check'    => 'route_lesson_check',

    'GET wordle'                 => 'route_wordle_get',
    'POST wordle/guess'          => 'route_wordle_guess',
    'POST wordle/hint'           => 'route_wordle_hint',
    'GET history/cards'          => 'route_history_cards',
    'POST history/older'         => 'route_history_older',
    'GET history/story'          => 'route_story_get',
    'POST history/story'         => 'route_story_answer',
];

function request_path(): string
{
    if (isset($_GET['r']) && is_string($_GET['r'])) return trim($_GET['r'], '/');
    $uri = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    if ($base !== '' && str_starts_with($uri, $base)) $uri = substr($uri, strlen($base));
    $uri = preg_replace('#^/index\.php#', '', $uri);
    return trim(rawurldecode($uri), '/');
}

function dispatch(array $routes): void
{
    $method = method();
    $path = request_path();

    // State-changing requests must come from our own pages (CSRF): a custom header
    // cannot be set by a cross-site form, and a cross-site fetch with it needs CORS.
    if ($method !== 'GET' && ($_SERVER['HTTP_X_CODLE'] ?? '') !== '1') {
        fail(403, 'missing_header', 'Send the X-Codle: 1 header.');
    }

    $allowed = [];
    foreach ($routes as $spec => $handler) {
        [$m, $pattern] = explode(' ', $spec, 2);
        $re = '#^' . str_replace('\{id\}', '([1-9][0-9]{0,9})', preg_quote($pattern, '#')) . '$#';
        if (!preg_match($re, $path, $match)) continue;
        if ($m !== $method) { $allowed[] = $m; continue; }
        $args = array_map('intval', array_slice($match, 1));
        send_json(200, $handler(...$args));
    }
    if ($allowed) {
        header('Allow: ' . implode(', ', array_unique($allowed)));
        fail(405, 'method_not_allowed');
    }
    fail(404, 'not_found', 'Unknown API endpoint: ' . $path);
}

try {
    date_default_timezone_set((string) (config()['timezone'] ?? 'Europe/Prague'));
    dispatch($ROUTES);
} catch (ApiError $e) {
    send_json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()] + $e->extra);
} catch (Throwable $e) {
    error_log('Codle API: ' . $e);
    send_json(500, ['error' => 'server_error', 'message' => 'Something went wrong on the server.']);
}
