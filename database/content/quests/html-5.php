<?php
// Codle content — HTML · Unit 5 · Tables & Forms

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
table { border-collapse: collapse; background: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
th, td { padding: 8px 14px; border-bottom: 1px solid #e5e7eb; text-align: left; }
th { background: #eef2f7; }
caption { caption-side: top; font-weight: 600; padding: 8px; }

form { max-width: 360px; padding: 20px; border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
label { display: block; margin: 12px 0 4px; font-weight: 600; }
input, select, textarea { width: 100%; padding: 8px 10px; font: inherit; border: 1px solid #c7ccd4; border-radius: 8px; box-sizing: border-box; }
button { margin-top: 16px; padding: 10px 18px; font: inherit; font-weight: 600; color: #ffffff; background: #0a84ff; border: none; border-radius: 8px; }
CSS;

return [

'tables' => [
  'title' => 'Rows and cells',
  'desc'  => '<p>A table is built row by row: <code>&lt;table&gt;</code> holds <code>&lt;tr&gt;</code> rows, and every row holds <code>&lt;td&gt;</code> cells. All rows should have the same number of cells.</p><p>Turn the timetable into a real table.</p>',
  'html'  => <<<'HTML'
<h1>Club timetable</h1>

Monday - Robotics - Room 12
Wednesday - Coding - Room 7
Friday - 3D printing - Workshop
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Create a <code>&lt;table&gt;</code> with one <code>&lt;tr&gt;</code> per day.',
     '<pre>&lt;table&gt;\n  &lt;tr&gt;...&lt;/tr&gt;\n  &lt;tr&gt;...&lt;/tr&gt;\n  &lt;tr&gt;...&lt;/tr&gt;\n&lt;/table&gt;</pre>',
     'var t = doc.querySelector("table");
return !!t && t.querySelectorAll("tr").length >= 3;'],
    ['html', 'Put the day, the activity and the room in three <code>&lt;td&gt;</code> cells in every row.',
     '<pre>&lt;tr&gt;\n  &lt;td&gt;Monday&lt;/td&gt;\n  &lt;td&gt;Robotics&lt;/td&gt;\n  &lt;td&gt;Room 12&lt;/td&gt;\n&lt;/tr&gt;</pre>',
     'var rows = doc.querySelectorAll("table tr");
return rows.length >= 3 && Array.prototype.every.call(rows, function (r) { return r.querySelectorAll("td").length === 3; });'],
    ['html', 'Leave no loose text outside the table.',
     'Every piece of the old lines must be inside a <code>&lt;td&gt;</code>.',
     'var loose = Array.prototype.filter.call(doc.body.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim().length > 0; });
return loose.length === 0 && !!doc.querySelector("table");'],
  ],
  'solution' => ['html' => "<h1>Club timetable</h1>\n\n<table>\n  <tr>\n    <td>Monday</td>\n    <td>Robotics</td>\n    <td>Room 12</td>\n  </tr>\n  <tr>\n    <td>Wednesday</td>\n    <td>Coding</td>\n    <td>Room 7</td>\n  </tr>\n  <tr>\n    <td>Friday</td>\n    <td>3D printing</td>\n    <td>Workshop</td>\n  </tr>\n</table>\n"],
],

'table-headers' => [
  'title' => 'Headers and captions',
  'desc'  => '<p>Header cells are <code>&lt;th&gt;</code>, not <code>&lt;td&gt;</code>. <code>&lt;thead&gt;</code> and <code>&lt;tbody&gt;</code> separate the header row from the data, and <code>&lt;caption&gt;</code> gives the table a title. Screen readers use all of this to read tables out loud.</p>',
  'html'  => <<<'HTML'
<table>
  <tr>
    <td>Day</td>
    <td>Activity</td>
    <td>Room</td>
  </tr>
  <tr>
    <td>Monday</td>
    <td>Robotics</td>
    <td>Room 12</td>
  </tr>
  <tr>
    <td>Wednesday</td>
    <td>Coding</td>
    <td>Room 7</td>
  </tr>
</table>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Change the three cells of the first row to <code>&lt;th&gt;</code> with <code>scope="col"</code>.',
     '<pre>&lt;th scope="col"&gt;Day&lt;/th&gt;</pre>',
     'var th = doc.querySelectorAll("table tr:first-child th[scope=\"col\"], thead th[scope=\"col\"]");
return th.length >= 3;'],
    ['html', 'Wrap the header row in <code>&lt;thead&gt;</code> and the other rows in <code>&lt;tbody&gt;</code>.',
     '<pre>&lt;thead&gt;\n  &lt;tr&gt;...&lt;/tr&gt;\n&lt;/thead&gt;\n&lt;tbody&gt;\n  &lt;tr&gt;...&lt;/tr&gt;\n&lt;/tbody&gt;</pre>',
     'return doc.querySelectorAll("thead tr").length === 1 && doc.querySelectorAll("tbody tr").length >= 2 && doc.querySelectorAll("thead th").length >= 3;'],
    ['html', 'Add a <code>&lt;caption&gt;</code> that says <code>Club timetable</code> as the first thing inside the table.',
     '<pre>&lt;table&gt;\n  &lt;caption&gt;Club timetable&lt;/caption&gt;\n  ...</pre>',
     'var c = doc.querySelector("table > caption");
return !!c && /club timetable/i.test(c.textContent);'],
  ],
  'solution' => ['html' => "<table>\n  <caption>Club timetable</caption>\n  <thead>\n    <tr>\n      <th scope=\"col\">Day</th>\n      <th scope=\"col\">Activity</th>\n      <th scope=\"col\">Room</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Monday</td>\n      <td>Robotics</td>\n      <td>Room 12</td>\n    </tr>\n    <tr>\n      <td>Wednesday</td>\n      <td>Coding</td>\n      <td>Room 7</td>\n    </tr>\n  </tbody>\n</table>\n"],
],

'forms' => [
  'title' => 'Sign-up form',
  'desc'  => '<p>A <code>&lt;form&gt;</code> collects what people type and sends it somewhere. <code>action</code> says where, <code>method="post"</code> says how. Every field needs a <code>name</code>, otherwise its value is not sent.</p><p>Build the sign-up form for the club.</p>',
  'html'  => <<<'HTML'
<h1>Join the club</h1>

HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a <code>&lt;form&gt;</code> with <code>action="/join"</code> and <code>method="post"</code>.',
     '<pre>&lt;form action="/join" method="post"&gt;\n\n&lt;/form&gt;</pre>',
     'var f = doc.querySelector("form");
return !!f && f.getAttribute("action") === "/join" && (f.getAttribute("method") || "").toLowerCase() === "post";'],
    ['html', 'Inside it, add a text input with <code>name="fullname"</code> and an email input with <code>name="email"</code>.',
     '<pre>&lt;input type="text" name="fullname"&gt;\n&lt;input type="email" name="email"&gt;</pre>',
     'var f = doc.querySelector("form");
return !!f && !!f.querySelector("input[name=\"fullname\"]") && !!f.querySelector("input[type=\"email\"][name=\"email\"]");'],
    ['html', 'Add a submit button that says <code>Join</code>.',
     '<pre>&lt;button type="submit"&gt;Join&lt;/button&gt;</pre>',
     'var b = doc.querySelector("form button[type=\"submit\"], form button:not([type]), form input[type=\"submit\"]");
return !!b && /join/i.test(b.textContent || b.value || "");'],
  ],
  'solution' => ['html' => "<h1>Join the club</h1>\n\n<form action=\"/join\" method=\"post\">\n  <input type=\"text\" name=\"fullname\">\n  <input type=\"email\" name=\"email\">\n  <button type=\"submit\">Join</button>\n</form>\n"],
],

'inputs' => [
  'title' => 'The right input for the job',
  'desc'  => '<p><code>&lt;input&gt;</code> changes with its <code>type</code>: <code>number</code> shows a number field with arrows, <code>date</code> a calendar. <code>&lt;select&gt;</code> is a drop-down of <code>&lt;option&gt;</code>s, and <code>&lt;textarea&gt;</code> is a box for longer text.</p>',
  'html'  => <<<'HTML'
<h1>Order a cake</h1>

<form action="/order" method="post">
  <label>Your name</label>
  <input type="text" name="fullname">

  <label>How many people?</label>


  <label>Pick-up date</label>


  <label>Flavour</label>


  <label>Message on the cake</label>


  <button type="submit">Order</button>
</form>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Add a <code>number</code> input named <code>people</code> with <code>min="1"</code> and <code>max="40"</code>.',
     '<pre>&lt;input type="number" name="people" min="1" max="40"&gt;</pre>',
     'var i = doc.querySelector("input[type=\"number\"][name=\"people\"]");
return !!i && i.getAttribute("min") === "1" && i.getAttribute("max") === "40";'],
    ['html', 'Add a <code>date</code> input named <code>pickup</code> and a <code>&lt;select name="flavour"&gt;</code> with at least three <code>&lt;option&gt;</code>s.',
     '<pre>&lt;input type="date" name="pickup"&gt;\n\n&lt;select name="flavour"&gt;\n  &lt;option&gt;Chocolate&lt;/option&gt;\n  &lt;option&gt;Vanilla&lt;/option&gt;\n  &lt;option&gt;Lemon&lt;/option&gt;\n&lt;/select&gt;</pre>',
     'var d = doc.querySelector("input[type=\"date\"][name=\"pickup\"]"), s = doc.querySelector("select[name=\"flavour\"]");
return !!d && !!s && s.querySelectorAll("option").length >= 3;'],
    ['html', 'Add a <code>&lt;textarea name="message"&gt;</code> for the message, with <code>rows="3"</code>.',
     '<pre>&lt;textarea name="message" rows="3"&gt;&lt;/textarea&gt;</pre>',
     'var t = doc.querySelector("textarea[name=\"message\"]");
return !!t && t.getAttribute("rows") === "3";'],
  ],
  'solution' => ['html' => "<h1>Order a cake</h1>\n\n<form action=\"/order\" method=\"post\">\n  <label>Your name</label>\n  <input type=\"text\" name=\"fullname\">\n\n  <label>How many people?</label>\n  <input type=\"number\" name=\"people\" min=\"1\" max=\"40\">\n\n  <label>Pick-up date</label>\n  <input type=\"date\" name=\"pickup\">\n\n  <label>Flavour</label>\n  <select name=\"flavour\">\n    <option>Chocolate</option>\n    <option>Vanilla</option>\n    <option>Lemon</option>\n  </select>\n\n  <label>Message on the cake</label>\n  <textarea name=\"message\" rows=\"3\"></textarea>\n\n  <button type=\"submit\">Order</button>\n</form>\n"],
],

'buttons-labels' => [
  'title' => 'Labels that click',
  'desc'  => '<p>A <code>&lt;label&gt;</code> names a field. With <code>for="…"</code> pointing at the input\'s <code>id</code>, clicking the label focuses the field, and screen readers read the name. <code>placeholder</code> is a hint inside the field, and <code>required</code> stops the form from sending while the field is empty.</p>',
  'html'  => <<<'HTML'
<h1>Newsletter</h1>

<form action="/subscribe" method="post">
  <label>Name</label>
  <input type="text" name="fullname">

  <label>Email</label>
  <input type="email" name="email">

  <button>Subscribe</button>
  <button>Clear</button>
</form>
HTML,
  'css'   => $page,
  'js'    => '',
  'objectives' => [
    ['html', 'Connect both labels to their inputs: give each input an <code>id</code> and each label a matching <code>for</code>.',
     '<pre>&lt;label for="fullname"&gt;Name&lt;/label&gt;\n&lt;input type="text" name="fullname" id="fullname"&gt;</pre>',
     'var labels = doc.querySelectorAll("label[for]");
if (labels.length < 2) return false;
return Array.prototype.every.call(labels, function (l) { var el = doc.getElementById(l.getAttribute("for")); return !!el && el.tagName === "INPUT"; });'],
    ['html', 'Make the email field <code>required</code> and give it a <code>placeholder</code> like <code>you@example.com</code>.',
     '<pre>&lt;input type="email" name="email" id="email" required placeholder="you@example.com"&gt;</pre>',
     'var i = doc.querySelector("input[type=\"email\"]");
return !!i && i.hasAttribute("required") && (i.getAttribute("placeholder") || "").indexOf("@") > 0;'],
    ['html', 'Set the button types: <code>Subscribe</code> is <code>type="submit"</code>, <code>Clear</code> is <code>type="reset"</code>.',
     'A button without a type submits the form, so say what each one does:<pre>&lt;button type="submit"&gt;Subscribe&lt;/button&gt;\n&lt;button type="reset"&gt;Clear&lt;/button&gt;</pre>',
     'var s = Array.prototype.filter.call(doc.querySelectorAll("button"), function (b) { return /subscribe/i.test(b.textContent); })[0];
var r = Array.prototype.filter.call(doc.querySelectorAll("button"), function (b) { return /clear/i.test(b.textContent); })[0];
return !!s && !!r && s.getAttribute("type") === "submit" && r.getAttribute("type") === "reset";'],
  ],
  'solution' => ['html' => "<h1>Newsletter</h1>\n\n<form action=\"/subscribe\" method=\"post\">\n  <label for=\"fullname\">Name</label>\n  <input type=\"text\" name=\"fullname\" id=\"fullname\">\n\n  <label for=\"email\">Email</label>\n  <input type=\"email\" name=\"email\" id=\"email\" required placeholder=\"you@example.com\">\n\n  <button type=\"submit\">Subscribe</button>\n  <button type=\"reset\">Clear</button>\n</form>\n"],
],

];
