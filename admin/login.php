<?php
require __DIR__ . '/lib/bootstrap.php';

const LOGIN_MAX_FAILS = 10;               // per window, for the whole admin (no IP addresses are stored)
const LOGIN_WINDOW = 15 * 60;

function throttle_path(): string
{
    return sys_get_temp_dir() . '/codle_admin_login_' . substr(hash('sha256', __DIR__), 0, 12) . '.json';
}

function recent_fails(): array
{
    $raw = @file_get_contents(throttle_path());
    $list = $raw ? json_decode($raw, true) : [];
    $since = time() - LOGIN_WINDOW;
    return array_values(array_filter(is_array($list) ? $list : [], fn($t) => is_int($t) && $t > $since));
}

function safe_next(string $next): string
{
    return preg_match('/^[a-z-]+\.php(\?[A-Za-z0-9_=&%.-]*)?$/', $next) ? $next : 'index.php';
}

if (is_logged_in()) redirect(safe_next((string) ($_GET['next'] ?? '')));

$error = '';
$hash = (string) (config()['admin_password_hash'] ?? '');

if (is_post()) {
    check_csrf();
    $fails = recent_fails();
    if (count($fails) >= LOGIN_MAX_FAILS) {
        $error = __('Too many failed attempts. Try again in 15 minutes.');
    } elseif ($hash !== '' && password_verify((string) ($_POST['password'] ?? ''), $hash)) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['seen'] = time();
        $_SESSION['pw'] = password_fingerprint();
        redirect(safe_next((string) ($_POST['next'] ?? '')));
    } else {
        $fails[] = time();
        @file_put_contents(throttle_path(), json_encode($fails), LOCK_EX);
        sleep(1);
        $error = __('Wrong password.');
    }
}

page_start(__('Log in'));
?>
<div class="login-wrap">
  <img class="login-logo" src="../assets/logo.png" alt="Codle" width="114" height="64">
  <section class="login panel liquid-glass">
    <div class="login-head">
      <h1><?= h(__('Admin')) ?></h1>
      <?= lang_switch() ?>
    </div>
    <?php if ($hash === ''): ?>
      <p class="muted"><?= h(__('No password has been set yet. Run this in the terminal:')) ?></p>
      <pre class="code-sample">php admin/tools/set-password.php</pre>
    <?php else: ?>
      <p class="muted"><?= h(__('Manage lessons, quests and the daily Wordle.')) ?></p>
      <form method="post" class="stack">
        <?= csrf_field() ?>
        <input type="hidden" name="next" value="<?= h((string) ($_GET['next'] ?? $_POST['next'] ?? '')) ?>">
        <label class="field">
          <span><?= h(__('Password')) ?></span>
          <input type="password" name="password" autocomplete="current-password" required autofocus>
        </label>
        <?php if ($error !== ''): ?><p class="form-error" role="alert"><?= h($error) ?></p><?php endif; ?>
        <button class="btn btn-primary btn-lg" type="submit"><?= h(__('Log in')) ?></button>
      </form>
    <?php endif; ?>
  </section>
</div>
<?php page_end();
