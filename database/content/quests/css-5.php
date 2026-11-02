<?php
// Codle content — CSS · Unit 5 · Responsive Design
// The preview can be any width, so the media-query checks read the CSS text rather than the layout.

$base = <<<'CSS'
body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}
CSS;

$pic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23ffe3b3'/%3E%3Ccircle cx='200' cy='130' r='70' fill='%23c8742a'/%3E%3Cellipse cx='200' cy='115' rx='60' ry='30' fill='%23e9a05a'/%3E%3C/svg%3E";

return [

'units' => [
  'title' => 'Pixels, rems and percent',
  'desc'  => '<p><code>px</code> is a fixed size. <code>rem</code> is relative to the root font size (16px by default), so text set in rem scales when the visitor makes everything bigger. <code>%</code> is relative to the parent, and <code>vh</code> to the window height (<code>100vh</code> is the full window).</p>',
  'html'  => <<<'HTML'
<div class="hero">
  <h1>Codle Bakery</h1>
  <p class="half">We fill half the width of the hero, whatever size it is.</p>
</div>
HTML,
  'css'   => $base . "\n.hero { display: flex; flex-direction: column; justify-content: center; padding: 24px; background: #0a84ff; color: #fff; border-radius: 12px; }\n.hero h1 { margin: 0 0 8px; }\n.half { margin: 0; padding: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 8px; }\n\n/* Objective 1: h1 in rem */\n\n\n/* Objective 2: .hero height in vh */\n\n\n/* Objective 3: .half width in percent */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Set the <code>h1</code> font size to <code>2.5rem</code>.',
     '<pre>.hero h1 {\n  font-size: 2.5rem;\n}</pre>',
     'var src = doc.querySelector("style").textContent;
return doc.defaultView.getComputedStyle(doc.querySelector("h1")).fontSize === "40px" && /2\.5rem/.test(src);'],
    ['css', 'Make <code>.hero</code> half the window height: <code>height: 50vh</code>.',
     '<pre>.hero {\n  height: 50vh;\n}</pre>',
     'var hero = doc.querySelector(".hero"), src = doc.querySelector("style").textContent, half = doc.defaultView.innerHeight / 2;
var inner = parseFloat(doc.defaultView.getComputedStyle(hero).height), outer = hero.getBoundingClientRect().height;
return /50vh/.test(src) && (Math.abs(inner - half) < 3 || Math.abs(outer - half) < 3);'],
    ['css', 'Make <code>.half</code> <code>50%</code> wide.',
     '<pre>.half {\n  width: 50%;\n}</pre>',
     'var p = doc.querySelector(".half"), hero = doc.querySelector(".hero");
var inner = hero.getBoundingClientRect().width - 48, w = parseFloat(doc.defaultView.getComputedStyle(p).width);
return Math.abs(w - inner / 2) < 2 || Math.abs(p.getBoundingClientRect().width - inner / 2) < 2;'],
  ],
  'solution' => ['css' => $base . "\n.hero { display: flex; flex-direction: column; justify-content: center; padding: 24px; background: #0a84ff; color: #fff; border-radius: 12px; }\n.hero h1 { margin: 0 0 8px; }\n.half { margin: 0; padding: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 8px; }\n\n.hero h1 {\n  font-size: 2.5rem;\n}\n\n.hero {\n  height: 50vh;\n}\n\n.half {\n  width: 50%;\n}\n"],
],

'media-queries' => [
  'title' => 'Different screens, different rules',
  'desc'  => '<p>A media query wraps rules that only apply when a condition is true: <code>@media (max-width: 600px) { … }</code> applies on screens up to 600px wide. That is how one page can have a sidebar on a laptop and none on a phone.</p><p>Drag the divider between the code and the output to see the query switch.</p>',
  'html'  => <<<'HTML'
<div class="layout">
  <main class="content">
    <h1>Today's bread</h1>
    <p>Rye, sourdough and a baguette or two.</p>
  </main>
  <aside class="sidebar">
    <h2>Opening hours</h2>
    <p>7–18 every day</p>
  </aside>
</div>
HTML,
  'css'   => $base . "\n.layout { display: flex; gap: 16px; }\n.content { flex: 1; padding: 16px; background: #ffffff; border-radius: 12px; }\n.sidebar { width: 200px; padding: 16px; background: #eef6ff; border-radius: 12px; }\nh1, h2, p { margin: 0 0 8px; }\n\n/* Objective 1–3: rules for screens up to 600px wide */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Add a media query for screens up to <code>600px</code> wide: <code>@media (max-width: 600px) { }</code>.',
     '<pre>@media (max-width: 600px) {\n\n}</pre>',
     'var src = doc.querySelector("style").textContent;
return /@media\s*\(\s*max-width\s*:\s*600px\s*\)\s*\{/.test(src);'],
    ['css', 'Inside it, hide <code>.sidebar</code>.',
     '<pre>@media (max-width: 600px) {\n  .sidebar {\n    display: none;\n  }\n}</pre>',
     'var src = doc.querySelector("style").textContent, m = /@media\s*\(\s*max-width\s*:\s*600px\s*\)\s*\{([\s\S]*)$/.exec(src);
return !!m && /\.sidebar\s*\{[^}]*display\s*:\s*none/.test(m[1]);'],
    ['css', 'Inside the same query, stack the layout: <code>.layout { flex-direction: column; }</code>.',
     'Both rules go inside the same braces of the <code>@media</code> block.',
     'var src = doc.querySelector("style").textContent, m = /@media\s*\(\s*max-width\s*:\s*600px\s*\)\s*\{([\s\S]*)$/.exec(src);
return !!m && /\.layout\s*\{[^}]*flex-direction\s*:\s*column/.test(m[1]);'],
  ],
  'solution' => ['css' => $base . "\n.layout { display: flex; gap: 16px; }\n.content { flex: 1; padding: 16px; background: #ffffff; border-radius: 12px; }\n.sidebar { width: 200px; padding: 16px; background: #eef6ff; border-radius: 12px; }\nh1, h2, p { margin: 0 0 8px; }\n\n@media (max-width: 600px) {\n  .sidebar {\n    display: none;\n  }\n  .layout {\n    flex-direction: column;\n  }\n}\n"],
],

'mobile-first' => [
  'title' => 'Start small',
  'desc'  => '<p><b>Mobile first</b> means the plain rules are for small screens and <code>@media (min-width: …)</code> adds columns as the screen grows. Phones get the simplest CSS, and you never have to undo a desktop layout.</p><p>The cards below should be one column by default, two from 600px, and three from 900px.</p>',
  'html'  => <<<'HTML'
<div class="cards">
  <div class="card">Rye</div>
  <div class="card">Sourdough</div>
  <div class="card">Baguette</div>
  <div class="card">Ciabatta</div>
  <div class="card">Focaccia</div>
  <div class="card">Brioche</div>
</div>
HTML,
  'css'   => $base . "\n.card { padding: 24px 16px; background: #ffffff; border-radius: 12px; font-weight: 600; }\n\n/* Objective 1: one column by default */\n\n\n/* Objective 2: two columns from 600px */\n\n\n/* Objective 3: three columns from 900px */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Make <code>.cards</code> a grid with <code>gap: 12px</code> and one column (<code>grid-template-columns: 1fr</code>) outside any media query.',
     '<pre>.cards {\n  display: grid;\n  gap: 12px;\n  grid-template-columns: 1fr;\n}</pre>',
     'var src = doc.querySelector("style").textContent.split(/@media/)[0];
return /\.cards\s*\{[^}]*display\s*:\s*grid/.test(src) && /\.cards\s*\{[^}]*grid-template-columns\s*:\s*1fr\s*;/.test(src);'],
    ['css', 'From <code>600px</code> up, switch to two columns: <code>@media (min-width: 600px) { .cards { grid-template-columns: repeat(2, 1fr); } }</code>',
     '<pre>@media (min-width: 600px) {\n  .cards {\n    grid-template-columns: repeat(2, 1fr);\n  }\n}</pre>',
     'var src = doc.querySelector("style").textContent, m = /@media\s*\(\s*min-width\s*:\s*600px\s*\)\s*\{([\s\S]*?)\}\s*\}/.exec(src);
return !!m && /\.cards\s*\{[^}]*grid-template-columns\s*:\s*repeat\(\s*2\s*,\s*1fr\s*\)/.test(m[1]);'],
    ['css', 'From <code>900px</code> up, three columns.',
     'Same again with <code>min-width: 900px</code> and <code>repeat(3, 1fr)</code>. Put it after the 600px query, so it wins on wide screens.',
     'var src = doc.querySelector("style").textContent, m = /@media\s*\(\s*min-width\s*:\s*900px\s*\)\s*\{([\s\S]*?)\}\s*\}/.exec(src);
return !!m && /\.cards\s*\{[^}]*grid-template-columns\s*:\s*repeat\(\s*3\s*,\s*1fr\s*\)/.test(m[1]) && src.indexOf("min-width: 900px") > src.indexOf("min-width: 600px");'],
  ],
  'solution' => ['css' => $base . "\n.card { padding: 24px 16px; background: #ffffff; border-radius: 12px; font-weight: 600; }\n\n.cards {\n  display: grid;\n  gap: 12px;\n  grid-template-columns: 1fr;\n}\n\n@media (min-width: 600px) {\n  .cards {\n    grid-template-columns: repeat(2, 1fr);\n  }\n}\n\n@media (min-width: 900px) {\n  .cards {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n"],
],

'responsive-images' => [
  'title' => 'Pictures that fit',
  'desc'  => '<p>An image is as big as its file unless you say otherwise. <code>max-width: 100%</code> stops it from overflowing its box and <code>height: auto</code> keeps the proportions. <code>object-fit: cover</code> fills a fixed box with the picture, cropping the edges instead of squashing it.</p>',
  'html'  => <<<HTML
<article class="post">
  <img class="photo" src="$pic" width="400" height="250" alt="A round loaf of bread">
  <p>The photo above is 400px wide. It should never be wider than the article.</p>
</article>

<div class="thumbs">
  <img class="thumb" src="$pic" alt="A round loaf of bread">
  <img class="thumb" src="$pic" alt="A round loaf of bread">
  <img class="thumb" src="$pic" alt="A round loaf of bread">
</div>
HTML,
  'css'   => $base . "\n.post { width: 260px; padding: 16px; background: #ffffff; border-radius: 12px; margin-bottom: 20px; }\n.thumbs { display: flex; gap: 8px; }\n.thumb { width: 80px; height: 80px; border-radius: 10px; }\n\n/* Objective 1 + 2: .photo */\n\n\n/* Objective 3: .thumb */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Stop <code>.photo</code> from overflowing: <code>max-width: 100%</code>.',
     '<pre>.photo {\n  max-width: 100%;\n}</pre>',
     'var img = doc.querySelector(".photo"), post = doc.querySelector(".post");
return doc.defaultView.getComputedStyle(img).maxWidth === "100%" && img.getBoundingClientRect().width <= post.getBoundingClientRect().width;'],
    ['css', 'Keep its proportions with <code>height: auto</code> (otherwise the <code>height</code> attribute squashes it).',
     '<pre>.photo {\n  height: auto;\n}</pre>',
     'var img = doc.querySelector(".photo"), r = img.getBoundingClientRect(), src = doc.querySelector("style").textContent;
return /\.photo\s*\{[^}]*height\s*:\s*auto/.test(src) && Math.abs(r.width / r.height - 1.6) < 0.05;'],
    ['css', 'The square thumbnails are squashed. Fix them with <code>object-fit: cover</code>.',
     '<pre>.thumb {\n  object-fit: cover;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".thumb")).objectFit === "cover";'],
  ],
  'solution' => ['css' => $base . "\n.post { width: 260px; padding: 16px; background: #ffffff; border-radius: 12px; margin-bottom: 20px; }\n.thumbs { display: flex; gap: 8px; }\n.thumb { width: 80px; height: 80px; border-radius: 10px; }\n\n.photo {\n  max-width: 100%;\n  height: auto;\n}\n\n.thumb {\n  object-fit: cover;\n}\n"],
],

];
