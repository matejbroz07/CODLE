<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/wordle.php';
require_login();

const REPEAT_WARN_DAYS = 30;              // flag a word that comes back sooner than this

$view = in_array($_GET['view'] ?? '', ['words', 'results'], true) ? $_GET['view'] : 'plan';
$today = today();
$tomorrow = add_days($today, 1);
$date = (string) ($_GET['date'] ?? $tomorrow);
if (!is_editable_day($date)) $date = $tomorrow;
$span = in_array(get_int('days'), [14, 30, 90], true) ? get_int('days') : 30;

function find_word(int $id): ?array
{
    $q = db()->prepare('SELECT * FROM wordle_words WHERE id = ?');
    $q->execute([$id]);
    return $q->fetch() ?: null;
}

if (is_post()) {
    check_csrf();
    $action = $_POST['action'] ?? '';
    $postDate = post_str('date');
    $back = 'wordle.php?' . http_build_query(array_filter([
        'view' => $view !== 'plan' ? $view : null,
        'date' => is_editable_day($postDate) ? $postDate : null,
        'days' => $span !== 30 ? $span : null,
    ]));

    switch ($action) {
        case 'set_day':
            $word = find_word(post_int('word_id'));
            if (!is_editable_day($postDate)) { flash('error', __('Today and past days are locked, players may already have played them.')); break; }
            if (!$word || !$word['is_active']) { flash('error', __('Pick an active word.')); break; }
            wordle_set_day($postDate, (int) $word['id']);
            flash('ok', __('%s: word %s saved.', fmt_date($postDate), $word['word']));
            break;

        case 'clear_day':
            if (!is_editable_day($postDate)) { flash('error', __('Today and past days are locked.')); break; }
            db()->prepare('DELETE FROM wordle_puzzles WHERE puzzle_date = ?')->execute([$postDate]);
            flash('ok', __('%s: the day has no word now.', fmt_date($postDate)));
            break;

        case 'update_hint':
            $word = find_word(post_int('word_id'));
            $hint = post_str('hint');
            if (!$word) break;
            if ($error = wordle_word_error($word['word'], $hint)) { flash('error', $error); break; }
            db()->prepare('UPDATE wordle_words SET hint = ? WHERE id = ?')->execute([$hint, $word['id']]);
            flash('ok', __('Hint for %s saved.', $word['word']));
            break;

        case 'add_word':
            $text = strtoupper(post_str('word'));
            $hint = post_str('hint');
            if ($error = wordle_word_error($text, $hint)) { flash('error', $error); break; }
            try {
                db()->prepare('INSERT INTO wordle_words (word, hint) VALUES (?, ?)')->execute([$text, $hint]);
            } catch (PDOException $e) {
                if ($e->errorInfo[1] !== 1062) throw $e;
                flash('error', __('%s is already in the word bank.', $text));
                break;
            }
            if (isset($_POST['schedule']) && is_editable_day($postDate)) {
                wordle_set_day($postDate, (int) db()->lastInsertId());
                flash('ok', __('%s added and scheduled for %s.', $text, fmt_date($postDate)));
            } else {
                flash('ok', __('%s added to the word bank.', $text));
            }
            break;

        case 'toggle_word':
            $word = find_word(post_int('word_id'));
            if (!$word) break;
            if ($word['is_active']) {
                $q = db()->prepare('SELECT MIN(puzzle_date) FROM wordle_puzzles WHERE word_id = ? AND puzzle_date >= ?');
                $q->execute([$word['id'], $today]);
                if ($next = $q->fetchColumn()) {
                    flash('error', __('%s is scheduled for %s. Replace it in the schedule first.', $word['word'], fmt_date($next)));
                    break;
                }
            }
            db()->prepare('UPDATE wordle_words SET is_active = 1 - is_active WHERE id = ?')->execute([$word['id']]);
            flash('ok', $word['is_active'] ? __('%s retired.', $word['word']) : __('%s is active again.', $word['word']));
            break;

        case 'delete_word':
            $word = find_word(post_int('word_id'));
            if (!$word) break;
            $q = db()->prepare('SELECT COUNT(*) FROM wordle_puzzles WHERE word_id = ?');
            $q->execute([$word['id']]);
            if ((int) $q->fetchColumn() > 0) { flash('error', __('%s is already in the schedule, it can only be retired.', $word['word'])); break; }
            db()->prepare('DELETE FROM wordle_words WHERE id = ?')->execute([$word['id']]);
            flash('ok', __('%s deleted.', $word['word']));
            break;

        case 'fill_gaps':
            $until = post_str('until');
            $limit = add_days($today, WORDLE_MAX_FILL_DAYS);
            if (!is_date($until) || $until <= $today || $until > $limit) {
                flash('error', __('Pick a date between tomorrow and %s.', fmt_date($limit, false)));
                break;
            }
            $planned = wordle_schedule($tomorrow, $until);
            $filled = 0;
            for ($d = $tomorrow; $d <= $until; $d = add_days($d, 1)) {
                if (isset($planned[$d]) || !is_editable_day($d)) continue;
                $pick = wordle_suggest($d);
                if (!$pick) { flash('error', __('There are no active words in the bank.')); break 2; }
                wordle_set_day($d, (int) $pick['id']);
                $filled++;
            }
            flash('ok', $filled ? __('Filled %s up to %s.', fmt_days($filled), fmt_date($until, false)) : __('No day was missing.'));
            break;
    }
    redirect($back);
}

