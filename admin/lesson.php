<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/content.php';
require_login();

const MAX_OBJECTIVES = 16;                // quest_saves.objectives_done is a 16-bit mask

function load_lesson(int $id): ?array
{
    $q = db()->prepare('
        SELECT l.*, u.title AS unit_title, u.position AS unit_position, u.course_id,
               c.name AS course_name
        FROM lessons l JOIN units u ON u.id = l.unit_id JOIN courses c ON c.id = u.course_id
        WHERE l.id = ?');
    $q->execute([$id]);
    return $q->fetch() ?: null;
}

$lesson = load_lesson(get_int('id'));
if (!$lesson) {
    flash('error', __('That lesson does not exist.'));
    redirect('courses.php');
}
$id = (int) $lesson['id'];
$courseId = (int) $lesson['course_id'];
$self = 'lesson.php?id=' . $id;

$quest = find_quest($id);
$questForm = null;           // posted quest values when saving failed
$questErrors = [];

/** Reads the quest editor form. Returns [values, errors]. */
function read_quest_form(): array
{
    $f = [
        'title'            => post_str('q_title'),
        'description_html' => post_str('q_desc'),
        'files'            => [],
        'objectives'       => [],
    ];
    foreach (array_keys(LANGS) as $lang) {
        $v = $_POST['starter_' . $lang] ?? '';
        $f['files'][$lang] = is_string($v) ? str_replace("\r\n", "\n", $v) : '';
    }
    $langs = (array) ($_POST['obj_lang'] ?? []);
    foreach ($langs as $i => $lang) {
        $f['objectives'][] = [
            'position'  => count($f['objectives']) + 1,
            'language'  => isset(LANGS[$lang]) ? $lang : 'html',
            'text_html' => trim(str_replace("\r\n", "\n", (string) ($_POST['obj_text'][$i] ?? ''))),
            'hint_html' => trim(str_replace("\r\n", "\n", (string) ($_POST['obj_hint'][$i] ?? ''))),
            'check_js'  => trim(str_replace("\r\n", "\n", (string) ($_POST['obj_check'][$i] ?? ''))),
        ];
    }

    $e = [];
    if ($f['title'] === '' || mb_strlen($f['title']) > 120) $e[] = __('The quest title is required (at most 120 characters).');
    if ($f['description_html'] === '') $e[] = __('Fill in the quest description.');
    if (!$f['objectives']) $e[] = __('A quest needs at least one objective.');
    if (count($f['objectives']) > MAX_OBJECTIVES) $e[] = __('A quest can have at most %d objectives.', MAX_OBJECTIVES);
    foreach ($f['objectives'] as $o) {
        $n = $o['position'];
        if ($o['text_html'] === '' || mb_strlen($o['text_html']) > 1000) $e[] = __('Objective %d: the text is required (at most 1000 characters).', $n);
        if (mb_strlen($o['hint_html']) > 2000) $e[] = __('Objective %d: the hint can be at most 2000 characters.', $n);
        if ($o['check_js'] === '') $e[] = __('Objective %d: the check (JS) is missing.', $n);
    }
    return [$f, $e];
}

if (is_post()) {
    check_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'save_lesson') {
        $title = post_str('title');
        $kind = $_POST['kind'] ?? '';
        $unitId = post_int('unit_id');
        $slug = slugify(post_str('slug') !== '' ? post_str('slug') : $title);
        $target = db()->prepare('SELECT id FROM units WHERE id = ? AND course_id = ?');
        $target->execute([$unitId, $courseId]);

        if ($title === '' || mb_strlen($title) > 120) {
            flash('error', __('The lesson name is required (at most 120 characters).'));
        } elseif (!isset(LESSON_KINDS[$kind]) || !$target->fetchColumn()) {
            flash('error', __('Invalid type or unit.'));
        } else {
            $dup = db()->prepare('SELECT 1 FROM lessons WHERE unit_id = ? AND slug = ? AND id <> ?');
            $dup->execute([$unitId, $slug, $id]);
            if ($dup->fetchColumn()) {
                flash('error', __('The target unit already has a lesson with the slug “%s”.', $slug));
            } else {
                $pdo = db();
                $pdo->beginTransaction();
                if ($unitId !== (int) $lesson['unit_id']) {
                    // Move to the end of the other unit, then close the gap in the old one.
                    $pdo->prepare('UPDATE lessons SET unit_id = ?, position = ? WHERE id = ?')
                        ->execute([$unitId, next_position('lessons', $unitId), $id]);
                    close_gap('lessons', (int) $lesson['unit_id'], (int) $lesson['position']);
                }
                $pdo->prepare('UPDATE lessons SET title = ?, slug = ?, kind = ?, xp_reward = ? WHERE id = ?')
                    ->execute([$title, $slug, $kind, max(0, min(1000, post_int('xp_reward'))), $id]);
                $pdo->commit();
                flash('ok', __('Lesson saved.'));
            }
        }
        redirect($self);
    }

    if ($action === 'delete_lesson') {
        $pdo = db();
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM lessons WHERE id = ?')->execute([$id]);
        close_gap('lessons', (int) $lesson['unit_id'], (int) $lesson['position']);
        $pdo->commit();
        flash('ok', __('Lesson “%s” deleted.', $lesson['title']));
        redirect('course.php?id=' . $courseId . '#unit-' . $lesson['unit_id']);
    }

    if ($action === 'delete_quest' && $quest) {
        db()->prepare('DELETE FROM quests WHERE id = ?')->execute([$quest['id']]);
        flash('ok', __('Quest deleted.'));
        redirect($self);
    }

    if ($action === 'save_quest') {
        [$questForm, $questErrors] = read_quest_form();
        if (!$questErrors) {
            $pdo = db();
            $pdo->beginTransaction();
            if ($quest) {
                $questId = (int) $quest['id'];
                $pdo->prepare('UPDATE quests SET title = ?, description_html = ? WHERE id = ?')
                    ->execute([$questForm['title'], $questForm['description_html'], $questId]);
            } else {
                $pdo->prepare('INSERT INTO quests (lesson_id, title, description_html) VALUES (?, ?, ?)')
                    ->execute([$id, $questForm['title'], $questForm['description_html']]);
                $questId = (int) $pdo->lastInsertId();
            }
            $file = $pdo->prepare('INSERT INTO quest_files (quest_id, language, starter) VALUES (?, ?, ?)
                                   ON DUPLICATE KEY UPDATE starter = VALUES(starter)');
            foreach ($questForm['files'] as $lang => $code) $file->execute([$questId, $lang, $code]);

            // Objectives are replaced as a whole; learners' progress is stored by position.
            $pdo->prepare('DELETE FROM quest_objectives WHERE quest_id = ?')->execute([$questId]);
            $obj = $pdo->prepare('INSERT INTO quest_objectives (quest_id, position, language, text_html, hint_html, check_js) VALUES (?, ?, ?, ?, ?, ?)');
            foreach ($questForm['objectives'] as $o) {
                $obj->execute([$questId, $o['position'], $o['language'], $o['text_html'], $o['hint_html'] !== '' ? $o['hint_html'] : null, $o['check_js']]);
            }
            $pdo->commit();
            flash('ok', $quest ? __('Quest saved.') : __('Quest created.'));
            redirect($self . '#quest');
        }
        http_response_code(422);
    }
}

$units = db()->prepare('SELECT id, position, title FROM units WHERE course_id = ? ORDER BY position');
$units->execute([$courseId]);
$units = $units->fetchAll();

$stats = course_lessons_with_stats($courseId, $id)[0] ?? null;
$objStats = $quest ? quest_objective_stats((int) $quest['id']) : [];
$saveSummary = $quest ? quest_save_summary((int) $quest['id']) : null;

// What the quest editor shows: posted values after a failed save, the saved quest, or a blank one.
$qf = $questForm ?? $quest ?? [
    'title' => $lesson['title'],
    'description_html' => '',
    'files' => ['html' => '', 'css' => '', 'js' => ''],
    'objectives' => [],
];
$showQuest = $quest || $questForm || in_array($lesson['kind'], ['lesson', 'quest'], true);

page_start($lesson['title'], 'courses.php');
?>
<nav class="crumbs">
  <a href="courses.php"><?= h(__('Courses')) ?></a> ›
  <a href="course.php?id=<?= $courseId ?>"><?= h($lesson['course_name']) ?></a> ›
  <a href="course.php?id=<?= $courseId ?>#unit-<?= (int) $lesson['unit_id'] ?>"><?= h(__('Unit %d', (int) $lesson['unit_position'])) ?>: <?= h($lesson['unit_title']) ?></a> ›
  <span><?= h(__('Lesson %d', (int) $lesson['position'])) ?></span>
</nav>
<div class="page-head">
  <h1><?= h($lesson['title']) ?> <?= kind_badge($lesson['kind']) ?></h1>
</div>

<div class="grid grid-2">
  <section class="panel liquid-glass">
    <h2><?= h(__('Lesson settings')) ?></h2>
    <form method="post" class="stack">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="save_lesson">
      <label class="field"><span><?= h(__('Name')) ?></span><input name="title" value="<?= h($lesson['title']) ?>" maxlength="120" required></label>
      <div class="form-row">
        <label class="field grow"><span><?= h(__('Slug')) ?></span><input class="mono" name="slug" value="<?= h($lesson['slug']) ?>" maxlength="64" pattern="[a-z0-9-]+"></label>
        <label class="field"><span><?= h(__('Type')) ?></span>
          <select name="kind"><?php foreach (array_keys(LESSON_KINDS) as $k): ?><option value="<?= $k ?>"<?= $k === $lesson['kind'] ? ' selected' : '' ?>><?= h(kind_label($k)) ?></option><?php endforeach; ?></select>
        </label>
        <label class="field field-xs"><span>XP</span><input name="xp_reward" type="number" min="0" max="1000" value="<?= (int) $lesson['xp_reward'] ?>"></label>
      </div>
      <label class="field"><span><?= h(__('Unit')) ?></span>
        <select name="unit_id">
          <?php foreach ($units as $u): ?>
            <option value="<?= (int) $u['id'] ?>"<?= (int) $u['id'] === (int) $lesson['unit_id'] ? ' selected' : '' ?>><?= (int) $u['position'] ?>. <?= h($u['title']) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <p class="muted small"><?= h(__('Moving the lesson to another unit puts it at the end of that unit.')) ?></p>
      <button class="btn btn-primary" type="submit"><?= h(__('Save lesson')) ?></button>
    </form>
  </section>

  <section class="panel liquid-glass">
    <h2><?= h(__('Stats')) ?></h2>
    <?php if ($stats && $stats['started'] > 0): ?>
      <div class="tiles-stats">
        <div class="stat"><b><?= (int) $stats['started'] ?></b><span><?= h(__('started')) ?></span></div>
        <div class="stat"><b><?= (int) $stats['completed'] ?></b><span><?= h(__('completed')) ?></span></div>
        <div class="stat"><b><?= fmt_num(pct($stats['completed'], $stats['started'])) ?> %</b><span><?= h(__('completion rate')) ?></span></div>
        <div class="stat"><b><?= (int) $stats['here'] ?></b><span><?= h(__('currently here')) ?></span></div>
        <div class="stat"><b><?= fmt_num($stats['avg_attempts'], 1) ?></b><span><?= h(__('avg. attempts')) ?></span></div>
        <div class="stat"><b><?= fmt_duration($stats['avg_secs'] !== null ? (float) $stats['avg_secs'] : null) ?></b><span><?= h(__('avg. time to finish')) ?></span></div>
        <?php if ($stats['avg_score'] !== null): ?><div class="stat"><b><?= fmt_num($stats['avg_score']) ?></b><span><?= h(__('avg. score')) ?></span></div><?php endif; ?>
      </div>
    <?php else: ?>
      <p class="empty"><?= h(__('Nobody has started this lesson yet.')) ?><?= $stats && $stats['here'] ? ' ' . h(__('%d learners are waiting for it.', (int) $stats['here'])) : '' ?></p>
    <?php endif; ?>
    <?php if ($saveSummary && $saveSummary['saves']): ?>
      <h3><?= h(__('Editor quest')) ?></h3>
      <p class="muted small"><?= h(__('%d saved solutions, %d finished. Last saved %s.', (int) $saveSummary['saves'], (int) $saveSummary['completed'], fmt_datetime($saveSummary['last_save']))) ?></p>
      <ul class="obj-stats">
        <?php foreach ($quest['objectives'] as $o): $s = $objStats[(int) $o['position']] ?? ['passed' => 0, 'saves' => 0]; $p = pct((float) $s['passed'], (float) $s['saves']); ?>
          <li>
            <span class="obj-stats-label"><b><?= (int) $o['position'] ?>.</b> <?= h(strip_tags($o['text_html'])) ?></span>
            <?= bar($p, $p !== null && $p < 50 ? 'bad' : 'ok') ?>
            <span class="num"><?= fmt_num($p) ?> %</span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </section>
</div>

<?php if ($showQuest): ?>
<section class="panel liquid-glass" id="quest">
  <div class="panel-head">
    <h2><?= h($quest ? __('Editor quest') : __('New editor quest')) ?></h2>
    <?php if ($quest): ?>
      <?= action_button('delete_quest', [], h(__('Delete quest')), 'btn btn-danger btn-sm', __('Delete the quest including learners’ saved solutions?')) ?>
    <?php endif; ?>
  </div>

  <?php if ($questErrors): ?>
    <div class="flash flash-error" role="alert"><b><?= h(__('The quest was not saved:')) ?></b><ul><?php foreach ($questErrors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?></ul></div>
  <?php endif; ?>
  <?php if (!$quest && !$questForm): ?>
    <p class="muted"><?= h(__('This lesson has no quest yet. Fill in the description, starter code and objectives, then save.')) ?></p>
  <?php endif; ?>

  <form method="post" class="stack quest-form" id="quest-form" data-dirty-guard>
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save_quest">

    <label class="field"><span><?= h(__('Quest title')) ?></span><input name="q_title" value="<?= h($qf['title']) ?>" maxlength="120" required></label>
    <label class="field"><span><?= h(__('Description (HTML)')) ?></span><textarea class="code" name="q_desc" rows="5" required><?= h($qf['description_html']) ?></textarea></label>

    <div class="field">
      <span><?= h(__('Starter code')) ?></span>
      <div class="code-tabs" data-tabs>
        <div class="tab-list" role="tablist">
          <?php $first = true; foreach (LANGS as $lang => $label): ?>
            <button type="button" role="tab" class="tab<?= $first ? ' glass-pill is-active' : '' ?>" data-tab="starter-<?= $lang ?>"><?= $label ?></button>
          <?php $first = false; endforeach; ?>
        </div>
        <?php $first = true; foreach (LANGS as $lang => $label): ?>
          <textarea class="code tab-panel<?= $first ? ' is-active' : '' ?>" id="starter-<?= $lang ?>" name="starter_<?= $lang ?>" rows="14" spellcheck="false" data-lang="<?= $lang ?>"><?= h($qf['files'][$lang] ?? '') ?></textarea>
        <?php $first = false; endforeach; ?>
      </div>
    </div>

    <div class="field">
      <span><?= h(__('Objectives')) ?></span>
      <p class="muted small"><?= __('The check is the body of %s. It returns true or false and runs in the preview after the code loads.', '<code>function (doc) { … }</code>') ?></p>
      <ol class="objectives" id="objectives">
        <?php foreach ($qf['objectives'] as $o): ?>
          <?php include __DIR__ . '/lib/objective-row.php'; ?>
        <?php endforeach; ?>
      </ol>
      <template id="objective-template">
        <?php $o = ['language' => 'html', 'text_html' => '', 'hint_html' => '', 'check_js' => "const el = doc.querySelector(\"h1\");\nreturn !!el;"]; include __DIR__ . '/lib/objective-row.php'; ?>
      </template>
      <button class="btn btn-ghost btn-dashed" type="button" id="add-objective">+ <?= h(__('Add objective')) ?></button>
      <?php if ($quest && $saveSummary && $saveSummary['saves']): ?>
        <p class="muted small"><?= h(__('Careful: learner progress is stored by objective order. Reordering or removing objectives shifts the objectives they have already completed.')) ?></p>
      <?php endif; ?>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" type="submit"><?= h($quest ? __('Save quest') : __('Create quest')) ?></button>
      <a class="btn btn-ghost" href="#tester"><?= h(__('Test objectives')) ?> ↓</a>
    </div>
  </form>
</section>

<section class="panel liquid-glass" id="tester" data-quest-key="<?= $quest ? 'q' . (int) $quest['id'] : 'l' . $id ?>">
  <div class="panel-head">
    <h2><?= h(__('Objective test')) ?></h2>
    <button class="btn btn-primary" type="button" id="run-tests"><?= h(__('Run test')) ?></button>
  </div>
  <p class="muted small">
    <?= h(__('The checks run against the starter code (objectives should fail) and against your test solution (all of them should pass). The current form content is tested, even unsaved. The solution is only stored in this browser.')) ?>
  </p>
  <div class="grid grid-2">
    <div class="field">
      <span><?= h(__('Test solution')) ?> <button type="button" class="link-btn" id="copy-starter"><?= h(__('copy the starter code')) ?></button></span>
      <div class="code-tabs" data-tabs>
        <div class="tab-list" role="tablist">
          <?php $first = true; foreach (LANGS as $lang => $label): ?>
            <button type="button" role="tab" class="tab<?= $first ? ' glass-pill is-active' : '' ?>" data-tab="solution-<?= $lang ?>"><?= $label ?></button>
          <?php $first = false; endforeach; ?>
        </div>
        <?php $first = true; foreach (LANGS as $lang => $label): ?>
          <textarea class="code tab-panel<?= $first ? ' is-active' : '' ?>" id="solution-<?= $lang ?>" rows="14" spellcheck="false" data-lang="<?= $lang ?>"></textarea>
        <?php $first = false; endforeach; ?>
      </div>
    </div>
    <div class="field">
      <span><?= h(__('Solution preview')) ?></span>
      <iframe class="preview" id="preview-solution" title="<?= h(__('Solution preview')) ?>" sandbox="allow-scripts allow-modals"></iframe>
      <iframe class="preview-hidden" id="preview-starter" title="<?= h(__('Starter code (hidden run)')) ?>" sandbox="allow-scripts" aria-hidden="true" tabindex="-1"></iframe>
    </div>
  </div>
  <div class="table-wrap">
    <table class="table test-results" id="test-results" hidden>
      <thead><tr><th class="num">#</th><th><?= h(__('Objective')) ?></th><th><?= h(__('Starter code')) ?></th><th><?= h(__('Solution')) ?></th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
  <pre class="console" id="test-console" hidden></pre>
</section>
<?php else: ?>
<section class="panel liquid-glass">
  <h2><?= h(__('Lesson content')) ?></h2>
  <p class="muted"><?= h(__('Lessons of type “%s” use quiz questions. The admin cannot edit those yet.', kind_label($lesson['kind']))) ?></p>
</section>
<?php endif; ?>

<section class="panel liquid-glass panel-danger">
  <h2><?= h(__('Delete lesson')) ?></h2>
  <p class="muted small"><?= h(__('Deletes the lesson, its quest and learner progress in it.')) ?></p>
  <?= action_button('delete_lesson', [], h(__('Delete lesson')), 'btn btn-danger',
      __('Delete lesson “%s”?', $lesson['title']) . ($stats && $stats['started'] ? ' ' . __('%d learners will lose their progress.', (int) $stats['started']) : '')) ?>
</section>
<?php page_end();
