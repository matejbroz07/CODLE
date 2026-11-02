<?php
// Codle content — JavaScript · Unit 3 · Control Flow

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
ul { margin: 0; padding-left: 20px; }
CSS;

return [

'if-else' => [
  'title' => 'Decisions',
  'desc'  => '<p><code>if (condition) { … }</code> runs the block only when the condition is true. <code>else</code> runs when it is not, and <code>else if</code> checks another condition in between. Conditions are usually comparisons like <code>temp &gt; 20</code>.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>24 °C feels <b id="today">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: describe(temp) returns \"Warm\" above 20, otherwise \"Cold\"\n\n\n// Objective 2: add \"Mild\" for temperatures above 10 with else if\n\n\n// Objective 3: print describe(24), describe(15) and describe(3); show describe(24) in #today\n",
  'objectives' => [
    ['js', 'Write <code>describe(temp)</code> that returns <code>"Warm"</code> if <code>temp &gt; 20</code> and <code>"Cold"</code> otherwise, with <code>if</code> and <code>else</code>.',
     '<pre>function describe(temp) {\n  if (temp > 20) {\n    return "Warm";\n  } else {\n    return "Cold";\n  }\n}</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /function\s+describe\s*\(\s*\w+\s*\)/.test(src) && /\bif\s*\(/.test(src) && /\belse\b/.test(src) && doc.defaultView.describe && doc.defaultView.describe(24) === "Warm" && doc.defaultView.describe(3) === "Cold";'],
    ['js', 'Add an <code>else if (temp &gt; 10)</code> branch that returns <code>"Mild"</code>.',
     '<pre>if (temp > 20) {\n  return "Warm";\n} else if (temp > 10) {\n  return "Mild";\n} else {\n  return "Cold";\n}</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, d = doc.defaultView.describe;
return /else\s+if\s*\(/.test(src) && !!d && d(24) === "Warm" && d(15) === "Mild" && d(3) === "Cold";'],
    ['js', 'Print <code>describe(24)</code>, <code>describe(15)</code> and <code>describe(3)</code>, and show <code>describe(24)</code> in <code>#today</code>.',
     '<pre>console.log(describe(24));\nconsole.log(describe(15));\nconsole.log(describe(3));\ndocument.getElementById("today").textContent = describe(24);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], el = doc.getElementById("today");
return logs.indexOf("Warm") >= 0 && logs.indexOf("Mild") >= 0 && logs.indexOf("Cold") >= 0 && !!el && el.textContent.trim() === "Warm";'],
  ],
  'solution' => ['js' => "function describe(temp) {\n  if (temp > 20) {\n    return \"Warm\";\n  } else if (temp > 10) {\n    return \"Mild\";\n  } else {\n    return \"Cold\";\n  }\n}\n\nconsole.log(describe(24));\nconsole.log(describe(15));\nconsole.log(describe(3));\ndocument.getElementById(\"today\").textContent = describe(24);\n"],
],

'comparisons' => [
  'title' => 'Equal or not',
  'desc'  => '<p>Use <code>===</code> to ask "is this the same value and type?" and <code>!==</code> for "is it different?". The older <code>==</code> converts types first, so <code>"5" == 5</code> is true, which causes bugs. Stick to <code>===</code>.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>Can a 17-year-old vote? <b id="vote">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: compare \"5\" and 5 with === and with ==, print both results\n\n\n// Objective 2: canVote(age) returns true from 18 up\n\n\n// Objective 3: isAdmin(role) returns true only when role is exactly \"admin\"\n",
  'objectives' => [
    ['js', 'Print <code>"5" === 5</code> and <code>"5" == 5</code> to see the difference.',
     '<pre>console.log("5" === 5);\nconsole.log("5" == 5);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /"5"\s*===\s*5/.test(src) && /"5"\s*==\s*5/.test(src) && logs.indexOf("false") >= 0 && logs.indexOf("true") >= 0;'],
    ['js', 'Write <code>canVote(age)</code> that returns <code>age &gt;= 18</code>, and show <code>canVote(17)</code> in <code>#vote</code>.',
     '<pre>function canVote(age) {\n  return age >= 18;\n}\ndocument.getElementById("vote").textContent = canVote(17);</pre>',
     'var w = doc.defaultView, el = doc.getElementById("vote");
return typeof w.canVote === "function" && w.canVote(18) === true && w.canVote(17) === false && !!el && el.textContent.trim() === "false";'],
    ['js', 'Write <code>isAdmin(role)</code> that returns whether <code>role === "admin"</code>, and print <code>isAdmin("admin")</code>.',
     '<pre>function isAdmin(role) {\n  return role === "admin";\n}\nconsole.log(isAdmin("admin"));</pre>',
     'var w = doc.defaultView, src = doc.scripts[doc.scripts.length - 1].textContent;
return typeof w.isAdmin === "function" && /role\s*===\s*"admin"/.test(src) && w.isAdmin("admin") === true && w.isAdmin("Admin") === false;'],
  ],
  'solution' => ['js' => "console.log(\"5\" === 5);\nconsole.log(\"5\" == 5);\n\nfunction canVote(age) {\n  return age >= 18;\n}\ndocument.getElementById(\"vote\").textContent = canVote(17);\n\nfunction isAdmin(role) {\n  return role === \"admin\";\n}\nconsole.log(isAdmin(\"admin\"));\n"],
],

'boolean-logic' => [
  'title' => 'And, or, not',
  'desc'  => '<p><code>&amp;&amp;</code> (and) is true only when both sides are true. <code>||</code> (or) is true when at least one side is. <code>!</code> (not) flips a boolean. Together they turn several small questions into one.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>Is the shop open? <b id="open">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: canEnter(age, hasTicket): age at least 12 AND a ticket\n\n\n// Objective 2: isWeekend(day): \"Sat\" OR \"Sun\"\n\n\n// Objective 3: the shop is open when it is NOT a holiday\nconst holiday = false;\n",
  'objectives' => [
    ['js', 'Write <code>canEnter(age, hasTicket)</code> that returns true only when <code>age &gt;= 12 &amp;&amp; hasTicket</code>.',
     '<pre>function canEnter(age, hasTicket) {\n  return age >= 12 && hasTicket;\n}</pre>',
     'var w = doc.defaultView, src = doc.scripts[doc.scripts.length - 1].textContent;
return typeof w.canEnter === "function" && /&&/.test(src) && w.canEnter(12, true) === true && w.canEnter(11, true) === false && w.canEnter(30, false) === false;'],
    ['js', 'Write <code>isWeekend(day)</code> that returns true for <code>"Sat"</code> or <code>"Sun"</code>.',
     '<pre>function isWeekend(day) {\n  return day === "Sat" || day === "Sun";\n}</pre>',
     'var w = doc.defaultView, src = doc.scripts[doc.scripts.length - 1].textContent;
return typeof w.isWeekend === "function" && /\|\|/.test(src) && w.isWeekend("Sat") === true && w.isWeekend("Sun") === true && w.isWeekend("Mon") === false;'],
    ['js', 'Show in <code>#open</code> whether the shop is open: it is open when it is <code>!holiday</code>.',
     '<pre>document.getElementById("open").textContent = !holiday;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("open");
return /!\s*holiday/.test(src) && !!el && el.textContent.trim() === "true";'],
  ],
  'solution' => ['js' => "function canEnter(age, hasTicket) {\n  return age >= 12 && hasTicket;\n}\n\nfunction isWeekend(day) {\n  return day === \"Sat\" || day === \"Sun\";\n}\n\nconst holiday = false;\ndocument.getElementById(\"open\").textContent = !holiday;\n"],
],

'for-loops' => [
  'title' => 'Again and again',
  'desc'  => '<p>A <code>for</code> loop repeats a block: <code>for (let i = 1; i &lt;= 5; i++) { … }</code> starts <code>i</code> at 1, runs while <code>i &lt;= 5</code>, and adds 1 after every round. Loops are how you handle lists without writing the same line ten times.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>1 + 2 + … + 100 = <b id="sum">?</b></p>
  <ul id="list"></ul>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: print 1 to 5 with a for loop\n\n\n// Objective 2: add up 1 to 100 and show the sum in #sum\n\n\n// Objective 3: one <li> per bread in #list\nconst breads = [\"Rye\", \"Sourdough\", \"Baguette\", \"Ciabatta\"];\nconst list = document.getElementById(\"list\");\n",
  'objectives' => [
    ['js', 'Print the numbers 1 to 5, one per line, with a <code>for</code> loop.',
     '<pre>for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /for\s*\(/.test(src) && ["1", "2", "3", "4", "5"].every(function (n) { return logs.indexOf(n) >= 0; });'],
    ['js', 'Add up the numbers 1 to 100 in a loop and show the result in <code>#sum</code>.',
     '<pre>let sum = 0;\nfor (let i = 1; i <= 100; i++) {\n  sum = sum + i;\n}\ndocument.getElementById("sum").textContent = sum;</pre>',
     'var el = doc.getElementById("sum"), src = doc.scripts[doc.scripts.length - 1].textContent;
return !!el && el.textContent.trim() === "5050" && !/5050/.test(src);'],
    ['js', 'Loop over <code>breads</code> and add an <code>&lt;li&gt;</code> with each name to <code>#list</code> (<code>list.innerHTML += "&lt;li&gt;" + … + "&lt;/li&gt;"</code>).',
     '<pre>for (let i = 0; i < breads.length; i++) {\n  list.innerHTML += "<li>" + breads[i] + "</li>";\n}</pre>',
     'var li = doc.querySelectorAll("#list li");
return li.length === 4 && li[0].textContent.trim() === "Rye" && li[3].textContent.trim() === "Ciabatta";'],
  ],
  'solution' => ['js' => "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n\nlet sum = 0;\nfor (let i = 1; i <= 100; i++) {\n  sum = sum + i;\n}\ndocument.getElementById(\"sum\").textContent = sum;\n\nconst breads = [\"Rye\", \"Sourdough\", \"Baguette\", \"Ciabatta\"];\nconst list = document.getElementById(\"list\");\nfor (let i = 0; i < breads.length; i++) {\n  list.innerHTML += \"<li>\" + breads[i] + \"</li>\";\n}\n"],
],

'while-loops' => [
  'title' => 'Until it is done',
  'desc'  => '<p>A <code>while</code> loop repeats as long as its condition is true: use it when you do not know in advance how many rounds you need. <code>break</code> leaves any loop immediately. Make sure something inside the loop changes the condition, or it never ends.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>First power of two above 1000: <b id="power">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: count down from 5 to 1 with while, then print \"Liftoff!\"\n\n\n// Objective 2: double n until it is above 1000, show it in #power\nlet n = 1;\n\n\n// Objective 3: print the words until you reach \"stop\"\nconst words = [\"knead\", \"rest\", \"stop\", \"bake\"];\n",
  'objectives' => [
    ['js', 'Count down from 5 to 1 with a <code>while</code> loop, then print <code>Liftoff!</code>.',
     '<pre>let count = 5;\nwhile (count > 0) {\n  console.log(count);\n  count = count - 1;\n}\nconsole.log("Liftoff!");</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
var i = logs.indexOf("5");
return /while\s*\(/.test(src) && i >= 0 && logs.slice(i, i + 6).join(",") === "5,4,3,2,1,Liftoff!";'],
    ['js', 'Double <code>n</code> in a <code>while</code> loop until it is above 1000, and show it in <code>#power</code>.',
     '<pre>while (n <= 1000) {\n  n = n * 2;\n}\ndocument.getElementById("power").textContent = n;</pre>',
     'var el = doc.getElementById("power"), src = doc.scripts[doc.scripts.length - 1].textContent;
return !!el && el.textContent.trim() === "1024" && !/1024/.test(src);'],
    ['js', 'Loop over <code>words</code> and print each one, but <code>break</code> out of the loop when you reach <code>"stop"</code>.',
     '<pre>for (let i = 0; i < words.length; i++) {\n  if (words[i] === "stop") {\n    break;\n  }\n  console.log(words[i]);\n}</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /\bbreak\b/.test(src) && logs.indexOf("knead") >= 0 && logs.indexOf("rest") >= 0 && logs.indexOf("bake") < 0;'],
  ],
  'solution' => ['js' => "let count = 5;\nwhile (count > 0) {\n  console.log(count);\n  count = count - 1;\n}\nconsole.log(\"Liftoff!\");\n\nlet n = 1;\nwhile (n <= 1000) {\n  n = n * 2;\n}\ndocument.getElementById(\"power\").textContent = n;\n\nconst words = [\"knead\", \"rest\", \"stop\", \"bake\"];\nfor (let i = 0; i < words.length; i++) {\n  if (words[i] === \"stop\") {\n    break;\n  }\n  console.log(words[i]);\n}\n"],
],

];
