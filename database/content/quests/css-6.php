<?php
// Codle content — CSS · Unit 6 · Effects & Polish

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

'transitions' => [
  'title' => 'Smooth changes',
  'desc'  => '<p>A <code>:hover</code> rule changes an element while the pointer is over it. Without a transition the change is instant; <code>transition: background-color 0.3s</code> animates it over 0.3 seconds. The transition goes on the element itself, not on the <code>:hover</code> rule, so it plays both ways.</p>',
  'html'  => <<<'HTML'
<button class="btn">Order now</button>
HTML,
  'css'   => $base . "\n.btn {\n  padding: 12px 24px;\n  font: inherit;\n  font-weight: 600;\n  color: #fff;\n  background: #0a84ff;\n  border: none;\n  border-radius: 999px;\n  cursor: pointer;\n}\n\n/* Objective 1: hover colour */\n\n\n/* Objective 2 + 3: transition on .btn */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Add a <code>.btn:hover</code> rule that changes the background to <code>#0060c0</code>.',
     '<pre>.btn:hover {\n  background: #0060c0;\n}</pre>',
     'var src = doc.querySelector("style").textContent;
return /\.btn:hover\s*\{[^}]*background(-color)?\s*:\s*#0060c0/i.test(src);'],
    ['css', 'Animate the change: give <code>.btn</code> <code>transition: background-color 0.3s</code>.',
     '<pre>.btn {\n  transition: background-color 0.3s;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".btn"));
return /background-color|all/.test(cs.transitionProperty) && parseFloat(cs.transitionDuration) >= 0.25;'],
    ['css', 'Also lift the button on hover with <code>transform: translateY(-2px)</code>, and add <code>transform</code> to the transition list.',
     'Several properties are separated by a comma:<pre>.btn {\n  transition: background-color 0.3s, transform 0.3s;\n}\n.btn:hover {\n  transform: translateY(-2px);\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".btn")), src = doc.querySelector("style").textContent;
return /transform|all/.test(cs.transitionProperty) && /\.btn:hover\s*\{[^}]*transform\s*:\s*translateY\(\s*-2px\s*\)/.test(src);'],
  ],
  'solution' => ['css' => $base . "\n.btn {\n  padding: 12px 24px;\n  font: inherit;\n  font-weight: 600;\n  color: #fff;\n  background: #0a84ff;\n  border: none;\n  border-radius: 999px;\n  cursor: pointer;\n  transition: background-color 0.3s, transform 0.3s;\n}\n\n.btn:hover {\n  background: #0060c0;\n  transform: translateY(-2px);\n}\n"],
],

'transforms' => [
  'title' => 'Rotate, scale, move',
  'desc'  => '<p><code>transform</code> changes how an element is drawn without moving anything else: <code>rotate(10deg)</code> tilts it, <code>scale(1.2)</code> makes it 20% bigger, <code>translateX(40px)</code> shifts it right. Several can be combined in one value.</p>',
  'html'  => <<<'HTML'
<div class="row">
  <div class="card tilted">Tilted</div>
  <div class="card big">Big</div>
  <div class="card moved">Moved</div>
</div>
HTML,
  'css'   => $base . "\n.row { display: flex; gap: 32px; padding: 32px 0; }\n.card { width: 110px; height: 110px; display: grid; place-items: center; font-weight: 700; color: #fff; background: #0a84ff; border-radius: 16px; }\n\n/* Objective 1: .tilted */\n\n\n/* Objective 2: .big */\n\n\n/* Objective 3: .moved */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Rotate <code>.tilted</code> by <code>-8deg</code>.',
     '<pre>.tilted {\n  transform: rotate(-8deg);\n}</pre>',
     'var t = doc.defaultView.getComputedStyle(doc.querySelector(".tilted")).transform, m = /matrix\(([^)]+)\)/.exec(t);
if (!m) return false;
var v = m[1].split(",").map(parseFloat);
return Math.abs(v[0] - Math.cos(-8 * Math.PI / 180)) < 0.01 && Math.abs(v[1] - Math.sin(-8 * Math.PI / 180)) < 0.01;'],
    ['css', 'Scale <code>.big</code> up by <code>1.2</code>.',
     '<pre>.big {\n  transform: scale(1.2);\n}</pre>',
     'var t = doc.defaultView.getComputedStyle(doc.querySelector(".big")).transform, m = /matrix\(([^)]+)\)/.exec(t);
if (!m) return false;
var v = m[1].split(",").map(parseFloat);
return Math.abs(v[0] - 1.2) < 0.01 && Math.abs(v[3] - 1.2) < 0.01;'],
    ['css', 'Shift <code>.moved</code> <code>40px</code> to the right and <code>20px</code> down with <code>translate(40px, 20px)</code>.',
     '<pre>.moved {\n  transform: translate(40px, 20px);\n}</pre>',
     'var t = doc.defaultView.getComputedStyle(doc.querySelector(".moved")).transform, m = /matrix\(([^)]+)\)/.exec(t);
if (!m) return false;
var v = m[1].split(",").map(parseFloat);
return Math.abs(v[4] - 40) < 0.5 && Math.abs(v[5] - 20) < 0.5;'],
  ],
  'solution' => ['css' => $base . "\n.row { display: flex; gap: 32px; padding: 32px 0; }\n.card { width: 110px; height: 110px; display: grid; place-items: center; font-weight: 700; color: #fff; background: #0a84ff; border-radius: 16px; }\n\n.tilted {\n  transform: rotate(-8deg);\n}\n\n.big {\n  transform: scale(1.2);\n}\n\n.moved {\n  transform: translate(40px, 20px);\n}\n"],
],

'animations' => [
  'title' => 'Keyframes',
  'desc'  => '<p>An animation has two parts: <code>@keyframes name { from { … } to { … } }</code> describes the steps, and <code>animation: name 1s linear infinite</code> on an element plays them: the name, how long, the easing, how many times.</p><p>Make the loading spinner spin.</p>',
  'html'  => <<<'HTML'
<div class="spinner"></div>
<p>Baking…</p>
HTML,
  'css'   => $base . "\n.spinner {\n  width: 40px;\n  height: 40px;\n  border: 4px solid #d0d5dd;\n  border-top-color: #0a84ff;\n  border-radius: 50%;\n}\n\n/* Objective 1: @keyframes spin */\n\n\n/* Objective 2 + 3: play it on .spinner */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Write <code>@keyframes spin</code> that goes from <code>rotate(0deg)</code> to <code>rotate(360deg)</code>.',
     '<pre>@keyframes spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}</pre>',
     'var src = doc.querySelector("style").textContent;
return /@keyframes\s+spin\s*\{[\s\S]*rotate\(\s*360deg\s*\)/.test(src);'],
    ['css', 'Play it on <code>.spinner</code>: <code>animation: spin 1s linear</code>.',
     '<pre>.spinner {\n  animation: spin 1s linear;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".spinner"));
return cs.animationName === "spin" && parseFloat(cs.animationDuration) > 0;'],
    ['css', 'Make it spin forever: add <code>infinite</code> to the animation.',
     '<pre>.spinner {\n  animation: spin 1s linear infinite;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".spinner"));
return cs.animationName === "spin" && cs.animationIterationCount === "infinite";'],
  ],
  'solution' => ['css' => $base . "\n.spinner {\n  width: 40px;\n  height: 40px;\n  border: 4px solid #d0d5dd;\n  border-top-color: #0a84ff;\n  border-radius: 50%;\n}\n\n@keyframes spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}\n\n.spinner {\n  animation: spin 1s linear infinite;\n}\n"],
],

'css-variables' => [
  'title' => 'One colour, many places',
  'desc'  => '<p>A custom property is a value you name once and reuse: <code>:root { --accent: #0a84ff; }</code> defines it for the whole page, and <code>var(--accent)</code> reads it anywhere. Change the one line and every button, link and border follows.</p>',
  'html'  => <<<'HTML'
<h1>Codle Bakery</h1>
<p>Fresh bread every morning. <a href="#">See the menu</a></p>
<button class="btn">Order now</button>
<div class="card">Pick-up today from 7:00</div>
HTML,
  'css'   => $base . "\n.btn { padding: 10px 20px; font: inherit; font-weight: 600; color: #fff; border: none; }\n.card { margin-top: 20px; padding: 16px; background: #ffffff; }\n\n/* Objective 1: define the variables */\n\n\n/* Objective 2 + 3: use them */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'In <code>:root</code>, define <code>--accent: #0a84ff</code> and <code>--radius: 12px</code>.',
     '<pre>:root {\n  --accent: #0a84ff;\n  --radius: 12px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.documentElement);
return cs.getPropertyValue("--accent").trim().toLowerCase() === "#0a84ff" && cs.getPropertyValue("--radius").trim() === "12px";'],
    ['css', 'Use <code>var(--accent)</code> for the <code>.btn</code> background and the <code>a</code> colour.',
     '<pre>.btn { background: var(--accent); }\na { color: var(--accent); }</pre>',
     'var cs = doc.defaultView.getComputedStyle, src = doc.querySelector("style").textContent;
return cs(doc.querySelector(".btn")).backgroundColor === "rgb(10, 132, 255)" && cs(doc.querySelector("a")).color === "rgb(10, 132, 255)" && (src.match(/var\(--accent\)/g) || []).length >= 2;'],
    ['css', 'Use <code>var(--radius)</code> for the <code>border-radius</code> of <code>.btn</code> and <code>.card</code>.',
     '<pre>.btn, .card {\n  border-radius: var(--radius);\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle, src = doc.querySelector("style").textContent;
return cs(doc.querySelector(".btn")).borderTopLeftRadius === "12px" && cs(doc.querySelector(".card")).borderTopLeftRadius === "12px" && /var\(--radius\)/.test(src);'],
  ],
  'solution' => ['css' => $base . "\n.btn { padding: 10px 20px; font: inherit; font-weight: 600; color: #fff; border: none; }\n.card { margin-top: 20px; padding: 16px; background: #ffffff; }\n\n:root {\n  --accent: #0a84ff;\n  --radius: 12px;\n}\n\n.btn { background: var(--accent); }\na { color: var(--accent); }\n\n.btn, .card {\n  border-radius: var(--radius);\n}\n"],
],

];
