<?php
/**
 * Codle API — XP, levels, streaks, the learning path and badges.
 *
 * xp_events is the ledger; daily_activity and the counters on users
 * (xp_total, streak_*) are updated in the same transaction as each XP event.
 */

/* ---------------------------------------------------------------
   Levels: going from level L to L+1 costs 100 × L XP
   (level 2 at 100 XP, level 3 at 300, level 4 at 600 …)
--------------------------------------------------------------- */

function level_start_xp(int $level): int
{
    return 50 * $level * ($level - 1);
}

function level_info(int $xp): array
{
    $level = 1;
    while (level_start_xp($level + 1) <= $xp) $level++;
    return [
        'level'         => $level,
        'levelXp'       => $xp - level_start_xp($level),
        'levelXpNeeded' => level_start_xp($level + 1) - level_start_xp($level),
    ];
}

/* ---------------------------------------------------------------
   XP + streak
--------------------------------------------------------------- */

const LESSON_SOURCES = ['lesson', 'quest', 'quiz', 'exam'];

/**
 * Books $amount XP for the user and updates today's activity and the streak.
 * Call inside a transaction. Returns the new numbers for the sidebar.
 */
function award_xp(array $user, int $amount, string $source, ?int $refId = null): array
{
    $day = local_today($user['timezone']);
    $lesson = in_array($source, LESSON_SOURCES, true) ? 1 : 0;

    if ($amount > 0) {
        q('INSERT INTO xp_events (user_id, amount, source, ref_id, local_day) VALUES (?, ?, ?, ?, ?)',
            [$user['id'], $amount, $source, $refId, $day]);
    }
    q('INSERT INTO daily_activity (user_id, local_day, xp, lessons_completed, goal_reached)
       VALUES (?, ?, ?, ?, ? >= ?)
       ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp),
                               lessons_completed = lessons_completed + VALUES(lessons_completed),
                               goal_reached = (xp >= ?)',
        [$user['id'], $day, $amount, $lesson, $amount, $user['daily_goal_xp'], $user['daily_goal_xp']]);

    // Lock the user row so two requests on the same day cannot both extend the streak.
    $u = q_row('SELECT streak_current, streak_best, streak_last_day FROM users WHERE id = ? FOR UPDATE', [$user['id']]);
    $streak = (int) $u['streak_current'];
    if ($u['streak_last_day'] !== $day) {
        $streak = $u['streak_last_day'] === add_days($day, -1) ? $streak + 1 : 1;
    }
    q('UPDATE users SET xp_total = xp_total + ?, streak_current = ?, streak_best = GREATEST(streak_best, ?), streak_last_day = ? WHERE id = ?',
        [$amount, $streak, $streak, $day, $user['id']]);

    return [
        'xpGained' => $amount,
        'xpToday'  => (int) q_val('SELECT xp FROM daily_activity WHERE user_id = ? AND local_day = ?', [$user['id'], $day]),
        'streak'   => $streak,
    ];
}

/** XP the user already got today from one source (for daily caps). */
function xp_today_from(array $user, string $source): int
{
    return (int) q_val('SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ? AND local_day = ? AND source = ?',
        [$user['id'], local_today($user['timezone']), $source]);
}

/* ---------------------------------------------------------------
   Sidebar / profile numbers
--------------------------------------------------------------- */

function fresh_user(int $id): array
{
    return q_row('SELECT * FROM users WHERE id = ?', [$id]);
}

function user_summary(array $user): array
{
    $user = fresh_user((int) $user['id']);
    $today = local_today($user['timezone']);
    $xpToday = (int) q_val('SELECT xp FROM daily_activity WHERE user_id = ? AND local_day = ?', [$user['id'], $today]);
    $last = $user['streak_last_day'];
    $alive = $last !== null && $last >= add_days($today, -1);

    $total = (int) q_val('SELECT COUNT(*) FROM users');
    $better = (int) q_val('SELECT COUNT(*) FROM users WHERE xp_total > ?', [$user['xp_total']]);

    $course = active_course($user);
    return [
        'id'           => (int) $user['id'],
        'username'     => $user['username'],
        'email'        => $user['email'],
        'joinedAt'     => iso($user['created_at']),
        'bio'          => (string) ($user['bio'] ?? ''),
        'avatarUrl'    => avatar_url($user['avatar_file'] ?? null),
        'profilePublic' => (bool) ($user['profile_public'] ?? true),
        'timezone'     => $user['timezone'],
        'dailyGoal'    => (int) $user['daily_goal_xp'],
        'xpToday'      => $xpToday,
        'gems'         => (int) $user['xp_total'],
        'streakCount'  => $alive ? (int) $user['streak_current'] : 0,
        'streakBest'   => (int) $user['streak_best'],
        'streakActive' => $last === $today,
        'topPercent'   => $total ? max(1, (int) ceil(100 * ($better + 1) / $total)) : 100,
        'nextBadge'    => $course ? next_badge($user, (int) $course['id']) : null,
        'badges'       => earned_badges($user),
    ] + level_info((int) $user['xp_total']);
}

