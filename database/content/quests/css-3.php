<?php
// Codle content — CSS · Unit 3 · The Box Model

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

'box-model' => [
  'title' => 'Every element is a box',
  'desc'  => '<p>Every element is a rectangle with four layers: the <b>content</b>, <b>padding</b> around it, a <b>border</b>, and <b>margin</b> outside. With <code>box-sizing: border-box</code> the width you set includes padding and border, which makes layouts much easier to reason about.</p>',
  'html'  => <<<'HTML'
<div class="card">
  <h2>Rye loaf</h2>
  <p>Dark, dense and a little sour. Keeps for a week.</p>
</div>
HTML,
  'css'   => $base . "\n.card {\n  width: 320px;\n  background: #ffffff;\n}\n.card h2 { margin: 0 0 6px; }\n.card p { margin: 0; color: #555; }\n\n/* Objectives 1–3: give .card padding, a border and border-box sizing */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Give <code>.card</code> <code>20px</code> of padding on every side.',
     '<pre>.card {\n  padding: 20px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".card"));
return cs.paddingTop === "20px" && cs.paddingRight === "20px" && cs.paddingBottom === "20px" && cs.paddingLeft === "20px";'],
    ['css', 'Give it a <code>2px solid #d0d5dd</code> border.',
     '<pre>.card {\n  border: 2px solid #d0d5dd;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".card"));
return cs.borderTopWidth === "2px" && cs.borderTopStyle === "solid" && cs.borderTopColor === "rgb(208, 213, 221)";'],
    ['css', 'Set <code>box-sizing: border-box</code>, so the card stays exactly 320px wide.',
     '<pre>.card {\n  box-sizing: border-box;\n}</pre>',
     'var c = doc.querySelector(".card"), cs = doc.defaultView.getComputedStyle(c);
return cs.boxSizing === "border-box" && Math.round(c.getBoundingClientRect().width) === 320;'],
  ],
  'solution' => ['css' => $base . "\n.card {\n  width: 320px;\n  background: #ffffff;\n}\n.card h2 { margin: 0 0 6px; }\n.card p { margin: 0; color: #555; }\n\n.card {\n  padding: 20px;\n  border: 2px solid #d0d5dd;\n  box-sizing: border-box;\n}\n"],
],

'padding-margin' => [
  'title' => 'Inside and outside',
  'desc'  => '<p>Padding is space <b>inside</b> the border, margin is space <b>outside</b> it. Two values mean top/bottom and left/right: <code>padding: 10px 20px</code>. <code>margin: 0 auto</code> on an element with a width centres it horizontally.</p>',
  'html'  => <<<'HTML'
<div class="wrap">
  <h1>Order online</h1>
  <div class="stack">
    <p>Pick what you want.</p>
    <p>Choose a pick-up time.</p>
    <p>Pay at the counter.</p>
  </div>
  <button>Start order</button>
</div>
HTML,
  'css'   => $base . "\n.wrap { width: 360px; background: #ffffff; padding: 24px; border-radius: 12px; }\n.stack p { margin: 0; padding: 10px; background: #eef2f7; border-radius: 8px; }\nbutton { font: inherit; font-weight: 600; color: #fff; background: #0a84ff; border: none; border-radius: 8px; }\n\n/* Objective 1: button padding */\n\n\n/* Objective 2: space between the stacked paragraphs */\n\n\n/* Objective 3: centre .wrap */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Give the <code>button</code> <code>10px</code> padding top and bottom and <code>20px</code> left and right, in one line.',
     '<pre>button {\n  padding: 10px 20px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector("button"));
return cs.paddingTop === "10px" && cs.paddingBottom === "10px" && cs.paddingLeft === "20px" && cs.paddingRight === "20px";'],
    ['css', 'Put <code>8px</code> of margin between the paragraphs in <code>.stack</code> (a top margin on every <code>p</code> except the first).',
     '<code>+</code> selects an element right after another one:<pre>.stack p + p {\n  margin-top: 8px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle, ps = doc.querySelectorAll(".stack p");
return ps.length === 3 && cs(ps[0]).marginTop === "0px" && cs(ps[1]).marginTop === "8px" && cs(ps[2]).marginTop === "8px";'],
    ['css', 'Centre <code>.wrap</code> on the page with <code>margin: 0 auto</code>.',
     '<pre>.wrap {\n  margin: 0 auto;\n}</pre>',
     'var w = doc.querySelector(".wrap"), r = w.getBoundingClientRect(), b = doc.body.getBoundingClientRect();
return Math.abs((r.left - b.left) - (b.right - r.right)) < 2 && r.left - b.left > 20;'],
  ],
  'solution' => ['css' => $base . "\n.wrap { width: 360px; background: #ffffff; padding: 24px; border-radius: 12px; }\n.stack p { margin: 0; padding: 10px; background: #eef2f7; border-radius: 8px; }\nbutton { font: inherit; font-weight: 600; color: #fff; background: #0a84ff; border: none; border-radius: 8px; }\n\nbutton {\n  padding: 10px 20px;\n}\n\n.stack p + p {\n  margin-top: 8px;\n}\n\n.wrap {\n  margin: 0 auto;\n}\n"],
],

'borders' => [
  'title' => 'Edges and corners',
  'desc'  => '<p><code>border</code> takes a width, a style and a colour: <code>1px solid #ccc</code>. You can set one side only (<code>border-left</code>) and round the corners with <code>border-radius</code>; <code>50%</code> turns a square into a circle.</p>',
  'html'  => <<<'HTML'
<div class="avatar">C</div>
<blockquote class="quote">The bread was still warm when I got home.</blockquote>
<div class="dropzone">Drop your photo here</div>
HTML,
  'css'   => $base . "\n.avatar { width: 72px; height: 72px; display: grid; place-items: center; font-size: 32px; font-weight: 700; color: #fff; background: #0a84ff; margin-bottom: 20px; }\n.quote { margin: 0 0 20px; padding: 12px 16px; background: #ffffff; font-style: italic; }\n.dropzone { padding: 32px; text-align: center; color: #555; }\n\n/* Objective 1: round the avatar */\n\n\n/* Objective 2: a thick left border on .quote */\n\n\n/* Objective 3: a dashed border on .dropzone */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Make <code>.avatar</code> a circle with <code>border-radius: 50%</code>.',
     '<pre>.avatar {\n  border-radius: 50%;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".avatar")).borderTopLeftRadius === "50%";'],
    ['css', 'Give <code>.quote</code> a <code>4px solid #0a84ff</code> border on the left side only.',
     '<pre>.quote {\n  border-left: 4px solid #0a84ff;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".quote"));
return cs.borderLeftWidth === "4px" && cs.borderLeftStyle === "solid" && cs.borderLeftColor === "rgb(10, 132, 255)" && cs.borderRightWidth === "0px";'],
    ['css', 'Give <code>.dropzone</code> a <code>2px dashed #999</code> border and <code>12px</code> rounded corners.',
     '<pre>.dropzone {\n  border: 2px dashed #999;\n  border-radius: 12px;\n}</pre>',
     'var cs = doc.defaultView.getComputedStyle(doc.querySelector(".dropzone"));
return cs.borderTopStyle === "dashed" && cs.borderTopWidth === "2px" && cs.borderTopLeftRadius === "12px";'],
  ],
  'solution' => ['css' => $base . "\n.avatar { width: 72px; height: 72px; display: grid; place-items: center; font-size: 32px; font-weight: 700; color: #fff; background: #0a84ff; margin-bottom: 20px; }\n.quote { margin: 0 0 20px; padding: 12px 16px; background: #ffffff; font-style: italic; }\n.dropzone { padding: 32px; text-align: center; color: #555; }\n\n.avatar {\n  border-radius: 50%;\n}\n\n.quote {\n  border-left: 4px solid #0a84ff;\n}\n\n.dropzone {\n  border: 2px dashed #999;\n  border-radius: 12px;\n}\n"],
],

'width-height' => [
  'title' => 'How big?',
  'desc'  => '<p><code>width</code> and <code>height</code> set a size; <code>max-width</code> caps it so text never gets too wide to read; <code>min-height</code> keeps a box from collapsing when it is empty. Percentages are relative to the parent.</p>',
  'html'  => <<<'HTML'
<div class="hero">Welcome to the bakery</div>
<article class="article">
  <p>This paragraph should never get wider than 600 pixels, however big the window is, because long lines are hard to read.</p>
</article>
<div class="box"></div>
HTML,
  'css'   => $base . "\n.hero { display: grid; place-items: center; font-size: 24px; font-weight: 700; color: #fff; background: #0a84ff; border-radius: 12px; margin-bottom: 20px; }\n.article { background: #ffffff; padding: 16px; margin-bottom: 20px; }\n.box { background: #ffd60a; border-radius: 12px; }\n\n/* Objective 1: .hero height */\n\n\n/* Objective 2: .article max-width */\n\n\n/* Objective 3: .box min-height and width */\n\n",
  'js'    => '',
  'objectives' => [
    ['css', 'Make <code>.hero</code> <code>180px</code> tall.',
     '<pre>.hero {\n  height: 180px;\n}</pre>',
     'return Math.round(doc.querySelector(".hero").getBoundingClientRect().height) === 180;'],
    ['css', 'Cap <code>.article</code> at <code>max-width: 600px</code>.',
     '<pre>.article {\n  max-width: 600px;\n}</pre>',
     'return doc.defaultView.getComputedStyle(doc.querySelector(".article")).maxWidth === "600px";'],
    ['css', 'The empty <code>.box</code> is invisible. Give it <code>min-height: 100px</code> and make it half as wide as the page with <code>width: 50%</code>.',
     '<pre>.box {\n  min-height: 100px;\n  width: 50%;\n}</pre>',
     'var b = doc.querySelector(".box"), cs = doc.defaultView.getComputedStyle(b);
var pw = b.parentNode.getBoundingClientRect().width - 48;
return cs.minHeight === "100px" && b.getBoundingClientRect().height >= 100 && Math.abs(b.getBoundingClientRect().width - pw / 2) < 2;'],
  ],
  'solution' => ['css' => $base . "\n.hero { display: grid; place-items: center; font-size: 24px; font-weight: 700; color: #fff; background: #0a84ff; border-radius: 12px; margin-bottom: 20px; }\n.article { background: #ffffff; padding: 16px; margin-bottom: 20px; }\n.box { background: #ffd60a; border-radius: 12px; }\n\n.hero {\n  height: 180px;\n}\n\n.article {\n  max-width: 600px;\n}\n\n.box {\n  min-height: 100px;\n  width: 50%;\n}\n"],
],

];
