<?php
require __DIR__ . '/lib/bootstrap.php';

if (is_post()) {
    check_csrf();
    $_SESSION = [];
    session_regenerate_id(true);
}
redirect('login.php');
