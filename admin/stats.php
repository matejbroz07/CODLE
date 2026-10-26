<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/content.php';
require_login();

const MIN_SAMPLE = 5;                     // lessons with fewer starts are not ranked as "hardest"

$courses = all_courses();
$course = find_course(get_int('course', (int) ($courses[0]['id'] ?? 0)));

page_start(__('Stats'), 'stats.php');
?>
<div class="page-head">
  <h1><?= h(__('Level stats')) ?></h1>
  <nav class="seg" aria-label="<?= h(__('Course')) ?>">
    <?php foreach ($courses as $c): $on = $course && (int) $c['id'] === (int) $course['id']; ?>
      <a href="stats.php?course=<?= (int) $c['id'] ?>"<?= $on ? ' class="glass-pill is-active" aria-current="page"' : '' ?>><?= h($c['name']) ?></a>
    <?php endforeach; ?>
  </nav>
</div>
<?php
if (!$course) {
    echo '<section class="panel liquid-glass"><p class="empty">' . h(__('No courses yet.')) . '</p></section>';
    page_end();
    exit;
}

$lessons = course_lessons_with_stats((int) $course['id']);
$summary = course_summary((int) $course['id']);
$totalStarted = array_sum(array_column($lessons, 'started'));
$totalCompleted = array_sum(array_column($lessons, 'completed'));
$maxStarted = max([1, ...array_map('intval', array_column($lessons, 'started'))]);
$maxHere = max([1, ...array_map('intval', array_column($lessons, 'here'))]);

// Hardest = lowest completion rate among lessons with enough starts.
$hardestId = null;
$hardestRate = 101;
foreach ($lessons as $l) {
    if ($l['started'] < MIN_SAMPLE) continue;
    $rate = pct($l['completed'], $l['started']);
    if ($rate < $hardestRate) { $hardestRate = $rate; $hardestId = (int) $l['id']; }
}
?>
<section class="panel liquid-glass">
  <div class="tiles-stats">
    <div class="stat"><b><?= (int) $summary['enrolled'] ?></b><span><?= h(__('enrolled learners')) ?></span></div>
    <div class="stat"><b><?= (int) $summary['not_started'] ?></b><span><?= h(__('without a started lesson')) ?></span></div>
    <div class="stat"><b><?= fmt_num($summary['avg_level'], 1) ?></b><span><?= h(__('avg. placement level (1–5)')) ?></span></div>
    <div class="stat"><b><?= $totalCompleted ?></b><span><?= h(__('lessons completed')) ?></span></div>
    <div class="stat"><b><?= fmt_num(pct($totalCompleted, $totalStarted)) ?> %</b><span><?= h(__('avg. completion rate')) ?></span></div>
  </div>
</section>

<?php if ($totalStarted === 0 && (int) $summary['enrolled'] === 0): ?>
  <div class="flash flash-info"><?= h(__('There is no progress data in the database yet. The app currently keeps progress in the browser only; stats will fill in once the app is connected to the API.')) ?></div>
<?php endif; ?>

<section class="panel liquid-glass">
  <div class="panel-head">
    <h2><?= h(__('%s: lessons in order', $course['name'])) ?></h2>
    <span class="muted small"><?= h(__('“Currently here” = learners whose Continue button points to this lesson.')) ?></span>
  </div>
  <div class="table-wrap">
    <table class="table table-stats">
      <thead>
        <tr>
          <th><?= h(__('Lesson')) ?></th><th><?= h(__('Type')) ?></th>
          <th class="num"><?= h(__('Started')) ?></th><th class="num"><?= h(__('Completed')) ?></th><th><?= h(__('Completion')) ?></th>
          <th class="num"><?= h(__('Avg. attempts')) ?></th><th class="num"><?= h(__('Avg. time')) ?></th><th class="num"><?= h(__('Avg. score')) ?></th>
          <th><?= h(__('Currently here')) ?></th>
        </tr>
      </thead>
      <tbody>
      <?php $unit = null; foreach ($lessons as $l):
          if ($unit !== $l['unit_id']): $unit = $l['unit_id']; ?>
          <tr class="row-group"><td colspan="9"><?= h(__('Unit %d', (int) $l['unit_position'])) ?>: <?= h($l['unit_title']) ?></td></tr>
        <?php endif;
          $rate = pct($l['completed'], $l['started']); ?>
        <tr class="row-link<?= (int) $l['id'] === $hardestId ? ' row-flag' : '' ?>">
          <td>
            <a href="lesson.php?id=<?= (int) $l['id'] ?>"><?= (int) $l['position'] ?>. <?= h($l['title']) ?></a>
            <?php if ((int) $l['id'] === $hardestId): ?><span class="badge badge-bad" title="<?= h(__('Lowest completion rate in the course (at least %d learners)', MIN_SAMPLE)) ?>"><?= h(__('hardest')) ?></span><?php endif; ?>
          </td>
          <td><?= kind_badge($l['kind']) ?></td>
          <td class="num"><span class="bar-inline"><?= bar(100 * $l['started'] / $maxStarted, 'dim') ?><?= (int) $l['started'] ?></span></td>
          <td class="num"><?= (int) $l['completed'] ?></td>
          <td><span class="bar-inline"><?= bar($rate, $rate !== null && $rate < 50 ? 'bad' : 'ok') ?><?= $rate === null ? '–' : $rate . ' %' ?></span></td>
          <td class="num"><?= fmt_num($l['avg_attempts'], 1) ?></td>
          <td class="num"><?= fmt_duration($l['avg_secs'] !== null ? (float) $l['avg_secs'] : null) ?></td>
          <td class="num"><?= fmt_num($l['avg_score']) ?></td>
          <td><span class="bar-inline"><?= bar(100 * $l['here'] / $maxHere, 'accent') ?><?= (int) $l['here'] ?></span></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$lessons): ?><tr><td colspan="9" class="empty"><?= h(__('This course has no lessons.')) ?></td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</section>
<?php page_end();
