<?php
/**
 * Codle API — practice games: Wordle, Older or Younger, Daily Story.
 */

function route_wordle_get(): array
{
    $user = require_user();
    $puzzle = wordle_puzzle_today($user);
    return wordle_state($user, $puzzle, $puzzle ? wordle_play($user, (int) $puzzle['puzzle_no']) : null);
}

function route_wordle_guess(): array
{
    $user = require_user();
    $guess = strtoupper(in_str('guess', 10));
    if (!preg_match('/^[A-Z]{5}$/', $guess)) fail(422, 'invalid_guess', 'A guess is 5 letters A–Z.');
    $puzzle = wordle_puzzle_today($user) ?? fail(404, 'no_puzzle', 'There is no word today.');
    $no = (int) $puzzle['puzzle_no'];

    return tx(function () use ($user, $puzzle, $no, $guess) {
        q('INSERT IGNORE INTO wordle_plays (user_id, puzzle_no) VALUES (?, ?)', [$user['id'], $no]);
        $play = wordle_play($user, $no, true);
        if ($play['status'] !== 'playing') fail(409, 'game_over', 'Today\'s game is already over.');

        $guesses = wordle_guesses($play);
        $guesses[] = $guess;
        $status = $guess === $puzzle['word'] ? 'won' : (count($guesses) >= WORDLE_MAX_GUESSES ? 'lost' : 'playing');
        q('UPDATE wordle_plays SET guesses = ?, guess_count = ?, status = ?, finished_at = IF(? <> \'playing\', NOW(), NULL)
           WHERE user_id = ? AND puzzle_no = ?', [implode(',', $guesses), count($guesses), $status, $status, $user['id'], $no]);

        $reward = null;
        if ($status === 'won') {
            $xp = config()['xp'] ?? [];
            $reward = award_xp($user, (int) ($play['hint_used'] ? ($xp['wordle_win_hint'] ?? 5) : ($xp['wordle_win'] ?? 10)), 'wordle', $no);
        }
        $state = wordle_state($user, $puzzle, wordle_play($user, $no));
        return $state + ['result' => wordle_evaluate($guess, $puzzle['word']), 'reward' => $reward];
    });
}

function route_wordle_hint(): array
{
    $user = require_user();
    $puzzle = wordle_puzzle_today($user) ?? fail(404, 'no_puzzle', 'There is no word today.');
    $no = (int) $puzzle['puzzle_no'];
    q('INSERT IGNORE INTO wordle_plays (user_id, puzzle_no) VALUES (?, ?)', [$user['id'], $no]);
    q("UPDATE wordle_plays SET hint_used = 1 WHERE user_id = ? AND puzzle_no = ? AND status = 'playing'", [$user['id'], $no]);
    return wordle_state($user, $puzzle, wordle_play($user, $no));
}

/* ---------------------------------------------------------------
   Older or Younger
--------------------------------------------------------------- */

function older_best(array $user): int
{
    return (int) q_val('SELECT COALESCE(MAX(score), 0) FROM older_younger_runs WHERE user_id = ?', [$user['id']]);
}

function route_history_cards(): array
{
    $user = require_user();
    $cards = q('SELECT name, year, category, fact, source_url FROM history_cards WHERE is_active = 1 ORDER BY id')->fetchAll();
    return [
        'cards' => array_map(fn($c) => ['name' => $c['name'], 'year' => (int) $c['year'], 'cat' => $c['category'],
                                        'fact' => $c['fact'], 'src' => $c['source_url']], $cards),
        'best'  => older_best($user),
    ];
}

/** A finished run. The score comes from the browser, so its XP is capped per day. */
function route_history_older(): array
{
    $user = require_user();
    $score = in_int('score');
    $max = (int) q_val('SELECT COUNT(*) FROM history_cards WHERE is_active = 1');
    if ($score < 0 || $score > max(0, $max * 3)) fail(422, 'invalid_score');

    return tx(function () use ($user, $score) {
        $best = older_best($user);
        q('INSERT INTO older_younger_runs (user_id, score) VALUES (?, ?)', [$user['id'], $score]);
        $cap = (int) (config()['xp']['older_younger_max'] ?? 20);
        $xp = max(0, min($score, $cap - xp_today_from($user, 'older_younger')));
        return [
            'best'    => max($best, $score),
            'newBest' => $score > $best,
            'reward'  => $xp > 0 ? award_xp($user, $xp, 'older_younger') : null,
        ];
    });
}

/* ---------------------------------------------------------------
   Daily Story
--------------------------------------------------------------- */

function route_story_get(): array
{
    return story_state(require_user());
}

function route_story_answer(): array
{
    $user = require_user();
    $optionId = in_int('optionId');
    $day = local_today($user['timezone']);
    $story = story_for_day($day) ?? fail(404, 'no_story', 'There is no story today.');
    $option = q_row('SELECT id, is_correct FROM history_story_options WHERE id = ? AND story_id = ?', [$optionId, $story['id']])
        ?? fail(422, 'invalid_option');

    $reward = tx(function () use ($user, $story, $option, $day) {
        if (q_val('SELECT 1 FROM history_story_answers WHERE user_id = ? AND local_day = ? FOR UPDATE', [$user['id'], $day])) {
            fail(409, 'already_answered', 'You already answered today\'s story.');
        }
        q('INSERT INTO history_story_answers (user_id, story_id, option_id, is_correct, local_day) VALUES (?, ?, ?, ?, ?)',
            [$user['id'], $story['id'], $option['id'], $option['is_correct'], $day]);
        return $option['is_correct'] ? award_xp($user, (int) (config()['xp']['daily_story'] ?? 10), 'daily_story', (int) $story['id']) : null;
    });
    return story_state($user) + ['reward' => $reward];
}
