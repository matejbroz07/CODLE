<?php
// Codle content — JavaScript · Unit 2 · Functions & Scope

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

'functions' => [
  'title' => 'Write it once',
  'desc'  => '<p>A <b>function</b> is a block of code with a name. Declare it with <code>function greet() { … }</code> and run it as often as you like by <b>calling</b> it: <code>greet();</code>. Nothing inside runs until it is called.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="message">?</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: declare greet(), which prints \"Hi there!\"\n\n\n// Objective 2: call greet() three times\n\n\n// Objective 3: declare showMessage(), which puts \"Welcome to Codle\" into #message, and call it\n",
  'objectives' => [
    ['js', 'Declare a function <code>greet</code> that prints <code>Hi there!</code> to the console.',
     '<pre>function greet() {\n  console.log("Hi there!");\n}</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /function\s+greet\s*\(\s*\)\s*\{[^}]*console\.log\(\s*"Hi there!"\s*\)/.test(src);'],
    ['js', 'Call <code>greet()</code> three times, so the message appears three times in the console.',
     '<pre>greet();\ngreet();\ngreet();</pre>',
     'var logs = doc.defaultView.__codleLogs || [];
return logs.filter(function (l) { return l === "Hi there!"; }).length >= 3;'],
    ['js', 'Declare <code>showMessage</code>, which sets the text of <code>#message</code> to <code>Welcome to Codle</code>, and call it once.',
     '<pre>function showMessage() {\n  document.getElementById("message").textContent = "Welcome to Codle";\n}\nshowMessage();</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("message");
return /function\s+showMessage\s*\(/.test(src) && /showMessage\s*\(\s*\)\s*;?/.test(src.replace(/function\s+showMessage\s*\([^)]*\)/, "")) && !!el && el.textContent.trim() === "Welcome to Codle";'],
  ],
  'solution' => ['js' => "function greet() {\n  console.log(\"Hi there!\");\n}\n\ngreet();\ngreet();\ngreet();\n\nfunction showMessage() {\n  document.getElementById(\"message\").textContent = \"Welcome to Codle\";\n}\nshowMessage();\n"],
],

'parameters' => [
  'title' => 'In and out',
  'desc'  => '<p><b>Parameters</b> are the values a function receives, named in the brackets: <code>function area(width, height)</code>. <code>return</code> sends a value back to whoever called the function, so <code>area(3, 4)</code> <i>is</i> 12 and can be stored, printed or shown.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>Area of a 5 × 6 tile: <b id="area">?</b></p>
  <p>Double of 21: <b id="double">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: area(width, height) returns width times height\n\n\n// Objective 2: print area(3, 4), show area(5, 6) in #area\n\n\n// Objective 3: double(n) returns n times 2, show double(21) in #double\n",
  'objectives' => [
    ['js', 'Declare <code>area(width, height)</code> that <code>return</code>s <code>width * height</code>.',
     '<pre>function area(width, height) {\n  return width * height;\n}</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /function\s+area\s*\(\s*\w+\s*,\s*\w+\s*\)\s*\{[^}]*return/.test(src);'],
    ['js', 'Print <code>area(3, 4)</code> to the console and show <code>area(5, 6)</code> in <code>#area</code>.',
     '<pre>console.log(area(3, 4));\ndocument.getElementById("area").textContent = area(5, 6);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], el = doc.getElementById("area"), src = doc.scripts[doc.scripts.length - 1].textContent;
return logs.indexOf("12") >= 0 && /area\s*\(\s*3\s*,\s*4\s*\)/.test(src) && !!el && el.textContent.trim() === "30";'],
    ['js', 'Declare <code>double(n)</code> that returns <code>n * 2</code>, and show <code>double(21)</code> in <code>#double</code>.',
     '<pre>function double(n) {\n  return n * 2;\n}\ndocument.getElementById("double").textContent = double(21);</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("double");
return /function\s+double\s*\(\s*\w+\s*\)/.test(src) && !!el && el.textContent.trim() === "42";'],
  ],
  'solution' => ['js' => "function area(width, height) {\n  return width * height;\n}\n\nconsole.log(area(3, 4));\ndocument.getElementById(\"area\").textContent = area(5, 6);\n\nfunction double(n) {\n  return n * 2;\n}\ndocument.getElementById(\"double\").textContent = double(21);\n"],
],

'scope' => [
  'title' => 'Who can see what',
  'desc'  => '<p>A variable lives in the block where it was declared. One declared inside a function is <b>local</b>: it does not exist outside. One declared at the top of the file is <b>global</b> and every function can read and change it.</p><p>The scoreboard below has a scope bug. Find out why and fix it.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>Score: <b id="score">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const siteName = \"Codle\";\n\nfunction show() {\n  // Objective 1: print siteName from inside the function\n}\nshow();\n\nfunction count() {\n  let clicks = 0;\n  clicks = clicks + 1;\n}\ncount();\n// Objective 2: print typeof clicks here, outside count()\n\n\nlet score = 10;\nfunction reset() {\n  let score = 0;   // Objective 3: this makes a NEW local score; the global one never changes\n}\nreset();\ndocument.getElementById(\"score\").textContent = score;\n",
  'objectives' => [
    ['js', 'Inside <code>show()</code>, print the global <code>siteName</code>: functions can read variables declared outside them.',
     '<pre>function show() {\n  console.log(siteName);\n}</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /function\s+show\s*\(\s*\)\s*\{[^}]*console\.log\(\s*siteName\s*\)/.test(src) && logs.indexOf("Codle") >= 0;'],
    ['js', 'After <code>count()</code>, print <code>typeof clicks</code>. It is <code>undefined</code>: <code>clicks</code> only exists inside the function.',
     '<pre>console.log(typeof clicks);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /typeof\s+clicks/.test(src) && logs.indexOf("undefined") >= 0;'],
    ['js', 'Fix <code>reset()</code> so it changes the global <code>score</code> to <code>0</code>: assign without <code>let</code>.',
     '<code>let score = 0</code> inside the function creates a second, local <code>score</code>. Drop the <code>let</code>:<pre>function reset() {\n  score = 0;\n}</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("score");
var body = (/function\s+reset\s*\(\s*\)\s*\{([^}]*)\}/.exec(src) || [])[1] || "";
return !/\b(let|const|var)\s+score\b/.test(body) && /\bscore\s*=\s*0/.test(body) && !!el && el.textContent.trim() === "0";'],
  ],
  'solution' => ['js' => "const siteName = \"Codle\";\n\nfunction show() {\n  console.log(siteName);\n}\nshow();\n\nfunction count() {\n  let clicks = 0;\n  clicks = clicks + 1;\n}\ncount();\nconsole.log(typeof clicks);\n\nlet score = 10;\nfunction reset() {\n  score = 0;\n}\nreset();\ndocument.getElementById(\"score\").textContent = score;\n"],
],

'arrow-functions' => [
  'title' => 'The short way',
  'desc'  => '<p>An <b>arrow function</b> is a shorter way to write a function: <code>const square = n =&gt; n * n;</code>. The parameters go before the arrow, the result after it. If the body is one expression, it is returned automatically. Arrow functions shine when you pass a function to another function, as with <code>.map()</code>.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>7 squared: <b id="square">?</b></p>
  <p id="hello">?</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: rewrite square as an arrow function\nfunction square(n) {\n  return n * n;\n}\ndocument.getElementById(\"square\").textContent = square(7);\n\n// Objective 2: greet(name) returns \"Hi \" + name\n\n\n// Objective 3: double every number with .map() and an arrow function\nconst numbers = [1, 2, 3];\n",
  'objectives' => [
    ['js', 'Rewrite <code>square</code> as an arrow function stored in a <code>const</code>.',
     '<pre>const square = n => n * n;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("square");
return /const\s+square\s*=\s*\(?\s*\w+\s*\)?\s*=>/.test(src) && !/function\s+square/.test(src) && !!el && el.textContent.trim() === "49";'],
    ['js', 'Write an arrow function <code>greet</code> that returns <code>"Hi " + name</code>, and show <code>greet("Ada")</code> in <code>#hello</code>.',
     '<pre>const greet = name => "Hi " + name;\ndocument.getElementById("hello").textContent = greet("Ada");</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("hello");
return /const\s+greet\s*=\s*\(?\s*\w+\s*\)?\s*=>/.test(src) && !!el && el.textContent.trim() === "Hi Ada";'],
    ['js', 'Print <code>numbers.map(n =&gt; n * 2)</code> to the console.',
     '<pre>console.log(numbers.map(n => n * 2));</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /numbers\.map\(\s*\(?\s*\w+\s*\)?\s*=>/.test(src) && logs.indexOf("[2,4,6]") >= 0;'],
  ],
  'solution' => ['js' => "const square = n => n * n;\ndocument.getElementById(\"square\").textContent = square(7);\n\nconst greet = name => \"Hi \" + name;\ndocument.getElementById(\"hello\").textContent = greet(\"Ada\");\n\nconst numbers = [1, 2, 3];\nconsole.log(numbers.map(n => n * 2));\n"],
],

'closures' => [
  'title' => 'Functions that remember',
  'desc'  => '<p>A function can return another function. The inner function keeps access to the variables of the outer one, even after the outer one has finished. That is a <b>closure</b>: a function with a private memory.</p><p>Build a counter you cannot reset from outside.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="out">?</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "// Objective 1: makeCounter() returns a function that adds 1 to its own count and returns it\n\n\n// Objective 2: two counters do not share a count\n\n\n// Objective 3: makeGreeter(greeting) returns a function (name) => greeting + \", \" + name\n",
  'objectives' => [
    ['js', 'Write <code>makeCounter()</code>: it declares <code>let count = 0</code> and returns a function that increases <code>count</code> and returns it. Call the counter three times and print the last result.',
     '<pre>function makeCounter() {\n  let count = 0;\n  return function () {\n    count = count + 1;\n    return count;\n  };\n}\nconst counter = makeCounter();\ncounter();\ncounter();\nconsole.log(counter());</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /function\s+makeCounter\s*\(\s*\)\s*\{[\s\S]*let\s+count\s*=\s*0[\s\S]*return\s+(function|\(?\s*\)?\s*=>)/.test(src) && logs.indexOf("3") >= 0;'],
    ['js', 'Make two counters with <code>makeCounter()</code>. Call the first one twice, then print what the second one returns on its first call: it should be <code>1</code>.',
     '<pre>const a = makeCounter();\nconst b = makeCounter();\na();\na();\nconsole.log(b());</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return (src.match(/makeCounter\s*\(\s*\)/g) || []).length >= 3 && logs.indexOf("1") >= 0;'],
    ['js', 'Write <code>makeGreeter(greeting)</code> that returns a function taking <code>name</code> and returning <code>greeting + ", " + name</code>. Show <code>makeGreeter("Hello")("Ada")</code> in <code>#out</code>.',
     '<pre>function makeGreeter(greeting) {\n  return name => greeting + ", " + name;\n}\nconst hello = makeGreeter("Hello");\ndocument.getElementById("out").textContent = hello("Ada");</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("out");
return /function\s+makeGreeter\s*\(\s*\w+\s*\)|const\s+makeGreeter\s*=/.test(src) && !!el && el.textContent.trim() === "Hello, Ada";'],
  ],
  'solution' => ['js' => "function makeCounter() {\n  let count = 0;\n  return function () {\n    count = count + 1;\n    return count;\n  };\n}\nconst counter = makeCounter();\ncounter();\ncounter();\nconsole.log(counter());\n\nconst a = makeCounter();\nconst b = makeCounter();\na();\na();\nconsole.log(b());\n\nfunction makeGreeter(greeting) {\n  return name => greeting + \", \" + name;\n}\nconst hello = makeGreeter(\"Hello\");\ndocument.getElementById(\"out\").textContent = hello(\"Ada\");\n"],
],

];