page_start('Wordle', 'wordle.php');
?>
<div class="page-head">
  <h1>Wordle</h1>
  <nav class="seg" aria-label="<?= h(__('View')) ?>">
    <a href="wordle.php"<?= $view === 'plan' ? ' class="glass-pill is-active" aria-current="page"' : '' ?>><?= h(__('Schedule')) ?></a>
    <a href="wordle.php?view=words"<?= $view === 'words' ? ' class="glass-pill is-active" aria-current="page"' : '' ?>><?= h(__('Word bank')) ?></a>
    <a href="wordle.php?view=results"<?= $view === 'results' ? ' class="glass-pill is-active" aria-current="page"' : '' ?>><?= h(__('Results')) ?></a>
  </nav>
</div>

<?php if ($view === 'plan'):
    $puzzle = wordle_puzzle($date);
    $candidates = wordle_candidates($date);
    $suggestion = (!$puzzle || isset($_GET['suggest'])) ? wordle_suggest($date, $candidates) : null;
    $selectedId = $suggestion ? (int) $suggestion['id'] : (int) ($puzzle['word_id'] ?? 0);
    $to = add_days($today, $span - 1);
    $schedule = wordle_schedule($today, $to);
    $repeats = wordle_nearest_repeats($today, $to);
    $gap = wordle_first_gap($tomorrow);
?>
<div class="flash flash-info">
  <?= __('The game on the site still picks the daily word in the browser (%s). Changes to this schedule will show up in the game once it reads from the API.', '<code>js/wordle-words.js</code>') ?>
</div>

