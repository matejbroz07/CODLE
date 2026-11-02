-- =============================================================
--  Codle — migration 003: HTML, CSS and JavaScript, six units each.
--  For a database seeded before 27 Oct 2026. seed.sql already contains this.
--
--    /Applications/XAMPP/xamppfiles/bin/mysql -u root codle < database/migrations/003_courses.sql
--
--  Removes the Python course (its units, lessons, quests, progress and
--  enrollments go with it; the Pythonista badge is deleted), publishes HTML
--  and CSS, and fills every course from js/curriculum.js. JavaScript units 1
--  and 2 are kept, because seed-quests.sql and learners' progress hang off
--  their lessons; the new lessons are added around them.
--  Run once: the inserts are not repeatable.
-- =============================================================

SET NAMES utf8mb4;
USE codle;

DELETE FROM badges WHERE slug = 'pythonista-1';
DELETE FROM courses WHERE slug = 'python';

UPDATE courses SET is_published = 1, sort_order = 1 WHERE slug = 'html';
UPDATE courses SET is_published = 1, sort_order = 2 WHERE slug = 'css';
UPDATE courses SET is_published = 1, sort_order = 3 WHERE slug = 'javascript';
UPDATE courses SET sort_order = 4 WHERE slug = 'php';

SET @js = (SELECT id FROM courses WHERE slug = 'javascript');

