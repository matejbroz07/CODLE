<?php
// Codle content — HTML · Unit 3 · Images & Media
// The pictures are tiny inline SVGs, so the preview works without the internet.

$sun = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'%3E%3Crect width='160' height='100' fill='%2387ceeb'/%3E%3Ccircle cx='110' cy='40' r='22' fill='%23ffd60a'/%3E%3Cpath d='M0 100 L40 55 L70 80 L100 60 L160 100Z' fill='%234a7c59'/%3E%3C/svg%3E";
$cat = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'%3E%3Crect width='160' height='100' fill='%23ffe3b3'/%3E%3Ccircle cx='80' cy='58' r='28' fill='%23555'/%3E%3Cpath d='M58 40 L62 14 L78 36Z M102 40 L98 14 L82 36Z' fill='%23555'/%3E%3Ccircle cx='70' cy='54' r='4' fill='%23fff'/%3E%3Ccircle cx='90' cy='54' r='4' fill='%23fff'/%3E%3C/svg%3E";
$wave = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 20'%3E%3Cpath d='M0 10 Q20 0 40 10 T80 10 T120 10 T160 10' stroke='%230a84ff' stroke-width='3' fill='none'/%3E%3C/svg%3E";

$page = <<<'CSS'
body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  background: #f2f4f8;
  color: #1c1c1e;
}

