<?php
/**
 * Codle — builds the content seeds from the files in this folder.
 *
 *   php database/content/build.php          writes database/seed-quests.sql and database/seed-quiz.sql
 *   php database/content/build.php --json   also writes content.json (used by the check verifier)
 *
 * quests/<course>-<unit>.php  return [slug => quest]   editor quests, one file per unit
 * quiz/<course>.php           return [slug => [...]]   questions of the unit quizzes and the final exam
 *
 * Lessons are matched by course slug, unit position and lesson slug, so the files
 * import on any database that has the courses from seed.sql. Both seeds replace
 * what they find (quests, questions) and can be imported again.
 */

$root = dirname(__DIR__);
$courses = ['html' => 'HTML', 'css' => 'CSS', 'javascript' => 'JavaScript'];

function q(string $s): string
{
    return "'" . str_replace(["\\", "'", "\n", "\r"], ["\\\\", "''", "\\n", ""], $s) . "'";
}

/** Authored text uses \n inside <pre> for a line break, like the SQL did. Code and checks keep their backslashes. */
function text(string $s): string
{
    return str_replace('\n', "\n", $s);
}

function lessonVar(string $course, int $unit, string $slug): string
{
    return "SET @lesson = (SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id JOIN courses c ON c.id = u.course_id\n" .
           "               WHERE c.slug = " . q($course) . " AND u.position = $unit AND l.slug = " . q($slug) . ");";
}

$quests = [];
$quiz = [];
$json = ['quests' => []];
$nQuests = 0;
$nQuestions = 0;

foreach ($courses as $course => $name) {
    for ($unit = 1; $unit <= 6; $unit++) {
        $file = __DIR__ . "/quests/$course-$unit.php";
        if (!is_file($file)) continue;
        $list = require $file;
        $quests[] = "-- -------------------------------------------------------------\n-- $name · Unit $unit\n-- -------------------------------------------------------------";
        foreach ($list as $slug => $qst) {
            $nQuests++;
            $files = ['html' => $qst['html'] ?? '', 'css' => $qst['css'] ?? '', 'js' => $qst['js'] ?? ''];
            $out = [];
            $out[] = "-- $slug · " . $qst['title'];
            $out[] = lessonVar($course, $unit, $slug);
            $out[] = "DELETE FROM quests WHERE lesson_id = @lesson;";
            $out[] = "INSERT INTO quests (lesson_id, title, description_html) VALUES (@lesson, " . q($qst['title']) . ",\n " . q(text($qst['desc'])) . ");";
            $out[] = "SET @q = LAST_INSERT_ID();";
            $out[] = "INSERT INTO quest_files (quest_id, language, starter) VALUES\n" . implode(",\n", array_map(
                fn($lang) => " (@q, " . q($lang) . ", " . q($files[$lang]) . ")", ['html', 'css', 'js'])) . ";";
            $rows = [];
            foreach ($qst['objectives'] as $i => $o) {
                [$lang, $txt, $hint, $check] = $o;
                $rows[] = " (@q, " . ($i + 1) . ", " . q($lang) . ", " . q(text($txt)) . ",\n  " . q(text($hint)) . ",\n  " . q(trim($check)) . ")";
            }
            $out[] = "INSERT INTO quest_objectives (quest_id, position, language, text_html, hint_html, check_js) VALUES\n" . implode(",\n", $rows) . ";";
            $quests[] = implode("\n", $out);

            $solution = $qst['solution'] ?? [];
            $json['quests'][] = [
                'id'       => "$course/$unit/$slug",
                'starter'  => $files,
                'solution' => ['html' => $solution['html'] ?? $files['html'], 'css' => $solution['css'] ?? $files['css'], 'js' => $solution['js'] ?? $files['js']],
                'checks'   => array_map(fn($o) => trim($o[3]), $qst['objectives']),
            ];
        }
    }

    $file = __DIR__ . "/quiz/$course.php";
    if (!is_file($file)) continue;
    $quiz[] = "-- -------------------------------------------------------------\n-- $name\n-- -------------------------------------------------------------";
    foreach (require $file as $slug => $questions) {
        $unit = $slug === 'final-exam' ? 6 : (int) substr($slug, 5, 1);
        $difficulty = min(5, (int) ceil($unit * 5 / 6));
        $out = ["-- Unit $unit · $slug (" . count($questions) . " questions)", lessonVar($course, $unit, $slug),
                "DELETE FROM questions WHERE lesson_id = @lesson;"];
        foreach ($questions as $qq) {
            [$prompt, $answers, $correct, $code] = $qq;
            if (count($answers) !== 4 || !isset($answers[$correct])) {
                fwrite(STDERR, "bad question in $course/$slug: $prompt\n");
                exit(1);
            }
            $nQuestions++;
            $out[] = "INSERT INTO questions (course_id, lesson_id, purpose, difficulty, prompt, code_snippet) SELECT id, @lesson, 'lesson', " .
                ($qq[4] ?? $difficulty) . ", " . q($prompt) . ", " . ($code === null ? 'NULL' : q($code)) . " FROM courses WHERE slug = " . q($course) . ";";
            $out[] = "SET @qq = LAST_INSERT_ID();";
            $out[] = "INSERT INTO question_answers (question_id, position, answer_text, is_correct) VALUES " . implode(", ", array_map(
                fn($i) => "(@qq, " . ($i + 1) . ", " . q($answers[$i]) . ", " . ($i === $correct ? 1 : 0) . ")", [0, 1, 2, 3])) . ";";
        }
        $quiz[] = implode("\n", $out);
    }
}

$head = "SET NAMES utf8mb4;\nUSE codle;\n\n";
file_put_contents("$root/seed-quests.sql",
    "-- =============================================================\n" .
    "--  Codle — editor quests for every lesson of HTML, CSS and JavaScript\n" .
    "--  Generated by database/content/build.php from database/content/quests/.\n" .
    "--  Import after seed.sql. Replaces the quest of every lesson it names ($nQuests quests).\n" .
    "--\n" .
    "--  check_js is the body of function (doc) { … } and runs in the preview iframe.\n" .
    "--  doc.defaultView.__codleLogs holds what console.log() printed (as strings).\n" .
    "-- =============================================================\n\n" . $head . implode("\n\n", $quests) . "\n");
file_put_contents("$root/seed-quiz.sql",
    "-- =============================================================\n" .
    "--  Codle — questions of the unit quizzes and final exams\n" .
    "--  Generated by database/content/build.php from database/content/quiz/.\n" .
    "--  Import after seed.sql. Replaces the questions of every quiz it names ($nQuestions questions).\n" .
    "-- =============================================================\n\n" . $head . implode("\n\n", $quiz) . "\n");
if (in_array('--json', $argv, true)) {
    file_put_contents(__DIR__ . '/content.json', json_encode($json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
}
echo "seed-quests.sql: $nQuests quests, seed-quiz.sql: $nQuestions questions\n";
