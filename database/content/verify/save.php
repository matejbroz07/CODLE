<?php
// Appends one line sent by verify.html to results.txt (headless Edge may dump the DOM before the run ends).
file_put_contents(__DIR__ . '/results.txt', file_get_contents('php://input') . "\n", FILE_APPEND);
echo 'ok';
