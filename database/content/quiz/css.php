<?php
// Codle content — CSS unit quizzes and final exam
// Question: [prompt, [four answers], index of the correct one, code snippet or null]

return [

'unit-1-quiz' => [
  ['What does CSS stand for?', ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style System', 'Colourful Style Syntax'], 1, null],
  ['Which part of this rule is the selector?', ['color', 'tomato', 'h1', '{ }'], 2, "h1 {\n  color: tomato;\n}"],
  ['How do you select every element with class="note"?', ['#note', 'note', '.note', '*note'], 2, null],
  ['How do you select the element with id="title"?', ['.title', '#title', 'id.title', 'title'], 1, null],
  ['What does "nav a" select?', ['Every nav and every a', 'Links inside a nav', 'A nav inside a link', 'Nothing, it is invalid'], 1, null],
  ['Which of these is the colour pure red?', ['rgb(0, 255, 0)', '#00ff00', '#ff0000', 'rgb(0, 0, 255)'], 2, null],
  ['What does the comma do in "h1, h2 { … }"?', ['Selects h2 inside h1', 'Applies the rule to both h1 and h2', 'Selects h1 right after h2', 'It is a syntax error'], 1, null],
  ['What does ".note.warning" select?', ['Elements with either class', 'A .warning inside a .note', 'Elements that have both classes', 'The first .note'], 2, null],
],

'unit-2-quiz' => [
  ['Which property changes the typeface?', ['font-style', 'font-family', 'text-font', 'typeface'], 1, null],
  ['Why end a font-family list with a generic name like sans-serif?', ['It makes the text bold', 'It is used when none of the named fonts is available', 'It loads the font faster', 'CSS requires it'], 1, null],
  ['Which value makes text bold?', ['font-weight: 700', 'font-style: bold', 'text-weight: bold', 'font: heavy'], 0, null],
  ['Which property writes text in capitals without changing the HTML?', ['text-case: upper', 'font-variant: caps', 'text-transform: uppercase', 'letter-case: upper'], 2, null],
  ['What does this do?', ['Underlines the text', 'Strikes a line through the text', 'Removes the underline', 'Makes the text italic'], 1, "text-decoration: line-through;"],
  ['Which property sets the space between lines of text?', ['line-spacing', 'text-height', 'line-height', 'row-gap'], 2, null],
  ['Which property centres text inside its box?', ['align: center', 'text-align: center', 'margin: auto', 'justify-content: center'], 1, null],
  ['What does @import url("https://fonts.googleapis.com/…") do at the top of a stylesheet?', ['Loads a font from the web', 'Imports another HTML page', 'Sets the default font size', 'Downloads an image'], 0, null],
],

'unit-3-quiz' => [
  ['Which is the correct order of the box model, from the inside out?', ['margin, border, padding, content', 'content, padding, border, margin', 'content, margin, padding, border', 'padding, content, border, margin'], 1, null],
  ['Padding is the space…', ['outside the border', 'inside the border, around the content', 'between two elements', 'between lines of text'], 1, null],
  ['What does "padding: 10px 20px" mean?', ['10px left and right, 20px top and bottom', '10px top and bottom, 20px left and right', '10px top, 20px everywhere else', '10px everywhere, plus 20px on the right'], 1, null],
  ['What does "margin: 0 auto" do on an element with a width?', ['Removes all margins', 'Centres it horizontally', 'Centres it vertically', 'Stretches it to full width'], 1, null],
  ['What does box-sizing: border-box change?', ['Padding and border are included in the width you set', 'The border is drawn outside the box', 'The element gets a visible border', 'Margins collapse'], 0, null],
  ['Which shorthand draws a thin grey line around an element?', ['border: 1px solid #ccc', 'outline: grey', 'border: grey 1', 'line: 1px #ccc'], 0, null],
  ['What does border-radius: 50% do to a square?', ['Makes it twice as big', 'Turns it into a circle', 'Rotates it', 'Rounds only the top corners'], 1, null],
  ['Which property stops text from getting wider than 600px but lets it be narrower?', ['width: 600px', 'min-width: 600px', 'max-width: 600px', 'size: 600px'], 2, null],
],

'unit-4-quiz' => [
  ['Which display value removes an element completely from the page?', ['display: hidden', 'display: none', 'visibility: none', 'display: 0'], 1, null],
  ['What does display: flex do?', ['Makes the element bend', 'Lays its children out in a row (or column)', 'Makes the element responsive', 'Centres text'], 1, null],
  ['Which property puts space between flex or grid children?', ['spacing', 'margin-between', 'gap', 'space'], 2, null],
  ['Which flex property pushes the first child to the left edge and the last to the right?', ['justify-content: space-between', 'align-items: stretch', 'flex-wrap: wrap', 'text-align: justify'], 0, null],
  ['Which property stacks flex children vertically?', ['flex-stack: vertical', 'flex-direction: column', 'direction: down', 'align-items: column'], 1, null],
  ['What does this make?', ['Three rows', 'Three equal columns', 'One column, 3fr wide', 'A 3 × 3 grid'], 1, "grid-template-columns: repeat(3, 1fr);"],
  ['position: absolute places an element relative to…', ['the page body, always', 'the nearest ancestor with a position other than static', 'the previous element', 'the mouse pointer'], 1, null],
  ['Which position value keeps a bar at the top while you scroll past it?', ['position: fixed-top', 'position: relative', 'position: sticky', 'position: scroll'], 2, null],
],

'unit-5-quiz' => [
  ['What is 2rem when the root font size is 16px?', ['2px', '16px', '32px', '200px'], 2, null],
  ['What does 100vh mean?', ['100 pixels high', 'The full height of the window', 'The height of the parent', '100% of the font size'], 1, null],
  ['What does this media query apply to?', ['Screens wider than 600px', 'Screens up to 600px wide', 'Printers only', 'Screens exactly 600px wide'], 1, "@media (max-width: 600px) { … }"],
  ['What does "mobile first" mean?', ['Write the phone layout as the default and add desktop rules with min-width queries', 'Test on a phone before a laptop', 'Load the mobile stylesheet first', 'Put the phone menu at the top'], 0, null],
  ['Which query adds rules for screens 900px and wider?', ['@media (width: 900px)', '@media (max-width: 900px)', '@media (min-width: 900px)', '@media screen 900px'], 2, null],
  ['Which rule stops an image from overflowing its container?', ['img { max-width: 100%; }', 'img { width: 100vw; }', 'img { overflow: hidden; }', 'img { size: fit; }'], 0, null],
  ['What does object-fit: cover do to an image in a fixed-size box?', ['Stretches it to fill the box', 'Fills the box and crops the edges, keeping the proportions', 'Shrinks it to fit inside with empty space', 'Repeats it like a pattern'], 1, null],
  ['Which unit is relative to the parent element?', ['px', 'rem', '%', 'vh'], 2, null],
],

'final-exam' => [
  ['Which rule makes the heading blue?', ['h1 { text: blue; }', 'h1 { color: blue; }', 'h1 { font-color: blue; }', 'h1 = blue'], 1, null],
  ['What does the "cascade" in CSS mean?', ['Styles flow from top to bottom of the page', 'When rules conflict, the more specific or later one wins', 'Every element inherits every property', 'Styles are applied in alphabetical order'], 1, null],
  ['Which selector is the most specific?', ['p', '.note', '#intro', 'section p'], 2, null],
  ['What goes on the element so that a hover change is animated?', ['animation: 0.3s', 'transition: background-color 0.3s', 'hover: smooth', 'transform: 0.3s'], 1, null],
  ['Which transform makes an element 20% bigger?', ['scale(20)', 'scale(1.2)', 'grow(20%)', 'size(120%)'], 1, null],
  ['What are the two parts of a CSS animation?', ['@keyframes and the animation property', 'transition and transform', 'hover and active', 'animate and play'], 0, null],
  ['How do you read a custom property?', ['$accent', 'var(--accent)', '--accent()', 'get(accent)'], 1, "--accent: #0a84ff;"],
  ['Where are custom properties usually declared so the whole page can use them?', ['In :root', 'In body', 'In every rule', 'In the HTML head'], 0, null],
  ['What does this rule do?', ['Hides every .card', 'Puts 16px of space between .card children in a grid', 'Makes .card 16px wide', 'Adds a 16px border'], 1, ".cards {\n  display: grid;\n  gap: 16px;\n}"],
  ['What does flex: 1 do on a flex child?', ['Makes it the first child', 'Lets it grow to fill the leftover space', 'Sets its width to 1px', 'Centres it'], 1, null],
  ['Which is a valid way to write pure white?', ['#fff', 'rgb(0, 0, 0)', 'white()', '#000'], 0, null],
  ['Which property animates smoothly and which does not?', ['color animates, display: none does not', 'display animates, color does not', 'Both animate', 'Neither animates'], 0, null],
],

];
