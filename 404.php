<?php
/**
 * Codle — "page not found". The root .htaccess sends every missing file here, so
 * it leaves with a real 404 status and the page with Curly (404.html, which GitHub
 * Pages serves by itself). The page shows up at any depth, so it gets a <base>
 * pointing back at the app root.
 */

declare(strict_types=1);

http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
$html = (string) file_get_contents(__DIR__ . '/404.html');
echo preg_replace('#<meta charset="UTF-8">#', "$0\n  <base href=\"" . htmlspecialchars($base, ENT_QUOTES) . '">', $html, 1);
