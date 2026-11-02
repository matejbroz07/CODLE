<?php
// Codle content — HTML · Unit 2 · Text & Links

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
h2 { margin: 24px 0 6px; }
p { margin: 0 0 10px; max-width: 60ch; }
a { color: #0a84ff; }
CSS;

return [

'links' => [
  'title' => 'Link it up',
  'desc'  => '<p>A link is an <code>&lt;a&gt;</code> tag with an <code>href</code> attribute that says where it goes. The text between the tags is what people click.</p><p>Good link text says where the link leads. "Click here" says nothing.</p>',
  'html'  => <<<'HTML'
<h1>Learning to code</h1>
<p>The best place to look things up is MDN.</p>
<p>Want to see a web page? Visit Wikipedia.</p>

<h2 id="contact">Contact</h2>
<p>Write to me any time.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Turn the word <code>MDN</code> into a link to <code>https://developer.mozilla.org</code>.',
     '<pre>&lt;a href="https://developer.mozilla.org"&gt;MDN&lt;/a&gt;</pre>',
     'return Array.prototype.some.call(doc.querySelectorAll("a[href]"), function (a) { return /^https:\/\/developer\.mozilla\.org/.test(a.getAttribute("href")) && /mdn/i.test(a.textContent); });'],
    ['html', 'Link <code>Wikipedia</code> to <code>https://www.wikipedia.org</code> and open it in a new tab with <code>target="_blank"</code>.',
     '<pre>&lt;a href="https://www.wikipedia.org" target="_blank"&gt;Wikipedia&lt;/a&gt;</pre>',
     'return Array.prototype.some.call(doc.querySelectorAll("a[href]"), function (a) { return /wikipedia\.org/.test(a.getAttribute("href")) && a.getAttribute("target") === "_blank"; });'],
    ['html', 'At the top, add a link that jumps down to the Contact section: <code>href="#contact"</code>.',
     'A link to an id on the same page starts with <code>#</code>:<pre>&lt;p&gt;&lt;a href="#contact"&gt;Jump to contact&lt;/a&gt;&lt;/p&gt;</pre>',
     'var a = doc.querySelector("a[href=\"#contact\"]"), h = doc.getElementById("contact");
return !!a && !!h && (a.compareDocumentPosition(h) & 4) !== 0;'],
  ],
  'solution' => ['html' => "<h1>Learning to code</h1>\n<p><a href=\"#contact\">Jump to contact</a></p>\n<p>The best place to look things up is <a href=\"https://developer.mozilla.org\">MDN</a>.</p>\n<p>Want to see a web page? Visit <a href=\"https://www.wikipedia.org\" target=\"_blank\">Wikipedia</a>.</p>\n\n<h2 id=\"contact\">Contact</h2>\n<p>Write to me any time.</p>\n"],
],

'lists' => [
  'title' => 'Shopping and steps',
  'desc'  => '<p>Use <code>&lt;ul&gt;</code> for a list where the order does not matter (bullets) and <code>&lt;ol&gt;</code> for steps (numbers). Every item is an <code>&lt;li&gt;</code>.</p><p>Lists can nest: put a whole list inside an <code>&lt;li&gt;</code>.</p>',
  'html'  => <<<'HTML'
<h1>Pancake day</h1>

<h2>Shopping list</h2>
flour, milk, eggs

<h2>Steps</h2>
Mix everything. Heat the pan. Fry each side for a minute.
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Make the shopping list a bulleted list (<code>&lt;ul&gt;</code>) with one <code>&lt;li&gt;</code> per item.',
     '<pre>&lt;ul&gt;\n  &lt;li&gt;flour&lt;/li&gt;\n  &lt;li&gt;milk&lt;/li&gt;\n  &lt;li&gt;eggs&lt;/li&gt;\n&lt;/ul&gt;</pre>',
     'var ul = doc.querySelector("ul");
return !!ul && ul.querySelectorAll(":scope > li").length >= 3;'],
    ['html', 'Make the steps a numbered list (<code>&lt;ol&gt;</code>) with three items.',
     'Same as the bulleted list, with <code>&lt;ol&gt;</code> instead of <code>&lt;ul&gt;</code>.',
     'var ol = doc.querySelector("ol");
return !!ol && ol.querySelectorAll(":scope > li").length >= 3;'],
    ['html', 'Nest a list inside the <code>eggs</code> item that says how many: for example "2 large" and "or 3 small".',
     'The inner list goes inside the <code>&lt;li&gt;</code>, before its closing tag:<pre>&lt;li&gt;eggs\n  &lt;ul&gt;\n    &lt;li&gt;2 large&lt;/li&gt;\n  &lt;/ul&gt;\n&lt;/li&gt;</pre>',
     'return !!doc.querySelector("ul li ul li, ul li ol li");'],
  ],
  'solution' => ['html' => "<h1>Pancake day</h1>\n\n<h2>Shopping list</h2>\n<ul>\n  <li>flour</li>\n  <li>milk</li>\n  <li>eggs\n    <ul>\n      <li>2 large</li>\n      <li>or 3 small</li>\n    </ul>\n  </li>\n</ul>\n\n<h2>Steps</h2>\n<ol>\n  <li>Mix everything.</li>\n  <li>Heat the pan.</li>\n  <li>Fry each side for a minute.</li>\n</ol>\n"],
],

'emphasis' => [
  'title' => 'Say it with meaning',
  'desc'  => '<p><code>&lt;strong&gt;</code> marks text that is important, <code>&lt;em&gt;</code> text that is stressed, and <code>&lt;mark&gt;</code> text that is highlighted. Browsers show them bold, italic and yellow, but the point is the meaning, not the look.</p>',
  'html'  => <<<'HTML'
<h1>Safety notice</h1>
<p>Never leave the pan unattended. The oil gets very hot.</p>
<p>Turn the heat off before you leave the kitchen.</p>
<p>Remember: the pan stays hot for a long time.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Wrap <code>Never</code> in <code>&lt;strong&gt;</code>.',
     '<pre>&lt;strong&gt;Never&lt;/strong&gt; leave the pan unattended.</pre>',
     'return Array.prototype.some.call(doc.querySelectorAll("strong"), function (e) { return /never/i.test(e.textContent); });'],
    ['html', 'Wrap <code>very</code> in <code>&lt;em&gt;</code>.',
     '<pre>The oil gets &lt;em&gt;very&lt;/em&gt; hot.</pre>',
     'return Array.prototype.some.call(doc.querySelectorAll("em"), function (e) { return /very/i.test(e.textContent); });'],
    ['html', 'Highlight <code>stays hot for a long time</code> with <code>&lt;mark&gt;</code>.',
     '<pre>the pan &lt;mark&gt;stays hot for a long time&lt;/mark&gt;.</pre>',
     'return Array.prototype.some.call(doc.querySelectorAll("mark"), function (e) { return /stays hot/i.test(e.textContent); });'],
  ],
  'solution' => ['html' => "<h1>Safety notice</h1>\n<p><strong>Never</strong> leave the pan unattended. The oil gets <em>very</em> hot.</p>\n<p>Turn the heat off before you leave the kitchen.</p>\n<p>Remember: the pan <mark>stays hot for a long time</mark>.</p>\n"],
],

