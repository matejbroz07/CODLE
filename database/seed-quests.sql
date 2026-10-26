-- =============================================================
--  Codle — editor quests for JavaScript, Unit 1 (JS Basics)
--  Console Log, Variables, Data Types. Import after seed.sql.
--  Replaces existing quests of these three lessons.
--
--  check_js is the body of function (doc) { … } and runs in the preview iframe.
--  doc.defaultView.__codleLogs holds what console.log() printed (as strings).
-- =============================================================

SET NAMES utf8mb4;
USE codle;

SET @unit = (SELECT u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'javascript' AND u.position = 1);

-- -------------------------------------------------------------
-- Lesson 1 · Console Log
-- -------------------------------------------------------------
SET @lesson = (SELECT id FROM lessons WHERE unit_id = @unit AND slug = 'console-log');
DELETE FROM quests WHERE lesson_id = @lesson;
INSERT INTO quests (lesson_id, title, description_html) VALUES (@lesson, 'Say hello',
 '<p><code>console.log()</code> prints whatever you give it to the <b>console</b> below the output. Programmers use it all the time to check what their code is doing.</p><p>Say hello to Codle in the console, let JavaScript do a little maths, and then put the greeting on the page as well.</p>');
SET @q = LAST_INSERT_ID();
INSERT INTO quest_files (quest_id, language, starter) VALUES
 (@q, 'html', '<main>\n  <h1 id="greeting">...</h1>\n  <p>Open the console under the output to see your messages.</p>\n</main>\n'),
 (@q, 'css',  'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui, sans-serif;\n  background: #f2f4f8;\n  color: #1c1c1e;\n}\n\nh1 {\n  margin: 0 0 8px;\n  font-size: 32px;\n}\n'),
 (@q, 'js',   '// Objective 1: print "Hello, Codle!" here\n\n\n// Objective 2: print the result of 6 * 7 here\n');
INSERT INTO quest_objectives (quest_id, position, language, text_html, hint_html, check_js) VALUES
 (@q, 1, 'js', 'Print <code>Hello, Codle!</code> with <code>console.log()</code>.',
  'Text goes in quotes:<pre>console.log("Hello, Codle!");</pre>',
  'var logs = doc.defaultView.__codleLogs || [];\nreturn logs.some(function (l) { return /hello,\\s*codle/i.test(l); });'),
 (@q, 2, 'js', 'Print the result of <code>6 * 7</code>. Let JavaScript count it, don''t type the answer.',
  'Numbers and maths go without quotes:<pre>console.log(6 * 7);</pre>',
  'var logs = doc.defaultView.__codleLogs || [];\nvar src = doc.scripts[doc.scripts.length - 1].textContent;\nreturn logs.indexOf("42") >= 0 && /6\\s*\\*\\s*7/.test(src);'),
 (@q, 3, 'html', 'Replace <code>...</code> in the <code>&lt;h1&gt;</code> with <code>Hello, Codle!</code>.',
  'In the <b>HTML</b> tab, change the text between <code>&lt;h1 id="greeting"&gt;</code> and <code>&lt;/h1&gt;</code>.',
  'var h = doc.getElementById("greeting");\nreturn !!h && /hello,\\s*codle/i.test(h.textContent);');

-- -------------------------------------------------------------
-- Lesson 2 · Variables
-- -------------------------------------------------------------
SET @lesson = (SELECT id FROM lessons WHERE unit_id = @unit AND slug = 'variables');
DELETE FROM quests WHERE lesson_id = @lesson;
INSERT INTO quests (lesson_id, title, description_html) VALUES (@lesson, 'Remember things',
 '<p>A <b>variable</b> is a named box for a value. Use <code>const</code> for a value that never changes and <code>let</code> for one that will.</p><p>Fill in the little profile: store your name and your age, add a year to the age, and show both on the page.</p>');
SET @q = LAST_INSERT_ID();
INSERT INTO quest_files (quest_id, language, starter) VALUES
 (@q, 'html', '<section class="card">\n  <p>Name: <b id="name">?</b></p>\n  <p>Age next year: <b id="age">?</b></p>\n</section>\n'),
 (@q, 'css',  'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui, sans-serif;\n  background: #f2f4f8;\n}\n\n.card {\n  padding: 20px 28px;\n  border-radius: 16px;\n  background: #ffffff;\n  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);\n  font-size: 18px;\n}\n'),
 (@q, 'js',   '// Objective 1: a constant called name\n\n\n// Objective 2: a variable called age, then add 1 to it\n\n\n// Objective 3: show both on the page\ndocument.getElementById("name").textContent = "?";\ndocument.getElementById("age").textContent = "?";\n');
