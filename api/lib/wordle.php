<?php
/**
 * Codle API — daily Wordle. The answer stays on the server until the game is over;
 * the browser only ever gets the colour of each letter it guessed.
 */

const WORDLE_LEN = 5;
const WORDLE_MAX_GUESSES = 6;

/** Same rules as evaluate() in js/practice.js: greens first, then yellows from what is left. */
function wordle_evaluate(string $guess, string $target): array
{
    $res = array_fill(0, WORDLE_LEN, null);
    $remaining = [];
    for ($c = 0; $c < WORDLE_LEN; $c++) {
        if ($guess[$c] === $target[$c]) $res[$c] = 'correct';
        else $remaining[$target[$c]] = ($remaining[$target[$c]] ?? 0) + 1;
    }
    for ($c = 0; $c < WORDLE_LEN; $c++) {
        if ($res[$c]) continue;
        if (!empty($remaining[$guess[$c]])) {
            $res[$c] = 'present';
            $remaining[$guess[$c]]--;
        } else {
            $res[$c] = 'absent';
        }
    }
    return $res;
}

/** Today's puzzle in the learner's time zone, with the answer (server side only). */
function wordle_puzzle_today(array $user): ?array
{
    return q_row('SELECT p.puzzle_no, p.puzzle_date, w.word, w.hint
                  FROM wordle_puzzles p JOIN wordle_words w ON w.id = p.word_id
                  WHERE p.puzzle_date = ?', [local_today($user['timezone'])]);
}

function wordle_play(array $user, int $puzzleNo, bool $lock = false): ?array
{
    return q_row('SELECT * FROM wordle_plays WHERE user_id = ? AND puzzle_no = ?' . ($lock ? ' FOR UPDATE' : ''), [$user['id'], $puzzleNo]);
}

function wordle_guesses(?array $play): array
{
    return $play && $play['guesses'] !== '' ? explode(',', $play['guesses']) : [];
}

/** Played, won, streaks and the guess distribution, from finished plays. */
function wordle_stats(array $user, ?int $todayNo): array
{
    $rows = q("SELECT puzzle_no, status, guess_count FROM wordle_plays
               WHERE user_id = ? AND status <> 'playing' ORDER BY puzzle_no", [$user['id']])->fetchAll();
    $stats = ['played' => 0, 'won' => 0, 'streak' => 0, 'maxStreak' => 0, 'dist' => array_fill(0, WORDLE_MAX_GUESSES, 0)];
    $run = 0;
    $prev = null;
    foreach ($rows as $r) {
        $stats['played']++;
        $no = (int) $r['puzzle_no'];
        if ($r['status'] === 'won') {
            $stats['won']++;
            $stats['dist'][max(1, min(WORDLE_MAX_GUESSES, (int) $r['guess_count'])) - 1]++;
            $run = $prev !== null && $no === $prev + 1 && $run > 0 ? $run + 1 : 1;
        } else {
            $run = 0;
        }
        $stats['maxStreak'] = max($stats['maxStreak'], $run);
        $prev = $no;
    }
    // A missed day breaks the streak: the last finished puzzle must be today's or yesterday's.
    $stats['streak'] = $prev !== null && $todayNo !== null && $prev >= $todayNo - 1 ? $run : 0;
    return $stats;
}

/** The state the browser gets: guesses with colours, never the answer while playing. */
function wordle_state(array $user, ?array $puzzle, ?array $play): array
{
    if (!$puzzle) {
        return ['available' => false, 'stats' => wordle_stats($user, null), 'secondsToMidnight' => secs_to_midnight($user['timezone'])];
    }
    $guesses = wordle_guesses($play);
    $status = $play['status'] ?? 'playing';
    $hintUsed = (bool) ($play['hint_used'] ?? false);
    $finished = $status !== 'playing';
    return [
        'available'  => true,
        'number'     => (int) $puzzle['puzzle_no'],
        'date'       => $puzzle['puzzle_date'],
        'guesses'    => $guesses,
        'results'    => array_map(fn($g) => wordle_evaluate($g, $puzzle['word']), $guesses),
        'status'     => $status,
        'hintUsed'   => $hintUsed,
        'hint'       => $hintUsed || $finished ? $puzzle['hint'] : null,
        'answer'     => $finished ? $puzzle['word'] : null,
        'stats'      => wordle_stats($user, (int) $puzzle['puzzle_no']),
        'secondsToMidnight' => secs_to_midnight($user['timezone']),
    ];
}
