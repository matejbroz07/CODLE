<?php
/**
 * Codle API — the Profile tab: avatars, profile numbers, sessions, data export.
 *
 * Avatars are re-encoded with GD into a square JPEG before they are stored, so
 * whatever was uploaded (EXIF with GPS, a script hidden in a "PNG" …) never
 * reaches the disk as is. Files live in uploads/avatars/ (no PHP runs there,
 * see its .htaccess). Without an avatar the page draws a gradient from the username.
 */

const AVATAR_SIZE = 320;                 // px, square
const AVATAR_MAX_PIXELS = 16_000_000;    // refuse decompression bombs before GD allocates them
const HEATMAP_DAYS = 182;                // 26 weeks

/* ---------------------------------------------------------------
   Settings with defaults (older api/config.php files have no 'profile')
--------------------------------------------------------------- */

function profile_config(string $key, int $default): int
{
    return (int) (config()['profile'][$key] ?? $default);
}

function username_cooldown_days(): int
{
    return max(0, profile_config('username_cooldown_days', 30));
}

/** When the next real rename is allowed, or null when it is allowed now. */
function username_next_change(array $user): ?string
{
    $last = $user['username_changed_at'] ?? null;
    if (!$last) return null;
    $next = (new DateTimeImmutable($last))->modify('+' . username_cooldown_days() . ' day');
    return $next > new DateTimeImmutable() ? $next->format('Y-m-d H:i:s') : null;
}

/* ---------------------------------------------------------------
   Avatar files
--------------------------------------------------------------- */

function avatar_dir(): string
{
    $dir = (string) (config()['profile']['avatar_dir'] ?? dirname(__DIR__, 2) . '/uploads/avatars');
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        error_log('Codle API: cannot create the avatar folder ' . $dir);
        fail(500, 'storage_unavailable', 'Avatars cannot be saved on this server.');
    }
    return $dir;
}

/** URL relative to the pages (index.html, editor.html), or null for the gradient. */
function avatar_url(?string $file): ?string
{
    if (!$file || !valid_avatar_name($file)) return null;
    $base = (string) (config()['profile']['avatar_url'] ?? 'uploads/avatars/');
    return rtrim($base, '/') . '/' . $file;
}

function valid_avatar_name(string $file): bool
{
    return (bool) preg_match('/^[0-9]{1,20}-[0-9a-f]{12}\.jpg$/', $file);
}

function delete_avatar_file(?string $file): void
{
    if (!$file || !valid_avatar_name($file)) return;   // never unlink a path that came from elsewhere
    $path = avatar_dir() . '/' . $file;
    if (is_file($path)) @unlink($path);
}

/** Reads an uploaded image, crops it to the centre square and returns JPEG bytes. */
function avatar_jpeg(string $path): string
{
    if (!function_exists('imagecreatetruecolor')) fail(500, 'storage_unavailable', 'This server cannot process images (PHP GD is missing).');
    $info = @getimagesize($path);
    if (!$info) fail(415, 'unsupported_image', 'That file is not an image we can read. Use a JPG, PNG or GIF.');
    [$w, $h, $type] = $info;
    $loaders = [
        IMAGETYPE_JPEG => 'imagecreatefromjpeg',
        IMAGETYPE_PNG  => 'imagecreatefrompng',
        IMAGETYPE_GIF  => 'imagecreatefromgif',
        IMAGETYPE_WEBP => 'imagecreatefromwebp',
    ];
    $load = $loaders[$type] ?? null;
    if (!$load || !function_exists($load)) fail(415, 'unsupported_image', 'Use a JPG, PNG or GIF image.');
    if ($w < 32 || $h < 32) fail(422, 'image_too_small', 'The image must be at least 32 × 32 px.');
    if ($w * $h > AVATAR_MAX_PIXELS) fail(422, 'image_too_large', 'The image has too many pixels. Use one under 16 megapixels.');

    $src = @$load($path);
    if (!$src) fail(415, 'unsupported_image', 'The image is damaged or in a format we cannot read.');

    // Phone photos are often stored sideways with an EXIF hint; apply it before the hint is dropped.
    if ($type === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($path);
        $angle = [3 => 180, 6 => -90, 8 => 90][(int) ($exif['Orientation'] ?? 1)] ?? 0;
        if ($angle) {
            $rotated = imagerotate($src, $angle, 0);
            if ($rotated) { imagedestroy($src); $src = $rotated; }
        }
    }

    $w = imagesx($src);
    $h = imagesy($src);
    $side = min($w, $h);
    $size = min(AVATAR_SIZE, $side);
    $dst = imagecreatetruecolor($size, $size);
    // Transparent PNG/GIF areas become the page background instead of black.
    imagefill($dst, 0, 0, imagecolorallocate($dst, 0x1b, 0x1d, 0x23));
    imagecopyresampled($dst, $src, 0, 0, intdiv($w - $side, 2), intdiv($h - $side, 2), $size, $size, $side, $side);
    imagedestroy($src);

    ob_start();
    imagejpeg($dst, null, 88);
    $bytes = (string) ob_get_clean();
    imagedestroy($dst);
    return $bytes;
}

