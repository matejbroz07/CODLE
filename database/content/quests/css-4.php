<?php
// Codle content — CSS · Unit 4 · Layout

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

'display' => [
  'title' => 'Block, inline, gone',
  'desc'  => '<p><code>display</code> decides how an element takes up space. <code>block</code> elements (like <code>&lt;p&gt;</code>) start on a new line and stretch across; <code>inline</code> ones (like <code>&lt;a&gt;</code>) sit in the text. <code>inline-block</code> sits in the text but accepts width, height and padding. <code>none</code> removes the element completely.</p>',
  'html'  => <<<'HTML'
<nav>
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">Bread</a></li>
    <li><a href="#">Cakes</a></li>
  </ul>
</nav>

<h1>Rye loaf <span class="tag">new</span> <span class="tag">vegan</span></h1>
<p class="draft">DRAFT: price to be confirmed</p>
<p>Dark, dense and a little sour.</p>
HTML,
  'css'   => $base . "\nnav ul { padding: 0; margin: 0 0 20px; list-style: none; }\n.tag { font-size: 12px; font-weight: 700; color: #fff; background: #30d158; border-radius: 999px; }\n\n/* Objective 1: menu items side by side */\n\n\n/* Objective 2: .tag with padding */\n\n\n/* Objective 3: hide .draft */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Put the menu items side by side: <code>nav li { display: inline; }</code> (and give them <code>margin-right: 16px</code>).',
     '<pre>nav li {\n  display: inline;\n  margin-right: 16px;\n}</pre>',
     'var li = doc.querySelectorAll("nav li");
return li.length === 3 && Math.abs(li[0].getBoundingClientRect().top - li[2].getBoundingClientRect().top) < 2;'],
    ['css', 'Make <code>.tag</code> <code>inline-block</code> with <code>2px 10px</code> padding.',
     'Padding on an inline element does not push the line apart; inline-block fixes that:<pre>.tag {\n  display: inline-block;\n  padding: 2px 10px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".tag"));
return cs.display === "inline-block" && cs.paddingLeft === "10px" && cs.paddingTop === "2px";'],
    ['css', 'Hide the <code>.draft</code> paragraph with <code>display: none</code>.',
     '<pre>.draft {\n  display: none;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".draft")).display === "none";'],
  ],
  'solution' => ['css' => $base . "\nnav ul { padding: 0; margin: 0 0 20px; list-style: none; }\n.tag { font-size: 12px; font-weight: 700; color: #fff; background: #30d158; border-radius: 999px; }\n\nnav li {\n  display: inline;\n  margin-right: 16px;\n}\n\n.tag {\n  display: inline-block;\n  padding: 2px 10px;\n}\n\n.draft {\n  display: none;\n}\n"],
],

'flexbox' => [
  'title' => 'Things in a row',
  'desc'  => '<p><code>display: flex</code> lays the children of an element out in a row. <code>gap</code> puts space between them. <code>flex: 1</code> on a child lets it grow and take the leftover room.</p>',
  'html'  => <<<'HTML'
<div class="row">
  <div class="item">Bread</div>
  <div class="item grow">Search our 40 kinds of bread…</div>
  <div class="item">Cart</div>
</div>
HTML,
  'css'   => $base . "\n.item { padding: 12px 16px; background: #ffffff; border-radius: 10px; }\n.grow { color: #555; }\n\n/* Objective 1: .row as a flex row */\n\n\n/* Objective 2: gap */\n\n\n/* Objective 3: .grow takes the rest */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Make <code>.row</code> a flex container.',
     '<pre>.row {\n  display: flex;\n}</pre>',
     'var items = doc.querySelectorAll(".item");
return doc.defaultView.getComputedStyle(doc.querySelector(".row")).display === "flex" && Math.abs(items[0].getBoundingClientRect().top - items[2].getBoundingClientRect().top) < 2;'],
    ['css', 'Put <code>12px</code> between the items with <code>gap</code>.',
     '<pre>.row {\n  gap: 12px;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".row")).columnGap === "12px";'],
    ['css', 'Let <code>.grow</code> fill the remaining space with <code>flex: 1</code>.',
     '<pre>.grow {\n  flex: 1;\n}</pre>',
     'var g = doc.querySelector(".grow"), items = doc.querySelectorAll(".item");
return doc.defaultView.getComputedStyle(g).flexGrow === "1" && g.getBoundingClientRect().width > items[0].getBoundingClientRect().width * 2;'],
  ],
  'solution' => ['css' => $base . "\n.item { padding: 12px 16px; background: #ffffff; border-radius: 10px; }\n.grow { color: #555; }\n\n.row {\n  display: flex;\n  gap: 12px;\n}\n\n.grow {\n  flex: 1;\n}\n"],
],

