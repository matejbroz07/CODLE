<?php
/**
 * Codle API — shared bootstrap: config, database, JSON in/out and helpers.
 */

declare(strict_types=1);

/* ---------------------------------------------------------------
   Errors — every failure leaves as JSON { "error": code, "message": … }
--------------------------------------------------------------- */

final class ApiError extends Exception
{
    public function __construct(public int $status, public string $errorCode, string $message = '', public array $extra = [])
    {
        parent::__construct($message !== '' ? $message : $errorCode);
    }
}

function fail(int $status, string $code, string $message = '', array $extra = []): never
{
    throw new ApiError($status, $code, $message, $extra);
}

function send_json(int $status, $data): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ---------------------------------------------------------------
   Config + database
--------------------------------------------------------------- */

function config(): array
{
    static $config = null;
    if ($config !== null) return $config;

    $path = getenv('CODLE_API_CONFIG') ?: dirname(__DIR__) . '/config.php';
    if (!is_file($path) || !is_readable($path)) {
        fail(503, 'not_configured', 'The API is not set up. Run php api/tools/setup.php.');
    }
    $config = require $path;
    if (strlen((string) ($config['secret'] ?? '')) < 32) {
        fail(503, 'not_configured', 'Set a secret of at least 32 characters in api/config.php.');
    }
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
        error_log('Codle API: database connection failed: ' . $e->getMessage());
        fail(503, 'db_unavailable', 'The database is not available.');
    }
    // Server-side timestamps (created_at, expires_at …) use the server zone; local days are computed in PHP.
    $pdo->exec("SET time_zone = '" . date('P') . "'");
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function q_row(string $sql, array $params = []): ?array
{
    return q($sql, $params)->fetch() ?: null;
}

function q_val(string $sql, array $params = [])
{
    $v = q($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

/** Runs $fn inside a transaction and returns its result. */
function tx(callable $fn)
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $result = $fn();
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

/* ---------------------------------------------------------------
   Request input
--------------------------------------------------------------- */

function method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function body(): array
{
    static $body = null;
    if ($body !== null) return $body;
    $raw = (string) file_get_contents('php://input');
    if ($raw === '') return $body = [];
    $data = json_decode($raw, true);
    if (!is_array($data)) fail(400, 'bad_json', 'The request body must be a JSON object.');
    return $body = $data;
}

function in_str(string $key, int $maxLen = 1000): string
{
    $v = body()[$key] ?? '';
    if (!is_string($v)) fail(422, 'invalid_' . $key);
    $v = trim($v);
    if (mb_strlen($v) > $maxLen) fail(422, 'invalid_' . $key, "$key is too long.");
    return $v;
}

/** Like in_str() but keeps whitespace (code, passwords). */
function in_raw(string $key, int $maxLen): string
{
    $v = body()[$key] ?? '';
    if (!is_string($v)) fail(422, 'invalid_' . $key);
    if (strlen($v) > $maxLen) fail(422, 'invalid_' . $key, "$key is too long.");
    return $v;
}

function in_int(string $key, ?int $default = null): int
{
    $v = body()[$key] ?? $default;
    if (is_int($v)) return $v;
    if (is_string($v) && preg_match('/^-?\d+$/', $v)) return (int) $v;
    fail(422, 'invalid_' . $key);
}

function query_str(string $key): string
{
    $v = $_GET[$key] ?? '';
    return is_string($v) ? trim($v) : '';
}

/* ---------------------------------------------------------------
   Dates — a learner's "day" is the date in their own time zone
--------------------------------------------------------------- */

function safe_timezone(?string $tz): string
{
    return $tz !== null && in_array($tz, timezone_identifiers_list(), true) ? $tz : (string) (config()['timezone'] ?? 'Europe/Prague');
}

function local_today(string $tz): string
{
    return (new DateTimeImmutable('now', new DateTimeZone(safe_timezone($tz))))->format('Y-m-d');
}

function add_days(string $date, int $days): string
{
    return (new DateTimeImmutable($date))->modify(($days >= 0 ? '+' : '') . $days . ' day')->format('Y-m-d');
}

function days_between(string $from, string $to): int
{
    return (int) (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->format('%r%a');
}

/** Seconds until midnight in the learner's zone (for "next word in …"). */
function secs_to_midnight(string $tz): int
{
    $zone = new DateTimeZone(safe_timezone($tz));
    $now = new DateTimeImmutable('now', $zone);
    return $now->modify('tomorrow')->getTimestamp() - $now->getTimestamp();
}

function iso(?string $datetime): ?string
{
    return $datetime ? (new DateTimeImmutable($datetime))->format(DATE_ATOM) : null;
}

/* ---------------------------------------------------------------
   Hashing
--------------------------------------------------------------- */

function keyed_hash(string $value): string
{
    return hash_hmac('sha256', $value, (string) config()['secret']);
}

function normalize_email(string $email): string
{
    return mb_strtolower(trim($email));
}

function valid_email(string $email): bool
{
    return mb_strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
