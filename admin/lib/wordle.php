<?php
/**
 * Codle admin — Wordle schedule and word bank.
 *
 * Puzzle numbers follow the date: #1 is config wordle_launch, #2 the day after, …
 * Today and past days are locked, because learners may already have played them.
 */

const WORDLE_MAX_FILL_DAYS = 366;

function wordle_launch(): string
{
    return (string) (config()['wordle_launch'] ?? '2026-10-13');
}

function puzzle_no_for(string $date): int
{
    return (int) (new DateTimeImmutable(wordle_launch()))->diff(new DateTimeImmutable($date))->format('%r%a') + 1;
}

function is_editable_day(string $date): bool
{
    return is_date($date) && $date > today() && $date >= wordle_launch();
}

/** Scheduled puzzles between two dates (inclusive), keyed by date. */
function wordle_schedule(string $from, string $to): array
{
    $q = db()->prepare("
        SELECT p.puzzle_no, p.puzzle_date, w.id AS word_id, w.word, w.hint, w.is_active
        FROM wordle_puzzles p JOIN wordle_words w ON w.id = p.word_id
        WHERE p.puzzle_date BETWEEN ? AND ?
        ORDER BY p.puzzle_date");
    $q->execute([$from, $to]);
    $out = [];
    foreach ($q as $r) $out[$r['puzzle_date']] = $r;
    return $out;
}

function wordle_puzzle(string $date): ?array
{
    return wordle_schedule($date, $date)[$date] ?? null;
}

/** First day from $from on that has no puzzle (looks a year ahead). */
function wordle_first_gap(string $from): ?string
{
    $to = add_days($from, WORDLE_MAX_FILL_DAYS);
    $planned = wordle_schedule($from, $to);
    for ($d = $from; $d <= $to; $d = add_days($d, 1)) {
        if (!isset($planned[$d])) return $d;
    }
    return null;
}

/**
 * Active words ordered by how good a pick they are for $date: never used first,
 * then by the distance (days) to their nearest other appearance, farthest first.
 */
function wordle_candidates(string $date): array
{
    $q = db()->prepare("
        SELECT * FROM (
            SELECT w.id, w.word, w.hint,
                   MIN(ABS(DATEDIFF(p.puzzle_date, ?))) AS distance,
                   COUNT(p.puzzle_no) AS used
            FROM wordle_words w
            LEFT JOIN wordle_puzzles p ON p.word_id = w.id AND p.puzzle_date <> ?
            WHERE w.is_active = 1
            GROUP BY w.id, w.word, w.hint
        ) c
        ORDER BY c.distance IS NOT NULL, c.distance DESC, c.word");
    $q->execute([$date, $date]);
    return $q->fetchAll();
}

/** A random word from the best few candidates, so suggestions are not alphabetical. */
function wordle_suggest(string $date, ?array $candidates = null): ?array
{
    $candidates ??= wordle_candidates($date);
    if (!$candidates) return null;
    $best = $candidates[0]['distance'];
    $pool = array_values(array_filter($candidates, fn($c) => $c['distance'] === $best));
    if (count($pool) < 5) $pool = array_slice($candidates, 0, 8);
    return $pool[random_int(0, count($pool) - 1)];
}

function wordle_set_day(string $date, int $wordId): void
{
    db()->prepare('INSERT INTO wordle_puzzles (puzzle_no, puzzle_date, word_id) VALUES (?, ?, ?)
                   ON DUPLICATE KEY UPDATE word_id = VALUES(word_id)')
        ->execute([puzzle_no_for($date), $date, $wordId]);
}

/** For each scheduled day in the range: days to the nearest other day with the same word. */
function wordle_nearest_repeats(string $from, string $to): array
{
    $q = db()->prepare("
        SELECT p.puzzle_date, MIN(ABS(DATEDIFF(p2.puzzle_date, p.puzzle_date))) AS nearest
        FROM wordle_puzzles p
        JOIN wordle_puzzles p2 ON p2.word_id = p.word_id AND p2.puzzle_no <> p.puzzle_no
        WHERE p.puzzle_date BETWEEN ? AND ?
        GROUP BY p.puzzle_date");
    $q->execute([$from, $to]);
    return array_column($q->fetchAll(), 'nearest', 'puzzle_date');
}

/** Every word with usage numbers, for the word bank. */
function wordle_words_with_usage(): array
{
    $today = today();
    $q = db()->prepare("
        SELECT w.id, w.word, w.hint, w.is_active, w.added_at,
               COUNT(p.puzzle_no) AS used,
               MAX(CASE WHEN p.puzzle_date <= ? THEN p.puzzle_date END) AS last_used,
               MIN(CASE WHEN p.puzzle_date > ? THEN p.puzzle_date END) AS next_planned
        FROM wordle_words w
        LEFT JOIN wordle_puzzles p ON p.word_id = w.id
        GROUP BY w.id, w.word, w.hint, w.is_active, w.added_at
        ORDER BY w.word");
    $q->execute([$today, $today]);
    return $q->fetchAll();
}

/** Results of past puzzles from wordle_plays. */
function wordle_results(string $from, string $to): array
{
    $q = db()->prepare("
        SELECT p.puzzle_no, p.puzzle_date, w.word,
               COUNT(pl.user_id) AS plays,
               COALESCE(SUM(pl.status = 'won'), 0)  AS won,
               COALESCE(SUM(pl.status = 'lost'), 0) AS lost,
               AVG(CASE WHEN pl.status = 'won' THEN pl.guess_count END) AS avg_guesses,
               COALESCE(SUM(pl.hint_used), 0) AS hints
        FROM wordle_puzzles p
        JOIN wordle_words w ON w.id = p.word_id
        LEFT JOIN wordle_plays pl ON pl.puzzle_no = p.puzzle_no
        WHERE p.puzzle_date BETWEEN ? AND ?
        GROUP BY p.puzzle_no, p.puzzle_date, w.word
        ORDER BY p.puzzle_date DESC");
    $q->execute([$from, $to]);
    return $q->fetchAll();
}

/** Validates a new word + hint; returns an error message or ''. */
function wordle_word_error(string $word, string $hint): string
{
    if (!preg_match('/^[A-Z]{5}$/', $word)) return __('The word must be exactly 5 letters A–Z (no accents).');
    if ($hint === '') return __('Fill in the hint.');
    if (mb_strlen($hint) > 255) return __('The hint can be at most 255 characters.');
    return '';
}
