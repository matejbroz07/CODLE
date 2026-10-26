<?php
/**
 * Codle admin — shared bootstrap: config, database, session, CSRF and helpers.
 * Every admin page starts with:  require __DIR__ . '/lib/bootstrap.php';
 */

declare(strict_types=1);

require __DIR__ . '/i18n.php';

const ADMIN_IDLE_SECONDS = 2 * 3600;      // log out after 2 hours without a request

/* ---------------------------------------------------------------
   Config + database
--------------------------------------------------------------- */

function config(): array
{
    static $config = null;
    if ($config !== null) return $config;

    $path = getenv('CODLE_ADMIN_CONFIG') ?: dirname(__DIR__) . '/config.php';
    if (!is_file($path)) {
        fatal_page(503, __('Admin is not set up'),
            __('Copy %s to %s and set the password with %s.',
                '<code>admin/config.sample.php</code>', '<code>admin/config.php</code>',
                '<code>php admin/tools/set-password.php</code>'));
    }
    if (!is_readable($path)) {
        fatal_page(503, __('Admin cannot read its config'),
            __('The web server is not allowed to read %s. Run %s on that file.', '<code>' . h($path) . '</code>', '<code>chmod 644</code>'));
    }
    $config = require $path;
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $c = config()['db'];
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'] ?? 3306, $c['name']);
    try {
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        error_log('Codle admin: database connection failed: ' . $e->getMessage());
        fatal_page(503, __('Database unavailable'),
            __('Check that MySQL is running in XAMPP and that the login in %s is right. %s creates the database.',
                '<code>admin/config.php</code>', '<code>database/schema.sql</code>'));
    }
    // Keep CURRENT_DATE in SQL on the same day as PHP's today().
    $pdo->exec("SET time_zone = '" . date('P') . "'");
    return $pdo;
}

function fatal_page(int $status, string $title, string $html): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="' . lang() . '"><head><meta charset="utf-8"><title>' . h($title) . '</title>' .
        '<style>body{font:15px/1.5 system-ui,sans-serif;background:#08090c;color:#eef1f6;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}' .
        'main{max-width:520px}code{background:#1b1e26;padding:2px 6px;border-radius:6px}</style></head>' .
        '<body><main><h1>' . h($title) . '</h1><p>' . $html . '</p></main></body></html>';
    exit;
}

date_default_timezone_set(config()['timezone'] ?? 'Europe/Prague');

/* ---------------------------------------------------------------
   Session + headers
--------------------------------------------------------------- */

session_name('codle_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

handle_lang_switch();

/* ---------------------------------------------------------------
   Auth
--------------------------------------------------------------- */

// Changing the password in config.php logs out every open session.
function password_fingerprint(): string
{
    return substr(hash('sha256', (string) (config()['admin_password_hash'] ?? '')), 0, 16);
}

function is_logged_in(): bool
{
    if (empty($_SESSION['admin'])) return false;
    $expired = time() - ($_SESSION['seen'] ?? 0) > ADMIN_IDLE_SECONDS;
    if ($expired || ($_SESSION['pw'] ?? '') !== password_fingerprint()) {
        $_SESSION = [];
        session_regenerate_id(true);
        return false;
    }
    $_SESSION['seen'] = time();
    return true;
}

function require_login(): void
{
    if (is_logged_in()) return;
    $next = basename($_SERVER['REQUEST_URI'] ?? '');
    redirect('login.php' . ($next !== '' ? '?next=' . urlencode($next) : ''));
}

/* ---------------------------------------------------------------
   CSRF — every POST form carries csrf_field()
--------------------------------------------------------------- */

function csrf_token(): string
{
    return $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}

function check_csrf(): void
{
    if (!hash_equals(csrf_token(), (string) ($_POST['csrf'] ?? ''))) {
        fatal_page(400, __('The form has expired'), __('Reload the page and try again.'));
    }
}

/* ---------------------------------------------------------------
   Helpers
--------------------------------------------------------------- */

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $url): void
{
    header('Location: ' . $url, true, 303);
    exit;
}

function flash(string $type, string $message): void
{
    $_SESSION['flash'][] = [$type, $message];
}

function take_flashes(): array
{
    $f = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $f;
}

function is_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function post_str(string $key): string
{
    $v = $_POST[$key] ?? '';
    return is_string($v) ? trim(str_replace("\r\n", "\n", $v)) : '';
}

function post_int(string $key, int $default = 0): int
{
    $v = $_POST[$key] ?? null;
    return is_numeric($v) ? (int) $v : $default;
}

function get_int(string $key, int $default = 0): int
{
    $v = $_GET[$key] ?? null;
    return is_numeric($v) ? (int) $v : $default;
}

function today(): string
{
    return date('Y-m-d');
}

function add_days(string $date, int $days): string
{
    return (new DateTimeImmutable($date))->modify(($days >= 0 ? '+' : '') . $days . ' day')->format('Y-m-d');
}

function is_date(string $s): bool
{
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $s);
    return $d !== false && $d->format('Y-m-d') === $s;
}

function slugify(string $s): string
{
    $ascii = function_exists('iconv') ? (string) @iconv('UTF-8', 'ASCII//TRANSLIT', $s) : $s;
    $slug = trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower($ascii)), '-');
    return substr($slug, 0, 64);
}

function pct(?float $part, ?float $whole): ?float
{
    return $whole ? round(100 * (float) $part / $whole, 0) : null;
}

const LESSON_KINDS = ['lesson' => 'Lesson', 'quest' => 'Quest', 'quiz' => 'Quiz', 'exam' => 'Exam'];
const LANGS = ['html' => 'HTML', 'css' => 'CSS', 'js' => 'JS'];

function kind_label(string $kind): string
{
    return __(LESSON_KINDS[$kind] ?? $kind);
}

require __DIR__ . '/layout.php';
