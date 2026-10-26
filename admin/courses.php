<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/content.php';
require_login();

if (is_post()) {
    check_csrf();
    if (($_POST['action'] ?? '') === 'create_course') {
        $name = post_str('name');
        $slug = slugify(post_str('slug') !== '' ? post_str('slug') : $name);
        if ($name === '' || mb_strlen($name) > 64) {
            flash('error', __('The course name is required (at most 64 characters).'));
        } elseif ($slug === '' || strlen($slug) > 32) {
            flash('error', __('The slug must be 1–32 characters: a-z, 0-9 and hyphens.'));
        } else {
            try {
                $order = (int) db()->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM courses')->fetchColumn();
                db()->prepare('INSERT INTO courses (slug, name, is_published, sort_order) VALUES (?, ?, 0, ?)')
                    ->execute([$slug, $name, $order]);
                flash('ok', __('Course “%s” created as a draft.', $name));
                redirect('course.php?id=' . db()->lastInsertId());
            } catch (PDOException $e) {
                if ($e->errorInfo[1] !== 1062) throw $e;
                flash('error', __('A course with the slug “%s” already exists.', $slug));
            }
        }
    }
    redirect('courses.php');
}

$courses = db()->query("
    SELECT c.*,
           (SELECT COUNT(*) FROM units u WHERE u.course_id = c.id) AS units,
           (SELECT COUNT(*) FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = c.id) AS lessons,
           (SELECT COUNT(*) FROM quests q JOIN lessons l ON l.id = q.lesson_id JOIN units u ON u.id = l.unit_id WHERE u.course_id = c.id) AS quests,
           (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS learners
    FROM courses c ORDER BY c.sort_order, c.id")->fetchAll();

page_start(__('Courses'), 'courses.php');
?>
<div class="page-head">
  <h1><?= h(__('Courses')) ?></h1>
  <p class="muted"><?= h(__('Course → units → lessons. The order here is the order of the learning path in the app.')) ?></p>
</div>

<section class="panel liquid-glass">
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th class="num"><?= h(__('Order')) ?></th><th><?= h(__('Course')) ?></th><th><?= h(__('Status')) ?></th><th class="num"><?= h(__('Units')) ?></th><th class="num"><?= h(__('Lessons')) ?></th><th class="num"><?= h(__('Quests')) ?></th><th class="num"><?= h(__('Learners')) ?></th></tr></thead>
      <tbody>
      <?php foreach ($courses as $c): ?>
        <tr class="row-link">
          <td class="num muted"><?= (int) $c['sort_order'] ?></td>
          <td><a href="course.php?id=<?= (int) $c['id'] ?>"><b><?= h($c['name']) ?></b></a> <span class="muted mono small"><?= h($c['slug']) ?></span></td>
          <td><?= published_badge((bool) $c['is_published']) ?></td>
          <td class="num"><?= (int) $c['units'] ?></td>
          <td class="num"><?= (int) $c['lessons'] ?></td>
          <td class="num"><?= (int) $c['quests'] ?></td>
          <td class="num"><?= (int) $c['learners'] ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$courses): ?>
        <tr><td colspan="7" class="empty"><?= h(__('No courses yet.')) ?></td></tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
</section>

<section class="panel liquid-glass">
  <h2><?= h(__('New course')) ?></h2>
  <form method="post" class="form-row">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="create_course">
    <label class="field grow"><span><?= h(__('Name')) ?></span><input name="name" maxlength="64" required placeholder="TypeScript"></label>
    <label class="field grow"><span><?= h(__('Slug')) ?></span><input name="slug" maxlength="32" pattern="[a-z0-9-]*" placeholder="typescript" class="mono"></label>
    <button class="btn btn-primary" type="submit"><?= h(__('Create course')) ?></button>
  </form>
</section>
<?php page_end();
