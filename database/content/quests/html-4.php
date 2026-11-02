<?php
// Codle content — HTML · Unit 4 · Page Structure

$page = <<<'CSS'
body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  background: #f2f4f8;
  color: #1c1c1e;
}

header, nav, main, section, article, aside, footer {
  display: block;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
header { background: #0a84ff; color: #ffffff; }
nav ul { margin: 0; padding: 0; list-style: none; display: flex; gap: 16px; }
nav a { color: #0a84ff; font-weight: 600; }
article { background: #fffbe6; }
aside { background: #eef6ff; }
footer { font-size: 14px; color: #555; }
h1, h2, h3, p { margin: 0 0 8px; }
CSS;

return [

'document-structure' => [
  'title' => 'Head and body',
  'desc'  => '<p>A page has two parts. The <b>head</b> holds information about the page: its <code>&lt;title&gt;</code> (shown in the browser tab) and <code>&lt;meta&gt;</code> tags. The <b>body</b> holds everything people see.</p><p>Codle adds the <code>&lt;html&gt;</code>, <code>&lt;head&gt;</code> and <code>&lt;body&gt;</code> tags for you, so write the head tags at the top of the HTML tab and they will count.</p>',
  'html'  => <<<'HTML'
<h1>Codle Bakery</h1>
<p>Fresh bread every morning since 1998.</p>
<p>Visit us at 12 Main Street.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a <code>&lt;title&gt;</code> with the text <code>Codle Bakery</code>.',
     'Put it at the very top:<pre>&lt;title&gt;Codle Bakery&lt;/title&gt;</pre>',
     'return /codle bakery/i.test(doc.title);'],
    ['html', 'Add a description for search engines: <code>&lt;meta name="description" content="…"&gt;</code>.',
     '<pre>&lt;meta name="description" content="Fresh bread every morning in Teplice."&gt;</pre>',
     'var m = doc.querySelector("meta[name=\"description\"]");
return !!m && (m.getAttribute("content") || "").trim().length >= 10;'],
    ['html', 'Wrap the visible content (heading and paragraphs) in <code>&lt;main&gt;</code>.',
     '<pre>&lt;main&gt;\n  &lt;h1&gt;...&lt;/h1&gt;\n  &lt;p&gt;...&lt;/p&gt;\n&lt;/main&gt;</pre>',
     'var m = doc.querySelector("main");
return !!m && !!m.querySelector("h1") && m.querySelectorAll("p").length >= 2;'],
  ],
  'solution' => ['html' => "<title>Codle Bakery</title>\n<meta name=\"description\" content=\"Fresh bread every morning in Teplice.\">\n\n<main>\n  <h1>Codle Bakery</h1>\n  <p>Fresh bread every morning since 1998.</p>\n  <p>Visit us at 12 Main Street.</p>\n</main>\n"],
],

'semantic-tags' => [
  'title' => 'Divs with a meaning',
  'desc'  => '<p>A <code>&lt;div&gt;</code> is a box with no meaning. HTML has boxes that say what they are: <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;footer&gt;</code>. Screen readers and search engines understand them, and your code reads better.</p><p>Replace the divs in this page with the matching semantic tags. The CSS already styles them.</p>',
  'html'  => <<<'HTML'
<div class="header">
  <h1>Codle Bakery</h1>
</div>

<div class="nav">
  <ul>
    <li><a href="#bread">Bread</a></li>
    <li><a href="#cakes">Cakes</a></li>
  </ul>
</div>

<div class="main">
  <h2 id="bread">Bread</h2>
  <p>Sourdough, rye and baguettes.</p>
  <h2 id="cakes">Cakes</h2>
  <p>Order two days ahead.</p>
</div>

<div class="footer">
  <p>© Codle Bakery</p>
</div>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Replace <code>&lt;div class="header"&gt;</code> with <code>&lt;header&gt;</code> and <code>&lt;div class="footer"&gt;</code> with <code>&lt;footer&gt;</code>.',
     'Change both the opening and the closing tag:<pre>&lt;header&gt;\n  &lt;h1&gt;Codle Bakery&lt;/h1&gt;\n&lt;/header&gt;</pre>',
     'return !doc.querySelector("div.header") && !doc.querySelector("div.footer") && !!doc.querySelector("header h1") && !!doc.querySelector("footer p");'],
    ['html', 'Replace <code>&lt;div class="nav"&gt;</code> with <code>&lt;nav&gt;</code>.',
     '<pre>&lt;nav&gt;\n  &lt;ul&gt;...&lt;/ul&gt;\n&lt;/nav&gt;</pre>',
     'return !doc.querySelector("div.nav") && doc.querySelectorAll("nav ul li a").length >= 2;'],
    ['html', 'Replace <code>&lt;div class="main"&gt;</code> with <code>&lt;main&gt;</code>, so no <code>&lt;div&gt;</code> is left.',
     'After this step there should be no <code>&lt;div&gt;</code> in the page at all.',
     'return !doc.querySelector("div") && doc.querySelectorAll("main h2").length >= 2;'],
  ],
  'solution' => ['html' => "<header>\n  <h1>Codle Bakery</h1>\n</header>\n\n<nav>\n  <ul>\n    <li><a href=\"#bread\">Bread</a></li>\n    <li><a href=\"#cakes\">Cakes</a></li>\n  </ul>\n</nav>\n\n<main>\n  <h2 id=\"bread\">Bread</h2>\n  <p>Sourdough, rye and baguettes.</p>\n  <h2 id=\"cakes\">Cakes</h2>\n  <p>Order two days ahead.</p>\n</main>\n\n<footer>\n  <p>© Codle Bakery</p>\n</footer>\n"],
],

'header-footer' => [
  'title' => 'Top and bottom',
  'desc'  => '<p>The <code>&lt;header&gt;</code> is the top of the page: the site name and often a tagline. The <code>&lt;footer&gt;</code> is the bottom: copyright, contact, small print.</p><p>Build both for a school club page.</p>',
  'html'  => <<<'HTML'
<main>
  <h2>Next meeting</h2>
  <p>Thursday at 15:00 in room 12. Bring your laptop.</p>
</main>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a <code>&lt;header&gt;</code> above <code>&lt;main&gt;</code> with an <code>&lt;h1&gt;</code> that says <code>Robotics Club</code>.',
     '<pre>&lt;header&gt;\n  &lt;h1&gt;Robotics Club&lt;/h1&gt;\n&lt;/header&gt;</pre>',
     'var h = doc.querySelector("header h1"), m = doc.querySelector("main");
return !!h && /robotics club/i.test(h.textContent) && !!m && (h.compareDocumentPosition(m) & 4) !== 0;'],
    ['html', 'Add a tagline paragraph in the header under the heading.',
     'For example <code>&lt;p&gt;We build robots on Thursdays.&lt;/p&gt;</code>, inside the header.',
     'var p = doc.querySelector("header p");
return !!p && p.textContent.trim().length >= 5;'],
    ['html', 'Add a <code>&lt;footer&gt;</code> after <code>&lt;main&gt;</code> with a copyright line (<code>&amp;copy;</code> writes the © sign) and an email link (<code>href="mailto:…"</code>).',
     '<pre>&lt;footer&gt;\n  &lt;p&gt;&amp;copy; 2026 Robotics Club · &lt;a href="mailto:club@example.com"&gt;Write to us&lt;/a&gt;&lt;/p&gt;\n&lt;/footer&gt;</pre>',
     'var f = doc.querySelector("footer"), m = doc.querySelector("main");
return !!f && !!m && (m.compareDocumentPosition(f) & 4) !== 0 && /©/.test(f.textContent) && !!f.querySelector("a[href^=\"mailto:\"]");'],
  ],
  'solution' => ['html' => "<header>\n  <h1>Robotics Club</h1>\n  <p>We build robots on Thursdays.</p>\n</header>\n\n<main>\n  <h2>Next meeting</h2>\n  <p>Thursday at 15:00 in room 12. Bring your laptop.</p>\n</main>\n\n<footer>\n  <p>&copy; 2026 Robotics Club · <a href=\"mailto:club@example.com\">Write to us</a></p>\n</footer>\n"],
],

'navigation' => [
  'title' => 'A menu that works',
  'desc'  => '<p>A site menu is a <code>&lt;nav&gt;</code> with a list of links. Links that start with <code>#</code> jump to the element with that <code>id</code> on the same page.</p><p>Build a menu for the three sections below and make every link land on its section.</p>',
  'html'  => <<<'HTML'
<header>
  <h1>Robotics Club</h1>
</header>

<main>
  <section>
    <h2>About</h2>
    <p>We are twelve students who like building things.</p>
  </section>
  <section>
    <h2>Projects</h2>
    <p>A line-following robot and a weather station.</p>
  </section>
  <section>
    <h2>Join</h2>
    <p>Come to room 12 on Thursday.</p>
  </section>
</main>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a <code>&lt;nav&gt;</code> between the header and main with a <code>&lt;ul&gt;</code> of three links: About, Projects, Join.',
     '<pre>&lt;nav&gt;\n  &lt;ul&gt;\n    &lt;li&gt;&lt;a href="#about"&gt;About&lt;/a&gt;&lt;/li&gt;\n    ...\n  &lt;/ul&gt;\n&lt;/nav&gt;</pre>',
     'var n = doc.querySelector("nav"), m = doc.querySelector("main");
return !!n && !!m && (n.compareDocumentPosition(m) & 4) !== 0 && n.querySelectorAll("ul li a").length >= 3;'],
    ['html', 'Give each section an <code>id</code> (<code>about</code>, <code>projects</code>, <code>join</code>).',
     '<pre>&lt;section id="about"&gt;</pre>',
     'return !!doc.querySelector("section#about") && !!doc.querySelector("section#projects") && !!doc.querySelector("section#join");'],
    ['html', 'Make every menu link point to its section with <code>href="#…"</code>.',
     'The <code>href</code> is <code>#</code> plus the id: <code>href="#projects"</code> goes to <code>id="projects"</code>.',
     'var links = doc.querySelectorAll("nav a[href^=\"#\"]");
if (links.length < 3) return false;
return Array.prototype.every.call(links, function (a) { var id = a.getAttribute("href").slice(1); return id && !!doc.getElementById(id); });'],
  ],
  'solution' => ['html' => "<header>\n  <h1>Robotics Club</h1>\n</header>\n\n<nav>\n  <ul>\n    <li><a href=\"#about\">About</a></li>\n    <li><a href=\"#projects\">Projects</a></li>\n    <li><a href=\"#join\">Join</a></li>\n  </ul>\n</nav>\n\n<main>\n  <section id=\"about\">\n    <h2>About</h2>\n    <p>We are twelve students who like building things.</p>\n  </section>\n  <section id=\"projects\">\n    <h2>Projects</h2>\n    <p>A line-following robot and a weather station.</p>\n  </section>\n  <section id=\"join\">\n    <h2>Join</h2>\n    <p>Come to room 12 on Thursday.</p>\n  </section>\n</main>\n"],
],

'sections' => [
  'title' => 'News page',
  'desc'  => '<p>An <code>&lt;article&gt;</code> is a piece of content that makes sense on its own: a news item, a blog post, a comment. A <code>&lt;section&gt;</code> groups related content under a heading. An <code>&lt;aside&gt;</code> is a side note.</p><p>Structure the club news page with these three.</p>',
  'html'  => <<<'HTML'
<main>
  <h2>Club news</h2>

  <h3>We won the regional final</h3>
  <p>Our line follower finished first in Ústí on Saturday.</p>

  <h3>New members welcome</h3>
  <p>Beginners can start any Thursday. No experience needed.</p>

  <p>Tip: bring a USB cable, we always run out.</p>
</main>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Wrap each news item (its <code>&lt;h3&gt;</code> and paragraph) in an <code>&lt;article&gt;</code>.',
     '<pre>&lt;article&gt;\n  &lt;h3&gt;We won the regional final&lt;/h3&gt;\n  &lt;p&gt;...&lt;/p&gt;\n&lt;/article&gt;</pre>',
     'var arts = doc.querySelectorAll("article");
return arts.length >= 2 && Array.prototype.every.call(arts, function (a) { return !!a.querySelector("h3") && !!a.querySelector("p"); });'],
    ['html', 'Group the heading <code>Club news</code> and both articles in a <code>&lt;section&gt;</code>.',
     'The section starts before the <code>&lt;h2&gt;</code> and ends after the second article.',
     'var s = doc.querySelector("section");
return !!s && !!s.querySelector("h2") && s.querySelectorAll("article").length >= 2;'],
    ['html', 'Turn the tip into an <code>&lt;aside&gt;</code> outside the section.',
     '<pre>&lt;aside&gt;\n  &lt;p&gt;Tip: bring a USB cable, we always run out.&lt;/p&gt;\n&lt;/aside&gt;</pre>',
     'var a = doc.querySelector("aside");
return !!a && /usb cable/i.test(a.textContent) && !a.closest("section");'],
  ],
  'solution' => ['html' => "<main>\n  <section>\n    <h2>Club news</h2>\n\n    <article>\n      <h3>We won the regional final</h3>\n      <p>Our line follower finished first in Ústí on Saturday.</p>\n    </article>\n\n    <article>\n      <h3>New members welcome</h3>\n      <p>Beginners can start any Thursday. No experience needed.</p>\n    </article>\n  </section>\n\n  <aside>\n    <p>Tip: bring a USB cable, we always run out.</p>\n  </aside>\n</main>\n"],
],

];
