<?php
/**
 * One objective in the quest editor. Expects $o with language, text_html, hint_html, check_js.
 * Used for saved rows and for the <template> that "+ Add objective" clones.
 */
?>
<li class="objective">
  <div class="objective-head">
    <span class="objective-no" data-label="<?= h(__('Objective')) ?>"></span>
    <select name="obj_lang[]" aria-label="<?= h(__('Editor tab')) ?>">
      <?php foreach (LANGS as $lang => $label): ?>
        <option value="<?= $lang ?>"<?= $lang === $o['language'] ? ' selected' : '' ?>><?= $label ?></option>
      <?php endforeach; ?>
    </select>
    <span class="objective-result" aria-live="polite"></span>
    <span class="objective-tools">
      <button type="button" class="btn btn-icon" data-obj="up" title="<?= h(__('Move up')) ?>" aria-label="<?= h(__('Move objective up')) ?>">↑</button>
      <button type="button" class="btn btn-icon" data-obj="down" title="<?= h(__('Move down')) ?>" aria-label="<?= h(__('Move objective down')) ?>">↓</button>
      <button type="button" class="btn btn-icon btn-icon-danger" data-obj="remove" title="<?= h(__('Remove')) ?>" aria-label="<?= h(__('Remove objective')) ?>">✕</button>
    </span>
  </div>
  <div class="objective-body">
    <label class="field"><span><?= h(__('Objective text (HTML)')) ?></span><textarea name="obj_text[]" rows="2" maxlength="1000" required><?= h($o['text_html']) ?></textarea></label>
    <label class="field"><span><?= h(__('Hint (HTML, optional)')) ?></span><textarea name="obj_hint[]" rows="2" maxlength="2000"><?= h($o['hint_html']) ?></textarea></label>
    <label class="field field-wide"><span><?= h(__('Check (JS)')) ?></span><textarea class="code" name="obj_check[]" rows="5" spellcheck="false" required><?= h($o['check_js']) ?></textarea></label>
  </div>
</li>
