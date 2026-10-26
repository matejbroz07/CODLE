<?php
/**
 * Creates api/config.php from config.sample.php with a random secret.
 *
 *   php api/tools/setup.php
 *
 * An existing config.php is left alone, unless its secret is still empty.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$apiDir = dirname(__DIR__);
$config = getenv('CODLE_API_CONFIG') ?: $apiDir . '/config.php';

if (!is_file($config)) {
    if (!copy($apiDir . '/config.sample.php', $config)) {
        fwrite(STDERR, "Nepodařilo se vytvořit $config\n");
        exit(1);
    }
    echo "Vytvořen $config (zkontrolujte přihlášení k databázi).\n";
}

$source = (string) file_get_contents($config);
if (!preg_match("/'secret'\s*=>\s*''/", $source)) {
    echo "Tajný klíč už je nastavený, nic se nemění.\n";
    exit(0);
}
$updated = preg_replace("/('secret'\s*=>\s*)''/", "\$1'" . bin2hex(random_bytes(32)) . "'", $source, 1);
if (file_put_contents($config, $updated) === false) {
    fwrite(STDERR, "Nepodařilo se zapsat $config\n");
    exit(1);
}
chmod($config, 0644);   // Apache runs as another user and must be able to read it
echo "Tajný klíč nastaven.\n";
