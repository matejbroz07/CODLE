<?php
/**
 * Sets the admin password: hashes it and writes the hash into admin/config.php
 * (created from config.sample.php if it does not exist yet).
 *
 *   php admin/tools/set-password.php
 *
 * Every open admin session is logged out afterwards.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const MIN_LENGTH = 10;

$adminDir = dirname(__DIR__);
$config = getenv('CODLE_ADMIN_CONFIG') ?: $adminDir . '/config.php';

function ask(string $prompt): string
{
    static $tty = null;
    $tty ??= stream_isatty(STDIN);       // must be checked before the first read
    echo $prompt;
    if ($tty) shell_exec('stty -echo');
    $line = fgets(STDIN);
    if ($tty) {
        shell_exec('stty echo');
        echo PHP_EOL;
    }
    return rtrim((string) $line, "\r\n");
}

$password = ask('Nové heslo admina: ');
if (mb_strlen($password) < MIN_LENGTH) {
    fwrite(STDERR, 'Heslo musí mít aspoň ' . MIN_LENGTH . " znaků.\n");
    exit(1);
}
if (ask('Heslo znovu: ') !== $password) {
    fwrite(STDERR, "Hesla se neshodují.\n");
    exit(1);
}

if (!is_file($config)) {
    if (!copy($adminDir . '/config.sample.php', $config)) {
        fwrite(STDERR, "Nepodařilo se vytvořit $config\n");
        exit(1);
    }
    echo "Vytvořen $config (zkontrolujte přihlášení k databázi).\n";
}

$source = (string) file_get_contents($config);
$hash = password_hash($password, PASSWORD_DEFAULT);
// A callback, because the hash itself contains "$" sequences that preg_replace would expand.
$updated = preg_replace_callback(
    "/('admin_password_hash'\s*=>\s*)'[^']*'/",
    fn($m) => $m[1] . var_export($hash, true),
    $source,
    1,
    $count
);
if ($count !== 1) {
    fwrite(STDERR, "V $config chybí řádek 'admin_password_hash' => ''.\n");
    exit(1);
}
file_put_contents($config, $updated, LOCK_EX);
@chmod($config, 0644);                    // Apache in XAMPP runs as "daemon" and must be able to read it
echo "Heslo uloženo.\n";
