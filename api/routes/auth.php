<?php
/**
 * Codle API — login, logout, registration wizard, password reset.
 */

function route_session(): array
{
    $user = current_user();
    return ['user' => $user ? user_summary($user) : null];
}

function route_login(): array
{
    $login = in_str('login', 254);
    $password = in_raw('password', 200);
    if ($login === '' || $password === '') fail(422, 'missing_fields', 'Enter your e-mail and password.');

    $key = normalize_email($login);
    throttle('login', $key, 10, 15 * 60);
    $user = str_contains($login, '@')
        ? q_row('SELECT * FROM users WHERE email = ?', [$key])
        : q_row('SELECT * FROM users WHERE username = ?', [$login]);

    // Unknown accounts still pay for one hash, so both cases take about the same time.
    $hash = $user['password_hash'] ?? password_hash(bin2hex(random_bytes(12)), PASSWORD_DEFAULT);
    if (!password_verify($password, $hash) || !$user) {
        fail(401, 'wrong_credentials', 'Wrong e-mail or password.');
    }
    if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
        q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }
    clear_throttle('login', $key);
    start_session((int) $user['id']);
    return ['user' => user_summary($user)];
}

function route_logout(): array
{
    end_session();
    return ['ok' => true];
}

function route_username_check(): array
{
    // Logged in (profile rename): the learner's own name is not "taken".
    $self = current_user();
    $problem = username_problem(query_str('u'), $self ? (int) $self['id'] : null);
    return ['available' => $problem === '', 'reason' => $problem ?: null];
}

/* ---------------------------------------------------------------
   Registration: step 3 (e-mail code) → step 4 (account)
--------------------------------------------------------------- */

function route_register_code(): array
{
    $email = normalize_email(in_str('email', 254));
    if (!valid_email($email)) fail(422, 'invalid_email', 'Please enter a valid e-mail.');
    if (q_val('SELECT 1 FROM users WHERE email = ?', [$email])) {
        fail(409, 'email_taken', 'An account with this e-mail already exists. Log in instead.');
    }
    throttle('send_code', $email, 5, 3600);
    return issue_code($email, 'register');
}

function route_register_verify(): array
{
    $email = normalize_email(in_str('email', 254));
    throttle('verify_code', $email, 20, 15 * 60);
    verify_code($email, 'register', in_str('code', 6));
    return ['verifiedToken' => verified_token($email)];
}

function route_register(): array
{
    $email = verified_email(in_str('verifiedToken', 500));
    $username = in_str('username', 20);
    $password = in_raw('password', 200);

    if ($problem = username_problem($username)) {
        fail(409, 'username_' . $problem, $problem === 'taken' ? 'This username is already taken.' : 'This username isn\'t allowed.');
    }
    if ($problem = password_problem($password)) fail(422, 'weak_password', $problem);
    if (q_val('SELECT 1 FROM users WHERE email = ?', [$email])) fail(409, 'email_taken', 'An account with this e-mail already exists.');

    $course = find_course_by_slug(in_str('course', 32));
    if (!$course) fail(422, 'invalid_course', 'Pick a language.');
    $tz = safe_timezone(in_str('timezone', 64));
    $answers = body()['placement']['answers'] ?? [];
    if (!is_array($answers) || count($answers) > 20) fail(422, 'invalid_placement');

    $result = tx(function () use ($email, $username, $password, $course, $tz, $answers) {
        q('INSERT INTO users (username, email, password_hash, email_verified_at, timezone) VALUES (?, ?, ?, NOW(), ?)',
            [$username, $email, password_hash($password, PASSWORD_DEFAULT), $tz]);
        $userId = (int) db()->lastInsertId();
        q('INSERT INTO user_settings (user_id) VALUES (?)', [$userId]);
        $user = fresh_user($userId);
        $placement = save_placement($user, $course, $answers, (int) (body()['placement']['seconds'] ?? 0));
        activate_course($user, $course, $placement['level']);
        return ['user' => $user, 'placement' => $placement];
    });

    start_session((int) $result['user']['id']);
    return ['user' => user_summary($result['user']), 'placement' => $result['placement']];
}

/**
 * Grades the placement quiz on the server and stores it. The level is the
 * hardest difficulty answered correctly (at least 1), like the results screen.
 */
