<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/content.php';
require_login();

$course = find_course(get_int('id'));
if (!$course) {
    flash('error', __('That course does not exist.'));
    redirect('courses.php');
}
$id = (int) $course['id'];
$self = 'course.php?id=' . $id;

/** The unit, if it belongs to this course. */
function course_unit(int $courseId, int $unitId): ?array
{
    $q = db()->prepare('SELECT * FROM units WHERE id = ? AND course_id = ?');
    $q->execute([$unitId, $courseId]);
    return $q->fetch() ?: null;
}

function course_lesson(int $courseId, int $lessonId): ?array
{
    $q = db()->prepare('SELECT l.* FROM lessons l JOIN units u ON u.id = l.unit_id WHERE l.id = ? AND u.course_id = ?');
    $q->execute([$lessonId, $courseId]);
    return $q->fetch() ?: null;
}

if (is_post()) {
    check_csrf();
    $action = $_POST['action'] ?? '';
    $anchor = '';

    switch ($action) {
        case 'save_course':
            $name = post_str('name');
            $slug = slugify(post_str('slug'));
            $desc = post_str('description');
            if ($name === '' || mb_strlen($name) > 64) { flash('error', __('The course name is required (at most 64 characters).')); break; }
            if ($slug === '' || strlen($slug) > 32) { flash('error', __('The slug must be 1–32 characters: a-z, 0-9 and hyphens.')); break; }
            if (mb_strlen($desc) > 500) { flash('error', __('The description can be at most 500 characters.')); break; }
            try {
                db()->prepare('UPDATE courses SET name = ?, slug = ?, description = ?, is_published = ?, sort_order = ? WHERE id = ?')
                    ->execute([$name, $slug, $desc !== '' ? $desc : null, isset($_POST['is_published']) ? 1 : 0, post_int('sort_order'), $id]);
                flash('ok', __('Course saved.'));
            } catch (PDOException $e) {
                if ($e->errorInfo[1] !== 1062) throw $e;
                flash('error', __('Another course already uses the slug “%s”.', $slug));
            }
            break;

        case 'delete_course':
            $q = db()->prepare('SELECT COUNT(*) FROM enrollments WHERE course_id = ?');
            $q->execute([$id]);
            if ((int) $q->fetchColumn() > 0) {
                flash('error', __('Learners are enrolled in this course and would lose their progress. Turn it back into a draft instead.'));
                break;
            }
            db()->prepare('DELETE FROM courses WHERE id = ?')->execute([$id]);
            flash('ok', __('Course “%s” deleted.', $course['name']));
            redirect('courses.php');

        case 'add_unit':
            $title = post_str('title');
            if ($title === '' || mb_strlen($title) > 120) { flash('error', __('The unit name is required (at most 120 characters).')); break; }
            db()->prepare('INSERT INTO units (course_id, position, title) VALUES (?, ?, ?)')
                ->execute([$id, next_position('units', $id), $title]);
            $anchor = '#unit-' . db()->lastInsertId();
            flash('ok', __('Unit “%s” added.', $title));
            break;

        case 'rename_unit':
            $unit = course_unit($id, post_int('unit_id'));
            $title = post_str('title');
            if (!$unit) break;
            if ($title === '' || mb_strlen($title) > 120) { flash('error', __('The unit name is required (at most 120 characters).')); break; }
            db()->prepare('UPDATE units SET title = ? WHERE id = ?')->execute([$title, $unit['id']]);
            $anchor = '#unit-' . $unit['id'];
            flash('ok', __('Unit renamed.'));
            break;

        case 'move_unit':
            if ($unit = course_unit($id, post_int('unit_id'))) {
                move_row('units', (int) $unit['id'], post_int('dir'));
                $anchor = '#unit-' . $unit['id'];
            }
            break;

        case 'delete_unit':
            if ($unit = course_unit($id, post_int('unit_id'))) {
                db()->beginTransaction();
                db()->prepare('DELETE FROM units WHERE id = ?')->execute([$unit['id']]);
                close_gap('units', $id, (int) $unit['position']);
                db()->commit();
                flash('ok', __('Unit “%s” deleted with its lessons.', $unit['title']));
            }
            break;

        case 'add_lesson':
            $unit = course_unit($id, post_int('unit_id'));
            $title = post_str('title');
            $kind = $_POST['kind'] ?? 'lesson';
            if (!$unit) break;
            $anchor = '#unit-' . $unit['id'];
            if ($title === '' || mb_strlen($title) > 120) { flash('error', __('The lesson name is required (at most 120 characters).')); break; }
            if (!isset(LESSON_KINDS[$kind])) $kind = 'lesson';
            $xp = max(0, min(1000, post_int('xp_reward', 20)));
            db()->prepare('INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$unit['id'], next_position('lessons', (int) $unit['id']), unique_lesson_slug((int) $unit['id'], slugify($title)), $title, $kind, $xp]);
            flash('ok', __('Lesson “%s” added.', $title));
            if (isset($_POST['open'])) redirect('lesson.php?id=' . db()->lastInsertId());
            break;

        case 'move_lesson':
            if ($lesson = course_lesson($id, post_int('lesson_id'))) {
                move_row('lessons', (int) $lesson['id'], post_int('dir'));
                $anchor = '#lesson-' . $lesson['id'];
            }
            break;
    }
    redirect($self . $anchor);
}

$units = db()->prepare('SELECT * FROM units WHERE course_id = ? ORDER BY position');
$units->execute([$id]);
$units = $units->fetchAll();

$lessonsByUnit = [];
foreach (course_lessons_with_stats($id) as $l) $lessonsByUnit[$l['unit_id']][] = $l;
$summary = course_summary($id);

page_start($course['name'], 'courses.php');
?>
<nav class="crumbs"><a href="courses.php"><?= h(__('Courses')) ?></a> › <span><?= h($course['name']) ?></span></nav>
<div class="page-head">
  <h1><?= h($course['name']) ?> <?= published_badge((bool) $course['is_published']) ?></h1>
  <div class="page-actions">
    <a class="btn btn-ghost" href="stats.php?course=<?= $id ?>"><?= h(__('Stats')) ?></a>
  </div>
</div>

<div class="grid grid-side">
  <div class="stack">
    <?php foreach ($units as $ui => $u):
        $ls = $lessonsByUnit[$u['id']] ?? [];
        $progressRows = array_sum(array_column($ls, 'started')); ?>
      <section class="panel liquid-glass unit" id="unit-<?= (int) $u['id'] ?>">
        <div class="unit-head">
          <span class="unit-no"><?= h(__('Unit %d', (int) $u['position'])) ?></span>
          <form method="post" class="unit-rename">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="rename_unit">
            <input type="hidden" name="unit_id" value="<?= (int) $u['id'] ?>">
            <input class="input-title" name="title" value="<?= h($u['title']) ?>" maxlength="120" required aria-label="<?= h(__('Unit name')) ?>">
            <button class="btn btn-ghost btn-sm save-on-change" type="submit"><?= h(__('Save')) ?></button>
          </form>
          <div class="unit-tools">
            <?= $ui > 0 ? action_button('move_unit', ['unit_id' => $u['id'], 'dir' => -1], '↑', 'btn btn-icon', '', __('Move unit up')) : '' ?>
            <?= $ui < count($units) - 1 ? action_button('move_unit', ['unit_id' => $u['id'], 'dir' => 1], '↓', 'btn btn-icon', '', __('Move unit down')) : '' ?>
            <?= action_button('delete_unit', ['unit_id' => $u['id']], h(__('Delete')), 'btn btn-danger btn-sm',
                __('Delete unit “%s” and all %d of its lessons?', $u['title'], count($ls)) .
                ($progressRows ? ' ' . __('Learner progress will be lost too (%d records).', $progressRows) : '')) ?>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table table-lessons">
            <thead><tr><th class="num">#</th><th><?= h(__('Lesson')) ?></th><th><?= h(__('Type')) ?></th><th class="num">XP</th><th><?= h(__('Quest')) ?></th><th class="num" title="<?= h(__('Started / completed')) ?>"><?= h(__('Progress')) ?></th><th></th></tr></thead>
            <tbody>
            <?php foreach ($ls as $li => $l): ?>
              <tr id="lesson-<?= (int) $l['id'] ?>" class="row-link">
                <td class="num muted"><?= (int) $l['position'] ?></td>
                <td><a href="lesson.php?id=<?= (int) $l['id'] ?>"><?= h($l['title']) ?></a> <span class="muted mono small"><?= h($l['slug']) ?></span></td>
                <td><?= kind_badge($l['kind']) ?></td>
                <td class="num"><?= (int) $l['xp_reward'] ?></td>
                <td><?= $l['has_quest'] ? '<span class="badge badge-ok">✓</span>' : (in_array($l['kind'], ['lesson', 'quest'], true) ? '<span class="badge badge-warn">' . h(__('missing')) . '</span>' : '<span class="muted">–</span>') ?></td>
                <td class="num"><?= (int) $l['started'] ?> / <?= (int) $l['completed'] ?></td>
                <td class="actions">
                  <?= $li > 0 ? action_button('move_lesson', ['lesson_id' => $l['id'], 'dir' => -1], '↑', 'btn btn-icon', '', __('Move up')) : '<span class="btn-icon-spacer"></span>' ?>
                  <?= $li < count($ls) - 1 ? action_button('move_lesson', ['lesson_id' => $l['id'], 'dir' => 1], '↓', 'btn btn-icon', '', __('Move down')) : '<span class="btn-icon-spacer"></span>' ?>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$ls): ?><tr><td colspan="7" class="empty"><?= h(__('This unit is empty.')) ?></td></tr><?php endif; ?>
            </tbody>
          </table>
        </div>

        <form method="post" class="form-row add-lesson">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="add_lesson">
          <input type="hidden" name="unit_id" value="<?= (int) $u['id'] ?>">
          <label class="field grow"><span><?= h(__('New lesson')) ?></span><input name="title" maxlength="120" required placeholder="<?= h(__('Lesson name')) ?>"></label>
          <label class="field"><span><?= h(__('Type')) ?></span>
            <select name="kind"><?php foreach (array_keys(LESSON_KINDS) as $k): ?><option value="<?= $k ?>"><?= h(kind_label($k)) ?></option><?php endforeach; ?></select>
          </label>
          <label class="field field-xs"><span>XP</span><input name="xp_reward" type="number" min="0" max="1000" value="20"></label>
          <button class="btn btn-ghost" type="submit"><?= h(__('Add')) ?></button>
          <button class="btn btn-ghost" type="submit" name="open" value="1"><?= h(__('Add and open')) ?></button>
        </form>
      </section>
    <?php endforeach; ?>

    <section class="panel liquid-glass">
      <h2><?= h(__('New unit')) ?></h2>
      <form method="post" class="form-row">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="add_unit">
        <label class="field grow"><span><?= h(__('Name')) ?></span><input name="title" maxlength="120" required placeholder="Loops"></label>
        <button class="btn btn-primary" type="submit"><?= h(__('Add unit')) ?></button>
      </form>
    </section>
  </div>

  <aside class="stack sticky-side">
    <section class="panel liquid-glass">
      <h2><?= h(__('Course settings')) ?></h2>
      <form method="post" class="stack">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="save_course">
        <label class="field"><span><?= h(__('Name')) ?></span><input name="name" value="<?= h($course['name']) ?>" maxlength="64" required></label>
        <label class="field"><span><?= h(__('Slug')) ?></span><input class="mono" name="slug" value="<?= h($course['slug']) ?>" maxlength="32" pattern="[a-z0-9-]+" required></label>
        <label class="field"><span><?= h(__('Description')) ?></span><textarea name="description" rows="3" maxlength="500"><?= h($course['description']) ?></textarea></label>
        <label class="field field-xs"><span><?= h(__('Menu order')) ?></span><input name="sort_order" type="number" value="<?= (int) $course['sort_order'] ?>"></label>
        <label class="check"><input type="checkbox" name="is_published" value="1"<?= $course['is_published'] ? ' checked' : '' ?>> <?= h(__('Published (learners can see it)')) ?></label>
        <button class="btn btn-primary" type="submit"><?= h(__('Save course')) ?></button>
      </form>
    </section>

    <section class="panel liquid-glass">
      <h2><?= h(__('Learners')) ?></h2>
      <div class="tiles-stats tiles-stats-2">
        <div class="stat"><b><?= (int) $summary['enrolled'] ?></b><span><?= h(__('enrolled')) ?></span></div>
        <div class="stat"><b><?= fmt_num($summary['avg_level'], 1) ?></b><span><?= h(__('avg. placement level')) ?></span></div>
      </div>
    </section>

    <section class="panel liquid-glass panel-danger">
      <h2><?= h(__('Delete course')) ?></h2>
      <p class="muted small"><?= h(__('Deletes the course with its units, lessons and quests. A course with enrolled learners cannot be deleted.')) ?></p>
      <?= action_button('delete_course', [], h(__('Delete course')), 'btn btn-danger', __('Really delete course “%s” and all of its content? This cannot be undone.', $course['name'])) ?>
    </section>
  </aside>
</div>
<?php page_end();