<div class="grid grid-side">
  <section class="panel liquid-glass day-editor<?= $puzzle ? '' : ' panel-warn' ?>" id="day">
    <div class="panel-head">
      <h2><?= h(($date === $tomorrow ? __('Tomorrow') : __('Day')) . ': ' . fmt_date($date)) ?></h2>
      <span class="muted">#<?= puzzle_no_for($date) ?></span>
    </div>

    <div class="day-current">
      <?= wordle_tiles($puzzle['word'] ?? null, 'lg') ?>
      <?php if ($puzzle): ?>
        <form method="post" class="stack hint-form">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="update_hint">
          <input type="hidden" name="date" value="<?= $date ?>">
          <input type="hidden" name="word_id" value="<?= (int) $puzzle['word_id'] ?>">
          <label class="field"><span><?= h(__('Hint')) ?> <small class="muted">(<?= h(__('applies to the word on every day')) ?>)</small></span>
            <textarea name="hint" rows="2" maxlength="255" required><?= h($puzzle['hint']) ?></textarea>
          </label>
          <div><button class="btn btn-ghost btn-sm" type="submit"><?= h(__('Save hint')) ?></button></div>
        </form>
      <?php else: ?>
        <p><b><?= h(__('This day has no word yet.')) ?></b></p>
      <?php endif; ?>
    </div>

    <form method="post" class="form-row">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="set_day">
      <input type="hidden" name="date" value="<?= $date ?>">
      <label class="field grow"><span><?= h($puzzle ? __('Replace with') : __('Pick a word')) ?></span>
        <select name="word_id" id="word-select" required>
          <?php if ($puzzle && !$puzzle['is_active']): ?>
            <option value="<?= (int) $puzzle['word_id'] ?>" selected disabled><?= h($puzzle['word']) ?> (<?= h(__('retired')) ?>)</option>
          <?php endif; ?>
          <?php
          $unused = __('Never used');
          $used = __('Used — farthest from this day first');
          $groups = [$unused => [], $used => []];
          foreach ($candidates as $c) $groups[$c['distance'] === null ? $unused : $used][] = $c;
          foreach ($groups as $label => $list): if (!$list) continue; ?>
            <optgroup label="<?= h($label) ?>">
              <?php foreach ($list as $c): ?>
                <option value="<?= (int) $c['id'] ?>" data-word="<?= h($c['word']) ?>" data-hint="<?= h($c['hint']) ?>"<?= (int) $c['id'] === $selectedId ? ' selected' : '' ?>>
                  <?= h($c['word']) ?><?= $c['distance'] !== null ? ' · ' . h(__('nearest use %s away', fmt_days((int) $c['distance']))) : '' ?><?= (int) $c['id'] === (int) ($puzzle['word_id'] ?? 0) ? ' · ' . h(__('current')) : '' ?>
                </option>
              <?php endforeach; ?>
            </optgroup>
          <?php endforeach; ?>
        </select>
      </label>
      <button class="btn btn-primary" type="submit"><?= h($puzzle ? __('Replace word') : __('Save word')) ?></button>
      <a class="btn btn-ghost" href="wordle.php?date=<?= $date ?>&amp;suggest=1#day"><?= h(__('Suggest another')) ?></a>
    </form>
    <p class="muted small" id="word-select-hint"><?= $suggestion ? h(__('Suggestion:')) . ' ' . h($suggestion['word']) . ' — ' . h($suggestion['hint']) : '' ?></p>

    <details class="more">
      <summary><?= h(__('New word for this day')) ?></summary>
      <form method="post" class="form-row">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="add_word">
        <input type="hidden" name="date" value="<?= $date ?>">
        <input type="hidden" name="schedule" value="1">
        <label class="field field-word"><span><?= h(__('Word')) ?></span><input class="mono upper" name="word" maxlength="5" minlength="5" pattern="[A-Za-z]{5}" required placeholder="LOOPS"></label>
        <label class="field grow"><span><?= h(__('Hint (in English, as in the game)')) ?></span><input name="hint" maxlength="255" required></label>
        <button class="btn btn-primary" type="submit"><?= h(__('Add and schedule')) ?></button>
      </form>
    </details>

    <?php if ($puzzle): ?>
      <div class="day-clear">
        <?= action_button('clear_day', ['date' => $date], h(__('Remove the word from this day')), 'link-btn link-danger', __('The day will have no word. Continue?')) ?>
      </div>
    <?php endif; ?>
  </section>

  <aside class="stack">
    <section class="panel liquid-glass">
      <h2><?= h(__('Fill missing days')) ?></h2>
      <p class="muted small">
        <?= $gap === null ? h(__('The schedule is complete for a year ahead.')) : h(__('First day without a word:')) . ' <b>' . h(fmt_date($gap)) . '</b>.' ?>
        <?= h(__('Free days get the words that are farthest from that day.')) ?>
      </p>
      <form method="post" class="form-row">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="fill_gaps">
        <label class="field grow"><span><?= h(__('Fill up to')) ?></span><input type="date" name="until" value="<?= add_days($today, 30) ?>" min="<?= $tomorrow ?>" max="<?= add_days($today, WORDLE_MAX_FILL_DAYS) ?>" required></label>
        <button class="btn btn-ghost" type="submit"><?= h(__('Fill')) ?></button>
      </form>
    </section>
  </aside>