h1 { margin: 0 0 12px; }
p { margin: 0 0 10px; max-width: 60ch; }
img, video, audio { max-width: 100%; display: block; }
figure { margin: 16px 0; }
figcaption { font-size: 14px; color: #555; margin-top: 6px; }
CSS;

return [

'images' => [
  'title' => 'Add a picture',
  'desc'  => '<p>An image is an <code>&lt;img&gt;</code> tag with a <code>src</code> attribute that points to the picture. It has no closing tag. <code>width</code> and <code>height</code> tell the browser how big it is.</p><p>Two pictures are waiting in the comments. Put them on the page.</p>',
  'html'  => <<<HTML
<h1>Summer trip</h1>
<p>Our first day at the lake.</p>

<!-- Picture 1 (the lake):
$sun
-->

<!-- Picture 2 (our cat stayed home):
$cat
-->
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Show the lake picture with an <code>&lt;img&gt;</code> tag: copy its address into <code>src</code>.',
     '<pre>&lt;img src="data:image/svg+xml,..."&gt;</pre>Copy the whole long line from the comment into the quotes.',
     'return Array.prototype.some.call(doc.querySelectorAll("img"), function (i) { return /viewBox=\'0 0 160 100\'/.test(i.getAttribute("src") || "") && /ffd60a/.test(i.getAttribute("src")); });'],
    ['html', 'Give the lake picture a <code>width</code> of <code>320</code>.',
     '<pre>&lt;img src="..." width="320"&gt;</pre>',
     'return Array.prototype.some.call(doc.querySelectorAll("img"), function (i) { return /ffd60a/.test(i.getAttribute("src") || "") && i.getAttribute("width") === "320"; });'],
    ['html', 'Add the cat picture as a second image, after a paragraph that introduces it.',
     'Add <code>&lt;p&gt;Pixel stayed at home.&lt;/p&gt;</code> and then another <code>&lt;img&gt;</code> with the second address.',
     'var imgs = doc.querySelectorAll("img");
var cat = Array.prototype.filter.call(imgs, function (i) { return /ffe3b3/.test(i.getAttribute("src") || ""); })[0];
if (!cat) return false;
var ps = doc.querySelectorAll("p");
return Array.prototype.some.call(ps, function (p) { return (p.compareDocumentPosition(cat) & 4) !== 0 && p.textContent.trim().length > 0 && !/first day/i.test(p.textContent); });'],
  ],
  'solution' => ['html' => "<h1>Summer trip</h1>\n<p>Our first day at the lake.</p>\n<img src=\"$sun\" width=\"320\">\n\n<p>Pixel stayed at home.</p>\n<img src=\"$cat\" width=\"320\">\n"],
],

'alt-text' => [
  'title' => 'Words for pictures',
  'desc'  => '<p>The <code>alt</code> attribute describes a picture for people who cannot see it: screen reader users, and everyone when the image fails to load. Describe what matters in the picture, not "image of".</p><p>A purely decorative picture gets an empty <code>alt=""</code>, so screen readers skip it.</p>',
  'html'  => <<<HTML
<h1>Our pets</h1>
<img id="cat" src="$cat" width="240">
<p>This is Pixel. He sleeps most of the day.</p>

<img id="lake" src="$sun" width="240">
<p>The lake where we take him swimming.</p>

<img class="deco" src="$wave" width="240">
<p>Thanks for visiting!</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Describe the cat picture with an <code>alt</code> text of at least three words.',
     '<pre>&lt;img id="cat" src="..." alt="Grey cat with white eyes"&gt;</pre>',
     'var i = doc.getElementById("cat");
return !!i && i.hasAttribute("alt") && i.getAttribute("alt").trim().split(/\s+/).length >= 3;'],
    ['html', 'Describe the lake picture too (at least three words).',
     'Say what is in the picture: a lake, the sun, hills.',
     'var i = doc.getElementById("lake");
return !!i && i.hasAttribute("alt") && i.getAttribute("alt").trim().split(/\s+/).length >= 3;'],
    ['html', 'The wavy line is decoration: give it an empty <code>alt=""</code>.',
     '<pre>&lt;img class="deco" src="..." alt=""&gt;</pre>',
     'var i = doc.querySelector("img.deco");
return !!i && i.hasAttribute("alt") && i.getAttribute("alt") === "";'],
  ],
  'solution' => ['html' => "<h1>Our pets</h1>\n<img id=\"cat\" src=\"$cat\" width=\"240\" alt=\"Grey cat with pointy ears\">\n<p>This is Pixel. He sleeps most of the day.</p>\n\n<img id=\"lake\" src=\"$sun\" width=\"240\" alt=\"Sunny lake with green hills\">\n<p>The lake where we take him swimming.</p>\n\n<img class=\"deco\" src=\"$wave\" width=\"240\" alt=\"\">\n<p>Thanks for visiting!</p>\n"],
],

'figures' => [
  'title' => 'Pictures with captions',
  'desc'  => '<p>A <code>&lt;figure&gt;</code> groups a picture with its caption, written in <code>&lt;figcaption&gt;</code>. The caption belongs to the picture, so they move together.</p>',
  'html'  => <<<HTML
<h1>Photo of the week</h1>
<img src="$sun" width="320" alt="Sunny lake with green hills">
Taken on Monday morning at Lake Codle.

<p>Send us your own photos!</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Wrap the image in a <code>&lt;figure&gt;</code>.',
     '<pre>&lt;figure&gt;\n  &lt;img ...&gt;\n&lt;/figure&gt;</pre>',
     'return !!doc.querySelector("figure > img");'],
    ['html', 'Put the sentence "Taken on Monday…" in a <code>&lt;figcaption&gt;</code> inside the figure.',
     'The caption goes after the image, still inside <code>&lt;figure&gt;</code>:<pre>&lt;figcaption&gt;Taken on Monday morning at Lake Codle.&lt;/figcaption&gt;</pre>',
     'var c = doc.querySelector("figure > figcaption");
return !!c && /taken on monday/i.test(c.textContent) && !!c.parentNode.querySelector("img");'],
    ['html', 'Keep the "Send us your own photos!" paragraph outside the figure.',
     'Only the picture and its caption belong in the figure.',
     'var p = Array.prototype.filter.call(doc.querySelectorAll("p"), function (x) { return /send us/i.test(x.textContent); })[0];
return !!p && !p.closest("figure");'],
  ],
  'solution' => ['html' => "<h1>Photo of the week</h1>\n<figure>\n  <img src=\"$sun\" width=\"320\" alt=\"Sunny lake with green hills\">\n  <figcaption>Taken on Monday morning at Lake Codle.</figcaption>\n</figure>\n\n<p>Send us your own photos!</p>\n"],
],

'audio-video' => [
  'title' => 'Sound and video',
  'desc'  => '<p><code>&lt;video&gt;</code> and <code>&lt;audio&gt;</code> play media files. Without the <code>controls</code> attribute there is no play button. Inside, one or more <code>&lt;source&gt;</code> tags name the files, so the browser can pick a format it knows.</p><p>The files here do not exist, so nothing will play. The structure is what counts.</p>',
  'html'  => <<<'HTML'
<h1>Our band</h1>
<p>Watch our first concert:</p>

<p>Or just listen to the single:</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a <code>&lt;video&gt;</code> with <code>controls</code> and a <code>&lt;source&gt;</code> pointing to <code>concert.mp4</code>.',
     '<pre>&lt;video controls width="320"&gt;\n  &lt;source src="concert.mp4" type="video/mp4"&gt;\n&lt;/video&gt;</pre>',
     'var v = doc.querySelector("video");
return !!v && v.hasAttribute("controls") && !!v.querySelector("source[src$=\".mp4\"]");'],
    ['html', 'Add an <code>&lt;audio&gt;</code> with <code>controls</code> and a source <code>single.mp3</code>.',
     '<pre>&lt;audio controls&gt;\n  &lt;source src="single.mp3" type="audio/mpeg"&gt;\n&lt;/audio&gt;</pre>',
     'var a = doc.querySelector("audio");
return !!a && a.hasAttribute("controls") && !!a.querySelector("source[src$=\".mp3\"]");'],
    ['html', 'Inside the video, add a fallback sentence for browsers that cannot play it, after the source.',
     'Text inside <code>&lt;video&gt;</code> only shows when the video cannot play:<pre>&lt;video controls&gt;\n  &lt;source ...&gt;\n  Your browser cannot play this video.\n&lt;/video&gt;</pre>',
     'var v = doc.querySelector("video");
return !!v && v.textContent.trim().length > 10;'],
  ],
  'solution' => ['html' => "<h1>Our band</h1>\n<p>Watch our first concert:</p>\n<video controls width=\"320\">\n  <source src=\"concert.mp4\" type=\"video/mp4\">\n  Your browser cannot play this video.\n</video>\n\n<p>Or just listen to the single:</p>\n<audio controls>\n  <source src=\"single.mp3\" type=\"audio/mpeg\">\n</audio>\n"],
],

];
