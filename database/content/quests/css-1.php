<?php
// Codle content — CSS · Unit 1 · Selectors & Colors
// Checks read computed styles: colours come back as "rgb(r, g, b)".

return [

'hello-css' => [
  'title' => 'Your first style',
  'desc'  => '<p>CSS tells the browser how things look. A <b>rule</b> names what to style (the selector, like <code>h1</code>) and then lists properties and values in braces: <code>h1 { color: tomato; }</code>.</p><p>The HTML is ready. Style it in the <b>CSS</b> tab.</p>',
  'html'  => <<<'HTML'
<h1>Codle Bakery</h1>
<p>Fresh bread every morning since 1998. Come in and smell it.</p>
HTML,
  'css'   => <<<'CSS'
/* Objective 1: make the heading tomato red */


/* Objective 2: make paragraphs easier to read (font-size 18px) */


/* Objective 3: give the page a background colour */

CSS,
  'js'    => '',
  'objectives' => [
    ['css', 'Give <code>h1</code> the colour <code>tomato</code>.',
     '<pre>h1 {\n  color: tomato;\n}</pre>',
     'var h = doc.querySelector("h1");
return !!h && doc.defaultView.getComputedStyle(h).color === "rgb(255, 99, 71)";'],
    ['css', 'Give <code>p</code> a <code>font-size</code> of <code>18px</code>.',
     '<pre>p {\n  font-size: 18px;\n}</pre>',
     'var p = doc.querySelector("p");
return !!p && doc.defaultView.getComputedStyle(p).fontSize === "18px";'],
    ['css', 'Give <code>body</code> a <code>background</code> colour, for example <code>#f2f4f8</code>.',
     '<pre>body {\n  background: #f2f4f8;\n}</pre>',
     'var b = doc.defaultView.getComputedStyle(doc.body).backgroundColor;
return b !== "rgba(0, 0, 0, 0)" && b !== "transparent";'],
  ],
  'solution' => ['css' => "h1 {\n  color: tomato;\n}\n\np {\n  font-size: 18px;\n}\n\nbody {\n  background: #f2f4f8;\n}\n"],
],

'selectors' => [
  'title' => 'Pick the right elements',
  'desc'  => '<p>A selector decides which elements a rule applies to. <code>h2</code> matches every <code>&lt;h2&gt;</code>. <code>nav a</code> matches links inside a nav (a <b>descendant</b> selector). <code>h1, h2</code> matches both (a <b>group</b>).</p>',
  'html'  => <<<'HTML'
<nav>
  <a href="#">Home</a>
  <a href="#">Menu</a>
  <a href="#">Contact</a>
</nav>

<h1>Codle Bakery</h1>
<h2>Bread</h2>
<p>Sourdough, rye and baguettes. <a href="#">See prices</a>.</p>
<h2>Cakes</h2>
<p>Order two days ahead.</p>
HTML,
  'css'   => <<<'CSS'
body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}
nav { display: flex; gap: 16px; margin-bottom: 24px; }

/* Objective 1: every h2 in #30d158 */


/* Objective 2: links inside the nav without underline */


/* Objective 3: h1 and h2 share one rule */

CSS,
  'js'    => '',
  'objectives' => [
    ['css', 'Colour every <code>h2</code> <code>#30d158</code>.',
     '<pre>h2 {\n  color: #30d158;\n}</pre>',
     'var hs = doc.querySelectorAll("h2");
return hs.length >= 2 && Array.prototype.every.call(hs, function (h) { return doc.defaultView.getComputedStyle(h).color === "rgb(48, 209, 88)"; });'],
    ['css', 'Remove the underline from links inside <code>nav</code> only (<code>text-decoration: none</code>). The link in the paragraph keeps it.',
     'A space between two selectors means "inside":<pre>nav a {\n  text-decoration: none;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle;
var nav = doc.querySelectorAll("nav a"), p = doc.querySelector("p a");
return nav.length >= 3 && Array.prototype.every.call(nav, function (a) { return cs(a).textDecorationLine === "none"; }) && !!p && cs(p).textDecorationLine !== "none";'],
    ['css', 'With one rule for both <code>h1, h2</code>, set <code>font-family: Georgia, serif</code>.',
     'A comma lists several selectors:<pre>h1, h2 {\n  font-family: Georgia, serif;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle;
var ok = function (el) { return !!el && /georgia/i.test(cs(el).fontFamily); };
var src = doc.querySelector("style").textContent;
return ok(doc.querySelector("h1")) && ok(doc.querySelector("h2")) && /h1\s*,\s*h2|h2\s*,\s*h1/.test(src);'],
  ],
  'solution' => ['css' => "body {\n  margin: 0;\n  padding: 24px;\n  font-family: system-ui, sans-serif;\n  background: #f2f4f8;\n  color: #1c1c1e;\n}\nnav { display: flex; gap: 16px; margin-bottom: 24px; }\n\nh2 {\n  color: #30d158;\n}\n\nnav a {\n  text-decoration: none;\n}\n\nh1, h2 {\n  font-family: Georgia, serif;\n}\n"],
],

'colors' => [
  'title' => 'Three ways to say red',
  'desc'  => '<p>Colours can be written as names (<code>tomato</code>), hex codes (<code>#0a84ff</code>) or <code>rgb()</code> values (<code>rgb(85, 85, 85)</code>). Hex and rgb are the same thing written differently: two hex digits per channel, red, green, blue.</p>',
  'html'  => <<<'HTML'
<h1>Colour card</h1>
<div class="swatch">Blue box</div>
<p>Grey text is easier on the eyes than pure black.</p>
HTML,
  'css'   => <<<'CSS'
body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
}
.swatch {
  padding: 24px;
  margin: 16px 0;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 600;
}

/* Objective 1: h1 colour by name */


/* Objective 2: .swatch background as a hex code */


/* Objective 3: p colour with rgb() */

CSS,
  'js'    => '',
  'objectives' => [
    ['css', 'Colour the <code>h1</code> with the named colour <code>tomato</code>.',
     '<pre>h1 { color: tomato; }</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector("h1")).color === "rgb(255, 99, 71)";'],
    ['css', 'Give <code>.swatch</code> the background <code>#0a84ff</code> (hex).',
     '<pre>.swatch { background: #0a84ff; }</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".swatch")).backgroundColor === "rgb(10, 132, 255)";'],
    ['css', 'Colour <code>p</code> with <code>rgb(85, 85, 85)</code>.',
     '<pre>p { color: rgb(85, 85, 85); }</pre>',
     'var src = doc.querySelector("style").textContent;
return doc.defaultView.getComputedStyle(doc.querySelector("p")).color === "rgb(85, 85, 85)" && /rgb\(\s*85\s*,\s*85\s*,\s*85\s*\)/.test(src);'],
  ],
  'solution' => ['css' => "body {\n  margin: 0;\n  padding: 24px;\n  font-family: system-ui, sans-serif;\n  background: #f2f4f8;\n}\n.swatch {\n  padding: 24px;\n  margin: 16px 0;\n  border-radius: 12px;\n  color: #ffffff;\n  font-weight: 600;\n}\n\nh1 { color: tomato; }\n\n.swatch { background: #0a84ff; }\n\np { color: rgb(85, 85, 85); }\n"],
],

'classes-ids' => [
  'title' => 'Classes and ids in CSS',
  'desc'  => '<p>A class selector starts with a dot (<code>.note</code>), an id selector with a hash (<code>#title</code>). Classes are for groups, ids for one element. Two classes on one element can be combined: <code>.note.warning</code> matches only elements that have both.</p>',
  'html'  => <<<'HTML'
<h1 id="title">Kitchen rules</h1>
<p class="note">Wash your hands before you start.</p>
<p class="note">Clean as you go.</p>
<p class="note warning">Never leave the oven on overnight.</p>
HTML,
  'css'   => <<<'CSS'
body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}

/* Objective 1: #title */


/* Objective 2: .note */


/* Objective 3: .note.warning */

CSS,
  'js'    => '',
  'objectives' => [
    ['css', 'Centre the heading with the id selector <code>#title</code> (<code>text-align: center</code>).',
     '<pre>#title {\n  text-align: center;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.getElementById("title")).textAlign === "center";'],
    ['css', 'Give every <code>.note</code> a white background (<code>#ffffff</code>) and <code>12px</code> of padding.',
     '<pre>.note {\n  background: #ffffff;\n  padding: 12px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle, n = doc.querySelectorAll(".note");
return n.length >= 3 && Array.prototype.every.call(n, function (e) { return cs(e).paddingTop === "12px" && cs(e).paddingLeft === "12px"; });'],
    ['css', 'Make the note that is also a <code>warning</code> stand out: with the selector <code>.note.warning</code>, set its colour to <code>#ff453a</code>.',
     'No space between the two classes:<pre>.note.warning {\n  color: #ff453a;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle;
var w = doc.querySelector(".note.warning"), plain = doc.querySelector(".note:not(.warning)");
return !!w && cs(w).color === "rgb(255, 69, 58)" && !!plain && cs(plain).color !== "rgb(255, 69, 58)";'],
  ],
  'solution' => ['css' => "body {\n  margin: 0;\n  padding: 24px;\n  font-family: system-ui, sans-serif;\n  background: #f2f4f8;\n  color: #1c1c1e;\n}\n\n#title {\n  text-align: center;\n}\n\n.note {\n  background: #ffffff;\n  padding: 12px;\n}\n\n.note.warning {\n  color: #ff453a;\n}\n"],
],

];