function save_placement(array $user, array $course, array $answers, int $seconds): array
{
    $graded = [];
    foreach (array_values($answers) as $i => $a) {
        $qid = (int) ($a['questionId'] ?? 0);
        $aid = isset($a['answerId']) ? (int) $a['answerId'] : null;
        $question = q_row("SELECT id, difficulty FROM questions WHERE id = ? AND course_id = ? AND purpose = 'placement'", [$qid, $course['id']]);
        if (!$question) continue;
        $answer = $aid !== null ? q_row('SELECT is_correct FROM question_answers WHERE id = ? AND question_id = ?', [$aid, $qid]) : null;
        $correct = $answer !== null && (bool) $answer['is_correct'];
        $graded[] = ['position' => $i + 1, 'question' => $qid, 'answer' => $answer !== null ? $aid : null,
                     'correct' => $correct, 'difficulty' => (int) $question['difficulty']];
    }

    if (!$graded) return ['level' => null, 'correct' => 0, 'wrong' => 0];
    $right = count(array_filter($graded, fn($g) => $g['correct']));
    $level = 1;
    foreach ($graded as $g) {
        if ($g['correct']) $level = max($level, $g['difficulty']);
    }

    $started = date('Y-m-d H:i:s', time() - max(0, min($seconds, 3600)));
    q('INSERT INTO placement_attempts (user_id, course_id, started_at, finished_at, correct_count, wrong_count, result_level)
       VALUES (?, ?, ?, NOW(), ?, ?, ?)', [$user['id'], $course['id'], $started, $right, count($graded) - $right, $level]);
    $attemptId = (int) db()->lastInsertId();
    foreach ($graded as $g) {
        q('INSERT INTO placement_answers (attempt_id, position, question_id, answer_id, is_correct) VALUES (?, ?, ?, ?, ?)',
            [$attemptId, $g['position'], $g['question'], $g['answer'], (int) $g['correct']]);
    }
    return ['level' => $level, 'correct' => $right, 'wrong' => count($graded) - $right];
}

/* ---------------------------------------------------------------
   Password reset
--------------------------------------------------------------- */

function route_password_code(): array
{
    $email = normalize_email(in_str('email', 254));
    if (!valid_email($email)) fail(422, 'invalid_email', 'Please enter a valid e-mail.');
    throttle('send_code', $email, 5, 3600);
    $user = q_row('SELECT id FROM users WHERE email = ?', [$email]);
    // The answer is the same whether the account exists or not.
    if (!$user) return ['sent' => true, 'expiresInMinutes' => CODE_TTL_MINUTES];
    return issue_code($email, 'password_reset', (int) $user['id']);
}

function route_password_reset(): array
{
    $email = normalize_email(in_str('email', 254));
    throttle('verify_code', $email, 20, 15 * 60);
    $user = q_row('SELECT * FROM users WHERE email = ?', [$email]) ?? fail(410, 'code_expired', 'The code has expired. Ask for a new one.');
    $password = in_raw('password', 200);
    if ($problem = password_problem($password)) fail(422, 'weak_password', $problem);
    verify_code($email, 'password_reset', in_str('code', 6));

    q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    q('DELETE FROM sessions WHERE user_id = ?', [$user['id']]);   // log out every other device
    clear_throttle('login', $email);
    start_session((int) $user['id']);
    return ['user' => user_summary($user)];
}

/* ---------------------------------------------------------------
   Placement quiz questions (registration step 2)
--------------------------------------------------------------- */

function route_placement_questions(): array
{
    $course = find_course_by_slug(query_str('course')) ?? fail(404, 'unknown_course');
    $rows = q("SELECT q.id, q.difficulty, q.prompt, q.code_snippet, a.id AS answer_id, a.answer_text, a.is_correct
               FROM questions q JOIN question_answers a ON a.question_id = q.id
               WHERE q.course_id = ? AND q.purpose = 'placement' AND q.is_active = 1
               ORDER BY q.id, a.position", [$course['id']])->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $id = (int) $r['id'];
        $out[$id] ??= ['id' => $id, 'level' => (int) $r['difficulty'], 'q' => $r['prompt'],
                       'code' => $r['code_snippet'], 'answers' => [], 'answerIds' => [], 'correct' => null];
        if ($r['is_correct']) $out[$id]['correct'] = count($out[$id]['answers']);
        $out[$id]['answers'][] = $r['answer_text'];
        $out[$id]['answerIds'][] = (int) $r['answer_id'];
    }
    // The quiz adapts in the browser, so it needs to know the right answers. Grading is redone on the server.
    return ['course' => $course['slug'], 'questions' => array_values($out)];
}
