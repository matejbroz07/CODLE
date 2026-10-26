<?php
/**
 * Codle API — history games: Older or Younger, Daily Story.
 */

const STORY_LAUNCH = '2026-10-13';        // story #1, the same day as Wordle #1

/**
 * Today's story: the one scheduled for the day (history_stories.story_date), otherwise
 * the stories in id order, one per day since launch, starting over at the end.
 */
function story_for_day(string $day): ?array
{
    $story = q_row('SELECT * FROM history_stories WHERE story_date = ?', [$day]);
    if ($story) return $story;
    $ids = array_map('intval', q('SELECT id FROM history_stories WHERE story_date IS NULL ORDER BY id')->fetchAll(PDO::FETCH_COLUMN));
    if (!$ids) return null;
    $n = days_between(STORY_LAUNCH, $day);
    return q_row('SELECT * FROM history_stories WHERE id = ?', [$ids[(($n % count($ids)) + count($ids)) % count($ids)]]);
}

function story_number(string $day): int
{
    return days_between(STORY_LAUNCH, $day) + 1;
}

/** Options in a per-day order that is the same for everyone that day. */
function story_options(array $story, string $day): array
{
    $opts = q('SELECT id, option_text, is_correct FROM history_story_options WHERE story_id = ? ORDER BY position', [$story['id']])->fetchAll();
    usort($opts, fn($a, $b) => strcmp(hash('crc32b', $day . '|' . $a['id']), hash('crc32b', $day . '|' . $b['id'])));
    return $opts;
}

/** Answered, correct and the streak of days in a row with a correct answer. */
function story_stats(array $user, string $today): array
{
    $rows = q('SELECT local_day, is_correct FROM history_story_answers WHERE user_id = ? ORDER BY local_day', [$user['id']])->fetchAll();
    $stats = ['played' => count($rows), 'correct' => 0, 'streak' => 0, 'best' => 0];
    $run = 0;
    $prevDay = null;
    foreach ($rows as $r) {
        if ($r['is_correct']) {
            $stats['correct']++;
            $run = $prevDay !== null && $run > 0 && $r['local_day'] === add_days($prevDay, 1) ? $run + 1 : 1;
        } else {
            $run = 0;
        }
        $stats['best'] = max($stats['best'], $run);
        $prevDay = $r['local_day'];
    }
    $stats['streak'] = $prevDay !== null && $prevDay >= add_days($today, -1) ? $run : 0;
    return $stats;
}

function story_state(array $user): array
{
    $day = local_today($user['timezone']);
    $story = story_for_day($day);
    if (!$story) return ['available' => false, 'stats' => story_stats($user, $day)];

    $answer = q_row('SELECT option_id, is_correct FROM history_story_answers WHERE user_id = ? AND local_day = ?', [$user['id'], $day]);
    $options = story_options($story, $day);
    $answered = $answer !== null;
    $correctId = null;
    foreach ($options as $o) {
        if ($o['is_correct']) $correctId = (int) $o['id'];
    }
    return [
        'available' => true,
        'number'    => story_number($day),
        'date'      => $day,
        'title'     => $story['title'],
        'year'      => (int) $story['year'],
        'text'      => $story['body'],
        'question'  => $story['question'],
        'options'   => array_map(fn($o) => ['id' => (int) $o['id'], 'text' => $o['option_text']], $options),
        'picked'    => $answered ? (int) $answer['option_id'] : null,
        // The right answer, the explanation and the source only after answering.
        'correctId' => $answered ? $correctId : null,
        'why'       => $answered ? $story['explanation'] : null,
        'source'    => $answered ? $story['source_url'] : null,
        'stats'     => story_stats($user, $day),
        'secondsToMidnight' => secs_to_midnight($user['timezone']),
    ];
}
