<?php
// Codle content — JavaScript · Unit 6 · Modern JS
// promises/fetch finish asynchronously; the learner clicks Check after the output has run.

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

'template-literals' => [
  'title' => 'Text with holes in it',
  'desc'  => '<p>A <b>template literal</b> is a string in backticks (<code>`…`</code>). Inside it, <code>${expression}</code> drops a value or a calculation straight into the text, and line breaks are kept. No more gluing strings with <code>+</code>.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="greeting">?</p>
  <p id="total">?</p>
  <pre id="address">?</pre>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const name = \"Ada\";\nconst price = 45;\nconst quantity = 3;\n\n// Objective 1: `Hello, \${name}!` in #greeting\n\n\n// Objective 2: \"3 loaves cost 135 Kč\" in #total, with the maths inside \${}\n\n\n// Objective 3: a two-line address in #address, in one template literal\n",
  'objectives' => [
    ['js', 'Show <code>Hello, Ada!</code> in <code>#greeting</code> using a template literal with <code>${name}</code>.',
     '<pre>document.getElementById("greeting").textContent = `Hello, ${name}!`;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("greeting");
return /`[^`]*\$\{\s*name\s*\}[^`]*`/.test(src) && !!el && el.textContent.trim() === "Hello, Ada!";'],
    ['js', 'Show <code>3 loaves cost 135 Kč</code> in <code>#total</code>, with <code>${quantity}</code> and <code>${price * quantity}</code> inside the literal.',
     '<pre>document.getElementById("total").textContent = `${quantity} loaves cost ${price * quantity} Kč`;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("total");
return /\$\{\s*price\s*\*\s*quantity\s*\}|\$\{\s*quantity\s*\*\s*price\s*\}/.test(src) && !!el && el.textContent.trim() === "3 loaves cost 135 Kč";'],
    ['js', 'Put a two-line address (street on one line, town on the next) into <code>#address</code> with one template literal that contains a real line break.',
     'Just press Enter inside the backticks:<pre>document.getElementById("address").textContent = `12 Main Street\nTeplice`;</pre>',
     'var el = doc.getElementById("address"), src = doc.scripts[doc.scripts.length - 1].textContent;
return /`[^`]*\n[^`]*`/.test(src) && !!el && el.textContent.trim().split("\n").length >= 2;'],
  ],
  'solution' => ['js' => "const name = \"Ada\";\nconst price = 45;\nconst quantity = 3;\n\ndocument.getElementById(\"greeting\").textContent = `Hello, \${name}!`;\n\ndocument.getElementById(\"total\").textContent = `\${quantity} loaves cost \${price * quantity} Kč`;\n\ndocument.getElementById(\"address\").textContent = `12 Main Street\nTeplice`;\n"],
],

'destructuring' => [
  'title' => 'Unpack it',
  'desc'  => '<p><b>Destructuring</b> pulls values out of objects and arrays into variables in one line: <code>const { name, price } = bread;</code> and <code>const [first, second] = list;</code>. The rest operator <code>...</code> collects whatever is left.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="out">?</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const bread = { name: \"Rye\", price: 45, vegan: true };\nconst queue = [\"Ada\", \"Grace\", \"Linus\", \"Tim\"];\n\n// Objective 1: take name and price out of bread, show \"Rye: 45 Kč\" in #out\n\n\n// Objective 2: take the first two people out of queue and print them\n\n\n// Objective 3: first person and ...others, print how many others there are\n",
  'objectives' => [
    ['js', 'Destructure <code>name</code> and <code>price</code> from <code>bread</code> and show <code>Rye: 45 Kč</code> in <code>#out</code>.',
     '<pre>const { name, price } = bread;\ndocument.getElementById("out").textContent = `${name}: ${price} Kč`;</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("out");
return /const\s*\{\s*name\s*,\s*price\s*\}\s*=\s*bread|const\s*\{\s*price\s*,\s*name\s*\}\s*=\s*bread/.test(src) && !!el && el.textContent.trim() === "Rye: 45 Kč";'],
    ['js', 'Destructure the first two names from <code>queue</code> into <code>first</code> and <code>second</code>, and print both.',
     '<pre>const [first, second] = queue;\nconsole.log(first);\nconsole.log(second);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /const\s*\[\s*first\s*,\s*second\s*\]\s*=\s*queue/.test(src) && logs.indexOf("Ada") >= 0 && logs.indexOf("Grace") >= 0;'],
    ['js', 'Destructure <code>queue</code> into <code>front</code> and the rest <code>...others</code>, and print <code>others.length</code>.',
     '<pre>const [front, ...others] = queue;\nconsole.log(others.length);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /\[\s*\w+\s*,\s*\.\.\.others\s*\]\s*=\s*queue/.test(src) && /others\.length/.test(src) && logs.indexOf("3") >= 0;'],
  ],
  'solution' => ['js' => "const bread = { name: \"Rye\", price: 45, vegan: true };\nconst queue = [\"Ada\", \"Grace\", \"Linus\", \"Tim\"];\n\nconst { name, price } = bread;\ndocument.getElementById(\"out\").textContent = `\${name}: \${price} Kč`;\n\nconst [first, second] = queue;\nconsole.log(first);\nconsole.log(second);\n\nconst [front, ...others] = queue;\nconsole.log(others.length);\n"],
],

'promises' => [
  'title' => 'Later, not now',
  'desc'  => '<p>A <b>promise</b> stands for a value that is not ready yet: the oven is on, the bread comes later. <code>.then()</code> runs when it is ready, <code>.catch()</code> when something went wrong. <code>async</code> functions let you <code>await</code> a promise and write it like ordinary code.</p><p><code>bake()</code> and <code>brokenOven()</code> below return promises. Run the code, wait a second, then check.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="status">Baking…</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "function bake() {\n  return new Promise(resolve => setTimeout(() => resolve(\"Bread is ready\"), 300));\n}\nfunction brokenOven() {\n  return new Promise((resolve, reject) => setTimeout(() => reject(new Error(\"Oven broke\")), 300));\n}\n\n// Objective 1: bake().then(...) prints the result\n\n\n// Objective 2: brokenOven().catch(...) prints the error message\n\n\n// Objective 3: an async function serve() awaits bake() and shows the result in #status\n",
  'objectives' => [
    ['js', 'Call <code>bake()</code> and print its result with <code>.then()</code>.',
     '<pre>bake().then(result => console.log(result));</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /bake\(\)\s*\.then\(/.test(src) && logs.indexOf("Bread is ready") >= 0;'],
    ['js', 'Call <code>brokenOven()</code> and print the error\'s <code>message</code> with <code>.catch()</code>.',
     '<pre>brokenOven().catch(error => console.log(error.message));</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /brokenOven\(\)[\s\S]*\.catch\(/.test(src) && logs.indexOf("Oven broke") >= 0;'],
    ['js', 'Write <code>async function serve()</code> that <code>await</code>s <code>bake()</code> and shows the result in <code>#status</code>; call it.',
     '<pre>async function serve() {\n  const result = await bake();\n  document.getElementById("status").textContent = result;\n}\nserve();</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("status");
return /async\s+function\s+serve|const\s+serve\s*=\s*async/.test(src) && /await\s+bake\(\)/.test(src) && !!el && el.textContent.trim() === "Bread is ready";'],
  ],
  'solution' => ['js' => "function bake() {\n  return new Promise(resolve => setTimeout(() => resolve(\"Bread is ready\"), 300));\n}\nfunction brokenOven() {\n  return new Promise((resolve, reject) => setTimeout(() => reject(new Error(\"Oven broke\")), 300));\n}\n\nbake().then(result => console.log(result));\n\nbrokenOven().catch(error => console.log(error.message));\n\nasync function serve() {\n  const result = await bake();\n  document.getElementById(\"status\").textContent = result;\n}\nserve();\n"],
],

'fetch' => [
  'title' => 'Load data from a URL',
  'desc'  => '<p><code>fetch(url)</code> asks a server for data and returns a promise. The answer is a <b>response</b>; <code>response.json()</code> reads it as JSON, which is another promise. The URL here is a <code>data:</code> address with the JSON built in, so it works offline.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>Breads on the menu: <b id="count">?</b></p>
  <ul id="list"></ul>
  <p id="error"></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const url = 'data:application/json,{\"breads\":[\"Rye\",\"Sourdough\",\"Baguette\"]}';\nconst badUrl = \"data:text/plain,not json\";\n\n// Objective 1: fetch(url), read it as JSON and show data.breads.length in #count\n\n\n// Objective 2: add one <li> per bread to #list\n\n\n// Objective 3: fetch(badUrl), read it as JSON, and on failure show \"Could not load the menu\" in #error\n",
  'objectives' => [
    ['js', 'Fetch <code>url</code>, read the response with <code>.json()</code>, and show <code>data.breads.length</code> in <code>#count</code>.',
     '<pre>fetch(url)\n  .then(response => response.json())\n  .then(data => {\n    document.getElementById("count").textContent = data.breads.length;\n  });</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("count");
return /fetch\(\s*url\s*\)/.test(src) && /\.json\(\)/.test(src) && !!el && el.textContent.trim() === "3";'],
    ['js', 'In the same <code>.then()</code>, add an <code>&lt;li&gt;</code> for every bread to <code>#list</code>.',
     '<pre>for (const bread of data.breads) {\n  const li = document.createElement("li");\n  li.textContent = bread;\n  document.getElementById("list").appendChild(li);\n}</pre>',
     'var li = doc.querySelectorAll("#list li");
return li.length === 3 && li[0].textContent.trim() === "Rye";'],
    ['js', 'Fetch <code>badUrl</code> and read it as JSON too; that fails, so add a <code>.catch()</code> that shows <code>Could not load the menu</code> in <code>#error</code>.',
     '<pre>fetch(badUrl)\n  .then(response => response.json())\n  .catch(() => {\n    document.getElementById("error").textContent = "Could not load the menu";\n  });</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("error");
return /fetch\(\s*badUrl\s*\)/.test(src) && /\.catch\(/.test(src) && !!el && el.textContent.trim() === "Could not load the menu";'],
  ],
  'solution' => ['js' => "const url = 'data:application/json,{\"breads\":[\"Rye\",\"Sourdough\",\"Baguette\"]}';\nconst badUrl = \"data:text/plain,not json\";\n\nfetch(url)\n  .then(response => response.json())\n  .then(data => {\n    document.getElementById(\"count\").textContent = data.breads.length;\n    for (const bread of data.breads) {\n      const li = document.createElement(\"li\");\n      li.textContent = bread;\n      document.getElementById(\"list\").appendChild(li);\n    }\n  });\n\nfetch(badUrl)\n  .then(response => response.json())\n  .catch(() => {\n    document.getElementById(\"error\").textContent = \"Could not load the menu\";\n  });\n"],
],

];
