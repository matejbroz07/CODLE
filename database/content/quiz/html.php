<?php
// Codle content — HTML unit quizzes and final exam (see database/content/README.md)
// Question: [prompt, [four answers], index of the correct one, code snippet or null]

return [

'unit-1-quiz' => [
  ['What does HTML stand for?', ['Hyper Text Markup Language', 'High Transfer Machine Language', 'Home Tool Markup Language', 'Hyperlink Text Mode Language'], 0, null],
  ['Which tag makes the main heading of a page?', ['<header>', '<h1>', '<title>', '<heading>'], 1, null],
  ['Which tag wraps a paragraph of text?', ['<text>', '<para>', '<p>', '<pg>'], 2, null],
  ['How many heading levels does HTML have?', ['3', '4', '6', '10'], 2, null],
  ['What is wrong with this code?', ['Nothing, it is fine', 'The closing tag is missing the slash', 'Headings cannot contain text', 'h1 must be lowercase'], 1, "<h1>Welcome<h1>"],
  ['Which of these is a comment?', ['// A note', '/* A note */', '<!-- A note -->', '# A note'], 2, null],
  ['What does the browser do with the line breaks in your HTML code between words?', ['Shows each one as a new line', 'Treats them as a single space', 'Shows an error', 'Removes the text after them'], 1, null],
  ['Which heading should follow an <h1> when you start a new section?', ['<h2>', '<h6>', 'Another <h1>', '<h3>'], 0, null],
],

'unit-2-quiz' => [
  ['Which attribute tells a link where to go?', ['src', 'link', 'href', 'url'], 2, null],
  ['How do you make a link open in a new tab?', ['target="_blank"', 'new="tab"', 'open="new"', 'href="_new"'], 0, null],
  ['Which tag makes a numbered list?', ['<ul>', '<list>', '<nl>', '<ol>'], 3, null],
  ['What goes inside <ul> and <ol>?', ['<item>', '<li>', '<p>', '<entry>'], 1, null],
  ['Which tag marks text as important (shown bold by default)?', ['<b>', '<bold>', '<strong>', '<important>'], 2, null],
  ['What does this link do?', ['Opens a page called contact', 'Jumps to the element with id="contact" on the same page', 'Sends an email', 'Nothing, it is broken'], 1, "<a href=\"#contact\">Contact</a>"],
  ['Which tag adds a line break inside a paragraph?', ['<break>', '<lb>', '<newline>', '<br>'], 3, null],
  ['What does <hr> draw?', ['A heading row', 'A horizontal rule (a line across the page)', 'A hidden row', 'A hyperlink reference'], 1, null],
],

'unit-3-quiz' => [
  ['Which attribute holds the address of an image?', ['href', 'src', 'link', 'path'], 1, null],
  ['Why does an image need an alt attribute?', ['To make it load faster', 'To set its size', 'To describe it for screen readers and when it fails to load', 'To add a caption under it'], 2, null],
  ['What alt text should a purely decorative image have?', ['alt="decoration"', 'An empty alt=""', 'No alt attribute at all', 'alt="image"'], 1, null],
  ['Which tag groups an image with its caption?', ['<caption>', '<figure>', '<imgbox>', '<picture>'], 1, null],
  ['Which tag holds the caption inside a <figure>?', ['<figcaption>', '<caption>', '<label>', '<title>'], 0, null],
  ['What does the controls attribute do on <video>?', ['Makes the video play automatically', 'Shows play, pause and volume buttons', 'Loops the video', 'Mutes the sound'], 1, null],
  ['What is the <source> tag for inside <audio> or <video>?', ['It adds subtitles', 'It names a media file the browser can pick', 'It sets the volume', 'It links to the website of the author'], 1, null],
  ['Why does this image look stretched?', ['Images cannot have a width', 'The height does not match the proportions of the picture', 'The src is wrong', 'alt is missing'], 1, "<img src=\"photo.jpg\" width=\"400\" height=\"100\" alt=\"A loaf\">"],
],

'unit-4-quiz' => [
  ['Where does the <title> of a page belong?', ['In <body>', 'In <head>', 'In <header>', 'In <main>'], 1, null],
  ['Which tag holds everything the visitor can see?', ['<head>', '<main>', '<body>', '<html>'], 2, null],
  ['Which tag is meant for the site navigation menu?', ['<menu>', '<nav>', '<links>', '<ul>'], 1, null],
  ['Which element is for content that makes sense on its own, like a news item?', ['<section>', '<div>', '<article>', '<aside>'], 2, null],
  ['Why use <header> instead of <div class="header">?', ['It loads faster', 'It is shorter and tells browsers and screen readers what the box is', 'div is no longer allowed', 'header can hold images, div cannot'], 1, null],
  ['Which tag is for a side note or related content?', ['<aside>', '<note>', '<sidebar>', '<footer>'], 0, null],
  ['What is the <meta name="description"> tag for?', ['The text under the page title in search results', 'The title in the browser tab', 'The heading at the top of the page', 'The page footer'], 0, null],
  ['How many <main> elements should a page have?', ['One per section', 'Exactly one', 'At least two', 'As many as you like'], 1, null],
],

'unit-5-quiz' => [
  ['Which tag is a table row?', ['<td>', '<tr>', '<row>', '<th>'], 1, null],
  ['Which tag is a header cell?', ['<th>', '<thead>', '<td>', '<hc>'], 0, null],
  ['What does <caption> do in a table?', ['Colours the header row', 'Gives the table a title', 'Adds a footer row', 'Makes the table sortable'], 1, null],
  ['Which input type shows a calendar?', ['type="calendar"', 'type="day"', 'type="date"', 'type="time"'], 2, null],
  ['Why does every form field need a name attribute?', ['So CSS can style it', 'Without it the value is not sent with the form', 'It sets the placeholder', 'It is required by the browser to render it'], 1, null],
  ['How do you connect a <label> to an input?', ['Put the same text in both', 'label for="…" matching the input id', 'label name="…" matching the input name', 'Wrap the label in the input'], 1, null],
  ['What does required do on an input?', ['Makes the field read-only', 'The form will not submit while the field is empty', 'Shows a red border', 'Fills in a default value'], 1, null],
  ['What does this button do inside a form?', ['Clears all fields', 'Submits the form', 'Closes the page', 'Nothing until JavaScript is added'], 0, "<button type=\"reset\">Clear</button>"],
],

'final-exam' => [
  ['Which tag is used for the largest heading?', ['<head>', '<h1>', '<h6>', '<title>'], 1, null],
  ['Which attribute makes an element unique on the page?', ['class', 'name', 'id', 'key'], 2, null],
  ['Can two elements share the same class?', ['No, classes are unique', 'Yes, that is what classes are for', 'Only if they are the same tag', 'Only inside a form'], 1, null],
  ['What does <meta charset="utf-8"> do?', ['Sets the page language', 'Tells the browser how the characters are encoded, so ě and ž show correctly', 'Sets the font', 'Makes the page responsive'], 1, null],
  ['What does the viewport meta tag do?', ['Stops phones from zooming out to a desktop-sized page', 'Sets the window title', 'Hides the page on phones', 'Loads a mobile stylesheet'], 0, null],
  ['Which of these is the best link text?', ['click here', 'link', 'our opening hours', 'http://example.com/hours'], 2, null],
  ['Which element should you use for something people click to run an action?', ['<div onclick>', '<span>', '<button>', '<a href="#">'], 2, null],
  ['What does this attribute do?', ['Shows the text on hover', 'Gives the icon-only button a name for screen readers', 'Changes the button text', 'Disables the button'], 1, "<button aria-label=\"Close\">✕</button>"],
  ['What is wrong here?', ['Nothing', 'An <li> must be inside <ul> or <ol>', '<li> needs a href', 'Lists cannot hold text'], 1, "<li>Bread</li>\n<li>Cakes</li>"],
  ['Which tag groups rows in the body of a table?', ['<tbody>', '<rows>', '<tgroup>', '<section>'], 0, null],
  ['What does rel="noopener" do on a link with target="_blank"?', ['Makes the link open faster', 'Stops the new page from getting access to the page that opened it', 'Hides the link from search engines', 'Opens the link in the same tab'], 1, null],
  ['Which of these is NOT a semantic element?', ['<article>', '<nav>', '<div>', '<footer>'], 2, null],
],

];