INSERT INTO quest_objectives (quest_id, position, language, text_html, hint_html, check_js) VALUES
 (@q, 1, 'js', 'Declare a constant <code>name</code> with your name and show it in <code>#name</code>.',
  '<pre>const name = "Ada";</pre>Then replace <code>"?"</code> on the <code>name</code> line with <code>name</code> (no quotes).',
  'var src = doc.scripts[doc.scripts.length - 1].textContent;\nvar el = doc.getElementById("name");\nreturn /\\bconst\\s+name\\s*=/.test(src) && !!el && el.textContent.trim().length > 1 && el.textContent.trim() !== "?";'),
 (@q, 2, 'js', 'Declare <code>age</code> with <code>let</code>, then add 1 to it on another line.',
  '<pre>let age = 15;\nage = age + 1;</pre><code>age += 1;</code> and <code>age++;</code> work too.',
  'var src = doc.scripts[doc.scripts.length - 1].textContent;\nreturn /\\blet\\s+age\\s*=/.test(src) && /\\bage\\s*(\\+\\+|\\+=\\s*1\\b|=\\s*age\\s*\\+\\s*1\\b)/.test(src);'),
 (@q, 3, 'js', 'Show <code>age</code> in <code>#age</code>.',
  'Replace <code>"?"</code> on the <code>age</code> line with <code>age</code>.',
  'var el = doc.getElementById("age");\nreturn !!el && /^\\d+$/.test(el.textContent.trim());');

-- -------------------------------------------------------------
-- Lesson 3 · Data Types
-- -------------------------------------------------------------
SET @lesson = (SELECT id FROM lessons WHERE unit_id = @unit AND slug = 'data-types');
DELETE FROM quests WHERE lesson_id = @lesson;
INSERT INTO quests (lesson_id, title, description_html) VALUES (@lesson, 'What type is it?',
 '<p>Every value in JavaScript has a <b>type</b>. <code>42</code> is a number, <code>"42"</code> is a string (text) and <code>true</code> is a boolean.</p><p>The <code>typeof</code> operator tells you the type of a value. Use it to fill in the table instead of typing the answers yourself.</p>');
SET @q = LAST_INSERT_ID();
INSERT INTO quest_files (quest_id, language, starter) VALUES
 (@q, 'html', '<table>\n  <tr><th>Value</th><th>Type</th></tr>\n  <tr><td><code>42</code></td><td id="t-number">?</td></tr>\n  <tr><td><code>"42"</code></td><td id="t-string">?</td></tr>\n  <tr><td><code>true</code></td><td id="t-boolean">?</td></tr>\n</table>\n'),
 (@q, 'css',  'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui, sans-serif;\n  background: #f2f4f8;\n}\n\ntable {\n  border-collapse: collapse;\n  background: #ffffff;\n  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);\n}\n\nth, td {\n  padding: 10px 18px;\n  border-bottom: 1px solid #e5e7eb;\n  text-align: left;\n}\n'),
 (@q, 'js',   'const number = 42;\nconst text = "42";\nconst flag = true;\n\n// Show the type of each value, for example:\n// document.getElementById("t-number").textContent = typeof number;\n');
INSERT INTO quest_objectives (quest_id, position, language, text_html, hint_html, check_js) VALUES
 (@q, 1, 'js', 'Show <code>typeof number</code> in <code>#t-number</code>.',
  'Remove the <code>//</code> in front of the example line so it runs.',
  'var src = doc.scripts[doc.scripts.length - 1].textContent;\nvar el = doc.getElementById("t-number");\nreturn /typeof/.test(src) && !!el && el.textContent.trim() === "number";'),
 (@q, 2, 'js', 'Show <code>typeof text</code> in <code>#t-string</code>.',
  '<pre>document.getElementById("t-string").textContent = typeof text;</pre>',
  'var src = doc.scripts[doc.scripts.length - 1].textContent;\nvar el = doc.getElementById("t-string");\nreturn /typeof\\s+text\\b/.test(src) && !!el && el.textContent.trim() === "string";'),
 (@q, 3, 'js', 'Show <code>typeof flag</code> in <code>#t-boolean</code>.',
  'Same as the two lines before, with <code>flag</code> and <code>"t-boolean"</code>.',
  'var src = doc.scripts[doc.scripts.length - 1].textContent;\nvar el = doc.getElementById("t-boolean");\nreturn /typeof\\s+flag\\b/.test(src) && !!el && el.textContent.trim() === "boolean";');
