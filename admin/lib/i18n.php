<?php
/**
 * Codle admin — interface language (English by default, Czech optional).
 *
 * Strings are written in English in the code and wrapped in __():
 *   __('Lesson saved.')                    → "Lekce uložena." in Czech
 *   __('%d learners started', $n)          → placeholders use sprintf syntax
 * Czech translations live in lib/lang/cs.php, keyed by the English text.
 * A missing translation falls back to English.
 */

const ADMIN_LANGS = ['en' => 'EN', 'cs' => 'CS'];
const LANG_COOKIE = 'codle_admin_lang';

function lang(): string
{
    $c = $_COOKIE[LANG_COOKIE] ?? '';
    return is_string($c) && isset(ADMIN_LANGS[$c]) ? $c : 'en';
}

function __(string $en, ...$args): string
{
    static $cs = null;
    $s = $en;
    if (lang() === 'cs') {
        $cs ??= require __DIR__ . '/lang/cs.php';
        $s = $cs[$en] ?? $en;
    }
    return $args ? vsprintf($s, $args) : $s;
}

/** ?lang=cs|en on any page stores the choice and reloads the page without the parameter. */
function handle_lang_switch(): void
{
    $l = $_GET['lang'] ?? null;
    if (!is_string($l) || !isset(ADMIN_LANGS[$l])) return;
    setcookie(LANG_COOKIE, $l, [
        'expires'  => time() + 365 * 86400,
        'path'     => '/',
        'samesite' => 'Lax',
        'httponly' => true,
    ]);
    $query = $_GET;
    unset($query['lang']);
    $path = strtok((string) ($_SERVER['REQUEST_URI'] ?? ''), '?') ?: 'index.php';
    header('Location: ' . $path . ($query ? '?' . http_build_query($query) : ''), true, 303);
    exit;
}

/** Current URL with ?lang= set, for the language switch. */
function lang_url(string $l): string
{
    return '?' . http_build_query(array_merge($_GET, ['lang' => $l]));
}

/* ---------------------------------------------------------------
   Formatting
--------------------------------------------------------------- */

const WEEKDAYS = [
    'en' => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'cs' => ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
];

/** "Tue 21 Oct 2026" / "út 21. 10. 2026" */
function fmt_date(string $date, bool $weekday = true): string
{
    $t = strtotime($date);
    $day = $weekday ? WEEKDAYS[lang()][(int) date('w', $t)] . ' ' : '';
    return $day . (lang() === 'cs' ? date('j. n. Y', $t) : date('j M Y', $t));
}

function fmt_datetime(string $datetime): string
{
    $t = strtotime($datetime);
    return lang() === 'cs' ? date('j. n. Y H:i', $t) : date('j M Y, H:i', $t);
}

/** "1 day", "3 days" / "1 den", "3 dny", "5 dní" */
function fmt_days(int $n): string
{
    if (lang() === 'cs') return $n . ' ' . ($n === 1 ? 'den' : ($n >= 2 && $n <= 4 ? 'dny' : 'dní'));
    return $n . ($n === 1 ? ' day' : ' days');
}

function fmt_num($v, int $decimals = 0): string
{
    if ($v === null) return '–';
    return lang() === 'cs'
        ? number_format((float) $v, $decimals, ',', ' ')
        : number_format((float) $v, $decimals, '.', ',');
}

function fmt_duration(?float $secs): string
{
    if ($secs === null) return '–';
    if ($secs < 90) return round($secs) . ' s';
    if ($secs < 5400) return round($secs / 60) . ' min';
    return fmt_num($secs / 3600, 1) . ' h';
}
