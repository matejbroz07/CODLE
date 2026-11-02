<?php
/**
 * Codle API — learning path, the editor (quests) and the quizzes.
 *
 * Objective checks run in the learner's browser (sandboxed iframe), so the
 * server trusts the results it is sent. It does make sure the lesson is
 * unlocked and pays the lesson's XP only once. Quizzes are graded here.
 */

const MAX_CODE_BYTES = 200_000;          // per file
const MAX_OBJECTIVES = 16;               // quest_saves.objectives_done is a SMALLINT bitmask
const QUIZ_PASS_PERCENT = 70;            // a quiz or exam completes the lesson from this score up

function route_path(): array
{
    $user = require_user();
    $slug = query_str('course');
    $course = $slug !== '' ? find_course_by_slug($slug) : active_course($user);
    if (!$course) fail(404, 'unknown_course');
    return course_path($user, $course);
}

/**
 * Loads a lesson the user may open (completed or current) with its course.
 * Fails with 403 for locked lessons. Enrolls the user in the course if needed.
 */
function unlocked_lesson(array $user, int $lessonId): array
{
    $lesson = q_row('SELECT l.*, u.position AS unit_position, u.title AS unit_title, u.course_id
                     FROM lessons l JOIN units u ON u.id = l.unit_id WHERE l.id = ?', [$lessonId]) ?? fail(404, 'unknown_lesson');
    $course = q_row('SELECT * FROM courses WHERE id = ?', [$lesson['course_id']]);
    $enrolled = q_val('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?', [$user['id'], $course['id']]);
    if (!$enrolled && !$course['is_published']) fail(404, 'unknown_lesson');

    $lessons = course_lessons($user, (int) $course['id']);
    $current = current_lesson($lessons);
    $row = null;
    $next = null;
    foreach ($lessons as $i => $l) {
        if ((int) $l['id'] === $lessonId) {
            $row = $l;
            $next = $lessons[$i + 1] ?? null;
        }
    }
    $state = lesson_state($row, $current);
    if ($state === 'locked') fail(403, 'lesson_locked', 'Finish the lessons before this one first.');
    if (!$enrolled) q('INSERT IGNORE INTO enrollments (user_id, course_id, is_active) VALUES (?, ?, 0)', [$user['id'], $course['id']]);

    return ['lesson' => $lesson, 'course' => $course, 'state' => $state, 'next' => $next];
}

/** unlocked_lesson() plus the editor quest; 404 for lessons without one. */
function open_lesson(array $user, int $lessonId): array
{
    $open = unlocked_lesson($user, $lessonId);
    $open['quest'] = q_row('SELECT * FROM quests WHERE lesson_id = ?', [$lessonId]) ?? fail(404, 'no_content', 'This lesson has no content yet.');
    return $open;
}

/** The lesson after this one, as the editor and the quiz page link to it. */
function next_lesson_payload(?array $next): ?array
{
    return $next ? ['id' => (int) $next['id'], 'title' => $next['title'], 'kind' => $next['kind'], 'playable' => lesson_playable($next)] : null;
}

function lesson_payload(array $lesson, array $course, string $state): array
{
    return [
        'id'        => (int) $lesson['id'],
        'title'     => $lesson['title'],
        'kind'      => $lesson['kind'],
        'crumb'     => 'Unit ' . $lesson['unit_position'] . ' · ' . (in_array($lesson['kind'], ['quiz', 'exam'], true) ? ucfirst($lesson['kind']) : 'Lesson ' . $lesson['position']),
        'unitTitle' => $lesson['unit_title'],
        'course'    => ['slug' => $course['slug'], 'name' => $course['name']],
        'xp'        => (int) $lesson['xp_reward'],
        'completed' => $state === 'completed',
    ];
}

function route_lesson_get(int $lessonId): array
{
    $user = require_user();
    ['lesson' => $lesson, 'course' => $course, 'quest' => $quest, 'state' => $state, 'next' => $next] = open_lesson($user, $lessonId);

    $files = ['html' => '', 'css' => '', 'js' => ''];
    foreach (q('SELECT language, starter FROM quest_files WHERE quest_id = ?', [$quest['id']]) as $f) $files[$f['language']] = $f['starter'];
    $objectives = q('SELECT position, language, text_html, hint_html, check_js FROM quest_objectives WHERE quest_id = ? ORDER BY position',
        [$quest['id']])->fetchAll();

    q('INSERT IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)', [$user['id'], $lessonId]);
    $save = q_row('SELECT html, css, js, objectives_done, completed_at, updated_at FROM quest_saves WHERE user_id = ? AND quest_id = ?',
        [$user['id'], $quest['id']]);
    $bits = (int) ($save['objectives_done'] ?? 0);

    return [
        'lesson' => lesson_payload($lesson, $course, $state),
        'quest' => [
            'id'         => 'lesson-' . $lesson['id'],
            'title'      => $quest['title'],
            'descHtml'   => $quest['description_html'],
            'starter'    => $files,
            'objectives' => array_map(fn($o) => [
                'lang'  => $o['language'],
                'text'  => $o['text_html'],
                'hint'  => $o['hint_html'] ?? '',
                'check' => $o['check_js'],
            ], $objectives),
        ],
        'save' => $save ? [
            'files'     => ['html' => $save['html'], 'css' => $save['css'], 'js' => $save['js']],
            'done'      => array_map(fn($i) => (bool) (($bits >> $i) & 1), array_keys($objectives)),
            'updatedAt' => iso($save['updated_at']),
        ] : null,
        'next'     => next_lesson_payload($next),
        'settings' => user_settings($user),
    ];
}

function code_input(): array
{
    return ['html' => in_raw('html', MAX_CODE_BYTES), 'css' => in_raw('css', MAX_CODE_BYTES), 'js' => in_raw('js', MAX_CODE_BYTES)];
}

/** [bitmask, passed count] from the "done" array, limited to the quest's objectives. */
function done_bits(int $total): array
{
    $done = body()['done'] ?? [];
    if (!is_array($done)) fail(422, 'invalid_done');
    $bits = 0;
    $n = 0;
    for ($i = 0; $i < min($total, MAX_OBJECTIVES); $i++) {
        if (!empty($done[$i])) {
            $bits |= 1 << $i;
            $n++;
        }
    }
    return [$bits, $n];
}

function upsert_save(array $user, int $questId, array $code, int $bits): void
{
    q('INSERT INTO quest_saves (user_id, quest_id, html, css, js, objectives_done) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE html = VALUES(html), css = VALUES(css), js = VALUES(js), objectives_done = VALUES(objectives_done)',
        [$user['id'], $questId, $code['html'], $code['css'], $code['js'], $bits]);
}

/** Autosave from the editor. */
function route_lesson_save(int $lessonId): array
{
    $user = require_user();
    $quest = open_lesson($user, $lessonId)['quest'];
    $total = (int) q_val('SELECT COUNT(*) FROM quest_objectives WHERE quest_id = ?', [$quest['id']]);
    [$bits] = done_bits($total);
    upsert_save($user, (int) $quest['id'], code_input(), $bits);
    return ['saved' => true];
}

/** "Check" in the editor: records the attempt; when every objective passes, completes the lesson. */
function route_lesson_check(int $lessonId): array
{
    $user = require_user();
    ['lesson' => $lesson, 'course' => $course, 'quest' => $quest, 'next' => $next] = open_lesson($user, $lessonId);
    $total = (int) q_val('SELECT COUNT(*) FROM quest_objectives WHERE quest_id = ?', [$quest['id']]);
    [$bits, $passed] = done_bits($total);
    $code = code_input();
    $allDone = $total > 0 && $passed === min($total, MAX_OBJECTIVES);
    $pct = $total ? (int) round(100 * $passed / $total) : 0;

    $out = tx(function () use ($user, $lesson, $course, $quest, $code, $bits, $pct, $allDone) {
        upsert_save($user, (int) $quest['id'], $code, $bits);
        $lp = q_row('SELECT status FROM lesson_progress WHERE user_id = ? AND lesson_id = ? FOR UPDATE', [$user['id'], $lesson['id']]);
        if (!$lp) {
            q('INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)', [$user['id'], $lesson['id']]);
            $lp = ['status' => 'in_progress'];
        }
        $first = $allDone && $lp['status'] !== 'completed';
        q("UPDATE lesson_progress SET attempts = attempts + 1, progress_pct = GREATEST(progress_pct, ?)" .
          ($first ? ", status = 'completed', completed_at = NOW(), best_score = 100" : '') .
          ' WHERE user_id = ? AND lesson_id = ?', [$allDone ? 100 : $pct, $user['id'], $lesson['id']]);

        $reward = null;
        $badges = [];
        if ($first) {
            q('UPDATE quest_saves SET completed_at = NOW() WHERE user_id = ? AND quest_id = ?', [$user['id'], $quest['id']]);
            $reward = award_xp($user, (int) $lesson['xp_reward'], $lesson['kind'], (int) $lesson['id']);
            $badges = award_unit_badges($user, (int) $lesson['unit_id']);
            sync_enrollment($user, (int) $course['id']);
        }
        return ['completed' => $allDone, 'firstCompletion' => $first, 'reward' => $reward, 'badges' => $badges];
    });

    return $out + [
        'passed' => $passed,
        'total'  => $total,
        'next'   => next_lesson_payload($next),
    ];
}

/* ---------------------------------------------------------------
   Quizzes and exams (quiz.html): multiple-choice questions of a lesson
--------------------------------------------------------------- */

/** The lesson's active questions with their answers; `correct` is the id of the right answer. */
function quiz_questions(int $lessonId): array
{
    $rows = q("SELECT q.id, q.prompt, q.code_snippet, a.id AS answer_id, a.answer_text, a.is_correct
               FROM questions q JOIN question_answers a ON a.question_id = q.id
               WHERE q.lesson_id = ? AND q.purpose = 'lesson' AND q.is_active = 1
               ORDER BY q.id, a.position", [$lessonId])->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $id = (int) $r['id'];
        $out[$id] ??= ['id' => $id, 'prompt' => $r['prompt'], 'code' => $r['code_snippet'], 'answers' => [], 'correct' => null];
        $out[$id]['answers'][] = ['id' => (int) $r['answer_id'], 'text' => $r['answer_text']];
        if ($r['is_correct']) $out[$id]['correct'] = (int) $r['answer_id'];
    }
    return array_values($out);
}

function open_quiz(array $user, int $lessonId): array
{
    $open = unlocked_lesson($user, $lessonId);
    $open['questions'] = quiz_questions($lessonId) ?: fail(404, 'no_content', 'This quiz has no questions yet.');
    return $open;
}

/** The quiz for quiz.html. Like the placement quiz, the page shows right and wrong as you go, so it gets the answers; grading is redone here. */
function route_quiz_get(int $lessonId): array
{
    $user = require_user();
    ['lesson' => $lesson, 'course' => $course, 'state' => $state, 'next' => $next, 'questions' => $questions] = open_quiz($user, $lessonId);
    q('INSERT IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)', [$user['id'], $lessonId]);
    $lp = q_row('SELECT best_score, attempts FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [$user['id'], $lessonId]);

    return [
        'lesson' => lesson_payload($lesson, $course, $state),
        'quiz'   => [
            'questions'   => $questions,
            'passPercent' => QUIZ_PASS_PERCENT,
            'bestScore'   => $lp && $lp['best_score'] !== null ? (int) $lp['best_score'] : null,
            'attempts'    => (int) ($lp['attempts'] ?? 0),
        ],
        'next' => next_lesson_payload($next),
    ];
}

/** Grades {answers: [{questionId, answerId}]}; from QUIZ_PASS_PERCENT up the lesson completes and pays its XP once. */
function route_quiz_submit(int $lessonId): array
{
    $user = require_user();
    ['lesson' => $lesson, 'course' => $course, 'next' => $next, 'questions' => $questions] = open_quiz($user, $lessonId);

    $given = [];
    foreach (body()['answers'] ?? [] as $a) {
        if (is_array($a) && isset($a['questionId'], $a['answerId'])) $given[(int) $a['questionId']] = (int) $a['answerId'];
    }
    $results = [];
    $correct = 0;
    foreach ($questions as $qq) {
        $answer = $given[$qq['id']] ?? null;
        $ok = $answer !== null && $answer === $qq['correct'];
        if ($ok) $correct++;
        $results[] = ['questionId' => $qq['id'], 'answerId' => $answer, 'correctAnswerId' => $qq['correct'], 'correct' => $ok];
    }
    $total = count($questions);
    $score = (int) round(100 * $correct / $total);
    $passed = $score >= QUIZ_PASS_PERCENT;

    $out = tx(function () use ($user, $lesson, $course, $score, $passed) {
        $lp = q_row('SELECT status FROM lesson_progress WHERE user_id = ? AND lesson_id = ? FOR UPDATE', [$user['id'], $lesson['id']]);
        if (!$lp) {
            q('INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)', [$user['id'], $lesson['id']]);
            $lp = ['status' => 'in_progress'];
        }
        $first = $passed && $lp['status'] !== 'completed';
        q("UPDATE lesson_progress SET attempts = attempts + 1, best_score = GREATEST(COALESCE(best_score, 0), ?), progress_pct = GREATEST(progress_pct, ?)" .
          ($first ? ", status = 'completed', completed_at = NOW()" : '') .
          ' WHERE user_id = ? AND lesson_id = ?', [$score, $passed ? 100 : $score, $user['id'], $lesson['id']]);

        $reward = null;
        $badges = [];
        if ($first) {
            $reward = award_xp($user, (int) $lesson['xp_reward'], $lesson['kind'], (int) $lesson['id']);
            $badges = award_unit_badges($user, (int) $lesson['unit_id']);
            sync_enrollment($user, (int) $course['id']);
        }
        return ['firstCompletion' => $first, 'reward' => $reward, 'badges' => $badges];
    });

    return $out + [
        'score'       => $score,
        'correct'     => $correct,
        'total'       => $total,
        'passed'      => $passed,
        'passPercent' => QUIZ_PASS_PERCENT,
        'results'     => $results,
        'next'        => next_lesson_payload($next),
    ];
}