</div>

<section class="panel liquid-glass">
  <div class="panel-head">
    <h2><?= h(__('Upcoming days')) ?></h2>
    <nav class="seg seg-sm" aria-label="<?= h(__('Range')) ?>">
      <?php foreach ([14, 30, 90] as $n): ?>
        <a href="wordle.php?days=<?= $n ?>"<?= $span === $n ? ' class="glass-pill is-active"' : '' ?>><?= h(fmt_days($n)) ?></a>
      <?php endforeach; ?>
    </nav>
  </div>
  <div class="table-wrap">
    <table class="table table-plan">
      <thead><tr><th><?= h(__('Day')) ?></th><th class="num">#</th><th><?= h(__('Word')) ?></th><th><?= h(__('Hint')) ?></th><th></th></tr></thead>
      <tbody>
      <?php for ($d = $today; $d <= $to; $d = add_days($d, 1)):
          $p = $schedule[$d] ?? null;
          $near = $repeats[$d] ?? null; ?>
        <tr class="<?= $d === $date ? 'row-current' : '' ?><?= $p ? '' : ' row-missing' ?>">
          <td class="nowrap">
            <?= h(fmt_date($d)) ?>
            <?= $d === $today ? '<span class="badge badge-accent">' . h(__('today')) . '</span>' : ($d === $tomorrow ? '<span class="badge">' . h(__('tomorrow')) . '</span>' : '') ?>
          </td>
          <td class="num muted"><?= puzzle_no_for($d) ?></td>
          <td><?= $p ? wordle_tiles($p['word'], 'sm') : '<span class="badge badge-bad">' . h(__('missing')) . '</span>' ?></td>
          <td class="hint-cell">
            <?= $p ? h($p['hint']) : '' ?>
            <?php if ($p && !$p['is_active']): ?><span class="badge badge-warn"><?= h(__('retired word')) ?></span><?php endif; ?>
            <?php if ($near !== null && $near < REPEAT_WARN_DAYS): ?><span class="badge badge-warn"><?= h(__('repeats after %s', fmt_days((int) $near))) ?></span><?php endif; ?>
          </td>
          <td class="actions">
            <?php if ($d === $today): ?>
              <span class="muted small"><?= h(__('locked')) ?></span>
            <?php else: ?>
              <a class="btn btn-ghost btn-sm" href="wordle.php?date=<?= $d ?><?= $span !== 30 ? '&amp;days=' . $span : '' ?>#day"><?= h($p ? __('Edit') : __('Fill in')) ?></a>
            <?php endif; ?>
          </td>
        </tr>
      <?php endfor; ?>
      </tbody>
    </table>
  </div>
</section>

<?php elseif ($view === 'words'):
    $words = wordle_words_with_usage();
    $active = count(array_filter($words, fn($w) => $w['is_active']));
?>
<section class="panel liquid-glass">
  <h2><?= h(__('Add a word')) ?></h2>
  <form method="post" class="form-row">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="add_word">
    <label class="field field-word"><span><?= h(__('Word')) ?></span><input class="mono upper" name="word" maxlength="5" minlength="5" pattern="[A-Za-z]{5}" required placeholder="LOOPS"></label>
    <label class="field grow"><span><?= h(__('Hint (in English, as in the game)')) ?></span><input name="hint" maxlength="255" required></label>
    <button class="btn btn-primary" type="submit"><?= h(__('Add')) ?></button>
  </form>
  <p class="muted small"><?= h(__('Programming terms only, exactly 5 letters A–Z. Players see the hint after clicking “Hint”.')) ?></p>
</section>

