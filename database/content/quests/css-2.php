<?php
// Codle content — CSS · Unit 2 · Text & Fonts

$base = <<<'CSS'
body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}
CSS;

return [

'fonts' => [
  'title' => 'Type matters',
  'desc'  => '<p><code>font-family</code> picks the typeface. List a few, separated by commas, and end with a generic one like <code>serif</code> or <code>sans-serif</code>: the browser uses the first font it has. <code>font-size</code> sets the size and <code>font-weight</code> how bold it is (<code>400</code> normal, <code>700</code> bold).</p>',
  'html'  => <<<'HTML'
<h1>The Daily Loaf</h1>
<p class="lead">News from the bakery, every Monday.</p>
<p>This week we tried a new rye recipe. The crust is darker and the crumb is softer.</p>
HTML,
  'css'   => $base . "\n\n/* Objective 1: body font */\n\n\n/* Objective 2: h1 size */\n\n\n/* Objective 3: .lead weight */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Set the <code>body</code> font to <code>Georgia</code> with <code>serif</code> as the fallback.',
     '<pre>body {\n  font-family: Georgia, serif;\n}</pre>',
     'var f = doc.defaultView.getComputedStyle(doc.body).fontFamily;
return /georgia/i.test(f) && /serif/i.test(f);'],
    ['css', 'Make the <code>h1</code> <code>40px</code> big.',
     '<pre>h1 {\n  font-size: 40px;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector("h1")).fontSize === "40px";'],
    ['css', 'Make <code>.lead</code> bold with <code>font-weight: 700</code> and <code>20px</code> big.',
     '<pre>.lead {\n  font-weight: 700;\n  font-size: 20px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".lead"));
return cs.fontWeight === "700" && cs.fontSize === "20px";'],
  ],
  'solution' => ['css' => $base . "\n\nbody {\n  font-family: Georgia, serif;\n}\n\nh1 {\n  font-size: 40px;\n}\n\n.lead {\n  font-weight: 700;\n  font-size: 20px;\n}\n"],
],

'text-styling' => [
  'title' => 'Dress up the text',
  'desc'  => '<p><code>text-transform: uppercase</code> writes text in capitals without changing the HTML. <code>text-decoration</code> adds or removes lines (<code>underline</code>, <code>line-through</code>, <code>none</code>). <code>font-style: italic</code> slants it.</p>',
  'html'  => <<<'HTML'
<p class="label">Special offer</p>
<h1>Sourdough loaf</h1>
<p>Price: <span class="old-price">89 Kč</span> <span class="price">69 Kč</span></p>
<p class="quote">"The best bread in town." — a happy customer</p>
HTML,
  'css'   => $base . "\n.price { font-weight: 700; color: #30d158; }\n\n/* Objective 1: .label */\n\n\n/* Objective 2: .old-price */\n\n\n/* Objective 3: .quote */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Write <code>.label</code> in capitals with <code>text-transform: uppercase</code>.',
     '<pre>.label {\n  text-transform: uppercase;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".label")).textTransform === "uppercase";'],
    ['css', 'Strike through <code>.old-price</code> with <code>text-decoration: line-through</code>.',
     '<pre>.old-price {\n  text-decoration: line-through;\n}</pre>',
     'return /line-through/.test(doc.defaultView.getComputedStyle(doc.querySelector(".old-price")).textDecorationLine);'],
    ['css', 'Make <code>.quote</code> italic.',
     '<pre>.quote {\n  font-style: italic;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".quote")).fontStyle === "italic";'],
  ],
  'solution' => ['css' => $base . "\n.price { font-weight: 700; color: #30d158; }\n\n.label {\n  text-transform: uppercase;\n}\n\n.old-price {\n  text-decoration: line-through;\n}\n\n.quote {\n  font-style: italic;\n}\n"],
],