/* ---------------------------------------------------------------
   Courses + enrollments
--------------------------------------------------------------- */

function find_course_by_slug(string $slug): ?array
{
    return q_row('SELECT * FROM courses WHERE slug = ?', [$slug]);
}

/** Published courses plus any the user is enrolled in, for the course switcher. */
function course_list(array $user): array
{
    $rows = q('SELECT c.id, c.slug, c.name, c.is_published, e.user_id IS NOT NULL AS enrolled, COALESCE(e.is_active, 0) AS active
               FROM courses c
               LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
               WHERE c.is_published = 1 OR e.user_id IS NOT NULL
               ORDER BY c.sort_order, c.id', [$user['id']])->fetchAll();
    return array_map(fn($r) => [
        'slug'     => $r['slug'],
        'name'     => $r['name'],
        'enrolled' => (bool) $r['enrolled'],
        'active'   => (bool) $r['active'],
    ], $rows);
}

function active_course(array $user): ?array
{
    return q_row('SELECT c.* FROM enrollments e JOIN courses c ON c.id = e.course_id
                  WHERE e.user_id = ? ORDER BY e.is_active DESC, e.enrolled_at DESC LIMIT 1', [$user['id']]);
}

/** Enrolls (if needed) and makes the course the one shown on the path. */
function activate_course(array $user, array $course, ?int $placementLevel = null): void
{
    q('UPDATE enrollments SET is_active = 0 WHERE user_id = ?', [$user['id']]);
    q('INSERT INTO enrollments (user_id, course_id, placement_level, is_active) VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1, placement_level = COALESCE(VALUES(placement_level), placement_level)',
        [$user['id'], $course['id'], $placementLevel]);
    sync_enrollment($user, (int) $course['id']);
}

/* ---------------------------------------------------------------
   Learning path
--------------------------------------------------------------- */

/** Every lesson of the course in path order with the user's progress on it. */
function course_lessons(array $user, int $courseId): array
{
    return q("SELECT l.id, l.unit_id, l.position, l.slug, l.title, l.kind, l.xp_reward,
                     u.position AS unit_position, u.title AS unit_title,
                     q.id AS quest_id,
                     lp.status, COALESCE(lp.progress_pct, 0) AS progress_pct
              FROM lessons l
              JOIN units u ON u.id = l.unit_id
              LEFT JOIN quests q ON q.lesson_id = l.id
              LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
              WHERE u.course_id = ?
              ORDER BY u.position, l.position", [$user['id'], $courseId])->fetchAll();
}

/** The first lesson that is not completed yet (the "Continue" node), or null when all are done. */
function current_lesson(array $lessons): ?array
{
    foreach ($lessons as $l) {
        if ($l['status'] !== 'completed') return $l;
    }
    return null;
}

/** Keeps enrollments.current_lesson_id in step with lesson_progress (the admin stats read it). */
function sync_enrollment(array $user, int $courseId): void
{
    $current = current_lesson(course_lessons($user, $courseId));
    q('UPDATE enrollments SET current_lesson_id = ? WHERE user_id = ? AND course_id = ?',
        [$current['id'] ?? null, $user['id'], $courseId]);
}

/** Lesson states: lessons before the current one are completed, after it locked. */
function lesson_state(array $lesson, ?array $current): string
{
    if ($lesson['status'] === 'completed') return 'completed';
    return $current && (int) $current['id'] === (int) $lesson['id'] ? 'current' : 'locked';
}

function course_path(array $user, array $course): array
{
    $units = q('SELECT id, position, title FROM units WHERE course_id = ? ORDER BY position', [$course['id']])->fetchAll();
    $lessons = course_lessons($user, (int) $course['id']);
    $current = current_lesson($lessons);

    $byUnit = [];
    foreach ($lessons as $l) $byUnit[$l['unit_id']][] = $l;

    $outUnits = [];
    $progress = ['currentUnit' => count($units) + 1, 'currentMilestone' => 1, 'currentMilestoneProgress' => 0];
    foreach ($units as $ui => $u) {
        $list = $byUnit[$u['id']] ?? [];
        $done = 0;
        $items = [];
        foreach ($list as $li => $l) {
            $state = lesson_state($l, $current);
            if ($state === 'completed') $done++;
            if ($state === 'current') {
                $progress = ['currentUnit' => $ui + 1, 'currentMilestone' => $li + 1, 'currentMilestoneProgress' => (int) $l['progress_pct']];
            }
            $items[] = [
                'id'       => (int) $l['id'],
                'slug'     => $l['slug'],
                'title'    => $l['title'],
                'kind'     => $l['kind'],
                'xp'       => (int) $l['xp_reward'],
                'state'    => $state,
                'progress' => (int) $l['progress_pct'],
                'playable' => $l['quest_id'] !== null,
            ];
        }
        $outUnits[] = ['id' => (int) $u['id'], 'position' => (int) $u['position'], 'title' => $u['title'],
                       'total' => count($list), 'completed' => $done, 'lessons' => $items];
    }

    return [
        'course'   => ['slug' => $course['slug'], 'name' => $course['name']],
        'units'    => $outUnits,
        'progress' => $progress,
        'currentLessonId' => $current ? (int) $current['id'] : null,
    ];
}

/* ---------------------------------------------------------------
   Badges — one per unit (badges.unit_id), earned by finishing the unit
--------------------------------------------------------------- */

function next_badge(array $user, int $courseId): ?array
{
    $b = q_row('SELECT b.id, b.name, b.description, b.unit_id
                FROM badges b JOIN units u ON u.id = b.unit_id
                LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
                WHERE u.course_id = ? AND ub.badge_id IS NULL
                ORDER BY u.position LIMIT 1', [$user['id'], $courseId]);
    if (!$b) return null;
    $p = q_row("SELECT COUNT(*) AS total, COALESCE(SUM(lp.status = 'completed'), 0) AS done
                FROM lessons l LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
                WHERE l.unit_id = ?", [$user['id'], $b['unit_id']]);
    return [
        'name'            => $b['name'],
        'label'           => $b['description'],
        'progressPercent' => $p['total'] ? (int) round(100 * $p['done'] / $p['total']) : 0,
    ];
}

function earned_badges(array $user): array
{
    return array_map(fn($r) => ['name' => $r['name'], 'label' => $r['description'], 'earnedAt' => iso($r['earned_at'])],
        q('SELECT b.name, b.description, ub.earned_at FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
           WHERE ub.user_id = ? ORDER BY ub.earned_at', [$user['id']])->fetchAll());
}

/** Awards the unit's badges once every lesson in the unit is completed. Returns the new badge names. */
function award_unit_badges(array $user, int $unitId): array
{
    $open = (int) q_val("SELECT COUNT(*) FROM lessons l
                         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ? AND lp.status = 'completed'
                         WHERE l.unit_id = ? AND lp.lesson_id IS NULL", [$user['id'], $unitId]);
    if ($open > 0) return [];
    $badges = q('SELECT b.id, b.name FROM badges b
                 LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
                 WHERE b.unit_id = ? AND ub.badge_id IS NULL', [$user['id'], $unitId])->fetchAll();
    foreach ($badges as $b) q('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [$user['id'], $b['id']]);
    return array_column($badges, 'name');
}

/* ---------------------------------------------------------------
   Leaderboard — XP over the learner's last 7 days
--------------------------------------------------------------- */

function leaderboard(array $user, int $limit = 20): array
{
    $from = add_days(local_today($user['timezone']), -6);
    $rows = q('SELECT u.id, u.username, u.avatar_file, COALESCE(SUM(x.amount), 0) AS xp
               FROM users u LEFT JOIN xp_events x ON x.user_id = u.id AND x.local_day >= ?
               GROUP BY u.id, u.username, u.avatar_file
               ORDER BY xp DESC, u.username
               LIMIT ' . (int) $limit, [$from])->fetchAll();

    $mine = (int) q_val('SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ? AND local_day >= ?', [$user['id'], $from]);
    $ahead = (int) q_val('SELECT COUNT(*) FROM (
                              SELECT u.id, COALESCE(SUM(x.amount), 0) AS xp
                              FROM users u LEFT JOIN xp_events x ON x.user_id = u.id AND x.local_day >= ?
                              GROUP BY u.id HAVING xp > ?) t', [$from, $mine]);

    $out = [];
    foreach ($rows as $i => $r) {
        $out[] = ['rank' => $i + 1, 'username' => $r['username'], 'avatarUrl' => avatar_url($r['avatar_file']),
                  'xp' => (int) $r['xp'], 'you' => (int) $r['id'] === (int) $user['id']];
    }
    return ['from' => $from, 'top' => $out, 'you' => ['rank' => $ahead + 1, 'xp' => $mine, 'username' => $user['username'],
                                                      'avatarUrl' => avatar_url($user['avatar_file'] ?? null)]];
}