'flex-alignment' => [
  'title' => 'Lined up',
  'desc'  => '<p>In a flex container, <code>justify-content</code> spreads children along the row (<code>space-between</code> pushes the first and last to the edges) and <code>align-items</code> lines them up across it (<code>center</code> puts them on one middle line). <code>flex-direction: column</code> stacks them instead.</p>',
  'html'  => <<<'HTML'
<header class="bar">
  <span class="logo">Codle Bakery</span>
  <button>Order</button>
</header>

<div class="stack">
  <div class="step">1. Pick</div>
  <div class="step">2. Pay</div>
  <div class="step">3. Enjoy</div>
</div>
HTML,
  'css'   => $base . "\n.bar { display: flex; padding: 12px 16px; background: #ffffff; border-radius: 12px; margin-bottom: 20px; }\n.logo { font-size: 24px; font-weight: 800; }\nbutton { font: inherit; padding: 8px 16px; color: #fff; background: #0a84ff; border: none; border-radius: 8px; }\n.stack { display: flex; gap: 8px; }\n.step { padding: 12px; background: #ffffff; border-radius: 10px; }\n\n/* Objective 1 + 2: .bar */\n\n\n/* Objective 3: .stack */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Push the logo and the button to opposite ends of <code>.bar</code> with <code>justify-content: space-between</code>.',
     '<pre>.bar {\n  justify-content: space-between;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".bar"));
var b = doc.querySelector(".bar button").getBoundingClientRect(), bar = doc.querySelector(".bar").getBoundingClientRect();
return cs.justifyContent === "space-between" && bar.right - b.right < 20;'],
    ['css', 'Centre them vertically with <code>align-items: center</code>.',
     '<pre>.bar {\n  align-items: center;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".bar")).alignItems === "center";'],
    ['css', 'Stack the steps vertically: <code>.stack { flex-direction: column; }</code>.',
     '<pre>.stack {\n  flex-direction: column;\n}</pre>',
     'var s = doc.querySelectorAll(".step");
return doc.defaultView.getComputedStyle(doc.querySelector(".stack")).flexDirection === "column" && s[1].getBoundingClientRect().top > s[0].getBoundingClientRect().bottom - 1;'],
  ],
  'solution' => ['css' => $base . "\n.bar { display: flex; padding: 12px 16px; background: #ffffff; border-radius: 12px; margin-bottom: 20px; }\n.logo { font-size: 24px; font-weight: 800; }\nbutton { font: inherit; padding: 8px 16px; color: #fff; background: #0a84ff; border: none; border-radius: 8px; }\n.stack { display: flex; gap: 8px; }\n.step { padding: 12px; background: #ffffff; border-radius: 10px; }\n\n.bar {\n  justify-content: space-between;\n  align-items: center;\n}\n\n.stack {\n  flex-direction: column;\n}\n"],
],

