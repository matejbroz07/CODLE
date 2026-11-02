<?php
// Codle content — JavaScript · Unit 1 · JS Basics
// console-log, variables and data-types are the original quests from the first seed-quests.sql.
// Checks: doc.defaultView.__codleLogs holds console.log output as strings; the learner's JS is the last <script>.

$card = <<<'CSS'
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}

.card {
  padding: 20px 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  font-size: 18px;
}
CSS;

return [

'console-log' => [
  'title' => 'Say hello',
  'desc'  => '<p><code>console.log()</code> prints whatever you give it to the <b>console</b> below the output. Programmers use it all the time to check what their code is doing.</p><p>Say hello to Codle in the console, let JavaScript do a little maths, and then put the greeting on the page as well.</p>',
  'html'  => <<<'HTML'
<main>
  <h1 id="greeting">...</h1>
  <p>Open the console under the output to see your messages.</p>
</main>

HTML,
  'css'   => <<<'CSS'
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}

h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

CSS,
  'js'    => "// Objective 1: print \"Hello, Codle!\" here\n\n\n// Objective 2: print the result of 6 * 7 here\n",
  'objectives' => [
    ['js', 'Print <code>Hello, Codle!</code> with <code>console.log()</code>.',
     'Text goes in quotes:<pre>console.log("Hello, Codle!");</pre>',
     'var logs = doc.defaultView.__codleLogs || [];
return logs.some(function (l) { return /hello,\s*codle/i.test(l); });'],
    ['js', 'Print the result of <code>6 * 7</code>. Let JavaScript count it, don\'t type the answer.',
     'Numbers and maths go without quotes:<pre>console.log(6 * 7);</pre>',
     'var logs = doc.defaultView.__codleLogs || [];
var src = doc.scripts[doc.scripts.length - 1].textContent;
return logs.indexOf("42") >= 0 && /6\s*\*\s*7/.test(src);'],
    ['html', 'Replace <code>...</code> in the <code>&lt;h1&gt;</code> with <code>Hello, Codle!</code>.',
     'In the <b>HTML</b> tab, change the text between <code>&lt;h1 id="greeting"&gt;</code> and <code>&lt;/h1&gt;</code>.',
     'var h = doc.getElementById("greeting");
return !!h && /hello,\s*codle/i.test(h.textContent);'],
  ],
  'solution' => ['html' => "<main>\n  <h1 id=\"greeting\">Hello, Codle!</h1>\n  <p>Open the console under the output to see your messages.</p>\n</main>\n", 'js' => "console.log(\"Hello, Codle!\");\nconsole.log(6 * 7);\n"],
],

'variables' => [
  'title' => 'Remember things',
  'desc'  => '<p>A <b>variable</b> is a named box for a value. Use <code>const</code> for a value that never changes and <code>let</code> for one that will.</p><p>Fill in the little profile: store your name and your age, add a year to the age, and show both on the page.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>Name: <b id="name">?</b></p>
  <p>Age next year: <b id="age">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: a constant called name\n\n\n// Objective 2: a variable called age, then add 1 to it\n\n\n// Objective 3: show both on the page\ndocument.getElementById(\"name\").textContent = \"?\";\ndocument.getElementById(\"age\").textContent = \"?\";\n",
  'objectives' => [
    ['js', 'Declare a constant <code>name</code> with your name and show it in <code>#name</code>.',
     '<pre>const name = "Ada";</pre>Then replace <code>"?"</code> on the <code>name</code> line with <code>name</code> (no quotes).',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
var el = doc.getElementById("name");
return /\bconst\s+name\s*=/.test(src) && !!el && el.textContent.trim().length > 1 && el.textContent.trim() !== "?";'],
    ['js', 'Declare <code>age</code> with <code>let</code>, then add 1 to it on another line.',
     '<pre>let age = 15;\nage = age + 1;</pre><code>age += 1;</code> and <code>age++;</code> work too.',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /\blet\s+age\s*=/.test(src) && /\bage\s*(\+\+|\+=\s*1\b|=\s*age\s*\+\s*1\b)/.test(src);'],
    ['js', 'Show <code>age</code> in <code>#age</code>.',
     'Replace <code>"?"</code> on the <code>age</code> line with <code>age</code>.',
     'var el = doc.getElementById("age");
return !!el && /^\d+$/.test(el.textContent.trim());'],
  ],
  'solution' => ['js' => "const name = \"Ada\";\n\nlet age = 15;\nage = age + 1;\n\ndocument.getElementById(\"name\").textContent = name;\ndocument.getElementById(\"age\").textContent = age;\n"],
],

'data-types' => [
  'title' => 'What type is it?',
  'desc'  => '<p>Every value in JavaScript has a <b>type</b>. <code>42</code> is a number, <code>"42"</code> is a string (text) and <code>true</code> is a boolean.</p><p>The <code>typeof</code> operator tells you the type of a value. Use it to fill in the table instead of typing the answers yourself.</p>',
  'html'  => <<<'HTML'
<table>
  <tr><th>Value</th><th>Type</th></tr>
  <tr><td><code>42</code></td><td id="t-number">?</td></tr>
  <tr><td><code>"42"</code></td><td id="t-string">?</td></tr>
  <tr><td><code>true</code></td><td id="t-boolean">?</td></tr>
</table>

HTML,
  'css'   => <<<'CSS'
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
}

table {
  border-collapse: collapse;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

th, td {
  padding: 10px 18px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

CSS,
  'js'    => "const number = 42;\nconst text = \"42\";\nconst flag = true;\n\n// Show the type of each value, for example:\n// document.getElementById(\"t-number\").textContent = typeof number;\n",
  'objectives' => [
    ['js', 'Show <code>typeof number</code> in <code>#t-number</code>.',
     'Remove the <code>//</code> in front of the example line so it runs.',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
var el = doc.getElementById("t-number");
return /typeof/.test(src) && !!el && el.textContent.trim() === "number";'],
    ['js', 'Show <code>typeof text</code> in <code>#t-string</code>.',
     '<pre>document.getElementById("t-string").textContent = typeof text;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
var el = doc.getElementById("t-string");
return /typeof\s+text\b/.test(src) && !!el && el.textContent.trim() === "string";'],
    ['js', 'Show <code>typeof flag</code> in <code>#t-boolean</code>.',
     'Same as the two lines before, with <code>flag</code> and <code>"t-boolean"</code>.',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
var el = doc.getElementById("t-boolean");
return /typeof\s+flag\b/.test(src) && !!el && el.textContent.trim() === "boolean";'],
  ],
  'solution' => ['js' => "const number = 42;\nconst text = \"42\";\nconst flag = true;\n\ndocument.getElementById(\"t-number\").textContent = typeof number;\ndocument.getElementById(\"t-string\").textContent = typeof text;\ndocument.getElementById(\"t-boolean\").textContent = typeof flag;\n"],
],

'operators' => [
  'title' => 'Do the maths',
  'desc'  => '<p>Operators combine values: <code>+ - * /</code> for maths, <code>%</code> for the remainder after division (<code>7 % 3</code> is 1), and <code>&gt; &lt; &gt;= &lt;=</code> to compare, which gives <code>true</code> or <code>false</code>.</p><p>Let JavaScript work out the bill, not you.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>3 loaves at 45 Kč: <b id="total">?</b> Kč</p>
  <p>Over the 100 Kč free-delivery limit? <b id="free">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const price = 45;\nconst quantity = 3;\n\n// Objective 1: total = price times quantity, shown in #total\n\n\n// Objective 2: print the remainder of 17 divided by 5\n\n\n// Objective 3: is the total over 100? Show true/false in #free\n",
  'objectives' => [
    ['js', 'Multiply <code>price</code> by <code>quantity</code> and show the result in <code>#total</code>.',
     '<pre>const total = price * quantity;\ndocument.getElementById("total").textContent = total;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("total");
return /price\s*\*\s*quantity|quantity\s*\*\s*price/.test(src) && !!el && el.textContent.trim() === "135";'],
    ['js', 'Print the remainder of <code>17 % 5</code> to the console.',
     '<pre>console.log(17 % 5);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /17\s*%\s*5/.test(src) && logs.indexOf("2") >= 0;'],
    ['js', 'Show in <code>#free</code> whether the total is greater than <code>100</code>, using the <code>&gt;</code> operator.',
     'A comparison is a value too:<pre>document.getElementById("free").textContent = total > 100;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("free");
return /\btotal\s*>\s*100|100\s*<\s*total/.test(src) && !!el && el.textContent.trim() === "true";'],
  ],
  'solution' => ['js' => "const price = 45;\nconst quantity = 3;\n\nconst total = price * quantity;\ndocument.getElementById(\"total\").textContent = total;\n\nconsole.log(17 % 5);\n\ndocument.getElementById(\"free\").textContent = total > 100;\n"],
],

'strings' => [
  'title' => 'Working with text',
  'desc'  => '<p>Text values are <b>strings</b>. <code>+</code> glues strings together, <code>.length</code> counts the characters, and methods like <code>.toUpperCase()</code> give you a changed copy.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="greeting">?</p>
  <p>Shouted: <b id="shout">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const name = \"Codle\";\n\n// Objective 1: print how many letters the name has\n\n\n// Objective 2: build \"Hello, Codle!\" with + and show it in #greeting\n\n\n// Objective 3: show the name in capitals in #shout\n",
  'objectives' => [
    ['js', 'Print the length of <code>name</code> with <code>.length</code>.',
     '<pre>console.log(name.length);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /name\.length/.test(src) && logs.indexOf("5") >= 0;'],
    ['js', 'Build the greeting <code>Hello, Codle!</code> from <code>"Hello, "</code>, <code>name</code> and <code>"!"</code> with <code>+</code>, and show it in <code>#greeting</code>.',
     '<pre>const greeting = "Hello, " + name + "!";\ndocument.getElementById("greeting").textContent = greeting;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("greeting");
return /"Hello,\s?"\s*\+\s*name\s*\+\s*"!"/.test(src) && !!el && el.textContent.trim() === "Hello, Codle!";'],
    ['js', 'Show <code>name</code> in capitals in <code>#shout</code> with <code>.toUpperCase()</code>.',
     '<pre>document.getElementById("shout").textContent = name.toUpperCase();</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("shout");
return /toUpperCase\(\)/.test(src) && !!el && el.textContent.trim() === "CODLE";'],
  ],
  'solution' => ['js' => "const name = \"Codle\";\n\nconsole.log(name.length);\n\nconst greeting = \"Hello, \" + name + \"!\";\ndocument.getElementById(\"greeting\").textContent = greeting;\n\ndocument.getElementById(\"shout\").textContent = name.toUpperCase();\n"],
],

];
