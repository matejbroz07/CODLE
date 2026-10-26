<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/content.php';
require __DIR__ . '/lib/wordle.php';
require_login();

$today = today();
$tomorrow = add_days($today, 1);
$todayPuzzle = wordle_puzzle($today);
$tomorrowPuzzle = wordle_puzzle($tomorrow);
$gap = wordle_first_gap($tomorrow);
$plannedDays = $gap === null ? WORDLE_MAX_FILL_DAYS : (int) (new DateTimeImmutable($tomorrow))->diff(new DateTimeImmutable($gap))->days;

$counts = db()->query("
    SELECT (SELECT COUNT(*) FROM courses) AS courses,
           (SELECT COUNT(*) FROM courses WHERE is_published = 1) AS published,
           (SELECT COUNT(*) FROM units) AS units,
           (SELECT COUNT(*) FROM lessons) AS lessons,
           (SELECT COUNT(*) FROM quests) AS quests,
           (SELECT COUNT(*) FROM lessons l LEFT JOIN quests q ON q.lesson_id = l.id
             WHERE l.kind IN ('lesson','quest') AND q.id IS NULL) AS lessons_without_quest,
           (SELECT COUNT(*) FROM users) AS users,
           (SELECT COUNT(*) FROM enrollments) AS enrollments,
           (SELECT COUNT(*) FROM wordle_words WHERE is_active = 1) AS words
")->fetch();

$todayPlays = $todayPuzzle ? (wordle_results($today, $today)[0] ?? null) : null;

page_start(__('Overview'), 'index.php');
?>
<div class="page-head">
  <h1><?= h(__('Overview')) ?></h1>
  <p class="muted"><?= h(fmt_date($today)) ?></p>
</div>

<div class="grid grid-2">
  <section class="panel liquid-glass<?= $tomorrowPuzzle ? '' : ' panel-warn' ?>">
    <div class="panel-head">
      <h2><?= h(__('Tomorrow’s Wordle')) ?></h2>
      <span class="muted"><?= h(fmt_date($tomorrow)) ?> · #<?= puzzle_no_for($tomorrow) ?></span>
    </div>
    <?php if ($tomorrowPuzzle): ?>
      <?= wordle_tiles($tomorrowPuzzle['word'], 'lg') ?>
      <p class="hint-text"><?= h($tomorrowPuzzle['hint']) ?></p>
      <a class="btn btn-ghost" href="wordle.php?date=<?= $tomorrow ?>"><?= h(__('Change')) ?></a>
    <?php else: ?>
      <?= wordle_tiles(null, 'lg') ?>
      <p><b><?= h(__('Tomorrow is not ready yet.')) ?></b> <?= h(__('Without a word, players will have nothing to guess.')) ?></p>
      <a class="btn btn-primary" href="wordle.php?date=<?= $tomorrow ?>"><?= h(__('Prepare tomorrow')) ?></a>
    <?php endif; ?>
  </section>

  <section class="panel liquid-glass">
    <div class="panel-head"><h2><?= h(__('Wordle schedule')) ?></h2></div>
    <dl class="kv">
      <dt><?= h(__('Today')) ?></dt>
      <dd><?= $todayPuzzle ? h($todayPuzzle['word']) . ' · #' . $todayPuzzle['puzzle_no'] : '<span class="text-bad">' . h(__('no word')) . '</span>' ?></dd>
      <dt><?= h(__('Planned ahead')) ?></dt>
      <dd class="<?= $plannedDays < 7 ? 'text-bad' : '' ?>">
        <?= h(fmt_days($plannedDays)) ?><?= $gap !== null ? ' (' . h(__('first free day %s', fmt_date($gap, false))) . ')' : '' ?>
      </dd>
      <dt><?= h(__('Active words')) ?></dt>
      <dd><?= (int) $counts['words'] ?></dd>
      <dt><?= h(__('Played today')) ?></dt>
      <dd><?= $todayPlays && $todayPlays['plays'] ? h(__('%d games, %s%% won', (int) $todayPlays['plays'], fmt_num(pct($todayPlays['won'], $todayPlays['plays'])))) : h(__('nobody yet')) ?></dd>
    </dl>
    <a class="btn btn-ghost" href="wordle.php"><?= h(__('Open schedule')) ?></a>
  </section>
</div>

<section class="panel liquid-glass">
  <div class="panel-head"><h2><?= h(__('Content')) ?></h2><a class="btn btn-ghost btn-sm" href="courses.php"><?= h(__('Courses')) ?></a></div>
  <div class="tiles-stats">
    <div class="stat"><b><?= (int) $counts['courses'] ?></b><span><?= h(__('courses (%d published)', (int) $counts['published'])) ?></span></div>
    <div class="stat"><b><?= (int) $counts['units'] ?></b><span><?= h(__('units')) ?></span></div>
    <div class="stat"><b><?= (int) $counts['lessons'] ?></b><span><?= h(__('lessons')) ?></span></div>
    <div class="stat"><b><?= (int) $counts['quests'] ?></b><span><?= h(__('editor quests')) ?></span></div>
    <div class="stat<?= $counts['lessons_without_quest'] ? ' stat-warn' : '' ?>"><b><?= (int) $counts['lessons_without_quest'] ?></b><span><?= h(__('lessons without a quest')) ?></span></div>
    <div class="stat"><b><?= (int) $counts['users'] ?></b><span><?= h(__('users, %d enrolments', (int) $counts['enrollments'])) ?></span></div>
  </div>
</section>

<section class="panel liquid-glass">
  <div class="panel-head"><h2><?= h(__('Courses')) ?></h2></div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th><?= h(__('Course')) ?></th><th><?= h(__('Status')) ?></th><th class="num"><?= h(__('Lessons')) ?></th><th class="num"><?= h(__('Quests')) ?></th><th class="num"><?= h(__('Learners')) ?></th><th></th></tr></thead>
      <tbody>
      <?php foreach (db()->query("
          SELECT c.id, c.name, c.slug, c.is_published,
                 (SELECT COUNT(*) FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = c.id) AS lessons,
                 (SELECT COUNT(*) FROM quests q JOIN lessons l ON l.id = q.lesson_id JOIN units u ON u.id = l.unit_id WHERE u.course_id = c.id) AS quests,
                 (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS learners
          FROM courses c ORDER BY c.sort_order, c.id") as $c): ?>
        <tr class="row-link">
          <td><a href="course.php?id=<?= (int) $c['id'] ?>"><b><?= h($c['name']) ?></b></a> <span class="muted mono small"><?= h($c['slug']) ?></span></td>
          <td><?= published_badge((bool) $c['is_published']) ?></td>
          <td class="num"><?= (int) $c['lessons'] ?></td>
          <td class="num"><?= (int) $c['quests'] ?></td>
          <td class="num"><?= (int) $c['learners'] ?></td>
          <td class="actions"><a class="btn btn-ghost btn-sm" href="stats.php?course=<?= (int) $c['id'] ?>"><?= h(__('Stats')) ?></a></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</section>
<?php page_end();