'grid' => [
  'title' => 'A grid of cards',
  'desc'  => '<p><code>display: grid</code> lays children out in rows and columns. <code>grid-template-columns: repeat(3, 1fr)</code> makes three equal columns (<code>fr</code> is a share of the free space). <code>gap</code> works here too, and <code>grid-column: span 2</code> lets one child take two columns.</p>',
  'html'  => <<<'HTML'
<div class="grid">
  <div class="card wide">Bread of the week</div>
  <div class="card">Rye</div>
  <div class="card">Baguette</div>
  <div class="card">Ciabatta</div>
  <div class="card">Focaccia</div>
</div>
HTML,
  'css'   => $base . "\n.card { padding: 24px 16px; background: #ffffff; border-radius: 12px; font-weight: 600; }\n.wide { background: #0a84ff; color: #fff; }\n\n/* Objective 1 + 2: .grid */\n\n\n/* Objective 3: .wide */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Make <code>.grid</code> a grid with three equal columns.',
     '<pre>.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".grid"));
return cs.display === "grid" && cs.gridTemplateColumns.trim().split(/\s+/).length === 3;'],
    ['css', 'Put <code>16px</code> between the cards with <code>gap</code>.',
     '<pre>.grid {\n  gap: 16px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".grid"));
return cs.columnGap === "16px" && cs.rowGap === "16px";'],
    ['css', 'Let <code>.wide</code> span two columns.',
     '<pre>.wide {\n  grid-column: span 2;\n}</pre>',
     'var w = doc.querySelector(".wide"), c = doc.querySelectorAll(".card:not(.wide)")[0];
return w.getBoundingClientRect().width > c.getBoundingClientRect().width * 1.8;'],
  ],
  'solution' => ['css' => $base . "\n.card { padding: 24px 16px; background: #ffffff; border-radius: 12px; font-weight: 600; }\n.wide { background: #0a84ff; color: #fff; }\n\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n}\n\n.wide {\n  grid-column: span 2;\n}\n"],
],

'positioning' => [
  'title' => 'Out of the flow',
  'desc'  => '<p><code>position: absolute</code> takes an element out of the normal flow and places it with <code>top</code>, <code>right</code>, <code>bottom</code>, <code>left</code>, measured from the nearest ancestor that has <code>position: relative</code>. <code>position: sticky</code> keeps an element in view while you scroll past it.</p>',
  'html'  => <<<'HTML'
<header class="topbar">Codle Bakery</header>

<div class="card">
  <span class="badge">New</span>
  <h2>Cinnamon rolls</h2>
  <p>Soft, sticky and gone by ten.</p>
</div>

<p class="filler">Scroll down…</p>
HTML,
  'css'   => $base . "\n.topbar { padding: 12px 16px; background: #0a84ff; color: #fff; font-weight: 700; border-radius: 10px; margin-bottom: 20px; }\n.card { padding: 20px; background: #ffffff; border-radius: 12px; }\n.card h2 { margin: 0 0 6px; }\n.card p { margin: 0; color: #555; }\n.badge { padding: 4px 10px; font-size: 12px; font-weight: 700; color: #fff; background: #ff453a; border-radius: 999px; }\n.filler { height: 1200px; color: #999; }\n\n/* Objective 1: .card as the reference box */\n\n\n/* Objective 2: .badge in the top right corner */\n\n\n/* Objective 3: .topbar sticks */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Give <code>.card</code> <code>position: relative</code>, so the badge can be placed inside it.',
     '<pre>.card {\n  position: relative;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".card")).position === "relative";'],
    ['css', 'Place <code>.badge</code> in the top right corner of the card: <code>position: absolute</code>, <code>top: 12px</code>, <code>right: 12px</code>.',
     '<pre>.badge {\n  position: absolute;\n  top: 12px;\n  right: 12px;\n}</pre>',
     'var b = doc.querySelector(".badge").getBoundingClientRect(), c = doc.querySelector(".card").getBoundingClientRect();
return doc.defaultView.getComputedStyle(doc.querySelector(".badge")).position === "absolute" && Math.abs(c.right - b.right - 12) < 2 && Math.abs(b.top - c.top - 12) < 2;'],
    ['css', 'Make <code>.topbar</code> stick to the top while scrolling: <code>position: sticky; top: 0;</code>.',
     '<pre>.topbar {\n  position: sticky;\n  top: 0;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".topbar"));
return cs.position === "sticky" && cs.top === "0px";'],
  ],
  'solution' => ['css' => $base . "\n.topbar { padding: 12px 16px; background: #0a84ff; color: #fff; font-weight: 700; border-radius: 10px; margin-bottom: 20px; }\n.card { padding: 20px; background: #ffffff; border-radius: 12px; }\n.card h2 { margin: 0 0 6px; }\n.card p { margin: 0; color: #555; }\n.badge { padding: 4px 10px; font-size: 12px; font-weight: 700; color: #fff; background: #ff453a; border-radius: 999px; }\n.filler { height: 1200px; color: #999; }\n\n.card {\n  position: relative;\n}\n\n.badge {\n  position: absolute;\n  top: 12px;\n  right: 12px;\n}\n\n.topbar {\n  position: sticky;\n  top: 0;\n}\n"],
],

];