/** Writes the JPEG under a new random name (so browsers never show a cached old one). */
function store_avatar(int $userId, string $jpeg): string
{
    $file = $userId . '-' . bin2hex(random_bytes(6)) . '.jpg';
    if (@file_put_contents(avatar_dir() . '/' . $file, $jpeg, LOCK_EX) === false) {
        error_log('Codle API: cannot write avatar ' . $file);
        fail(500, 'storage_unavailable', 'The avatar could not be saved. Try again later.');
    }
    return $file;
}

/* ---------------------------------------------------------------
   Plain-text bio
--------------------------------------------------------------- */

function clean_bio(string $bio): string
{
    $bio = str_replace(["\r\n", "\r"], "\n", $bio);
    // Control characters (except new lines) and bidi overrides that could disguise text.
    $bio = (string) preg_replace('/(?!\n)[\p{Cc}\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', '', $bio);
    $bio = (string) preg_replace("/\n{3,}/", "\n\n", $bio);
    return trim($bio);
}

/* ---------------------------------------------------------------
   Notices to the account's e-mail (only when mail.mode = mail)
--------------------------------------------------------------- */

function notify_mail(string $to, string $subject, string $text): void
{
    if ((config()['mail']['mode'] ?? 'dev') !== 'mail') return;
    $from = (string) (config()['mail']['from'] ?? 'Codle <no-reply@example.com>');
    $headers = "From: $from\r\nContent-Type: text/plain; charset=utf-8\r\n";
    // A notice is a courtesy: a failed one must not undo the change itself.
    if (!@mail($to, $subject, $text . "\n\nIf this was not you, reset your password right away.\n\nCodle", $headers)) {
        error_log('Codle API: notice mail failed: ' . $subject);
    }
}

/* ---------------------------------------------------------------
   Sessions ("Your devices")
--------------------------------------------------------------- */

function current_token_hash(): string
{
    return hash('sha256', (string) ($_COOKIE[SESSION_COOKIE] ?? ''));
}