<section class="panel liquid-glass">
  <div class="panel-head">
    <h2><?= h(__('Word bank')) ?> <span class="muted">(<?= h(__('%d active of %d', $active, count($words))) ?>)</span></h2>
    <input type="search" class="filter" data-filter="#words-table" placeholder="<?= h(__('Search word or hint')) ?>" aria-label="<?= h(__('Search')) ?>">
  </div>
  <div class="table-wrap">
    <table class="table" id="words-table">
      <thead><tr><th><?= h(__('Word')) ?></th><th><?= h(__('Hint')) ?></th><th class="num"><?= h(__('Used')) ?></th><th><?= h(__('Last used')) ?></th><th><?= h(__('Next')) ?></th><th></th></tr></thead>
      <tbody>
      <?php foreach ($words as $w): ?>
        <tr class="<?= $w['is_active'] ? '' : 'row-off' ?>">
          <td><?= wordle_tiles($w['word'], 'sm') ?></td>
          <td class="hint-cell">
            <details class="inline-edit">
              <summary title="<?= h(__('Click to edit')) ?>"><?= h($w['hint']) ?></summary>
              <form method="post" class="form-row">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="update_hint">
                <input type="hidden" name="word_id" value="<?= (int) $w['id'] ?>">
                <input class="grow" name="hint" value="<?= h($w['hint']) ?>" maxlength="255" required aria-label="<?= h(__('Hint')) ?>">
                <button class="btn btn-primary btn-sm" type="submit"><?= h(__('Save')) ?></button>
              </form>
            </details>
          </td>
          <td class="num"><?= (int) $w['used'] ?>×</td>
          <td class="nowrap"><?= $w['last_used'] ? h(fmt_date($w['last_used'], false)) : '<span class="muted">' . h(__('never')) . '</span>' ?></td>
          <td class="nowrap"><?= $w['next_planned'] ? '<a href="wordle.php?date=' . h($w['next_planned']) . '#day">' . h(fmt_date($w['next_planned'], false)) . '</a>' : '<span class="muted">–</span>' ?></td>
          <td class="actions">
            <?= action_button('toggle_word', ['word_id' => $w['id']], h($w['is_active'] ? __('Retire') : __('Activate')), 'btn btn-ghost btn-sm') ?>
            <?= (int) $w['used'] === 0 ? action_button('delete_word', ['word_id' => $w['id']], h(__('Delete')), 'btn btn-danger btn-sm', __('Delete the word %s?', $w['word'])) : '' ?>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</section>

<?php else:
    $results = wordle_results(add_days($today, -29), $today);
?>
<section class="panel liquid-glass">
  <div class="panel-head"><h2><?= h(__('Last 30 days')) ?></h2></div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th><?= h(__('Day')) ?></th><th class="num">#</th><th><?= h(__('Word')) ?></th><th class="num"><?= h(__('Games')) ?></th><th><?= h(__('Wins')) ?></th><th class="num"><?= h(__('Avg. guesses')) ?></th><th class="num"><?= h(__('Hint used')) ?></th></tr></thead>
      <tbody>
      <?php foreach ($results as $r): $win = pct($r['won'], $r['won'] + $r['lost']); ?>
        <tr>
          <td class="nowrap"><?= h(fmt_date($r['puzzle_date'])) ?><?= $r['puzzle_date'] === $today ? ' <span class="badge badge-accent">' . h(__('in progress')) . '</span>' : '' ?></td>
          <td class="num muted"><?= (int) $r['puzzle_no'] ?></td>
          <td><?= wordle_tiles($r['word'], 'sm') ?></td>
          <td class="num"><?= (int) $r['plays'] ?></td>
          <td><span class="bar-inline"><?= bar($win, $win !== null && $win < 50 ? 'bad' : 'ok') ?><?= $win === null ? '–' : $win . ' %' ?></span></td>
          <td class="num"><?= fmt_num($r['avg_guesses'], 1) ?></td>
          <td class="num"><?= fmt_num(pct($r['hints'], $r['plays'])) ?> %</td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$results): ?><tr><td colspan="7" class="empty"><?= h(__('No puzzles in the last 30 days.')) ?></td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <p class="muted small"><?= __('Results come from the %s table, which fills in once the game is connected to the API.', '<code>wordle_plays</code>') ?></p>
</section>
<?php endif; ?>
<?php page_end();
