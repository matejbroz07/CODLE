<?php
// Codle content — HTML · Unit 1 · First Page (editor quests; see database/content/README.md)

$page = <<<'CSS'
body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  background: #f2f4f8;
  color: #1c1c1e;
}

h1 { margin: 0 0 12px; }
h2 { margin: 24px 0 6px; }
p { margin: 0 0 10px; max-width: 60ch; }
CSS;

return [

'hello-html' => [
  'title' => 'Your first page',
  'desc'  => '<p>A web page is just text with <b>tags</b> around it. A tag like <code>&lt;h1&gt;</code> tells the browser what the text is: a heading, a paragraph, a link.</p><p>The output on the right is empty. Give it a heading and a paragraph, and say hello.</p>',
  'html'  => <<<'HTML'
<!-- Write your first HTML below this line -->

HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a main heading with <code>&lt;h1&gt;</code>.',
     'Tags come in pairs. The text goes between the opening and the closing tag:<pre>&lt;h1&gt;Hello, world!&lt;/h1&gt;</pre>',
     'var h = doc.querySelector("h1");
return !!h && h.textContent.trim().length > 0;'],
    ['html', 'Make the heading say <code>Hello</code> (any sentence with the word Hello in it).',
     'For example <code>&lt;h1&gt;Hello from my first page&lt;/h1&gt;</code>.',
     'var h = doc.querySelector("h1");
return !!h && /hello/i.test(h.textContent);'],
    ['html', 'Add a paragraph with <code>&lt;p&gt;</code> under the heading.',
     '<pre>&lt;p&gt;This is my very first web page.&lt;/p&gt;</pre>',
     'var h = doc.querySelector("h1"), p = doc.querySelector("p");
return !!h && !!p && p.textContent.trim().length > 0 && (h.compareDocumentPosition(p) & 4) !== 0;'],
  ],
  'solution' => ['html' => "<h1>Hello, world!</h1>\n<p>This is my very first web page.</p>\n"],
],

'headings' => [
  'title' => 'Headings in order',
  'desc'  => '<p>HTML has six heading levels, <code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code>. <code>&lt;h1&gt;</code> is the title of the page, <code>&lt;h2&gt;</code> starts a section, <code>&lt;h3&gt;</code> a part of that section. The levels are about structure, not size.</p><p>Turn the plain text into a page about hobbies with a proper outline.</p>',
  'html'  => <<<'HTML'
My Hobbies

Music
I play the guitar and I am learning the piano.

Sports
Football

I play every Saturday.
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Make <code>My Hobbies</code> the page title with <code>&lt;h1&gt;</code>.',
     '<pre>&lt;h1&gt;My Hobbies&lt;/h1&gt;</pre>Only one <code>&lt;h1&gt;</code> per page.',
     'var h = doc.querySelectorAll("h1");
return h.length === 1 && /my hobbies/i.test(h[0].textContent);'],
    ['html', 'Make <code>Music</code> and <code>Sports</code> section headings with <code>&lt;h2&gt;</code>.',
     'Each section gets its own <code>&lt;h2&gt;</code>:<pre>&lt;h2&gt;Music&lt;/h2&gt;</pre>',
     'var t = Array.prototype.map.call(doc.querySelectorAll("h2"), function (h) { return h.textContent.trim().toLowerCase(); });
return t.indexOf("music") >= 0 && t.indexOf("sports") >= 0;'],
    ['html', 'Make <code>Football</code> an <code>&lt;h3&gt;</code> inside the Sports section, and put the sentences in <code>&lt;p&gt;</code> tags.',
     'The <code>&lt;h3&gt;</code> comes after the Sports <code>&lt;h2&gt;</code>. Every sentence gets a <code>&lt;p&gt;</code>.',
     'var h3 = doc.querySelector("h3");
var sports = Array.prototype.filter.call(doc.querySelectorAll("h2"), function (h) { return /sports/i.test(h.textContent); })[0];
return !!h3 && /football/i.test(h3.textContent) && !!sports && (sports.compareDocumentPosition(h3) & 4) !== 0 && doc.querySelectorAll("p").length >= 2;'],
  ],
  'solution' => ['html' => "<h1>My Hobbies</h1>\n\n<h2>Music</h2>\n<p>I play the guitar and I am learning the piano.</p>\n\n<h2>Sports</h2>\n<h3>Football</h3>\n<p>I play every Saturday.</p>\n"],
],

'paragraphs' => [
  'title' => 'Paragraphs',
  'desc'  => '<p>Browsers ignore line breaks in your code. Two sentences on separate lines still end up in one block, unless you wrap each block in <code>&lt;p&gt;</code>.</p><p>Write a short "about me" with three real paragraphs.</p>',
  'html'  => <<<'HTML'
<h1>About me</h1>

I live in a small town by the river.
I have a dog called Pixel.
My favourite subject is science.
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Put each sentence in its own <code>&lt;p&gt;</code>, so the page has three paragraphs.',
     '<pre>&lt;p&gt;I live in a small town by the river.&lt;/p&gt;</pre>Do the same for the other two sentences.',
     'return doc.querySelectorAll("p").length >= 3;'],
    ['html', 'Make the paragraphs a little longer: every paragraph should have at least two sentences.',
     'Add a second sentence inside each <code>&lt;p&gt;</code>, for example what you like about the town.',
     'var ps = doc.querySelectorAll("p");
if (ps.length < 3) return false;
return Array.prototype.every.call(ps, function (p) { return (p.textContent.match(/[.!?]/g) || []).length >= 2; });'],
    ['html', 'Leave no loose text outside the paragraphs (only the heading and the paragraphs).',
     'Every sentence must sit between <code>&lt;p&gt;</code> and <code>&lt;/p&gt;</code>.',
     'var loose = Array.prototype.filter.call(doc.body.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim().length > 0; });
return loose.length === 0 && doc.querySelectorAll("p").length >= 3;'],
  ],
  'solution' => ['html' => "<h1>About me</h1>\n\n<p>I live in a small town by the river. In summer we swim there every day.</p>\n<p>I have a dog called Pixel. He is three years old and loves tennis balls.</p>\n<p>My favourite subject is science. I want to build robots one day.</p>\n"],
],

'comments' => [
  'title' => 'Notes to yourself',
  'desc'  => '<p>Anything between <code>&lt;!--</code> and <code>--&gt;</code> is a <b>comment</b>. The browser skips it, so it is a good place for notes, or for hiding something you are not sure about yet.</p><p>The page shows a to-do note that visitors should not see. Hide it, and leave a note of your own.</p>',
  'html'  => <<<'HTML'
<h1>Recipe: pancakes</h1>
<p>Mix flour, milk and eggs. Fry on both sides.</p>

TODO: add the amounts before publishing

<p>Serve with jam or maple syrup.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Turn the <code>TODO</code> line into a comment so it disappears from the page.',
     '<pre>&lt;!-- TODO: add the amounts before publishing --&gt;</pre>',
     'if (/todo/i.test(doc.body.textContent)) return false;
var w = doc.createTreeWalker(doc.body, 128), c;
while ((c = w.nextNode())) if (/todo/i.test(c.textContent)) return true;
return false;'],
    ['html', 'Add a comment of your own above the <code>&lt;h1&gt;</code>, for example what the page is about.',
     'A comment can say anything:<pre>&lt;!-- My recipe page --&gt;</pre>',
     'var h = doc.querySelector("h1"); if (!h) return false;
var w = doc.createTreeWalker(doc.body, 128), c;
while ((c = w.nextNode())) if (!/todo/i.test(c.textContent) && c.textContent.trim() && (c.compareDocumentPosition(h) & 4) !== 0) return true;
return false;'],
    ['html', 'Keep both recipe paragraphs visible.',
     'Only the TODO line goes inside a comment. Check that you closed it with <code>--&gt;</code>.',
     'var ps = doc.querySelectorAll("p");
return ps.length >= 2 && /mix flour/i.test(doc.body.textContent) && /serve with/i.test(doc.body.textContent);'],
  ],
  'solution' => ['html' => "<!-- My recipe page -->\n<h1>Recipe: pancakes</h1>\n<p>Mix flour, milk and eggs. Fry on both sides.</p>\n\n<!-- TODO: add the amounts before publishing -->\n\n<p>Serve with jam or maple syrup.</p>\n"],
],

];
