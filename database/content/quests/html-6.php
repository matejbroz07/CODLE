<?php
// Codle content — HTML · Unit 6 · Putting It Together

$page = <<<'CSS'
body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  background: #f2f4f8;
  color: #1c1c1e;
}

h1 { margin: 0 0 16px; }
p { margin: 0 0 10px; max-width: 60ch; }
a { color: #0a84ff; }
abbr { text-decoration: underline dotted; cursor: help; }
CSS;

$cards = <<<'CSS'
body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}

h1 { margin: 0 0 16px; }

.card {
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.card h2 { margin: 0 0 4px; font-size: 18px; }
.card p { margin: 0; color: #555; }

.featured {
  background: #0a84ff;
  color: #ffffff;
}
.featured p { color: #dbeaff; }

.sold-out { opacity: 0.5; }
CSS;

return [

'attributes' => [
  'title' => 'Attributes everywhere',
  'desc'  => '<p>Attributes sit inside the opening tag and add details: <code>id</code> names one element, <code>title</code> shows a tooltip, <code>target</code> and <code>rel</code> control how a link opens. Attribute names are lowercase, values go in quotes.</p>',
  'html'  => <<<'HTML'
<h1>About the club</h1>
<p>We meet in room 12. Our club is part of the STEM programme.</p>
<p>Read more about our robots on the school website.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Give the heading <code>id="top"</code>.',
     '<pre>&lt;h1 id="top"&gt;About the club&lt;/h1&gt;</pre>',
     'var h = doc.getElementById("top");
return !!h && h.tagName === "H1";'],
    ['html', 'Wrap <code>STEM</code> in <code>&lt;abbr&gt;</code> with a <code>title</code> that spells it out.',
     '<pre>&lt;abbr title="Science, Technology, Engineering and Mathematics"&gt;STEM&lt;/abbr&gt;</pre>',
     'var a = doc.querySelector("abbr[title]");
return !!a && /stem/i.test(a.textContent) && a.getAttribute("title").trim().length >= 10;'],
    ['html', 'Link <code>school website</code> to <code>https://school.example.com</code>, opening in a new tab with <code>target="_blank"</code> and <code>rel="noopener"</code>.',
     '<pre>&lt;a href="https://school.example.com" target="_blank" rel="noopener"&gt;school website&lt;/a&gt;</pre>',
     'var a = doc.querySelector("a[href=\"https://school.example.com\"]");
return !!a && a.getAttribute("target") === "_blank" && /\bnoopener\b/.test(a.getAttribute("rel") || "");'],
  ],
  'solution' => ['html' => "<h1 id=\"top\">About the club</h1>\n<p>We meet in room 12. Our club is part of the <abbr title=\"Science, Technology, Engineering and Mathematics\">STEM</abbr> programme.</p>\n<p>Read more about our robots on the <a href=\"https://school.example.com\" target=\"_blank\" rel=\"noopener\">school website</a>.</p>\n"],
],

'classes' => [
  'title' => 'Same look, many elements',
  'desc'  => '<p>An <code>id</code> is for one element; a <code>class</code> can be shared by many. CSS uses classes to style whole groups at once, and an element can have several classes separated by spaces.</p><p>The CSS tab already has styles for <code>.card</code>, <code>.featured</code> and <code>.sold-out</code>. Use them.</p>',
  'html'  => <<<'HTML'
<h1>Workshops</h1>

<section>
  <h2>Build a robot arm</h2>
  <p>Saturday 10:00 · 8 places left</p>
</section>

<section>
  <h2>Intro to 3D printing</h2>
  <p>Saturday 13:00 · 2 places left</p>
</section>

<section>
  <h2>Soldering basics</h2>
  <p>Sunday 10:00 · sold out</p>
</section>
HTML,
  'css'   => $cards,
  'js'    => '',
  'objectives' => [
    ['html', 'Give all three <code>&lt;section&gt;</code>s the class <code>card</code>.',
     '<pre>&lt;section class="card"&gt;</pre>',
     'var s = doc.querySelectorAll("section");
return s.length >= 3 && Array.prototype.every.call(s, function (x) { return x.classList.contains("card"); });'],
    ['html', 'Make the robot arm workshop stand out: add a second class <code>featured</code> to its section.',
     'Classes are separated by a space:<pre>&lt;section class="card featured"&gt;</pre>',
     'var s = doc.querySelector("section.card.featured");
return !!s && /robot arm/i.test(s.textContent) && doc.querySelectorAll("section.featured").length === 1;'],
    ['html', 'Add the class <code>sold-out</code> to the soldering workshop.',
     '<pre>&lt;section class="card sold-out"&gt;</pre>',
     'var s = doc.querySelector("section.card.sold-out");
return !!s && /soldering/i.test(s.textContent);'],
  ],
  'solution' => ['html' => "<h1>Workshops</h1>\n\n<section class=\"card featured\">\n  <h2>Build a robot arm</h2>\n  <p>Saturday 10:00 · 8 places left</p>\n</section>\n\n<section class=\"card\">\n  <h2>Intro to 3D printing</h2>\n  <p>Saturday 13:00 · 2 places left</p>\n</section>\n\n<section class=\"card sold-out\">\n  <h2>Soldering basics</h2>\n  <p>Sunday 10:00 · sold out</p>\n</section>\n"],
],

'meta-tags' => [
  'title' => 'What the browser needs to know',
  'desc'  => '<p>Every real page starts with a few <code>&lt;meta&gt;</code> tags in the head: <code>charset</code> so letters like ž and ě show correctly, <code>viewport</code> so phones do not zoom out, and <code>description</code> for search results. Plus a <code>&lt;title&gt;</code>.</p><p>Codle wraps your code in html, head and body for you: write the head tags at the top of the HTML tab.</p>',
  'html'  => <<<'HTML'
<h1>Robotics Club</h1>
<p>Žádný robot není příliš malý.</p>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add <code>&lt;meta charset="utf-8"&gt;</code> and a <code>&lt;title&gt;</code>.',
     '<pre>&lt;meta charset="utf-8"&gt;\n&lt;title&gt;Robotics Club&lt;/title&gt;</pre>',
     'return !!doc.querySelector("meta[charset]") && /utf-?8/i.test(doc.querySelector("meta[charset]").getAttribute("charset")) && doc.title.trim().length > 0;'],
    ['html', 'Add the viewport tag: <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code>.',
     'Copy it exactly; this one line is on practically every website.',
     'var m = doc.querySelector("meta[name=\"viewport\"]");
return !!m && /width=device-width/.test(m.getAttribute("content") || "") && /initial-scale=1/.test(m.getAttribute("content") || "");'],
    ['html', 'Add a <code>description</code> meta tag of at least 20 characters.',
     '<pre>&lt;meta name="description" content="A school robotics club in Teplice. Beginners welcome."&gt;</pre>',
     'var m = doc.querySelector("meta[name=\"description\"]");
return !!m && (m.getAttribute("content") || "").trim().length >= 20;'],
  ],
  'solution' => ['html' => "<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"description\" content=\"A school robotics club in Teplice. Beginners welcome.\">\n<title>Robotics Club</title>\n\n<h1>Robotics Club</h1>\n<p>Žádný robot není příliš malý.</p>\n"],
],

'accessibility' => [
  'title' => 'A page for everyone',
  'desc'  => '<p>Accessible HTML works with a keyboard and a screen reader. Buttons must be real <code>&lt;button&gt;</code>s (a <code>&lt;div&gt;</code> cannot be focused or pressed with Enter), icon-only buttons need an <code>aria-label</code>, and every field needs a label.</p><p>Fix the three problems in this page.</p>',
  'html'  => <<<'HTML'
<h1>Newsletter</h1>

<form action="/subscribe" method="post">
  <input type="email" name="email" id="email" placeholder="Email">
  <div class="btn" onclick="alert('Thanks!')">Subscribe</div>
</form>

<button class="icon" type="button">✕</button>
HTML,
  'css'   => <<<'CSS'
body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  background: #f2f4f8;
  color: #1c1c1e;
}
form { display: flex; gap: 8px; align-items: center; }
input { padding: 10px 12px; font: inherit; border: 1px solid #c7ccd4; border-radius: 8px; }
label { font-weight: 600; margin-right: 4px; }
.btn, button { padding: 10px 16px; font: inherit; font-weight: 600; color: #ffffff; background: #0a84ff; border: none; border-radius: 8px; cursor: pointer; }
.icon { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; padding: 0; border-radius: 50%; background: #333; }
CSS,
  'js'    => '',
  'objectives' => [
    ['html', 'Replace the <code>&lt;div class="btn"&gt;</code> with a real <code>&lt;button type="submit"&gt;</code>.',
     '<pre>&lt;button type="submit" class="btn"&gt;Subscribe&lt;/button&gt;</pre>',
     'var b = doc.querySelector("form button[type=\"submit\"]");
return !!b && /subscribe/i.test(b.textContent) && !doc.querySelector("div.btn");'],
    ['html', 'Add a <code>&lt;label for="email"&gt;</code> before the email field.',
     '<pre>&lt;label for="email"&gt;Email&lt;/label&gt;</pre>',
     'var l = doc.querySelector("label[for=\"email\"]");
return !!l && l.textContent.trim().length > 0 && !!doc.getElementById("email");'],
    ['html', 'The ✕ button has no readable name: give it <code>aria-label="Close"</code>.',
     '<pre>&lt;button class="icon" type="button" aria-label="Close"&gt;✕&lt;/button&gt;</pre>',
     'var b = doc.querySelector("button.icon");
return !!b && /close/i.test(b.getAttribute("aria-label") || "");'],
  ],
  'solution' => ['html' => "<h1>Newsletter</h1>\n\n<form action=\"/subscribe\" method=\"post\">\n  <label for=\"email\">Email</label>\n  <input type=\"email\" name=\"email\" id=\"email\" placeholder=\"Email\">\n  <button type=\"submit\" class=\"btn\">Subscribe</button>\n</form>\n\n<button class=\"icon\" type=\"button\" aria-label=\"Close\">✕</button>\n"],
],

];
