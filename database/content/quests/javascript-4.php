<?php
// Codle content — JavaScript · Unit 4 · Arrays & Objects

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

'arrays' => [
  'title' => 'A list of things',
  'desc'  => '<p>An <b>array</b> holds many values in order: <code>const fruits = ["apple", "pear"]</code>. Items are numbered from <b>0</b>: <code>fruits[0]</code> is the first. <code>.length</code> says how many there are and <code>.push()</code> adds one at the end.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>First: <b id="first">?</b></p>
  <p>Last: <b id="last">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const fruits = [\"apple\", \"pear\"];\n\n// Objective 1: add \"plum\" with push(), then print fruits.length\n\n\n// Objective 2: show the first fruit in #first\n\n\n// Objective 3: show the last fruit in #last (without writing 2)\n",
  'objectives' => [
    ['js', 'Add <code>"plum"</code> with <code>fruits.push()</code> and print <code>fruits.length</code>.',
     '<pre>fruits.push("plum");\nconsole.log(fruits.length);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /fruits\.push\(\s*"plum"\s*\)/.test(src) && /fruits\.length/.test(src) && logs.indexOf("3") >= 0;'],
    ['js', 'Show the first fruit in <code>#first</code> using its index.',
     '<pre>document.getElementById("first").textContent = fruits[0];</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("first");
return /fruits\[\s*0\s*\]/.test(src) && !!el && el.textContent.trim() === "apple";'],
    ['js', 'Show the last fruit in <code>#last</code> with <code>fruits[fruits.length - 1]</code>, so it works however long the list is.',
     '<pre>document.getElementById("last").textContent = fruits[fruits.length - 1];</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("last");
return /fruits\[\s*fruits\.length\s*-\s*1\s*\]|fruits\.at\(\s*-1\s*\)/.test(src) && !!el && el.textContent.trim() === "plum";'],
  ],
  'solution' => ['js' => "const fruits = [\"apple\", \"pear\"];\n\nfruits.push(\"plum\");\nconsole.log(fruits.length);\n\ndocument.getElementById(\"first\").textContent = fruits[0];\n\ndocument.getElementById(\"last\").textContent = fruits[fruits.length - 1];\n"],
],

'array-methods' => [
  'title' => 'Map, filter, join',
  'desc'  => '<p>Arrays come with methods that take a function: <code>.map()</code> makes a new array by changing every item, <code>.filter()</code> keeps only the items the function says yes to, and <code>.join(", ")</code> glues the items into one string.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="menu">?</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const prices = [10, 20, 30];\nconst breads = [\"Rye\", \"Sourdough\", \"Baguette\"];\n\n// Objective 1: double every price with map() and print the new array\n\n\n// Objective 2: keep only prices over 15 with filter() and print them\n\n\n// Objective 3: join the breads with \", \" and show them in #menu\n",
  'objectives' => [
    ['js', 'Print <code>prices</code> with every price doubled, using <code>.map()</code>.',
     '<pre>console.log(prices.map(p => p * 2));</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /prices\.map\(/.test(src) && logs.indexOf("[20,40,60]") >= 0;'],
    ['js', 'Print only the prices over 15, using <code>.filter()</code>.',
     '<pre>console.log(prices.filter(p => p > 15));</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /prices\.filter\(/.test(src) && logs.indexOf("[20,30]") >= 0;'],
    ['js', 'Show the breads in <code>#menu</code> as one line separated by commas, using <code>.join(", ")</code>.',
     '<pre>document.getElementById("menu").textContent = breads.join(", ");</pre>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("menu");
return /breads\.join\(/.test(src) && !!el && el.textContent.trim() === "Rye, Sourdough, Baguette";'],
  ],
  'solution' => ['js' => "const prices = [10, 20, 30];\nconst breads = [\"Rye\", \"Sourdough\", \"Baguette\"];\n\nconsole.log(prices.map(p => p * 2));\n\nconsole.log(prices.filter(p => p > 15));\n\ndocument.getElementById(\"menu\").textContent = breads.join(\", \");\n"],
],

'objects' => [
  'title' => 'Things with properties',
  'desc'  => '<p>An <b>object</b> groups named values: <code>const bread = { name: "Rye", price: 45 }</code>. Read one with a dot (<code>bread.name</code>), add or change one by assigning (<code>bread.weight = 500</code>). A function stored in an object is a <b>method</b> and can use <code>this</code> to reach the other properties.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p id="desc">?</p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const bread = {\n  name: \"Rye\",\n  price: 45,\n  vegan: true\n};\n\n// Objective 1: print bread.name\n\n\n// Objective 2: add a weight of 500 and print it\n\n\n// Objective 3: a describe() method that returns name + \" — \" + price + \" Kč\"\n",
  'objectives' => [
    ['js', 'Print <code>bread.name</code>.',
     '<pre>console.log(bread.name);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /bread\.name/.test(src) && logs.indexOf("Rye") >= 0;'],
    ['js', 'Add a property <code>weight</code> with the value <code>500</code> to <code>bread</code>, then print it.',
     '<pre>bread.weight = 500;\nconsole.log(bread.weight);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /bread\.weight\s*=\s*500|weight\s*:\s*500/.test(src) && logs.indexOf("500") >= 0;'],
    ['js', 'Add a method <code>describe</code> that returns <code>this.name + " — " + this.price + " Kč"</code>, and show <code>bread.describe()</code> in <code>#desc</code>.',
     'Inside the braces of the object:<pre>describe: function () {\n  return this.name + " — " + this.price + " Kč";\n}</pre>Or add it later with <code>bread.describe = function () { … };</code>',
     'var src = doc.scripts[doc.scripts.length - 1].textContent, el = doc.getElementById("desc");
return /describe\s*[:=]\s*function|describe\s*\(\s*\)\s*\{/.test(src) && /this\.name/.test(src) && !!el && el.textContent.trim() === "Rye — 45 Kč";'],
  ],
  'solution' => ['js' => "const bread = {\n  name: \"Rye\",\n  price: 45,\n  vegan: true,\n  describe: function () {\n    return this.name + \" — \" + this.price + \" Kč\";\n  }\n};\n\nconsole.log(bread.name);\n\nbread.weight = 500;\nconsole.log(bread.weight);\n\ndocument.getElementById(\"desc\").textContent = bread.describe();\n"],
],

'json' => [
  'title' => 'Data as text',
  'desc'  => '<p><b>JSON</b> is how data travels between programs: an object written as text, with keys in double quotes. <code>JSON.parse(text)</code> turns the text into a real object; <code>JSON.stringify(object)</code> turns an object back into text.</p>',
  'html'  => <<<'HTML'
<section class="card">
  <p>First item: <b id="first">?</b></p>
</section>

HTML,
  'css'   => $card . "\n",
  'js'    => "const text = '{\"customer\": \"Ada\", \"items\": [\"Rye\", \"Baguette\"]}';\n\n// Objective 1: parse the text into an object called order and print how many items it has\n\n\n// Objective 2: show the first item in #first\n\n\n// Objective 3: turn this object into JSON text and print it\nconst bread = { name: \"Rye\", price: 45 };\n",
  'objectives' => [
    ['js', 'Parse <code>text</code> with <code>JSON.parse()</code> into <code>order</code>, and print <code>order.items.length</code>.',
     '<pre>const order = JSON.parse(text);\nconsole.log(order.items.length);</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /JSON\.parse\(\s*text\s*\)/.test(src) && logs.indexOf("2") >= 0;'],
    ['js', 'Show the first item of the order in <code>#first</code>.',
     '<pre>document.getElementById("first").textContent = order.items[0];</pre>',
     'var el = doc.getElementById("first");
return !!el && el.textContent.trim() === "Rye";'],
    ['js', 'Print <code>bread</code> as JSON text with <code>JSON.stringify()</code>.',
     '<pre>console.log(JSON.stringify(bread));</pre>',
     'var logs = doc.defaultView.__codleLogs || [], src = doc.scripts[doc.scripts.length - 1].textContent;
return /JSON\.stringify\(\s*bread\s*\)/.test(src) && logs.indexOf("{\"name\":\"Rye\",\"price\":45}") >= 0;'],
  ],
  'solution' => ['js' => "const text = '{\"customer\": \"Ada\", \"items\": [\"Rye\", \"Baguette\"]}';\n\nconst order = JSON.parse(text);\nconsole.log(order.items.length);\n\ndocument.getElementById(\"first\").textContent = order.items[0];\n\nconst bread = { name: \"Rye\", price: 45 };\nconsole.log(JSON.stringify(bread));\n"],
],

];