'text-spacing' => [
  'title' => 'Room to breathe',
  'desc'  => '<p><code>text-align</code> lines text up left, right or centre. <code>line-height</code> is the space between lines; <code>1.6</code> means 1.6 times the font size and is comfortable for reading. <code>letter-spacing</code> spreads the letters apart, nice for small capitals.</p>',
  'html'  => <<<'HTML'
<p class="label">Our story</p>
<h1>Codle Bakery</h1>
<p>We opened in 1998 with one oven and a lot of hope. Today we bake forty kinds of bread, cakes for every birthday in town, and the occasional experiment that only the staff get to eat.</p>
HTML,
  'css'   => $base . "\n.label { text-transform: uppercase; font-size: 12px; font-weight: 700; color: #555; }\n\n/* Objective 1: centre the h1 and the label */\n\n\n/* Objective 2: line-height for p */\n\n\n/* Objective 3: letter-spacing for .label */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Centre the <code>h1</code> and the <code>.label</code> with <code>text-align: center</code>.',
     '<pre>h1, .label {\n  text-align: center;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle;
return cs(doc.querySelector("h1")).textAlign === "center" && cs(doc.querySelector(".label")).textAlign === "center";'],
    ['css', 'Give <code>p</code> a <code>line-height</code> of <code>1.6</code>.',
     '<pre>p {\n  line-height: 1.6;\n}</pre>',
     'var p = doc.querySelectorAll("p")[1], cs = doc.defaultView.getComputedStyle(p);
return parseFloat(cs.lineHeight) >= parseFloat(cs.fontSize) * 1.55 && parseFloat(cs.lineHeight) <= parseFloat(cs.fontSize) * 1.65;'],
    ['css', 'Spread the letters of <code>.label</code> with <code>letter-spacing: 2px</code>.',
     '<pre>.label {\n  letter-spacing: 2px;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".label")).letterSpacing === "2px";'],
  ],
  'solution' => ['css' => $base . "\n.label { text-transform: uppercase; font-size: 12px; font-weight: 700; color: #555; }\n\nh1, .label {\n  text-align: center;\n}\n\np {\n  line-height: 1.6;\n}\n\n.label {\n  letter-spacing: 2px;\n}\n"],
],

'web-fonts' => [
  'title' => 'Fonts from the web',
  'desc'  => '<p>Fonts the visitor does not have can be loaded from the web. Google Fonts gives you an <code>@import</code> line to paste at the top of your CSS; after that the font name works in <code>font-family</code>. Always keep a generic fallback after it, for the moment before the font arrives.</p><p>The editor is offline, so the font will not actually show. The CSS is what counts.</p>',
  'html'  => <<<'HTML'
<h1>Codle Bakery</h1>
<p>Baked with patience and a very old oven.</p>
HTML,
  'css'   => "/* Objective 1: paste the import line here (before everything else) */\n\n\n" . $base . "\n\n/* Objective 2 + 3: use the font */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'At the very top, import the Inter font: <code>@import url("https://fonts.googleapis.com/css2?family=Inter&amp;display=swap");</code>',
     'Copy the line exactly; it has to be the first rule in the file.',
     'var src = doc.querySelector("style").textContent;
return /^\s*(\/\*[\s\S]*?\*\/\s*)*@import\s+url\(["\']?https:\/\/fonts\.googleapis\.com\/css2\?family=Inter[^)]*\)\s*;/.test(src);'],
    ['css', 'Use it: set <code>font-family</code> of <code>h1</code> to <code>"Inter"</code> with <code>sans-serif</code> as the fallback.',
     '<pre>h1 {\n  font-family: "Inter", sans-serif;\n}</pre>',
     'var f = doc.defaultView.getComputedStyle(doc.querySelector("h1")).fontFamily;
return /inter/i.test(f) && /sans-serif/i.test(f);'],
    ['css', 'Give <code>p</code> a different web font the same way: import <code>Lora</code> too (<code>family=Lora</code>) and use it with the <code>serif</code> fallback.',
     'You can import both at once:<pre>@import url("https://fonts.googleapis.com/css2?family=Inter&family=Lora&display=swap");</pre>and then <code>p { font-family: "Lora", serif; }</code>.',
     'var src = doc.querySelector("style").textContent, f = doc.defaultView.getComputedStyle(doc.querySelector("p")).fontFamily;
return /family=Lora/.test(src) && /lora/i.test(f) && /serif/i.test(f);'],
  ],
  'solution' => ['css' => "@import url(\"https://fonts.googleapis.com/css2?family=Inter&family=Lora&display=swap\");\n\n" . $base . "\n\nh1 {\n  font-family: \"Inter\", sans-serif;\n}\n\np {\n  font-family: \"Lora\", serif;\n}\n"],
],

];
