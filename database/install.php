<?php
/**
 * Codle — installs the database into the one named in api/config.php.
 *
 *   php database/install.php            creates the tables and loads the content
 *   php database/install.php --sql      prints everything as one SQL file instead
 *                                       (for phpMyAdmin → Import when the host has no SSH):
 *                                       php database/install.php --sql > codle-install.sql
 *
 * The SQL files in this folder say "USE codle"; on a host the database usually has
 * another name, so those lines and CREATE DATABASE are left out here. The target
 * database must exist and be empty (create it in the hosting control panel).
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const FILES = ['schema.sql', 'seed.sql', 'seed-placement.sql', 'seed-quests.sql', 'seed-quiz.sql'];

function sql_for(string $file): string
{
    $sql = (string) file_get_contents(__DIR__ . '/' . $file);
    // Drop the database selection: the target is the configured database.
    $sql = (string) preg_replace('/^\s*CREATE DATABASE[^;]*;\s*$/mi', '', $sql);
    $sql = (string) preg_replace('/^\s*USE\s+`?codle`?\s*;\s*$/mi', '', $sql);
    return $sql;
}

if (in_array('--sql', $argv, true)) {
    echo "-- Codle install script, generated " . date('Y-m-d H:i') . "\n";
    echo "-- Import it into an empty database (phpMyAdmin → Import).\n\nSET NAMES utf8mb4;\n\n";
    foreach (FILES as $f) echo "-- ===== $f =====\n" . sql_for($f) . "\n\n";
    exit(0);
}

$configPath = getenv('CODLE_API_CONFIG') ?: dirname(__DIR__) . '/api/config.php';
if (!is_file($configPath)) {
    fwrite(STDERR, "Missing $configPath. Run php api/tools/setup.php first and fill in the database login.\n");
    exit(1);
}
$c = (require $configPath)['db'];

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $db = new mysqli($c['host'], $c['user'], $c['pass'], $c['name'], (int) ($c['port'] ?? 3306));
    $db->set_charset('utf8mb4');
} catch (mysqli_sql_exception $e) {
    fwrite(STDERR, 'Cannot connect to the database: ' . $e->getMessage() . "\n");
    exit(1);
}

$tables = (int) $db->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')->fetch_row()[0];
if ($tables > 0) {
    fwrite(STDERR, "The database {$c['name']} already has $tables tables. Install into an empty database,\n"
        . "or update an existing one with the files in database/migrations/.\n");
    exit(1);
}

foreach (FILES as $f) {
    echo str_pad($f, 22) . ' … ';
    try {
        $db->multi_query(sql_for($f));
        do {
            if ($r = $db->store_result()) $r->free();
        } while ($db->more_results() && $db->next_result());
    } catch (mysqli_sql_exception $e) {
        echo "failed\n";
        fwrite(STDERR, $e->getMessage() . "\n");
        exit(1);
    }
    echo "ok\n";
}
echo "Done. Database {$c['name']} is ready.\n";
