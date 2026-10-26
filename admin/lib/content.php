<?php
/**
 * Codle admin — courses, units, lessons and quests: ordering and statistics.
 */

// Ordered child tables and the column that groups them.
const ORDERED = [
    'units'   => 'course_id',
    'lessons' => 'unit_id',
];

/** Swap a row with its neighbour above (-1) or below (+1). */
function move_row(string $table, int $id, int $dir): void
{
    $group = ORDERED[$table];
    $pdo = db();
    $pdo->beginTransaction();
    $row = $pdo->prepare("SELECT $group AS g, position FROM $table WHERE id = ? FOR UPDATE");
    $row->execute([$id]);
    $row = $row->fetch();
    if (!$row) { $pdo->rollBack(); return; }

    $cmp = $dir < 0 ? '<' : '>';
    $ord = $dir < 0 ? 'DESC' : 'ASC';
    $n = $pdo->prepare("SELECT id, position FROM $table WHERE $group = ? AND position $cmp ? ORDER BY position $ord LIMIT 1 FOR UPDATE");
    $n->execute([$row['g'], $row['position']]);
    $n = $n->fetch();
    if (!$n) { $pdo->rollBack(); return; }

    // Park the row on a free position first so the UNIQUE (group, position) key never clashes.
    $set = $pdo->prepare("UPDATE $table SET position = ? WHERE id = ?");
    $set->execute([65535, $id]);
    $set->execute([$row['position'], $n['id']]);
    $set->execute([$n['position'], $id]);
    $pdo->commit();
}

/** Close the hole left at $position after a row was removed from the group. */
function close_gap(string $table, int $groupId, int $position): void
{
    $group = ORDERED[$table];
    db()->prepare("UPDATE $table SET position = position - 1 WHERE $group = ? AND position > ? ORDER BY position ASC")
        ->execute([$groupId, $position]);
}

function next_position(string $table, int $groupId): int
{
    $group = ORDERED[$table];
    $q = db()->prepare("SELECT COALESCE(MAX(position), 0) + 1 FROM $table WHERE $group = ?");
    $q->execute([$groupId]);
    return (int) $q->fetchColumn();
}

/** A slug that is free inside the unit: "loops", "loops-2", … */
function unique_lesson_slug(int $unitId, string $base, int $exceptId = 0): string
{
    $base = $base !== '' ? substr($base, 0, 60) : 'lesson';
    $q = db()->prepare('SELECT 1 FROM lessons WHERE unit_id = ? AND slug = ? AND id <> ?');
    for ($i = 1, $slug = $base; ; $slug = $base . '-' . ++$i) {
        $q->execute([$unitId, $slug, $exceptId]);
        if (!$q->fetchColumn()) return $slug;
    }
}

function find_course(int $id): ?array
{
    $q = db()->prepare('SELECT * FROM courses WHERE id = ?');
    $q->execute([$id]);
    return $q->fetch() ?: null;
}

function all_courses(): array
{
    return db()->query('SELECT * FROM courses ORDER BY sort_order, id')->fetchAll();
}

/**
 * Every lesson of a course in path order, with progress numbers.
 * Keys: started, completed, avg_attempts, avg_score, avg_secs, here (learners whose
 * "Continue" node is this lesson) and has_quest.
 */
function course_lessons_with_stats(int $courseId, int $onlyLessonId = 0): array
{
    $sql = "
        SELECT l.id, l.unit_id, l.position, l.slug, l.title, l.kind, l.xp_reward,
               u.position AS unit_position, u.title AS unit_title,
               (q.id IS NOT NULL) AS has_quest,
               COALESCE(p.started, 0)   AS started,
               COALESCE(p.completed, 0) AS completed,
               p.avg_attempts, p.avg_score, p.avg_secs,
               COALESCE(e.here, 0) AS here
        FROM lessons l
        JOIN units u ON u.id = l.unit_id
        LEFT JOIN quests q ON q.lesson_id = l.id
        LEFT JOIN (
            SELECT lp.lesson_id,
                   COUNT(*)                     AS started,
                   SUM(lp.status = 'completed') AS completed,
                   AVG(lp.attempts)             AS avg_attempts,
                   AVG(lp.best_score)           AS avg_score,
                   AVG(TIMESTAMPDIFF(SECOND, lp.started_at, lp.completed_at)) AS avg_secs
            FROM lesson_progress lp
            JOIN lessons l2 ON l2.id = lp.lesson_id
            JOIN units u2 ON u2.id = l2.unit_id
            WHERE u2.course_id = ?
            GROUP BY lp.lesson_id
        ) p ON p.lesson_id = l.id
        LEFT JOIN (
            SELECT current_lesson_id, COUNT(*) AS here
            FROM enrollments
            WHERE course_id = ? AND current_lesson_id IS NOT NULL
            GROUP BY current_lesson_id
        ) e ON e.current_lesson_id = l.id
        WHERE u.course_id = ?" . ($onlyLessonId ? ' AND l.id = ?' : '') . "
        ORDER BY u.position, l.position";
    $params = [$courseId, $courseId, $courseId];
    if ($onlyLessonId) $params[] = $onlyLessonId;
    $q = db()->prepare($sql);
    $q->execute($params);
    return $q->fetchAll();
}

function course_summary(int $courseId): array
{
    $q = db()->prepare("
        SELECT COUNT(*) AS enrolled,
               AVG(placement_level) AS avg_level,
               SUM(current_lesson_id IS NULL) AS not_started
        FROM enrollments WHERE course_id = ?");
    $q->execute([$courseId]);
    return $q->fetch();
}

function find_quest(int $lessonId): ?array
{
    $q = db()->prepare('SELECT * FROM quests WHERE lesson_id = ?');
    $q->execute([$lessonId]);
    $quest = $q->fetch();
    if (!$quest) return null;

    $quest['files'] = ['html' => '', 'css' => '', 'js' => ''];
    $f = db()->prepare('SELECT language, starter FROM quest_files WHERE quest_id = ?');
    $f->execute([$quest['id']]);
    foreach ($f as $row) $quest['files'][$row['language']] = $row['starter'];

    $o = db()->prepare('SELECT position, language, text_html, hint_html, check_js FROM quest_objectives WHERE quest_id = ? ORDER BY position');
    $o->execute([$quest['id']]);
    $quest['objectives'] = $o->fetchAll();
    return $quest;
}

/** How many saved attempts pass each objective (bit n of objectives_done = objective n+1). */
function quest_objective_stats(int $questId): array
{
    $q = db()->prepare("
        SELECT o.position,
               COUNT(s.user_id) AS saves,
               COALESCE(SUM((s.objectives_done >> (o.position - 1)) & 1), 0) AS passed
        FROM quest_objectives o
        LEFT JOIN quest_saves s ON s.quest_id = o.quest_id
        WHERE o.quest_id = ?
        GROUP BY o.id, o.position
        ORDER BY o.position");
    $q->execute([$questId]);
    $out = [];
    foreach ($q as $r) $out[(int) $r['position']] = $r;
    return $out;
}

function quest_save_summary(int $questId): array
{
    $q = db()->prepare('SELECT COUNT(*) AS saves, SUM(completed_at IS NOT NULL) AS completed, MAX(updated_at) AS last_save FROM quest_saves WHERE quest_id = ?');
    $q->execute([$questId]);
    return $q->fetch();
}