'line-breaks' => [
  'title' => 'Breaks and rules',
  'desc'  => '<p><code>&lt;br&gt;</code> breaks a line inside a block, for example in an address or a poem. <code>&lt;hr&gt;</code> draws a horizontal rule between two parts of a page. Both have no closing tag.</p><p>Use <code>&lt;br&gt;</code> only where the line break is part of the content. For space between paragraphs, use paragraphs.</p>',
  'html'  => <<<'HTML'
<h1>Codle Bakery</h1>
<p>Open every day from 7 to 18.</p>

<h2>Address</h2>
<address>
  Codle Bakery, 12 Main Street, 41501 Teplice
</address>

<h2>Opening hours</h2>
<p>Monday to Friday: 7–18. Saturday: 8–12. Sunday: closed.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Put the address on three lines (name, street, town) with <code>&lt;br&gt;</code>.',
     '<pre>Codle Bakery&lt;br&gt;\n12 Main Street&lt;br&gt;\n41501 Teplice</pre>',
     'var a = doc.querySelector("address");
return !!a && a.querySelectorAll("br").length >= 2;'],
    ['html', 'Draw a rule with <code>&lt;hr&gt;</code> between the address and the opening hours.',
     'Put <code>&lt;hr&gt;</code> on its own line right before <code>&lt;h2&gt;Opening hours&lt;/h2&gt;</code>.',
     'var hr = doc.querySelector("hr"), a = doc.querySelector("address");
var h = Array.prototype.filter.call(doc.querySelectorAll("h2"), function (x) { return /opening/i.test(x.textContent); })[0];
return !!hr && !!a && !!h && (a.compareDocumentPosition(hr) & 4) !== 0 && (hr.compareDocumentPosition(h) & 4) !== 0;'],
    ['html', 'Split the opening hours into three paragraphs, one per line, without using <code>&lt;br&gt;</code> there.',
     'Three <code>&lt;p&gt;</code> tags: one for weekdays, one for Saturday, one for Sunday.',
     'var ps = Array.prototype.filter.call(doc.querySelectorAll("p"), function (p) { return /monday|saturday|sunday/i.test(p.textContent); });
return ps.length >= 3 && ps.every(function (p) { return !p.querySelector("br"); });'],
  ],
  'solution' => ['html' => "<h1>Codle Bakery</h1>\n<p>Open every day from 7 to 18.</p>\n\n<h2>Address</h2>\n<address>\n  Codle Bakery<br>\n  12 Main Street<br>\n  41501 Teplice\n</address>\n\n<hr>\n\n<h2>Opening hours</h2>\n<p>Monday to Friday: 7–18.</p>\n<p>Saturday: 8–12.</p>\n<p>Sunday: closed.</p>\n"],
],

];