function session_list(array $user): array
{
    $current = current_token_hash();
    $rows = q('SELECT token_hash, device_label, created_at, last_seen_at FROM sessions
               WHERE user_id = ? AND expires_at > NOW() ORDER BY last_seen_at DESC', [$user['id']])->fetchAll();
    // The id is a prefix of the token hash: enough to pick a row, useless as a login.
    return array_map(fn($r) => [
        'id'         => substr($r['token_hash'], 0, 16),
        'device'     => $r['device_label'] ?: 'Unknown device',
        'createdAt'  => iso($r['created_at']),
        'lastSeenAt' => iso($r['last_seen_at']),
        'current'    => hash_equals($r['token_hash'], $current),
    ], $rows);
}

/* ---------------------------------------------------------------
   Profile numbers
--------------------------------------------------------------- */

/** Day => XP for the heatmap (only days with activity). */
function activity_days(array $user, string $from): array
{
    $out = [];
    foreach (q('SELECT local_day, xp FROM daily_activity WHERE user_id = ? AND local_day >= ? AND xp > 0 ORDER BY local_day',
        [$user['id'], $from])->fetchAll() as $r) {
        $out[$r['local_day']] = (int) $r['xp'];
    }
    return $out;
}

function course_progress(array $user): array
{
    // The next lesson comes from lesson_progress (like the path), not the cached enrollments.current_lesson_id.
    $rows = q("SELECT c.slug, c.name, e.placement_level, e.is_active, e.enrolled_at,
                      (SELECT l.title FROM lessons l JOIN units u ON u.id = l.unit_id
                       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id AND lp.status = 'completed'
                       WHERE u.course_id = c.id AND lp.lesson_id IS NULL
                       ORDER BY u.position, l.position LIMIT 1) AS current_title,
                      (SELECT COUNT(*) FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = c.id) AS total,
                      (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN units u ON u.id = l.unit_id
                        WHERE u.course_id = c.id AND lp.user_id = e.user_id AND lp.status = 'completed') AS done
               FROM enrollments e
               JOIN courses c ON c.id = e.course_id
               WHERE e.user_id = ?
               ORDER BY e.is_active DESC, e.enrolled_at", [$user['id']])->fetchAll();
    return array_map(fn($r) => [
        'slug'           => $r['slug'],
        'name'           => $r['name'],
        'active'         => (bool) $r['is_active'],
        'placementLevel' => $r['placement_level'] !== null ? (int) $r['placement_level'] : null,
        'enrolledAt'     => iso($r['enrolled_at']),
        'completed'      => (int) $r['done'],
        'total'          => (int) $r['total'],
        'percent'        => $r['total'] ? (int) floor(100 * $r['done'] / $r['total']) : 0,
        'currentLesson'  => $r['current_title'],
    ], $rows);
}

/** Badges of the learner's courses that are not earned yet, closest first. */
function upcoming_badges(array $user, int $limit = 6): array
{
    $rows = q("SELECT b.name, b.description, c.name AS course, u.position,
                      COUNT(l.id) AS total, COALESCE(SUM(lp.status = 'completed'), 0) AS done
               FROM badges b
               JOIN units u ON u.id = b.unit_id
               JOIN courses c ON c.id = u.course_id
               JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
               LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = e.user_id
               LEFT JOIN lessons l ON l.unit_id = u.id
               LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
               WHERE ub.badge_id IS NULL
               GROUP BY b.id, b.name, b.description, c.name, u.position, e.is_active
               ORDER BY e.is_active DESC, u.position
               LIMIT " . (int) $limit, [$user['id']])->fetchAll();
    return array_map(fn($r) => [
        'name'            => $r['name'],
        'label'           => $r['description'],
        'course'          => $r['course'],
        'progressPercent' => $r['total'] ? (int) round(100 * $r['done'] / $r['total']) : 0,
    ], $rows);
}

/** The last XP gains with what they were for. */
function recent_activity(array $user, int $limit = 12): array
{
    $rows = q("SELECT x.amount, x.source, x.ref_id, x.created_at, l.title AS lesson_title, hs.title AS story_title
               FROM xp_events x
               LEFT JOIN lessons l ON x.source IN ('lesson','quest','quiz','exam') AND l.id = x.ref_id
               LEFT JOIN history_stories hs ON x.source = 'daily_story' AND hs.id = x.ref_id
               WHERE x.user_id = ?
               ORDER BY x.created_at DESC, x.id DESC
               LIMIT " . (int) $limit, [$user['id']])->fetchAll();
    return array_map(fn($r) => [
        'source' => $r['source'],
        'xp'     => (int) $r['amount'],
        'ref'    => $r['ref_id'] !== null ? (int) $r['ref_id'] : null,
        'title'  => $r['lesson_title'] ?? $r['story_title'],
        'at'     => iso($r['created_at']),
    ], $rows);
}

/**
 * Everything the Profile tab shows. $own adds the private parts (e-mail, account
 * dates, recent activity). Someone else's private profile shows only the basics.
 */
function profile_payload(array $user, bool $own, array $viewer): array
{
    $user = fresh_user((int) $user['id']);
    $today = local_today($user['timezone']);
    $xp = (int) $user['xp_total'];
    $last = $user['streak_last_day'];
    $alive = $last !== null && $last >= add_days($today, -1);

    $base = [
        'username'  => $user['username'],
        'avatarUrl' => avatar_url($user['avatar_file'] ?? null),
        'joinedAt'  => iso($user['created_at']),
        'xp'        => $xp,
        'own'       => $own,
    ] + level_info($xp);

    if (!$own && !($user['profile_public'] ?? 1)) return $base + ['private' => true];

    $board = leaderboard($user, 1)['you'];
    $wordleToday = q_val('SELECT puzzle_no FROM wordle_puzzles WHERE puzzle_date = ?', [$today]);
    $best = q_row('SELECT local_day, xp FROM daily_activity WHERE user_id = ? ORDER BY xp DESC, local_day DESC LIMIT 1', [$user['id']]);
    $totals = q_row('SELECT COUNT(*) AS days, COALESCE(SUM(goal_reached), 0) AS goal_days FROM daily_activity WHERE user_id = ? AND xp > 0', [$user['id']]);
    $from = add_days($today, -(HEATMAP_DAYS - 1));

    $out = $base + [
        'private'     => false,
        'bio'         => (string) ($user['bio'] ?? ''),
        'timezone'    => $user['timezone'],
        'streak'      => $alive ? (int) $user['streak_current'] : 0,
        'streakBest'  => (int) $user['streak_best'],
        'stats'       => [
            'lessonsCompleted' => (int) q_val("SELECT COUNT(*) FROM lesson_progress WHERE user_id = ? AND status = 'completed'", [$user['id']]),
            'activeDays'       => (int) $totals['days'],
            'goalDays'         => (int) $totals['goal_days'],
            'xpWeek'           => (int) $board['xp'],
            'xpMonth'          => (int) q_val('SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ? AND local_day >= ?', [$user['id'], add_days($today, -29)]),
            'weeklyRank'       => (int) $board['rank'],
            'players'          => (int) q_val('SELECT COUNT(*) FROM users'),
            'bestDay'          => $best ? ['day' => $best['local_day'], 'xp' => (int) $best['xp']] : null,
        ],
        'heatmap'     => ['from' => $from, 'to' => $today, 'days' => (object) activity_days($user, $from)],
        'xpBySource'  => array_map(fn($r) => ['source' => $r['source'], 'xp' => (int) $r['xp']],
            q('SELECT source, SUM(amount) AS xp FROM xp_events WHERE user_id = ? GROUP BY source HAVING xp > 0 ORDER BY xp DESC', [$user['id']])->fetchAll()),
        'courses'     => course_progress($user),
        'badges'      => earned_badges($user),
        'nextBadges'  => upcoming_badges($user),
        'games'       => [
            'wordle' => wordle_stats($user, $wordleToday !== null ? (int) $wordleToday : null),
            'older'  => [
                'best' => older_best($user),
                'runs' => (int) q_val('SELECT COUNT(*) FROM older_younger_runs WHERE user_id = ?', [$user['id']]),
            ],
            'story'  => story_stats($user, $today),
        ],
    ];

    if ($own) {
        $out['account'] = [
            'email'              => $user['email'],
            'emailVerified'      => $user['email_verified_at'] !== null,
            'profilePublic'      => (bool) ($user['profile_public'] ?? 1),
            'dailyGoal'          => (int) $user['daily_goal_xp'],
            'xpToday'            => (int) q_val('SELECT xp FROM daily_activity WHERE user_id = ? AND local_day = ?', [$user['id'], $today]),
            'lastLoginAt'        => iso($user['last_login_at']),
            'passwordChangedAt'  => iso($user['password_changed_at'] ?? null),
            'usernameChangedAt'  => iso($user['username_changed_at'] ?? null),
            'usernameNextChange' => iso(username_next_change($user)),
            'usernameCooldownDays' => username_cooldown_days(),
            'previousNames'      => q('SELECT old_username FROM username_history WHERE user_id = ? ORDER BY changed_at DESC LIMIT 5',
                                      [$user['id']])->fetchAll(PDO::FETCH_COLUMN),
        ];
        $out['recent'] = recent_activity($user);
    }
    return $out;
}

/* ---------------------------------------------------------------
   Data export (GDPR: right of access / portability)
--------------------------------------------------------------- */

function user_export(array $user): array
{
    $id = $user['id'];
    $all = fn(string $sql) => q($sql, [$id])->fetchAll();
    $account = fresh_user((int) $id);
    unset($account['password_hash']);

    return [
        'exportedAt'       => date(DATE_ATOM),
        'note'             => 'Everything Codle stores about your account. Passwords and login tokens are kept only as hashes and are not included.',
        'account'          => $account,
        'usernameHistory'  => $all('SELECT old_username, new_username, changed_at FROM username_history WHERE user_id = ? ORDER BY changed_at'),
        'linkedAccounts'   => $all('SELECT provider, linked_at FROM oauth_accounts WHERE user_id = ?'),
        'settings'         => $all('SELECT * FROM user_settings WHERE user_id = ?')[0] ?? null,
        'sessions'         => $all('SELECT device_label, created_at, last_seen_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at'),
        'enrollments'      => $all('SELECT c.slug AS course, e.placement_level, e.current_lesson_id, e.is_active, e.enrolled_at
                                    FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ?'),
        'placementAttempts' => $all('SELECT c.slug AS course, p.started_at, p.finished_at, p.correct_count, p.wrong_count, p.result_level
                                    FROM placement_attempts p JOIN courses c ON c.id = p.course_id WHERE p.user_id = ? ORDER BY p.started_at'),
        'lessonProgress'   => $all('SELECT lesson_id, status, progress_pct, best_score, attempts, started_at, completed_at
                                    FROM lesson_progress WHERE user_id = ? ORDER BY started_at'),
        'questSaves'       => $all('SELECT quest_id, html, css, js, objectives_done, completed_at, updated_at FROM quest_saves WHERE user_id = ?'),
        'xpEvents'         => $all('SELECT amount, source, ref_id, local_day, created_at FROM xp_events WHERE user_id = ? ORDER BY id'),
        'dailyActivity'    => $all('SELECT local_day, xp, lessons_completed, goal_reached FROM daily_activity WHERE user_id = ? ORDER BY local_day'),
        'badges'           => $all('SELECT b.name, b.description, ub.earned_at FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = ?'),
        'wordlePlays'      => $all('SELECT puzzle_no, guesses, guess_count, status, hint_used, started_at, finished_at FROM wordle_plays WHERE user_id = ? ORDER BY puzzle_no'),
        'olderYoungerRuns' => $all('SELECT score, finished_at FROM older_younger_runs WHERE user_id = ? ORDER BY id'),
        'dailyStoryAnswers' => $all('SELECT story_id, option_id, is_correct, local_day, answered_at FROM history_story_answers WHERE user_id = ? ORDER BY local_day'),
    ];
}
