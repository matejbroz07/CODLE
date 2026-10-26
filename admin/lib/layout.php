<?php
/**
 * Codle admin — page chrome: the floating glass navbar (same as the app),
 * background, flash messages and small rendering helpers.
 */

const ADMIN_NAV = [
    'index.php'   => ['Overview', '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    'courses.php' => ['Courses', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'],
    'stats.php'   => ['Stats', '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'],
    'wordle.php'  => ['Wordle', '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'],
];

function icon(string $paths): string
{
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $paths . '</svg>';
}

function lang_switch(): string
{
    $out = '<div class="ad-lang" role="group" aria-label="' . h(__('Language')) . '">';
    foreach (ADMIN_LANGS as $code => $label) {
        $on = $code === lang();
        $out .= '<a href="' . h(lang_url($code)) . '" hreflang="' . $code . '"' . ($on ? ' class="glass-pill" aria-current="true"' : '') . '>' . $label . '</a>';
    }
    return $out . '</div>';
}

function page_start(string $title, string $active = ''): void
{
    $v = '2';
    ?>
<!DOCTYPE html>
<html lang="<?= lang() ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?= h($title) ?> — Codle admin</title>
  <link rel="icon" type="image/png" href="../assets/logo.png">
  <meta name="theme-color" content="#08090c">
  <!-- Picks full or lite visual effects before first paint (slow devices) -->
  <script src="../js/perf.js"></script>
  <link rel="stylesheet" href="../css/base.css?v=<?= $v ?>">
  <link rel="stylesheet" href="assets/admin.css?v=<?= $v ?>">
  <script src="assets/admin.js?v=<?= $v ?>" defer></script>
</head>
<body class="admin">
<div class="bg" aria-hidden="true"></div>
<?php if (is_logged_in()): ?>
<header class="ad-top liquid-glass liquid-glass--bar">
  <a class="ad-brand" href="index.php" aria-label="<?= h(__('Overview')) ?>">
    <img src="../assets/logo.png" alt="Codle" width="64" height="36">
    <span class="ad-brand-tag">Admin</span>
  </a>
  <nav class="ad-tabs" aria-label="<?= h(__('Admin menu')) ?>">
    <?php foreach (ADMIN_NAV as $href => [$label, $paths]): $on = $active === $href; ?>
      <a class="ad-tab<?= $on ? ' glass-pill is-active' : '' ?>" href="<?= $href ?>" aria-label="<?= h(__($label)) ?>"<?= $on ? ' aria-current="page"' : '' ?>><?= icon($paths) ?><span><?= h(__($label)) ?></span></a>
    <?php endforeach; ?>
  </nav>
  <div class="ad-top-right">
    <?= lang_switch() ?>
    <a class="ad-icon-btn" href="../index.html" target="_blank" rel="noopener" title="<?= h(__('Open the site')) ?>" aria-label="<?= h(__('Open the site')) ?>">
      <?= icon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>') ?>
    </a>
    <form method="post" action="logout.php"><?= csrf_field() ?>
      <button class="ad-icon-btn" type="submit" title="<?= h(__('Log out')) ?>" aria-label="<?= h(__('Log out')) ?>">
        <?= icon('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>') ?>
      </button>
    </form>
  </div>
</header>
<?php endif; ?>
<main class="ad-main">
<?php foreach (take_flashes() as [$type, $msg]): ?>
  <div class="flash flash-<?= h($type) ?>" role="status"><?= h($msg) ?></div>
<?php endforeach;
}

function page_end(): void
{
    echo "</main>\n</body>\n</html>\n";
}

/** Small POST form with a single button, e.g. move / delete actions. */
function action_button(string $action, array $fields, string $label, string $class = 'btn btn-ghost btn-sm', string $confirm = '', string $title = ''): string
{
    $out = '<form method="post" class="inline-form"' . ($confirm !== '' ? ' data-confirm="' . h($confirm) . '"' : '') . '>' . csrf_field() .
        '<input type="hidden" name="action" value="' . h($action) . '">';
    foreach ($fields as $k => $v) {
        $out .= '<input type="hidden" name="' . h($k) . '" value="' . h((string) $v) . '">';
    }
    return $out . '<button type="submit" class="' . h($class) . '"' . ($title !== '' ? ' title="' . h($title) . '" aria-label="' . h($title) . '"' : '') . '>' . $label . '</button></form>';
}

function wordle_tiles(?string $word, string $size = ''): string
{
    $letters = $word !== null ? str_split($word) : array_fill(0, 5, '');
    $out = '<span class="tiles' . ($size !== '' ? ' tiles-' . $size : '') . ($word === null ? ' is-empty' : '') . '" aria-label="' . h($word ?? __('not set')) . '">';
    foreach ($letters as $ch) $out .= '<span>' . h($ch) . '</span>';
    return $out . '</span>';
}

function kind_badge(string $kind): string
{
    return '<span class="badge badge-' . h($kind) . '">' . h(kind_label($kind)) . '</span>';
}

function published_badge(bool $published): string
{
    return $published ? '<span class="badge badge-ok">' . h(__('Published')) . '</span>' : '<span class="badge">' . h(__('Draft')) . '</span>';
}

function bar(?float $percent, string $tone = ''): string
{
    $p = max(0, min(100, (float) ($percent ?? 0)));
    return '<span class="bar' . ($tone !== '' ? ' bar-' . $tone : '') . '"><span style="width:' . $p . '%"></span></span>';
}