-- HTML
INSERT INTO units (course_id, position, title) SELECT id, 1, 'First Page' FROM courses WHERE slug = 'html';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'hello-html', 'Your First Page', 'lesson', 20),
  (@unit, 2, 'headings', 'Headings', 'lesson', 20),
  (@unit, 3, 'paragraphs', 'Paragraphs', 'lesson', 20),
  (@unit, 4, 'comments', 'Comments', 'lesson', 20),
  (@unit, 5, 'unit-1-quiz', 'Unit 1 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 2, 'Text & Links' FROM courses WHERE slug = 'html';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'links', 'Links', 'lesson', 20),
  (@unit, 2, 'lists', 'Lists', 'lesson', 20),
  (@unit, 3, 'emphasis', 'Bold & Italic', 'lesson', 20),
  (@unit, 4, 'line-breaks', 'Line Breaks & Rules', 'lesson', 20),
  (@unit, 5, 'unit-2-quiz', 'Unit 2 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 3, 'Images & Media' FROM courses WHERE slug = 'html';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'images', 'Images', 'lesson', 20),
  (@unit, 2, 'alt-text', 'Alt Text', 'lesson', 20),
  (@unit, 3, 'figures', 'Figures & Captions', 'lesson', 20),
  (@unit, 4, 'audio-video', 'Audio & Video', 'lesson', 20),
  (@unit, 5, 'unit-3-quiz', 'Unit 3 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 4, 'Page Structure' FROM courses WHERE slug = 'html';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'document-structure', 'Head & Body', 'lesson', 20),
  (@unit, 2, 'semantic-tags', 'Semantic Tags', 'lesson', 20),
  (@unit, 3, 'header-footer', 'Header & Footer', 'lesson', 20),
  (@unit, 4, 'navigation', 'Navigation', 'lesson', 20),
  (@unit, 5, 'sections', 'Sections & Articles', 'lesson', 20),
  (@unit, 6, 'unit-4-quiz', 'Unit 4 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 5, 'Tables & Forms' FROM courses WHERE slug = 'html';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'tables', 'Tables', 'lesson', 20),
  (@unit, 2, 'table-headers', 'Table Headers', 'lesson', 20),
  (@unit, 3, 'forms', 'Forms', 'lesson', 20),
  (@unit, 4, 'inputs', 'Inputs', 'lesson', 20),
  (@unit, 5, 'buttons-labels', 'Buttons & Labels', 'lesson', 20),
  (@unit, 6, 'unit-5-quiz', 'Unit 5 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 6, 'Putting It Together' FROM courses WHERE slug = 'html';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'attributes', 'Attributes & IDs', 'lesson', 20),
  (@unit, 2, 'classes', 'Classes', 'lesson', 20),
  (@unit, 3, 'meta-tags', 'Meta Tags', 'lesson', 20),
  (@unit, 4, 'accessibility', 'Accessibility', 'lesson', 20),
  (@unit, 5, 'final-exam', 'Final Exam', 'exam', 100);

-- CSS
INSERT INTO units (course_id, position, title) SELECT id, 1, 'Selectors & Colors' FROM courses WHERE slug = 'css';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'hello-css', 'Your First Style', 'lesson', 20),
  (@unit, 2, 'selectors', 'Selectors', 'lesson', 20),
  (@unit, 3, 'colors', 'Colors', 'lesson', 20),
  (@unit, 4, 'classes-ids', 'Classes & IDs', 'lesson', 20),
  (@unit, 5, 'unit-1-quiz', 'Unit 1 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 2, 'Text & Fonts' FROM courses WHERE slug = 'css';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'fonts', 'Fonts', 'lesson', 20),
  (@unit, 2, 'text-styling', 'Text Styling', 'lesson', 20),
  (@unit, 3, 'text-spacing', 'Alignment & Spacing', 'lesson', 20),
  (@unit, 4, 'web-fonts', 'Web Fonts', 'lesson', 20),
  (@unit, 5, 'unit-2-quiz', 'Unit 2 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 3, 'The Box Model' FROM courses WHERE slug = 'css';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'box-model', 'The Box Model', 'lesson', 20),
  (@unit, 2, 'padding-margin', 'Padding & Margin', 'lesson', 20),
  (@unit, 3, 'borders', 'Borders', 'lesson', 20),
  (@unit, 4, 'width-height', 'Width & Height', 'lesson', 20),
  (@unit, 5, 'unit-3-quiz', 'Unit 3 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 4, 'Layout' FROM courses WHERE slug = 'css';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'display', 'Display', 'lesson', 20),
  (@unit, 2, 'flexbox', 'Flexbox', 'lesson', 20),
  (@unit, 3, 'flex-alignment', 'Flex Alignment', 'lesson', 20),
  (@unit, 4, 'grid', 'Grid', 'lesson', 20),
  (@unit, 5, 'positioning', 'Positioning', 'lesson', 20),
  (@unit, 6, 'unit-4-quiz', 'Unit 4 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 5, 'Responsive Design' FROM courses WHERE slug = 'css';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'units', 'Units', 'lesson', 20),
  (@unit, 2, 'media-queries', 'Media Queries', 'lesson', 20),
  (@unit, 3, 'mobile-first', 'Mobile First', 'lesson', 20),
  (@unit, 4, 'responsive-images', 'Responsive Images', 'lesson', 20),
  (@unit, 5, 'unit-5-quiz', 'Unit 5 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 6, 'Effects & Polish' FROM courses WHERE slug = 'css';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'transitions', 'Transitions', 'lesson', 20),
  (@unit, 2, 'transforms', 'Transforms', 'lesson', 20),
  (@unit, 3, 'animations', 'Animations', 'lesson', 20),
  (@unit, 4, 'css-variables', 'CSS Variables', 'lesson', 20),
  (@unit, 5, 'final-exam', 'Final Exam', 'exam', 100);

-- JavaScript
SET @unit = (SELECT id FROM units WHERE course_id = @js AND position = 1);
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 4, 'operators', 'Operators', 'lesson', 20),
  (@unit, 5, 'strings', 'Strings', 'lesson', 20),
  (@unit, 6, 'unit-1-quiz', 'Unit 1 Quiz', 'quiz', 50);

SET @unit = (SELECT id FROM units WHERE course_id = @js AND position = 2);
UPDATE lessons SET position = position + 100 WHERE unit_id = @unit;
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'functions', 'Functions', 'lesson', 20),
  (@unit, 2, 'parameters', 'Parameters & Returns', 'lesson', 20),
  (@unit, 3, 'scope', 'Scope', 'lesson', 20),
  (@unit, 6, 'unit-2-quiz', 'Unit 2 Quiz', 'quiz', 50);
UPDATE lessons SET position = 4 WHERE unit_id = @unit AND slug = 'arrow-functions';
UPDATE lessons SET position = 5 WHERE unit_id = @unit AND slug = 'closures';

INSERT INTO units (course_id, position, title) SELECT id, 3, 'Control Flow' FROM courses WHERE slug = 'javascript';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'if-else', 'If & Else', 'lesson', 20),
  (@unit, 2, 'comparisons', 'Comparisons', 'lesson', 20),
  (@unit, 3, 'boolean-logic', 'Boolean Logic', 'lesson', 20),
  (@unit, 4, 'for-loops', 'For Loops', 'lesson', 20),
  (@unit, 5, 'while-loops', 'While Loops', 'lesson', 20),
  (@unit, 6, 'unit-3-quiz', 'Unit 3 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 4, 'Arrays & Objects' FROM courses WHERE slug = 'javascript';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'arrays', 'Arrays', 'lesson', 20),
  (@unit, 2, 'array-methods', 'Array Methods', 'lesson', 20),
  (@unit, 3, 'objects', 'Objects', 'lesson', 20),
  (@unit, 4, 'json', 'JSON', 'lesson', 20),
  (@unit, 5, 'unit-4-quiz', 'Unit 4 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 5, 'The DOM' FROM courses WHERE slug = 'javascript';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'selecting-elements', 'Selecting Elements', 'lesson', 20),
  (@unit, 2, 'changing-content', 'Changing Content', 'lesson', 20),
  (@unit, 3, 'styles-classes', 'Styles & Classes', 'lesson', 20),
  (@unit, 4, 'events', 'Events', 'lesson', 20),
  (@unit, 5, 'creating-elements', 'Creating Elements', 'lesson', 20),
  (@unit, 6, 'unit-5-quiz', 'Unit 5 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 6, 'Modern JS' FROM courses WHERE slug = 'javascript';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'template-literals', 'Template Literals', 'lesson', 20),
  (@unit, 2, 'destructuring', 'Destructuring', 'lesson', 20),
  (@unit, 3, 'promises', 'Promises', 'lesson', 20),
  (@unit, 4, 'fetch', 'Fetch', 'lesson', 20),
  (@unit, 5, 'final-exam', 'Final Exam', 'exam', 100);

-- Badges: one after units 2, 4 and 6 of every course
INSERT INTO badges (slug, name, description, unit_id)
SELECT 'html-1', 'Markup Rookie', 'Complete Unit 2', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'html' AND u.position = 2
UNION ALL SELECT 'html-2', 'Page Builder', 'Complete Unit 4', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'html' AND u.position = 4
UNION ALL SELECT 'html-3', 'HTML Master', 'Complete Unit 6', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'html' AND u.position = 6
UNION ALL SELECT 'css-1', 'Stylist I', 'Complete Unit 2', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'css' AND u.position = 2
UNION ALL SELECT 'css-2', 'Layout Pro', 'Complete Unit 4', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'css' AND u.position = 4
UNION ALL SELECT 'css-3', 'CSS Master', 'Complete Unit 6', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'css' AND u.position = 6
UNION ALL SELECT 'js-1', 'Scripter I', 'Complete Unit 2', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'javascript' AND u.position = 2
UNION ALL SELECT 'js-2', 'DOM Wrangler', 'Complete Unit 4', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'javascript' AND u.position = 4
UNION ALL SELECT 'js-3', 'JS Master', 'Complete Unit 6', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'javascript' AND u.position = 6;
