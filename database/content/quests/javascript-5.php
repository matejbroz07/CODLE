<?php
// Codle content — JavaScript · Unit 5 · The DOM
// The events quest clicks the buttons from inside the check (doc.getElementById("btn").click()).

$page = <<<'CSS'
body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  background: #f2f4f8;
  color: #1c1c1e;
}

h1 { margin: 0 0 12px; }
p { margin: 0 0 10px; }
ul { padding-left: 20px; }
button, input {
  padding: 8px 14px;
  font: inherit;
  border: 1px solid #c7ccd4;
  border-radius: 8px;
}
button { color: #ffffff; background: #0a84ff; border-color: #0a84ff; cursor: pointer; }
.highlight { background: #fff3b0; }
.hidden { display: none; }
CSS;

return [

'selecting-elements' => [
  'title' => 'Find things on the page',
  'desc'  => '<p>JavaScript reaches into the page through the <b>DOM</b>. <code>document.getElementById("id")</code> finds one element by id, <code>document.querySelector(".class")</code> finds the first match of any CSS selector, and <code>querySelectorAll()</code> finds all of them.</p>',
  'html'  => <<<'HTML'
<h1 id="title">Hello</h1>
<p class="lead">Today's bread is rye.</p>
<ul>
  <li>Rye</li>
  <li>Sourdough</li>
  <li>Baguette</li>
</ul>
HTML,
  'css'   => $page,
  'js'    => "// Objective 1: find #title with getElementById and change its text to \"Welcome\"\n\n\n// Objective 2: find .lead with querySelector and print its text\n\n\n// Objective 3: find all <li> with querySelectorAll and print how many there are\n",
  'objectives' => [
    ['js', 'Find <code>#title</code> with <code>getElementById</code> and set its <code>textContent</code> to <code>Welcome</code>.',
     '<pre>const title = document.getElementById("title");\ntitle.textContent = "Welcome";</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, h = doc.getElementById("title");
return /getElementById\(\s*"title"\s*\)/.test(src) && !!h && h.textContent.trim() === "Welcome";'],
    ['js', 'Find <code>.lead</code> with <code>querySelector</code> and print its text.',
     '<pre>const lead = document.querySelector(".lead");\nconsole.log(lead.textContent);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /querySelector\(\s*"\.lead"\s*\)/.test(src) && logs.some(function (l) { return /today\'s bread is rye/i.test(l); });'],
    ['js', 'Find every <code>&lt;li&gt;</code> with <code>querySelectorAll</code> and print how many there are.',
     '<pre>const items = document.querySelectorAll("li");\nconsole.log(items.length);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /querySelectorAll\(\s*"li"\s*\)/.test(src) && logs.indexOf("3") >= 0;'],
  ],
  'solution' => ['js' => "const title = document.getElementById(\"title\");\ntitle.textContent = \"Welcome\";\n\nconst lead = document.querySelector(\".lead\");\nconsole.log(lead.textContent);\n\nconst items = document.querySelectorAll(\"li\");\nconsole.log(items.length);\n"],
],

'changing-content' => [
  'title' => 'Change what you see',
  'desc'  => '<p><code>textContent</code> replaces the text of an element. <code>innerHTML</code> replaces it with HTML, tags and all. Attributes are properties too: <code>link.href = "…"</code> changes where a link goes.</p>',
  'html'  => <<<'HTML'
<h1>Cart</h1>
<p id="count">0 items</p>
<p id="note"></p>
<a id="checkout" href="#">Go to checkout</a>
HTML,
  'css'   => $page,
  'js'    => "const items = [\"Rye\", \"Baguette\", \"Brioche\"];\n\n// Objective 1: show \"3 items\" in #count (use items.length)\n\n\n// Objective 2: put \"Free delivery <strong>today</strong>\" into #note with innerHTML\n\n\n// Objective 3: point the #checkout link at \"https://example.com/checkout\"\n",
  'objectives' => [
    ['js', 'Set the text of <code>#count</code> to <code>3 items</code>, built from <code>items.length</code>.',
     '<pre>document.getElementById("count").textContent = items.length + " items";</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("count");
return /items\.length/.test(src) && !!el && el.textContent.trim() === "3 items";'],
    ['js', 'Put <code>Free delivery &lt;strong&gt;today&lt;/strong&gt;</code> into <code>#note</code> with <code>innerHTML</code>, so the word is bold.',
     '<pre>document.getElementById("note").innerHTML = "Free delivery <strong>today</strong>";</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("note");
return /innerHTML/.test(src) && !!el && !!el.querySelector("strong") && /free delivery/i.test(el.textContent);'],
    ['js', 'Change the <code>href</code> of <code>#checkout</code> to <code>https://example.com/checkout</code>.',
     '<pre>document.getElementById("checkout").href = "https://example.com/checkout";</pre>',
     'var a = doc.getElementById("checkout");
return !!a && a.getAttribute("href") === "https://example.com/checkout";'],
  ],
  'solution' => ['js' => "const items = [\"Rye\", \"Baguette\", \"Brioche\"];\n\ndocument.getElementById(\"count\").textContent = items.length + \" items\";\n\ndocument.getElementById(\"note\").innerHTML = \"Free delivery <strong>today</strong>\";\n\ndocument.getElementById(\"checkout\").href = \"https://example.com/checkout\";\n"],
],

'styles-classes' => [
  'title' => 'Styles from JavaScript',
  'desc'  => '<p><code>element.style.color = "tomato"</code> sets one CSS property directly. For anything bigger, keep the look in CSS and switch classes: <code>classList.add("highlight")</code>, <code>classList.remove()</code>, and <code>classList.toggle()</code>, which adds the class if it is missing and removes it if it is there.</p>',
  'html'  => <<<'HTML'
<h1 id="title">Today's special</h1>
<p id="offer">Two baguettes for the price of one.</p>
<p id="old">Yesterday's special: rye.</p>
HTML,
  'css'   => $page,
  'js'    => "const title = document.getElementById(\"title\");\nconst offer = document.getElementById(\"offer\");\nconst old = document.getElementById(\"old\");\n\n// Objective 1: title in tomato red via .style\n\n\n// Objective 2: add the class \"highlight\" to offer\n\n\n// Objective 3: toggle the class \"hidden\" on old\n",
  'objectives' => [
    ['js', 'Colour <code>title</code> <code>tomato</code> with <code>.style.color</code>.',
     '<pre>title.style.color = "tomato";</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, h = doc.getElementById("title");
return /title\.style\.color\s*=/.test(src) && doc.defaultView.getComputedStyle(h).color === "rgb(255, 99, 71)";'],
    ['js', 'Add the class <code>highlight</code> to <code>offer</code> with <code>classList.add()</code>.',
     '<pre>offer.classList.add("highlight");</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /classList\.add\(\s*"highlight"\s*\)/.test(src) && doc.getElementById("offer").classList.contains("highlight");'],
    ['js', 'Hide <code>old</code> by toggling the class <code>hidden</code> with <code>classList.toggle()</code>.',
     '<pre>old.classList.toggle("hidden");</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /classList\.toggle\(\s*"hidden"\s*\)/.test(src) && doc.getElementById("old").classList.contains("hidden");'],
  ],
  'solution' => ['js' => "const title = document.getElementById(\"title\");\nconst offer = document.getElementById(\"offer\");\nconst old = document.getElementById(\"old\");\n\ntitle.style.color = \"tomato\";\n\noffer.classList.add(\"highlight\");\n\nold.classList.toggle(\"hidden\");\n"],
],

'events' => [
  'title' => 'When something happens',
  'desc'  => '<p>An <b>event listener</b> runs a function when something happens: <code>button.addEventListener("click", () =&gt; { … })</code>. Clicks, key presses and typing (<code>"input"</code>) are all events. The checker will press the buttons for you.</p>',
  'html'  => <<<'HTML'
<h1>Counter</h1>
<p>Clicks: <b id="count">0</b></p>
<button id="btn">Click me</button>
<button id="reset">Reset</button>

<p><input id="name" placeholder="Type your name"></p>
<p>Hello, <b id="preview">stranger</b>!</p>
HTML,
  'css'   => $page,
  'js'    => "let clicks = 0;\nconst count = document.getElementById(\"count\");\n\n// Objective 1: every click on #btn adds 1 to clicks and shows it in #count\n\n\n// Objective 2: #reset sets clicks back to 0\n\n\n// Objective 3: typing in #name shows the text in #preview (the \"input\" event)\n",
  'objectives' => [
    ['js', 'Listen for <code>click</code> on <code>#btn</code>: add 1 to <code>clicks</code> and show it in <code>#count</code>.',
     '<pre>document.getElementById("btn").addEventListener("click", () => {\n  clicks = clicks + 1;\n  count.textContent = clicks;\n});</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, c = doc.getElementById("count");
if (!/addEventListener\(\s*"click"/.test(src)) return false;
var before = parseInt(c.textContent, 10) || 0;
doc.getElementById("btn").click();
doc.getElementById("btn").click();
return parseInt(c.textContent, 10) === before + 2;'],
    ['js', 'Listen for <code>click</code> on <code>#reset</code>: set <code>clicks</code> to 0 and show it.',
     '<pre>document.getElementById("reset").addEventListener("click", () => {\n  clicks = 0;\n  count.textContent = clicks;\n});</pre>',
     'var c = doc.getElementById("count");
doc.getElementById("btn").click();
doc.getElementById("reset").click();
return c.textContent.trim() === "0";'],
    ['js', 'Listen for <code>input</code> on <code>#name</code> and copy its <code>value</code> into <code>#preview</code>.',
     '<pre>const name = document.getElementById("name");\nname.addEventListener("input", () => {\n  document.getElementById("preview").textContent = name.value;\n});</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, i = doc.getElementById("name");
if (!/addEventListener\(\s*"input"/.test(src)) return false;
i.value = "Ada";
i.dispatchEvent(new doc.defaultView.Event("input", { bubbles: true }));
return doc.getElementById("preview").textContent.trim() === "Ada";'],
  ],
  'solution' => ['js' => "let clicks = 0;\nconst count = document.getElementById(\"count\");\n\ndocument.getElementById(\"btn\").addEventListener(\"click\", () => {\n  clicks = clicks + 1;\n  count.textContent = clicks;\n});\n\ndocument.getElementById(\"reset\").addEventListener(\"click\", () => {\n  clicks = 0;\n  count.textContent = clicks;\n});\n\nconst name = document.getElementById(\"name\");\nname.addEventListener(\"input\", () => {\n  document.getElementById(\"preview\").textContent = name.value;\n});\n"],
],

'creating-elements' => [
  'title' => 'Build the page',
  'desc'  => '<p>New elements are made with <code>document.createElement("li")</code>, filled with <code>textContent</code>, and put on the page with <code>appendChild()</code> (at the end) or <code>prepend()</code> (at the start). <code>element.remove()</code> takes one away.</p>',
  'html'  => <<<'HTML'
<h1>Menu</h1>
<ul id="list">
  <li id="old">Yesterday's leftovers</li>
</ul>
HTML,
  'css'   => $page,
  'js'    => "const breads = [\"Rye\", \"Sourdough\", \"Baguette\"];\nconst list = document.getElementById(\"list\");\n\n// Objective 1: remove #old\n\n\n// Objective 2: one <li> per bread, created with createElement and added with appendChild\n\n\n// Objective 3: prepend an <li> that says \"Bread of the day\" at the top\n",
  'objectives' => [
    ['js', 'Remove the <code>#old</code> item with <code>.remove()</code>.',
     '<pre>document.getElementById("old").remove();</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent;
return /\.remove\(\s*\)/.test(src) && !doc.getElementById("old");'],
    ['js', 'For every bread, create an <code>&lt;li&gt;</code> with <code>createElement</code>, set its text and <code>appendChild</code> it to <code>list</code>.',
     '<pre>for (const bread of breads) {\n  const li = document.createElement("li");\n  li.textContent = bread;\n  list.appendChild(li);\n}</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, li = doc.querySelectorAll("#list li");
var names = Array.prototype.map.call(li, function (l) { return l.textContent.trim(); });
return /createElement\(\s*"li"\s*\)/.test(src) && /appendChild\(/.test(src) && names.indexOf("Rye") >= 0 && names.indexOf("Sourdough") >= 0 && names.indexOf("Baguette") >= 0;'],
    ['js', 'Create one more <code>&lt;li&gt;</code> that says <code>Bread of the day</code> and put it first with <code>list.prepend()</code>.',
     '<pre>const special = document.createElement("li");\nspecial.textContent = "Bread of the day";\nlist.prepend(special);</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, first = doc.querySelector("#list li");
return /\.prepend\(/.test(src) && !!first && first.textContent.trim() === "Bread of the day";'],
  ],
  'solution' => ['js' => "const breads = [\"Rye\", \"Sourdough\", \"Baguette\"];\nconst list = document.getElementById(\"list\");\n\ndocument.getElementById(\"old\").remove();\n\nfor (const bread of breads) {\n  const li = document.createElement(\"li\");\n  li.textContent = bread;\n  list.appendChild(li);\n}\n\nconst special = document.createElement(\"li\");\nspecial.textContent = \"Bread of the day\";\nlist.prepend(special);\n"],
],

];
