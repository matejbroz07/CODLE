/**
 * Codle — Registration & Login
 * Application script
 *
 * Features:
 * - Login / Registration toggle, password reset with an e-mailed code
 * - Multi-step registration wizard
 * - Adaptive placement quiz (10 questions, difficulty follows each answer)
 * - Email verification with a 6-digit code
 * - Username availability checking
 * - Password strength meter with rule validation
 *
 * With the API (js/api.js) everything goes to the server: questions come from
 * the database and the account is created there. Without it (static hosting)
 * the page runs as a demo: the question bank below, code 111111, no account.
 */

(function () {
  "use strict";

  /* ===============================================================
     0. QUESTION BANK — Adaptive Quiz Data
  ================================================================*/

  var QUESTIONS = {
    "html": [
        {
            "level": 1,
            "q": "What does HTML stand for?",
            "answers": [
                "Hyper Text Markup Language",
                "High Tech Modern Language",
                "Home Tool Markup Language",
                "Hyperlinks and Text Markup Language"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "Which tag is used for the highest level heading?",
            "answers": [
                "<heading>",
                "<h6>",
                "<h1>",
                "<head>"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "Which HTML element is used for paragraphs?",
            "answers": [
                "<paragraph>",
                "<p>",
                "<text>",
                "<br>"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "What is the correct tag for a line break?",
            "answers": [
                "<break>",
                "<lb>",
                "<br>",
                "<newline>"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "Which tag is used for bold text?",
            "answers": [
                "<b>",
                "<bold>",
                "<heavy>",
                "<strong>"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "Which tag is used for italic text?",
            "answers": [
                "<i>",
                "<italic>",
                "<em>",
                "<text-italic>"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "How do you create a hyperlink?",
            "answers": [
                "<a url='...'>",
                "<a href='...'>",
                "<link href='...'>",
                "<hyperlink>"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "Which character is used to indicate an end tag?",
            "answers": [
                "*",
                "/",
                "<",
                "^"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "What does the <title> tag do?",
            "answers": [
                "Adds a title to the body",
                "Sets the title in the browser tab",
                "Creates a heading",
                "Defines the document structure"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "Which tag contains the visible page content?",
            "answers": [
                "<head>",
                "<body>",
                "<html>",
                "<main>"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What is the correct HTML element for inserting an image?",
            "answers": [
                "<img src='image.jpg'>",
                "<image src='image.jpg'>",
                "<picture>image.jpg</picture>",
                "<src img='image.jpg'>"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "What does the 'alt' attribute do on the <img> tag?",
            "answers": [
                "Sets an alternative image",
                "Describes the image for accessibility",
                "Resizes the image",
                "Adds an animation"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "Which HTML element creates a numbered list?",
            "answers": [
                "<ul>",
                "<list>",
                "<ol>",
                "<dl>"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "Which HTML element creates an unordered list?",
            "answers": [
                "<ul>",
                "<ol>",
                "<li>",
                "<list>"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "What tag is used for a list item?",
            "answers": [
                "<item>",
                "<li>",
                "<ul>",
                "<list>"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How can you open a link in a new tab?",
            "answers": [
                "target='_new'",
                "target='_blank'",
                "open='new'",
                "newtab='true'"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What is the purpose of the <thead> tag?",
            "answers": [
                "Page header",
                "Table header grouping",
                "Heading of an article",
                "Document metadata"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "Which tag defines a table row?",
            "answers": [
                "<th>",
                "<td>",
                "<tr>",
                "<table>"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "Which tag defines a table cell?",
            "answers": [
                "<cell>",
                "<tr>",
                "<td>",
                "<th>"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What does the <iframe> tag do?",
            "answers": [
                "Displays an image",
                "Embeds another document within the current one",
                "Creates a form",
                "Defines a frame for a picture"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the purpose of the <meta charset='UTF-8'> tag?",
            "answers": [
                "Sets the page language",
                "Defines the character set of the document",
                "Adds metadata for SEO",
                "Sets the password encoding"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is semantic HTML?",
            "answers": [
                "HTML with inline styles",
                "Using tags that clearly describe their content",
                "HTML validated by W3C validator",
                "HTML generated by JavaScript"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the difference between <section> and <div>?",
            "answers": [
                "No difference",
                "<section> is semantic, <div> has no meaning",
                "<div> is semantic, <section> is not",
                "<section> is deprecated"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "Which of these is a valid semantic tag?",
            "answers": [
                "<wrapper>",
                "<container>",
                "<article>",
                "<block>"
            ],
            "correct": 2
        },
        {
            "level": 3,
            "q": "What does the <aside> tag represent?",
            "answers": [
                "A sidebar",
                "Content indirectly related to the main content",
                "A comment",
                "A footer"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the use of the <nav> element?",
            "answers": [
                "To navigate to a new page",
                "To represent a section with navigation links",
                "To define a breadcrumb trail",
                "To embed a map"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does the <form> attribute 'action' do?",
            "answers": [
                "Defines the HTTP method",
                "Specifies where to send the form-data",
                "Validates the form",
                "Submits the form immediately"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the difference between GET and POST methods in a form?",
            "answers": [
                "GET is secure, POST is not",
                "POST appends data to URL, GET sends it in the body",
                "GET appends data to URL, POST sends it in the body",
                "No difference"
            ],
            "correct": 2
        },
        {
            "level": 3,
            "q": "Which input type creates a dropdown list?",
            "answers": [
                "<select>",
                "<list>",
                "<dropdown>",
                "<input type='dropdown'>"
            ],
            "correct": 0
        },
        {
            "level": 3,
            "q": "What does the 'required' attribute do in forms?",
            "answers": [
                "Formats the input",
                "Mandates that the field must be filled out before submitting",
                "Validates email format",
                "Disables the input"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the loading='lazy' attribute do for images?",
            "answers": [
                "Loads the image asynchronously",
                "Defers loading the image until it is near the viewport",
                "Compresses the image",
                "Loads the image from cache"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the purpose of the <template> tag?",
            "answers": [
                "Defines a page template",
                "Holds HTML content hidden from the user when the page loads",
                "Creates a responsive layout",
                "Imports external HTML"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "How does the <picture> element differ from <img>?",
            "answers": [
                "It adds a frame to the image",
                "It allows specifying multiple source images for different viewport sizes",
                "It is only for vector graphics",
                "There is no difference"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the 'srcset' attribute do?",
            "answers": [
                "Sets multiple CSS classes",
                "Defines a set of images for the browser to choose from based on screen density/width",
                "Points to a JavaScript file",
                "Sets the video source"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the <canvas> element used for?",
            "answers": [
                "Displaying static images",
                "Drawing graphics via scripting (usually JavaScript)",
                "Creating complex layouts",
                "Embedding PDF files"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the <figure> element represent?",
            "answers": [
                "A mathematical equation",
                "Self-contained content like illustrations or diagrams",
                "A numerical list",
                "A CSS shape"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "How does the 'defer' attribute on a <script> tag work?",
            "answers": [
                "Executes the script immediately",
                "Downloads the script in parallel and executes it after the document is parsed",
                "Executes the script before parsing the body",
                "Prevents the script from running"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the 'async' attribute on a <script> tag?",
            "answers": [
                "Waits for the DOM to load",
                "Executes the script as soon as it is downloaded, without blocking parsing",
                "Defers execution until the load event",
                "Runs the script on a web worker"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the <details> and <summary> combination create?",
            "answers": [
                "A table of contents",
                "An interactive disclosure widget (accordion)",
                "A form summary",
                "A modal window"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the <datalist> element?",
            "answers": [
                "A database table",
                "Specifies a list of pre-defined options for an <input> element",
                "An ordered list",
                "A JSON data structure"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the Shadow DOM?",
            "answers": [
                "DOM of shadow elements on the page",
                "Encapsulated DOM separate from the main document",
                "Invisible DOM elements",
                "Alternative to Virtual DOM"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the contenteditable attribute do?",
            "answers": [
                "Locks the content from being edited",
                "Allows the user to edit the element's content",
                "Allows text copying",
                "Encrypts the element content"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How do Web Components relate to HTML?",
            "answers": [
                "They are external libraries",
                "They allow creation of custom, reusable, encapsulated HTML tags",
                "They replace the DOM",
                "They are a CSS framework"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the purpose of the <slot> element?",
            "answers": [
                "A placeholder inside a web component that you can fill with your own markup",
                "A gambling game",
                "Allocates memory for JS",
                "Defines a grid area"
            ],
            "correct": 0
        },
        {
            "level": 5,
            "q": "What does the 'rel=noopener noreferrer' attribute combination prevent?",
            "answers": [
                "Cross-site scripting (XSS)",
                "Tabnabbing vulnerability and prevents passing referrer headers",
                "SQL Injection",
                "CSS leakage"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the <dialog> element?",
            "answers": [
                "A chat window",
                "A native HTML element for creating modal dialogs/popups",
                "A form element",
                "An alert box alternative"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How does 'prefetch' differ from 'preload' in a <link> tag?",
            "answers": [
                "They are identical",
                "Prefetch is for low-priority future navigation, preload is for high-priority current page resources",
                "Preload is for the future, prefetch is for the present",
                "Prefetch only works for images"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is a Service Worker in relation to HTML?",
            "answers": [
                "An HTML tag for offline caching",
                "A script that runs in the background enabling offline experiences and PWA features",
                "A server-side HTML parser",
                "A CSS compiler"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the purpose of the 'manifest' attribute on the <html> tag (AppCache)?",
            "answers": [
                "It defines the PWA manifest",
                "It is deprecated and was used for offline caching",
                "It points to a CSS file",
                "It lists the required scripts"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the <base> tag do?",
            "answers": [
                "Sets the base font size",
                "Specifies the base URL for all relative URLs in a document",
                "Defines the bottom layout",
                "Imports base styles"
            ],
            "correct": 1
        }
    ],
    "css": [
        {
            "level": 1,
            "q": "How do you set text color in CSS?",
            "answers": [
                "text-color: red;",
                "font-color: red;",
                "color: red;",
                "text: red;"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "Which CSS selector targets an element with id 'header'?",
            "answers": [
                ".header",
                "#header",
                "header",
                "*header"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you add a comment in CSS?",
            "answers": [
                "// comment",
                "<!-- comment -->",
                "/* comment */",
                "# comment"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "Which property is used to change the background color?",
            "answers": [
                "color",
                "bgcolor",
                "background-color",
                "background-image"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "How do you select elements with class name 'test'?",
            "answers": [
                "#test",
                ".test",
                "test",
                "*test"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you select all p elements?",
            "answers": [
                "p",
                ".p",
                "#p",
                "all-p"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "Which property changes the font size?",
            "answers": [
                "text-size",
                "font-size",
                "text-style",
                "size"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you make text bold?",
            "answers": [
                "font-weight: bold;",
                "style: bold;",
                "text: b;",
                "font: bold;"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "Which property is used to center text?",
            "answers": [
                "align: center;",
                "text-align: center;",
                "center-text: true;",
                "text-position: center;"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you remove the underline from a link?",
            "answers": [
                "text-decoration: none;",
                "underline: none;",
                "link-style: none;",
                "text-style: none;"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "What does 'display: flex' do?",
            "answers": [
                "Hides the element",
                "Creates a flexible container",
                "Sets a fixed position",
                "Creates a grid layout"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What is the difference between margin and padding?",
            "answers": [
                "None",
                "Margin is outer space, padding is inner space",
                "Padding is outer space, margin is inner space",
                "Both are inner spaces"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What does 'position: relative' do?",
            "answers": [
                "Removes element from normal flow",
                "Element remains in normal flow but can be offset",
                "Element is fixed to the screen",
                "Centers the element"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How do you select all p elements inside a div element?",
            "answers": [
                "div p",
                "div + p",
                "div ~ p",
                "div > p"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "What property is used to change the font of an element?",
            "answers": [
                "font-family",
                "font-style",
                "font-weight",
                "text-font"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "How do you add a shadow to a box?",
            "answers": [
                "shadow-box",
                "box-shadow",
                "shadow",
                "element-shadow"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What does 'float: left' do?",
            "answers": [
                "Makes the element fly",
                "Positions the element to the left and lets content wrap around it",
                "Aligns text to the left",
                "Hides the element"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How do you make a list not display bullet points?",
            "answers": [
                "list-type: none;",
                "bullet: none;",
                "list-style-type: none;",
                "no-bullet: true;"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What property controls the space between lines of text?",
            "answers": [
                "line-spacing",
                "spacing",
                "line-height",
                "text-height"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What does 'opacity: 0' do?",
            "answers": [
                "Makes the element fully transparent",
                "Removes the element from the DOM",
                "Makes the element black",
                "Makes the element fully opaque"
            ],
            "correct": 0
        },
        {
            "level": 3,
            "q": "What is CSS specificity? Order from lowest to highest:",
            "answers": [
                "element < class < id < inline",
                "class < element < id < inline",
                "id < class < element < inline",
                "inline < id < class < element"
            ],
            "correct": 0
        },
        {
            "level": 3,
            "q": "What does 'box-sizing: border-box' do?",
            "answers": [
                "Adds a border to every element",
                "Width and height include padding and border",
                "Removes the box model",
                "Sets rounded corners"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "How does 'z-index' work?",
            "answers": [
                "Sets the font size",
                "Controls the stacking order of elements",
                "Sets the transparency",
                "Defines a grid zone"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does 'position: absolute' do?",
            "answers": [
                "Positions element relative to the viewport",
                "Removes element from document flow and positions it relative to closest positioned ancestor",
                "Keeps element in flow",
                "Floats the element"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "How do you select an element that is the first child of its parent?",
            "answers": [
                ":first",
                ":first-child",
                ":child(1)",
                ":nth-child(0)"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is a pseudo-element?",
            "answers": [
                "A fake element",
                "A keyword added to a selector that lets you style a specific part of the selected element (e.g. ::before)",
                "A JavaScript variable",
                "An HTML tag"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does the > selector mean (e.g., div > p)?",
            "answers": [
                "Any descendant",
                "Direct child",
                "Next sibling",
                "Previous sibling"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does the + selector mean (e.g., div + p)?",
            "answers": [
                "Direct child",
                "Adjacent sibling",
                "General sibling",
                "Inside"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the rem unit relative to?",
            "answers": [
                "The parent element's font size",
                "The viewport width",
                "The root element's font size",
                "The physical screen size"
            ],
            "correct": 2
        },
        {
            "level": 3,
            "q": "What does 'display: none' vs 'visibility: hidden' do?",
            "answers": [
                "No difference",
                "display:none hides it and removes space; visibility:hidden hides it but keeps space",
                "display:none keeps space; visibility:hidden removes space",
                "display:none is for images only"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is 'CSS Grid' and how does it differ from Flexbox?",
            "answers": [
                "Grid is only for tables",
                "Grid is a 2D system, Flexbox is 1D",
                "Grid is deprecated, Flexbox is modern",
                "No difference"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the CSS function clamp() do?",
            "answers": [
                "Restricts a value between a minimum and maximum",
                "Rounds the value",
                "Animates between values",
                "Converts units"
            ],
            "correct": 0
        },
        {
            "level": 4,
            "q": "What does the 'transform: translate3d(x, y, z)' property enable?",
            "answers": [
                "3D printing",
                "Hardware acceleration (GPU rendering) for the transformation",
                "Creates a 3D box",
                "Requires a VR headset"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "How do CSS Variables (Custom Properties) differ from preprocessor variables (like Sass)?",
            "answers": [
                "No difference",
                "CSS variables are dynamic and can be changed by JS/CSS at runtime, Sass variables are compiled away",
                "Sass variables are faster",
                "CSS variables only work for colors"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does 'align-items: baseline' do in flexbox?",
            "answers": [
                "Aligns items to the bottom",
                "Aligns items such that their text baselines align",
                "Stretches items",
                "Centers items"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the purpose of the 'will-change' property?",
            "answers": [
                "Animates the element",
                "Hints to the browser what properties will change to optimize rendering in advance",
                "Changes the DOM structure",
                "Forces a repaint"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is a 'BFC' (Block Formatting Context)?",
            "answers": [
                "A type of font",
                "A part of a visual CSS rendering of a webpage where block boxes are laid out",
                "A JavaScript object",
                "A grid container"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does 'flex-basis' define?",
            "answers": [
                "The final size",
                "The default size of an element before the remaining space is distributed",
                "The minimum size",
                "The gap between items"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the 'vh' unit?",
            "answers": [
                "Visual Height",
                "Viewport Height (1vh = 1% of viewport height)",
                "Vertical Height",
                "View Horizontal"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "How does 'mix-blend-mode' work?",
            "answers": [
                "Blends colors within a gradient",
                "Determines how an element's content should blend with its parent and background",
                "Mixes JavaScript variables",
                "Creates a blur effect"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is a CSS @container query?",
            "answers": [
                "Query for a database",
                "Styling based on the size of a parent container rather than the viewport",
                "Media query for Docker containers",
                "Alternative to @media"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How does the CSS pseudo-class :has() work?",
            "answers": [
                "Selects a div inside an img",
                "A parent selector that selects an element if it contains a specified descendant",
                "Selects an img inside a div",
                "Adds an image to a div"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is 'CSS Houdini'?",
            "answers": [
                "A magic trick",
                "A set of low-level APIs that expose parts of the CSS engine to developers",
                "A new CSS framework",
                "A polyfill for IE11"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the 'paint()' function in CSS used for?",
            "answers": [
                "Coloring text",
                "Invoking a Paint Worklet (Houdini API) to dynamically draw an image",
                "Drawing borders",
                "Fills SVGs"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the property 'content-visibility: auto' do?",
            "answers": [
                "Hides the element",
                "Skips rendering the element's layout and painting until it is close to the viewport",
                "Makes text readable by screen readers",
                "Adjusts contrast automatically"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How does '@layer' (Cascade Layers) work?",
            "answers": [
                "Creates a z-index layer",
                "Allows developers to explicitly define the cascade ordering of CSS rules regardless of source order or specificity",
                "Groups animations",
                "Creates photoshop-like layers"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the 'minmax()' function used for in CSS Grid?",
            "answers": [
                "Responsive typography",
                "Defines a size range greater than or equal to min and less than or equal to max",
                "Restricting colors",
                "Setting max-width"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does 'overscroll-behavior: contain' achieve?",
            "answers": [
                "Prevents scrolling entirely",
                "Prevents scroll chaining (bounce effects) from propagating to parent elements",
                "Hides the scrollbar",
                "Smooth scrolls the page"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How does 'aspect-ratio' property work?",
            "answers": [
                "Sets the monitor resolution",
                "Sets a preferred aspect ratio for the box, auto-calculating dimensions",
                "Forces the image to be square",
                "Crops the image"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the 'lch()' color function?",
            "answers": [
                "Lightness, Chroma, Hue color space that is perceptually uniform",
                "Low Contrast Hue",
                "Linear Color Header",
                "Light Color Highlight"
            ],
            "correct": 0
        }
    ],
    "javascript": [
        {
            "level": 1,
            "q": "How do you declare a variable in JavaScript?",
            "answers": [
                "variable x = 5;",
                "var x = 5;",
                "v x = 5;",
                "x := 5;"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "What does 'console.log()' do?",
            "answers": [
                "Writes to a file",
                "Prints to the browser console",
                "Creates a dialog box",
                "Logs server errors"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you create a function in JavaScript?",
            "answers": [
                "function:myFunction()",
                "function myFunction()",
                "create myFunction()",
                "def myFunction()"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you call a function named 'myFunction'?",
            "answers": [
                "call myFunction()",
                "call function myFunction()",
                "myFunction()",
                "execute myFunction()"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "How to write an IF statement in JavaScript?",
            "answers": [
                "if i = 5 then",
                "if (i == 5)",
                "if i == 5",
                "if i = 5"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How does a WHILE loop start?",
            "answers": [
                "while i = 1 to 10",
                "while (i <= 10)",
                "while (i <= 10; i++)",
                "while i < 10 then"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How does a FOR loop start?",
            "answers": [
                "for (i <= 5; i++)",
                "for (i = 0; i <= 5; i++)",
                "for i = 1 to 5",
                "for (i = 0; i <= 5)"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you add a comment in JavaScript?",
            "answers": [
                "<!-- comment -->",
                "' comment",
                "// comment",
                "# comment"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "What is the correct way to write a JavaScript array?",
            "answers": [
                "var colors = ['red', 'green', 'blue']",
                "var colors = (1:'red', 2:'green', 3:'blue')",
                "var colors = 1 = ('red'), 2 = ('green')",
                "var colors = 'red', 'green', 'blue'"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "How do you round the number 7.25 to the nearest integer?",
            "answers": [
                "Math.rnd(7.25)",
                "round(7.25)",
                "Math.round(7.25)",
                "rnd(7.25)"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What is the difference between '==' and '==='?",
            "answers": [
                "None",
                "'==' also compares types",
                "'===' compares both value and type",
                "'===' is deprecated"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What is a callback function?",
            "answers": [
                "A function that calls itself",
                "A function passed as an argument to another function",
                "A function returning void",
                "A recursive function"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How do you find the number with the highest value of x and y?",
            "answers": [
                "Math.ceil(x, y)",
                "top(x, y)",
                "Math.max(x, y)",
                "ceil(x, y)"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What event occurs when the user clicks on an HTML element?",
            "answers": [
                "onmouseover",
                "onchange",
                "onclick",
                "onmouseclick"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "How do you declare a JavaScript object?",
            "answers": [
                "var obj = [];",
                "var obj = {};",
                "var obj = ();",
                "var obj = <>;"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What is JSON?",
            "answers": [
                "JavaScript Object Notation",
                "JavaScript Object Native",
                "Java Standard Object Network",
                "JavaScript Output Name"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "How to parse a JSON string into a JavaScript object?",
            "answers": [
                "JSON.stringify()",
                "JSON.parse()",
                "JSON.toObject()",
                "JSON.read()"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "Which operator is used to assign a value to a variable?",
            "answers": [
                "*",
                "-",
                "=",
                "x"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What will 'typeof undefined' return?",
            "answers": [
                "'null'",
                "'undefined'",
                "'object'",
                "'string'"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What does the 'this' keyword refer to in a regular object method?",
            "answers": [
                "The window object",
                "The document object",
                "The object the method belongs to",
                "The function itself"
            ],
            "correct": 2
        },
        {
            "level": 3,
            "q": "What is a closure in JavaScript?",
            "answers": [
                "A way to close the browser",
                "A function with access to variables in its outer scope",
                "Syntactic sugar for classes",
                "A method for closing connections"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the difference between 'let' and 'var'?",
            "answers": [
                "No difference",
                "'let' has block scope, 'var' has function scope",
                "'var' has block scope, 'let' has function scope",
                "'let' is faster"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does the array 'map()' method do?",
            "answers": [
                "Mutates the original array",
                "Creates a new array populated with the results of calling a provided function on every element",
                "Filters elements",
                "Reduces array to a single value"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is event bubbling?",
            "answers": [
                "Events trigger on the child and bubble up to parents",
                "Events trigger on the parent and trickle down to children",
                "Events fire randomly",
                "Browser crashes due to too many events"
            ],
            "correct": 0
        },
        {
            "level": 3,
            "q": "What does 'preventDefault()' do?",
            "answers": [
                "Stops event bubbling",
                "Prevents the default action of the event from occurring",
                "Destroys the element",
                "Hides the event"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is a Promise?",
            "answers": [
                "An object representing the eventual completion or failure of an async operation",
                "A guarantee that code will run fast",
                "A string representation",
                "A synchronous loop"
            ],
            "correct": 0
        },
        {
            "level": 3,
            "q": "What does 'strict mode' do?",
            "answers": [
                "Makes code execute faster",
                "Enforces stricter parsing and error handling in JavaScript",
                "Removes warnings",
                "Enables new syntax features"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is destructuring assignment?",
            "answers": [
                "Deleting an object",
                "Unpacking values from arrays or properties from objects into distinct variables",
                "Merging two objects",
                "Copying an object"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does the spread operator (...) do?",
            "answers": [
                "Compresses an array",
                "Expands an iterable into more elements",
                "Multiplies numbers",
                "Concatenates strings"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "How do you check if a property exists in an object?",
            "answers": [
                "'property' in object",
                "object.has('property')",
                "object.contains('property')",
                "object.property == true"
            ],
            "correct": 0
        },
        {
            "level": 4,
            "q": "What does 'Promise.all()' do?",
            "answers": [
                "Executes promises sequentially",
                "Returns a single Promise that fulfills when all of the input's promises fulfill",
                "Cancels all promises",
                "Returns the first fulfilled promise"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the event loop?",
            "answers": [
                "A loop for DOM event handling",
                "A mechanism for processing asynchronous callbacks in a single-threaded environment",
                "An infinite loop in the browser",
                "A method for repeating animations"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is a generator function?",
            "answers": [
                "A function that creates objects",
                "A function that can be paused and resumed using the 'yield' keyword",
                "A function that generates random numbers",
                "An arrow function"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the difference between call() and apply()?",
            "answers": [
                "No difference",
                "call() takes arguments separately, apply() takes them as an array",
                "apply() takes arguments separately, call() takes them as an array",
                "call() is synchronous, apply() is async"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the 'bind()' method do?",
            "answers": [
                "Creates a new function that, when called, has its 'this' keyword set to the provided value",
                "Links two objects",
                "Attaches an event listener",
                "Merges arrays"
            ],
            "correct": 0
        },
        {
            "level": 4,
            "q": "What is prototype chaining?",
            "answers": [
                "Linking arrays",
                "The mechanism by which objects inherit features from one another",
                "A way to chain Promises",
                "Chaining string methods"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is a Symbol?",
            "answers": [
                "An icon",
                "A primitive data type whose instances are unique and immutable",
                "A string alias",
                "A mathematical operator"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does 'async/await' do?",
            "answers": [
                "Replaces callbacks with promises",
                "Provides syntactic sugar over Promises to write async code that looks synchronous",
                "Makes code run in parallel",
                "Stops the event loop"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is a WeakMap?",
            "answers": [
                "A map that forgets data",
                "A collection of key/value pairs where keys must be objects and are weakly referenced",
                "A map with slow lookup",
                "A map restricted to strings"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does Object.freeze() do?",
            "answers": [
                "Makes an object invisible",
                "Freezes an object, preventing new properties from being added or existing ones from being altered",
                "Saves object to localStorage",
                "Deep clones the object"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is a Proxy object in JavaScript?",
            "answers": [
                "An HTTP proxy server",
                "An object for intercepting and defining custom behavior for fundamental operations",
                "A design pattern for lazy loading",
                "A wrapper for localStorage"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does Reflect API do?",
            "answers": [
                "Creates mirror images",
                "Provides methods for interceptable JavaScript operations, often used with Proxies",
                "Checks object types",
                "Calculates geometry"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is tail call optimization?",
            "answers": [
                "Minimizing string lengths",
                "An engine feature where recursive function calls do not add a new frame to the call stack",
                "Compressing JS files",
                "Removing trailing spaces"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is a SharedArrayBuffer?",
            "answers": [
                "An array accessible by multiple iframes",
                "A memory area that can be shared between the main thread and Web Workers",
                "A polyfill for arrays",
                "A global array variable"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How does the 'typeof' operator behave with a Proxy object?",
            "answers": [
                "Returns 'proxy'",
                "Returns 'object'",
                "Returns the typeof the target object being proxied",
                "Throws an error"
            ],
            "correct": 2
        },
        {
            "level": 5,
            "q": "What is a microtask?",
            "answers": [
                "A very short function",
                "A task scheduled to run immediately after the currently executing script and before rendering (e.g. Promises)",
                "A setTimeout callback",
                "A CSS animation"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the 'yield*' expression do?",
            "answers": [
                "Multiplies the yielded value",
                "Delegates to another generator or iterable object",
                "Ends the generator",
                "Yields all properties of an object"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the Temporal Dead Zone (TDZ)?",
            "answers": [
                "When the browser freezes",
                "The period between entering scope and the actual declaration of a let/const variable where it cannot be accessed",
                "A deprecated JS feature",
                "Time spent waiting for a fetch request"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does structuredClone() do?",
            "answers": [
                "Creates a shallow copy",
                "Creates a deep clone of a given value using the structured clone algorithm",
                "Clones DOM nodes",
                "Copies an object's prototype"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "How does dynamic import() work?",
            "answers": [
                "It imports CSS files",
                "It loads a module asynchronously and returns a Promise resolving to the module namespace object",
                "It automatically imports all modules in a folder",
                "It is used for importing images"
            ],
            "correct": 1
        }
    ],
    "php": [
        {
            "level": 1,
            "q": "How does a PHP block of code start?",
            "answers": [
                "<script>",
                "<?php",
                "<php>",
                "<%"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you declare a variable in PHP?",
            "answers": [
                "var name;",
                "$name;",
                "let name;",
                "dim name;"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you output text in PHP?",
            "answers": [
                "print(\"text\")",
                "echo \"text\";",
                "write(\"text\")",
                "All are correct"
            ],
            "correct": 3
        },
        {
            "level": 1,
            "q": "Which symbol is used for single-line comments in PHP?",
            "answers": [
                "//",
                "<!--",
                "/*",
                "##"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "What is the correct way to end a PHP statement?",
            "answers": [
                ".",
                "</php>",
                ";",
                ":"
            ],
            "correct": 2
        },
        {
            "level": 1,
            "q": "How do you create an array in PHP?",
            "answers": [
                "$arr = array();",
                "$arr = ();",
                "$arr = {};",
                "$arr = []()"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "What is the concatenation operator in PHP?",
            "answers": [
                "+",
                ".",
                "&",
                "-"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you write an IF statement in PHP?",
            "answers": [
                "if $i == 5 then",
                "if ($i == 5)",
                "if i = 5",
                "if (i == 5) then"
            ],
            "correct": 1
        },
        {
            "level": 1,
            "q": "How do you get the length of a string in PHP?",
            "answers": [
                "strlen($str)",
                "$str->length",
                "length($str)",
                "count($str)"
            ],
            "correct": 0
        },
        {
            "level": 1,
            "q": "Which superglobal array holds form data sent via POST?",
            "answers": [
                "$_GET",
                "$_REQUEST",
                "$_POST",
                "$_FORM"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What is the difference between echo and print in PHP?",
            "answers": [
                "None",
                "echo has no return value, print does",
                "print is faster",
                "echo only accepts strings"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What does the isset() function do?",
            "answers": [
                "Sets a variable",
                "Checks if a variable is set and is not NULL",
                "Deletes a variable",
                "Returns the variable type"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How do you create an associative array?",
            "answers": [
                "$arr = array(\"key\" => \"value\");",
                "$arr = [key: value];",
                "$arr = {\"key\": \"value\"};",
                "$arr = array(key, value);"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "What does the count() function do?",
            "answers": [
                "Counts words in a string",
                "Returns the number of elements in an array",
                "Counts active sessions",
                "Calculates string length"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How do you start a PHP session?",
            "answers": [
                "session.start();",
                "start_session();",
                "session_start();",
                "init_session();"
            ],
            "correct": 2
        },
        {
            "level": 2,
            "q": "What is the correct way to include a file?",
            "answers": [
                "include 'file.php';",
                "import 'file.php';",
                "require_file('file.php');",
                "load 'file.php';"
            ],
            "correct": 0
        },
        {
            "level": 2,
            "q": "Which function is used to redirect the browser to another page?",
            "answers": [
                "redirect('url');",
                "header('Location: url');",
                "location('url');",
                "navigate('url');"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What does the $_SESSION superglobal do?",
            "answers": [
                "Stores variables for the current script",
                "Stores session variables available across multiple pages",
                "Stores cookies",
                "Stores server data"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "How do you define a constant in PHP?",
            "answers": [
                "const $NAME = 1;",
                "define('NAME', 1);",
                "constant NAME = 1;",
                "let NAME = 1;"
            ],
            "correct": 1
        },
        {
            "level": 2,
            "q": "What does the empty() function check?",
            "answers": [
                "If an array is empty",
                "If a variable is empty (evaluates to false)",
                "If a string has no characters",
                "All of the above"
            ],
            "correct": 3
        },
        {
            "level": 3,
            "q": "What are PHP namespaces?",
            "answers": [
                "Spaces for storing files",
                "Code organization to prevent name collisions",
                "Alternative to classes",
                "Configuration files"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the difference between include and require?",
            "answers": [
                "None",
                "require stops the script on error, include does not",
                "include stops the script on error, require does not",
                "require is faster"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What are PHP traits?",
            "answers": [
                "Data types",
                "A mechanism for code reuse in single inheritance languages",
                "Server configuration",
                "Testing frameworks"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the '=>' operator called in PHP?",
            "answers": [
                "Greater than or equal",
                "Assignment operator",
                "Double arrow operator (used in associative arrays)",
                "Object operator"
            ],
            "correct": 2
        },
        {
            "level": 3,
            "q": "How does the '===' operator differ from '==' in PHP?",
            "answers": [
                "'===' checks only type",
                "'===' checks both value and type (strict comparison)",
                "There is no difference",
                "'===' is used for objects only"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the purpose of the '__construct()' method?",
            "answers": [
                "Destroys an object",
                "Called automatically when a new object is created (constructor)",
                "Compiles the class",
                "Used to clone objects"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does 'password_hash()' do?",
            "answers": [
                "Decrypts a password",
                "Creates a secure password hash",
                "Compares two passwords",
                "Generates a random password"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What is the scope resolution operator in PHP?",
            "answers": [
                "->",
                ".",
                "::",
                "\\"
            ],
            "correct": 2
        },
        {
            "level": 3,
            "q": "How do you access a property of an object in PHP?",
            "answers": [
                "$object.property",
                "$object->property",
                "$object::property",
                "$object[property]"
            ],
            "correct": 1
        },
        {
            "level": 3,
            "q": "What does 'var_dump()' do?",
            "answers": [
                "Deletes a variable",
                "Dumps information about a variable including type and value",
                "Exports variable to database",
                "Returns the variable type as string"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is PDO in PHP?",
            "answers": [
                "A templating system",
                "PHP Data Objects, an abstraction layer for database access",
                "A WordPress plugin",
                "A formatting tool"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does a generator do in PHP?",
            "answers": [
                "Creates an array",
                "A function containing 'yield' that returns an iterable sequence lazily",
                "Generates random numbers",
                "Compiles PHP to bytecode"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is a closure in PHP?",
            "answers": [
                "Closing a file",
                "An anonymous function that can capture variables from its surrounding scope",
                "Closing a database connection",
                "Ending a loop"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the spl_autoload_register() function do?",
            "answers": [
                "Registers a user session",
                "Registers a function to be called when an undefined class is instantiated",
                "Loads CSS files",
                "Registers a database connection"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is dependency injection?",
            "answers": [
                "Injecting SQL code",
                "A design pattern where an object receives its dependencies from outside rather than creating them itself",
                "A method for encrypting data",
                "Loading external scripts"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the 'match' expression (introduced in PHP 8) do?",
            "answers": [
                "Regex matching",
                "A safer and expression-based alternative to 'switch'",
                "Matches array keys",
                "Compares passwords"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What are type hints/declarations in PHP?",
            "answers": [
                "Comments for developers",
                "Specifying the expected data type of an argument or return value",
                "Suggestions by the IDE",
                "Converting variables"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does the 'static' keyword do inside a function?",
            "answers": [
                "Makes the function global",
                "Preserves the variable's value between function calls",
                "Prevents the function from running",
                "Makes the function private"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What is the purpose of the '__call()' magic method?",
            "answers": [
                "To call a function",
                "Triggered when invoking inaccessible or non-existing methods in an object context",
                "To dial a phone number API",
                "To execute a shell command"
            ],
            "correct": 1
        },
        {
            "level": 4,
            "q": "What does 'json_encode()' do?",
            "answers": [
                "Parses JSON",
                "Returns the JSON representation of a value",
                "Encrypts JSON",
                "Validates JSON"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What are PHP Fibers (PHP 8.1)?",
            "answers": [
                "Threads for parallel processing",
                "Lightweight concurrency mechanism for cooperative multitasking with a suspendable stack",
                "A logging system",
                "A micro-services framework"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the #[Attribute] syntax do in PHP 8?",
            "answers": [
                "Sets an HTML attribute",
                "Provides structured, machine-readable metadata natively in the language",
                "Clears the output buffer",
                "Optimizes performance"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is a WeakMap in PHP?",
            "answers": [
                "A map that loses data randomly",
                "A map that accepts objects as keys and doesn't prevent them from being garbage collected",
                "A slow array",
                "A map restricted to strings"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is OPCache?",
            "answers": [
                "A caching plugin for WordPress",
                "A PHP extension that improves performance by storing precompiled script bytecode in shared memory",
                "A database caching tool",
                "A browser cache"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the JIT compiler (introduced in PHP 8) do?",
            "answers": [
                "Compiles PHP into machine code just-in-time to improve performance",
                "Compiles PHP to Java",
                "Minifies PHP files",
                "Translates PHP to JavaScript"
            ],
            "correct": 0
        },
        {
            "level": 5,
            "q": "What is constructor property promotion (PHP 8)?",
            "answers": [
                "Promoting a class to global scope",
                "A shorthand syntax for defining and initializing object properties directly in the constructor parameters",
                "A marketing tool",
                "Upgrading a variable's type"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the 'fn' keyword signify (PHP 7.4+)?",
            "answers": [
                "A standard function",
                "An arrow function (short closure) that automatically captures variables from the parent scope by value",
                "A final function",
                "A fake function"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What are intersection types (PHP 8.1)?",
            "answers": [
                "Types that cross files",
                "A type declaration requiring a value to satisfy multiple type constraints simultaneously (e.g., TypeA&TypeB)",
                "Union types",
                "A geometric calculation"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What is the purpose of the 'ffi' (Foreign Function Interface) extension?",
            "answers": [
                "Calling front-end functions",
                "Calling C functions and using C data types directly from pure PHP",
                "Formatting file inputs",
                "Fetching remote APIs"
            ],
            "correct": 1
        },
        {
            "level": 5,
            "q": "What does the nullsafe operator (?->) do?",
            "answers": [
                "Deletes null variables",
                "Short-circuits method/property access if the left side evaluates to null, avoiding fatal errors",
                "Checks if a variable is safe",
                "Converts null to 0"
            ],
            "correct": 1
        }
    ]
};

  /* Usernames that already exist (offline demo only; online the server checks) */
  var RESERVED_USERNAMES = [
    "admin", "codle", "codemaster", "user", "test", "root", "system",
    "moderator", "developer", "python", "javascript", "webdev", "hacker",
    "john", "jane", "alex", "programmer", "null", "undefined"
  ];
  /* Terms that may not appear anywhere in a username (matched as a substring) */
  var BLOCKED_USERNAME_TERMS = ["nigger"];

  /* Verification code of the offline demo */
  var VERIFICATION_CODE = "111111"; // Hardcoded per user request
  var QUIZ_LENGTH = 10;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }

  /* Online = the API answered. A logged-in visitor goes straight to the app. */
  var online = false;
  var api = window.CodleApi;
  if (api) {
    api.ready.then(function (s) {
      online = s.online;
      if (s.online && s.user) window.location.replace("index.html");
    });
  }

  /** Shows an API error under a field; falls back to a generic message. */
  function apiMessage(err, fallback) {
    if (err && err.code === "offline") return "No connection to the server. Try again.";
    return (err && err.message) || fallback || "Something went wrong. Try again.";
  }

  function setLoading(btn, on) {
    btn.classList.toggle("loading", on);
    btn.disabled = on;
  }

  function setGroupState(groupId, errorId, state, message) {
    var group = $(groupId);
    var error = $(errorId);
    if (!group) return;
    group.classList.remove("valid", "invalid");
    if (state) group.classList.add(state);
    if (error) error.textContent = message || "";
    if (state === "invalid" && message && window.CodleMascot) window.CodleMascot.mood("sad", 1800);
  }

  /* The mascot explains the page and answers clicks */
  if (window.CodleMascot) {
    window.CodleMascot.help(function () {
      var loginOpen = $("login-view") && $("login-view").style.display !== "none";
      return loginOpen
        ? { text: "Log in with your e-mail or username. Forgot the password? Use the reset link under the form." }
        : { text: "Pick a username, add your e-mail and a password, and you're in. Your progress, XP and streak are saved to your account." };
    });
    setTimeout(function () {
      window.CodleMascot.tip("Hi, I'm " + window.CodleMascot.name + ". Create an account and I'll walk you through Codle.", { key: "reg-greet", mood: "happy", ms: 6000 });
    }, 1200);
  }

  /* ===============================================================
     1. AUTH TOGGLE (Login / Register)
  ================================================================*/

  var toggleRegister = $("toggle-register");
  var toggleLogin = $("toggle-login");
  var slider = $("auth-toggle-slider");
  var loginView = $("login-view");
  var registerView = $("register-view");

  function updateToggle() {
    var activeBtn = document.querySelector(".auth-toggle-btn.active");
    if (!activeBtn || !slider) return;
    slider.style.width = activeBtn.offsetWidth + "px";
    slider.style.transform = "translateX(" + activeBtn.offsetLeft + "px)";
  }

  function showAuthView(showLogin) {
    toggleLogin.classList.toggle("active", showLogin);
    toggleRegister.classList.toggle("active", !showLogin);
    toggleLogin.setAttribute("aria-selected", showLogin ? "true" : "false");
    toggleRegister.setAttribute("aria-selected", showLogin ? "false" : "true");
    var show = showLogin ? loginView : registerView;
    var hide = showLogin ? registerView : loginView;
    hide.style.display = "none";
    show.style.display = "";
    show.style.animation = "none";
    void show.offsetWidth; // restart the entrance animation
    show.style.animation = "fadeSlideUp .5s var(--lg-spring) both";
    updateToggle();
  }

  if (toggleRegister && toggleLogin) {
    toggleRegister.addEventListener("click", function () { showAuthView(false); });
    toggleLogin.addEventListener("click", function () { showAuthView(true); });
  }
  window.addEventListener("load", updateToggle);
  window.addEventListener("resize", updateToggle);

  /* ===============================================================
     2. LOGIN FORM
  ================================================================*/

  var loginForm = $("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("login-email").value.trim();
      var pass = $("login-password").value;
      var valid = true;

      if (!EMAIL_RE.test(email)) {
        setGroupState("login-email-group", "login-email-error", "invalid", "Please enter a valid e-mail");
        valid = false;
      } else {
        setGroupState("login-email-group", "login-email-error", "valid");
      }

      if (!pass) {
        setGroupState("login-password-group", "login-password-error", "invalid", "Please enter your password");
        valid = false;
      } else {
        setGroupState("login-password-group", "login-password-error", "valid");
      }

      if (!valid) return;
      var btn = $("login-submit");
      setLoading(btn, true);
      if (!online) {
        setTimeout(function () {
          window.location.href = "index.html"; // offline demo: no accounts
        }, 1500);
        return;
      }
      api.post("auth/login", { login: email, password: pass }).then(function () {
        window.location.href = "index.html";
      }, function (err) {
        setLoading(btn, false);
        setGroupState("login-password-group", "login-password-error", "invalid", apiMessage(err));
      });
    });
  }

  function bindVisibilityToggle(buttonId, inputId) {
    var btn = $(buttonId);
    var inp = $(inputId);
    if (!btn || !inp) return;
    btn.addEventListener("click", function () {
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  }
  bindVisibilityToggle("login-toggle-vis", "login-password");
  bindVisibilityToggle("reg-toggle-vis", "reg-password");

  /* Password reset (online only): e-mail → code → new password, then logged in */

  var forgotLink = $("forgot-link");
  var resetForm = $("reset-form");

  function showReset(show) {
    loginForm.hidden = show;
    resetForm.hidden = !show;
    $("login-divider").hidden = show;
    $("login-social").hidden = show;
    $("login-title").textContent = show ? "Reset password" : "Welcome back";
    $("login-subtitle").textContent = show ? "We'll e-mail you a code to set a new password" : "Log into your account";
    if (show) {
      $("reset-email").value = $("login-email").value.trim();
      $("reset-email").focus();
    }
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", function () {
      if (online) { showReset(true); return; }
      var email = $("login-email");
      setGroupState("login-email-group", "login-email-error", "invalid", "Password reset isn't available in this demo yet");
      if (email) email.focus();
    });
  }

  if (resetForm) {
    $("reset-back").addEventListener("click", function () { showReset(false); });

    $("reset-send").addEventListener("click", function () {
      var email = $("reset-email").value.trim();
      if (!EMAIL_RE.test(email)) {
        setGroupState("reset-email-group", "reset-email-error", "invalid", "Please enter a valid e-mail");
        return;
      }
      var btn = $("reset-send");
      btn.disabled = true;
      api.post("auth/password/code", { email: email }).then(function (res) {
        setGroupState("reset-email-group", "reset-email-error", "valid");
        btn.textContent = "Sent ✓";
        var status = $("reset-status");
        status.className = "verify-status success";
        status.textContent = res.devCode
          ? "Dev mode: e-mail is off, your code is " + res.devCode + "."
          : "If an account uses this e-mail, a code is on its way.";
        $("reset-code").focus();
        setTimeout(function () { btn.disabled = false; btn.textContent = "Resend"; }, 60000);
      }, function (err) {
        btn.disabled = false;
        setGroupState("reset-email-group", "reset-email-error", "invalid", apiMessage(err));
      });
    });

    resetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("reset-email").value.trim();
      var code = $("reset-code").value.replace(/\D/g, "");
      var pass = $("reset-password").value;
      setGroupState("reset-code-group", "reset-code-error", code.length === 6 ? null : "invalid", code.length === 6 ? "" : "The code has 6 digits");
      setGroupState("reset-password-group", "reset-password-error", pass ? null : "invalid", pass ? "" : "Enter a new password");
      if (code.length !== 6 || !pass) return;

      var btn = $("reset-submit");
      setLoading(btn, true);
      api.post("auth/password/reset", { email: email, code: code, password: pass }).then(function () {
        window.location.href = "index.html";
      }, function (err) {
        setLoading(btn, false);
        var field = err.code === "weak_password" ? "password" : "code";
        setGroupState("reset-" + field + "-group", "reset-" + field + "-error", "invalid", apiMessage(err));
      });
    });
  }

  /* ===============================================================
     3. REGISTRATION WIZARD
  ================================================================*/

  var currentStep = 1;
  var currentPanel = "step-1";
  var STEP_NAMES = { 1: "Language", 2: "Quiz", 3: "Email", 4: "Account" };
  // Where the header back button goes from each panel
  var BACK_TARGET = { "step-2": 1, "step-2-results": 1, "step-3": "2-results", "step-4": 3 };
  var selectedLang = null;
  var quizState = {};
  var emailVerified = false;
  var usernameValid = false;
  var passwordValid = false;
  var confirmValid = false;

  /**
   * Show a wizard panel. `step` is 1–4, "2-results" or "success".
   * The header shows the step, fills the progress segments and offers Back.
   */
  function goToStep(step) {
    var targetId = "step-" + step;
    var numericStep = parseInt(step, 10) || currentStep;
    var goingBack = numericStep < currentStep;
    var resultsShown = step === "2-results";

    document.querySelectorAll(".wizard-panel").forEach(function (p) { p.classList.remove("active", "back"); });
    var target = $(targetId);
    if (target) {
      target.classList.add("active");
      if (goingBack && !reduceMotion) target.classList.add("back");
    }

    var header = $("wizard-progress");
    if (header) {
      header.dataset.progress = numericStep;
      header.classList.toggle("done", step === "success");
      header.querySelector(".reg-progress").setAttribute("aria-valuenow", numericStep);
      $("reg-step-label").textContent = "Step " + numericStep + " of 4 · " + (resultsShown ? "Results" : STEP_NAMES[numericStep]);
      $("reg-back").hidden = !BACK_TARGET[targetId];
    }

    currentStep = numericStep;
    currentPanel = targetId;
    if (target) target.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  var regBack = $("reg-back");
  if (regBack) regBack.addEventListener("click", function () {
    var target = BACK_TARGET[currentPanel];
    if (target) goToStep(target);
  });

  /* ===== STEP 1: Language selection ===== */

  var langCards = document.querySelectorAll(".lang-card");
  var btnStartQuiz = $("btn-start-quiz");

  // Brand colours per language + a text colour that stays readable on top of them
  var brandColors = {
    html:       { accent: "#e34f26", ink: "#ffffff" },
    css:        { accent: "#1572b6", ink: "#ffffff" },
    javascript: { accent: "#f7df1e", ink: "#08090c" },
    php:        { accent: "#777bb4", ink: "#ffffff" }
  };

  function applyBrand(lang) {
    var colors = brandColors[lang];
    if (!colors) return;
    var root = document.documentElement.style;
    root.setProperty("--accent", colors.accent);
    root.setProperty("--accent-ink", colors.ink);
  }

  langCards.forEach(function (card) {
    card.addEventListener("click", function () {
      langCards.forEach(function (c) {
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      card.classList.add("selected");
      card.setAttribute("aria-checked", "true");
      selectedLang = card.dataset.lang;
      btnStartQuiz.disabled = false;
      applyBrand(selectedLang);
    });
  });

  if (btnStartQuiz) {
    btnStartQuiz.addEventListener("click", function () {
      if (!selectedLang) return;
      if (!online) {
        initQuiz(selectedLang, QUESTIONS[selectedLang]);
        goToStep(2);
        return;
      }
      // Online the questions come from the database; their ids go back with the answers.
      var lang = selectedLang;
      btnStartQuiz.disabled = true;
      api.get("placement/questions?course=" + encodeURIComponent(lang)).then(function (res) {
        btnStartQuiz.disabled = false;
        initQuiz(lang, res.questions.length ? res.questions : QUESTIONS[lang]);
        goToStep(2);
      }, function () {
        btnStartQuiz.disabled = false;
        initQuiz(lang, QUESTIONS[lang]);
        goToStep(2);
      });
    });
  }

  /* ===== STEP 2: Adaptive quiz engine =====
     Questions are chosen one at a time: a correct answer raises the
     difficulty for the next question, a wrong one lowers it. */

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function langDisplayName(lang) {
    var names = { html: "HTML", css: "CSS", javascript: "JavaScript", php: "PHP" };
    return names[lang] || lang;
  }

  function initQuiz(lang, bank) {
    var byLevel = {};
    (bank || []).forEach(function (q) {
      (byLevel[q.level] = byLevel[q.level] || []).push(q);
    });
    Object.keys(byLevel).forEach(function (lvl) { byLevel[lvl] = shuffleArray(byLevel[lvl]); });

    quizState = {
      lang: lang,
      byLevel: byLevel,
      questions: [],        // questions asked so far, in order
      answers: [],          // chosen answer index per question
      difficulty: 1,
      correct: 0,
      wrong: 0,
      currentAnswer: null,
      startTime: Date.now()
    };

    $("quiz-lang-name").textContent = langDisplayName(lang);
    $("quiz-total").textContent = QUIZ_LENGTH;
    askNextQuestion();
  }

  /** Pop an unused question at the wanted difficulty, or the nearest level that still has one. */
  function takeQuestion(difficulty) {
    for (var delta = 0; delta <= 4; delta++) {
      var up = quizState.byLevel[difficulty + delta];
      if (up && up.length) return up.shift();
      var down = quizState.byLevel[difficulty - delta];
      if (delta && down && down.length) return down.shift();
    }
    return null;
  }

  function askNextQuestion() {
    var q = takeQuestion(quizState.difficulty);
    if (!q) { showQuizResults(); return; }
    quizState.questions.push(q);
    showQuestion(q, quizState.questions.length - 1);
  }

  function showQuestion(q, idx) {
    quizState.currentAnswer = null;
    $("quiz-current").textContent = idx + 1;
    $("quiz-progress-fill").style.width = ((idx + 1) / QUIZ_LENGTH * 100) + "%";
    updateDifficultyIndicator(q.level);
    $("quiz-question").textContent = q.q;

    var codeBlock = $("quiz-code-block");
    if (q.code) {
      $("quiz-code").textContent = q.code;
      codeBlock.style.display = "block";
    } else {
      codeBlock.style.display = "none";
    }

    var answersContainer = $("quiz-answers");
    answersContainer.innerHTML = "";
    var letters = ["A", "B", "C", "D"];

    q.answers.forEach(function (ans, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "reg-row quiz-answer";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.dataset.idx = i;

      var letter = document.createElement("span");
      letter.className = "answer-letter";
      letter.textContent = letters[i];
      var text = document.createElement("span");
      text.className = "reg-row-text";
      text.textContent = ans;

      btn.appendChild(letter);
      btn.appendChild(text);
      btn.addEventListener("click", function () { selectAnswer(i); });
      answersContainer.appendChild(btn);
    });

    // "I don't know" lives outside the list; it selects the index after the last answer.
    quizSkip.dataset.idx = q.answers.length;
    quizSkip.setAttribute("aria-pressed", "false");

    var btnNext = $("btn-quiz-next");
    btnNext.disabled = true;
    btnNext.querySelector(".btn-text").textContent = idx + 1 < QUIZ_LENGTH ? "Next" : "See results";
  }

  function updateDifficultyIndicator(level) {
    var labels = { 1: "Beginner", 2: "Basics", 3: "Intermediate", 4: "Advanced", 5: "Master" };
    $("difficulty-label").textContent = labels[level] || "";
  }

  var quizSkip = $("quiz-skip");
  if (quizSkip) quizSkip.addEventListener("click", function () { selectAnswer(parseInt(quizSkip.dataset.idx, 10)); });

  function selectAnswer(answerIdx) {
    quizState.currentAnswer = answerIdx;
    document.querySelectorAll(".quiz-answer").forEach(function (btn) {
      btn.setAttribute("aria-checked", parseInt(btn.dataset.idx, 10) === answerIdx ? "true" : "false");
    });
    quizSkip.setAttribute("aria-pressed", parseInt(quizSkip.dataset.idx, 10) === answerIdx ? "true" : "false");
    $("btn-quiz-next").disabled = false;
  }

  // Keyboard: A–E picks an answer, Enter confirms (unless focus is on a control that handles Enter itself)
  window.addEventListener("keydown", function (e) {
    if (!$("step-2").classList.contains("active")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || "").toLowerCase();
    var onControl = tag === "button" || tag === "input" || tag === "textarea" || tag === "select" || tag === "a";

    if (e.key === "Enter") {
      if (onControl) return; // the focused button fires its own click
      var btnNext = $("btn-quiz-next");
      if (btnNext && !btnNext.disabled) btnNext.click();
      return;
    }
    if (tag === "input" || tag === "textarea") return;
    var keyMap = { a: 0, b: 1, c: 2, d: 3, e: 4 };
    var pos = keyMap[e.key.toLowerCase()];
    if (pos === undefined) return;
    var buttons = document.querySelectorAll(".quiz-answer");
    if (buttons[pos]) buttons[pos].click();
    else if (pos === buttons.length) quizSkip.click(); // E = "I don't know"
  });

  var btnQuizNext = $("btn-quiz-next");
  if (btnQuizNext) {
    btnQuizNext.addEventListener("click", function () {
      if (quizState.currentAnswer === null || quizState.currentAnswer === undefined) return;
      var q = quizState.questions[quizState.questions.length - 1];
      var isCorrect = quizState.currentAnswer === q.correct;
      quizState.answers.push(quizState.currentAnswer);

      if (isCorrect) {
        quizState.correct++;
        quizState.difficulty = Math.min(5, quizState.difficulty + 1);
      } else {
        quizState.wrong++;
        quizState.difficulty = Math.max(1, quizState.difficulty - 1);
      }

      if (quizState.questions.length < QUIZ_LENGTH) askNextQuestion();
      else showQuizResults();
    });
  }

  function showQuizResults() {
    var total = quizState.questions.length;
    var pct = total ? Math.round((quizState.correct / total) * 100) : 0;
    var elapsed = Math.round((Date.now() - quizState.startTime) / 1000);
    quizState.seconds = elapsed;

    // Placement = the hardest level the learner answered correctly.
    var highest = 0;
    quizState.questions.forEach(function (q, i) {
      if (quizState.answers[i] === q.correct && q.level > highest) highest = q.level;
    });
    var levelNames = { 0: "Beginner", 1: "Beginner", 2: "Basics", 3: "Intermediate", 4: "Advanced", 5: "Master" };

    goToStep("2-results");

    $("results-score").textContent = pct + "%";
    $("results-correct").textContent = quizState.correct;
    $("results-wrong").textContent = quizState.wrong;
    $("results-time").textContent = elapsed >= 60 ? Math.floor(elapsed / 60) + "m " + (elapsed % 60) + "s" : elapsed + "s";
    $("results-level-name").textContent = levelNames[highest];
    $("results-title").textContent = (pct >= 80 ? "Great job!" : pct >= 50 ? "Well done!" : "Good start!") +
      " You answered " + quizState.correct + " of " + total + " correctly.";

    // Fill the level meter after the panel is visible so the change animates.
    var meter = $("level-meter");
    meter.dataset.level = 0;
    setTimeout(function () { meter.dataset.level = Math.max(1, highest); }, 150);
  }

  var btnToEmail = $("btn-to-email");
  if (btnToEmail) btnToEmail.addEventListener("click", function () { goToStep(3); });

  /* ===== STEP 3: Email verification ===== */

  var regEmail = $("reg-email");
  var btnSendCode = $("btn-send-code");
  var verifySection = $("verify-code-section");
  var codeDigits = document.querySelectorAll(".code-digit");
  var btnResend = $("btn-resend");
  var btnToAccount = $("btn-to-account");
  var resendInterval = null;

  function resetCodeDigits() {
    codeDigits.forEach(function (d) {
      d.value = "";
      d.disabled = false;
      d.classList.remove("filled", "correct", "wrong");
    });
    var status = $("verify-status");
    status.className = "verify-status";
    status.textContent = "";
  }

  /** Forget everything about a previously sent code (used when the address changes). */
  function resetVerification() {
    clearInterval(resendInterval);
    emailVerified = false;
    verifiedToken = null;
    verifySection.style.display = "none";
    btnSendCode.textContent = "Send code";
    btnSendCode.classList.remove("sent");
    btnToAccount.disabled = true;
    resetCodeDigits();
  }

  if (regEmail) {
    regEmail.addEventListener("input", function () {
      var val = regEmail.value.trim();
      var isValid = EMAIL_RE.test(val);

      if (verifySection.style.display !== "none") resetVerification();
      btnSendCode.disabled = !isValid;

      if (val && !isValid) setGroupState("reg-email-group", "reg-email-error", "invalid", "Please enter a valid e-mail");
      else if (isValid) setGroupState("reg-email-group", "reg-email-error", "valid");
      else setGroupState("reg-email-group", "reg-email-error", null);
    });
  }

  var verifiedToken = null;  // from the API once the code is right; proves the e-mail at step 4

  function markSent() {
    btnSendCode.textContent = "Sent ✓";
    btnSendCode.classList.add("sent");
    btnSendCode.disabled = true;
    startResendTimer();
  }

  /** Sends a code and resolves true when it went out (offline demo: always, code 111111). */
  function sendCode() {
    var email = regEmail.value.trim();
    if (!online) {
      console.log("Verification code (simulation):", VERIFICATION_CODE);
      markSent();
      return Promise.resolve(true);
    }
    btnSendCode.disabled = true;
    return api.post("auth/register/code", { email: email }).then(function (res) {
      markSent();
      // Local XAMPP sends no e-mail (mail mode "dev"): the API hands the code back instead.
      $("verify-hint").innerHTML = res.devCode
        ? 'Dev mode: e-mail is off, your code is <strong>' + res.devCode + "</strong>"
        : 'Sent to <strong id="verify-email-display"></strong>';
      if (!res.devCode) $("verify-email-display").textContent = email;
      return true;
    }, function (err) {
      btnSendCode.disabled = false;
      setGroupState("reg-email-group", "reg-email-error", "invalid", apiMessage(err));
      return false;
    });
  }

  if (btnSendCode) {
    btnSendCode.addEventListener("click", function () {
      var email = regEmail.value.trim();
      if (!EMAIL_RE.test(email)) return;
      sendCode().then(function (sent) {
        if (!sent) return;
        verifySection.style.display = "block";
        if ($("verify-email-display")) $("verify-email-display").textContent = email;
        setTimeout(function () { codeDigits[0].focus(); }, 300);
      });
    });
  }

  function fillDigitsFrom(startIdx, digits) {
    for (var i = 0; i < digits.length && startIdx + i < codeDigits.length; i++) {
      codeDigits[startIdx + i].value = digits[i];
      codeDigits[startIdx + i].classList.add("filled");
    }
    var next = Math.min(startIdx + digits.length, codeDigits.length - 1);
    codeDigits[next].focus();
    checkVerificationCode();
  }

  codeDigits.forEach(function (digit, idx) {
    digit.addEventListener("input", function (e) {
      var val = e.target.value.replace(/\D/g, "");
      if (val.length > 1) { // mobile keyboards can insert several characters at once
        e.target.value = "";
        fillDigitsFrom(idx, val.slice(0, codeDigits.length - idx));
        return;
      }
      e.target.value = val;
      e.target.classList.toggle("filled", !!val);
      if (val) {
        if (idx < codeDigits.length - 1) codeDigits[idx + 1].focus();
        checkVerificationCode();
      }
    });

    digit.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        codeDigits[idx - 1].value = "";
        codeDigits[idx - 1].classList.remove("filled");
        codeDigits[idx - 1].focus();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        codeDigits[idx - 1].focus();
      } else if (e.key === "ArrowRight" && idx < codeDigits.length - 1) {
        codeDigits[idx + 1].focus();
      }
    });

    digit.addEventListener("paste", function (e) {
      e.preventDefault();
      var paste = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
      if (paste) fillDigitsFrom(idx, paste.slice(0, codeDigits.length - idx));
    });
  });

  function checkVerificationCode() {
    var code = "";
    codeDigits.forEach(function (d) { code += d.value; });
    if (code.length < codeDigits.length) return;

    var status = $("verify-status");
    function accept() {
      status.className = "verify-status success";
      status.textContent = "✓ E-mail verified successfully!";
      emailVerified = true;
      btnToAccount.disabled = false;
      codeDigits.forEach(function (d) { d.classList.add("correct"); d.disabled = true; });
      clearInterval(resendInterval);
      btnResend.disabled = true;
      btnResend.textContent = "Verified";
    }
    function reject(message) {
      status.className = "verify-status error";
      status.textContent = "✗ " + (message || "Incorrect code. Try again.");
      codeDigits.forEach(function (d) { d.classList.add("wrong"); });
      setTimeout(function () {
        resetCodeDigits();
        status.className = "verify-status error";
        status.textContent = "✗ " + (message || "Incorrect code. Try again.");
        codeDigits[0].focus();
      }, 1200);
    }

    if (!online) {
      if (code === VERIFICATION_CODE) accept(); else reject();
      return;
    }
    codeDigits.forEach(function (d) { d.disabled = true; });
    api.post("auth/register/verify", { email: regEmail.value.trim(), code: code }).then(function (res) {
      verifiedToken = res.verifiedToken;
      accept();
    }, function (err) {
      codeDigits.forEach(function (d) { d.disabled = false; });
      var msg = err.code === "wrong_code"
        ? "Incorrect code. " + err.data.attemptsLeft + (err.data.attemptsLeft === 1 ? " try" : " tries") + " left."
        : apiMessage(err);
      reject(msg);
    });
  }

  function startResendTimer() {
    var timer = 60;
    clearInterval(resendInterval);
    btnResend.disabled = true;
    btnResend.innerHTML = 'Resend in <span id="resend-timer">60</span>s';
    var timerEl = $("resend-timer");
    resendInterval = setInterval(function () {
      timer--;
      timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(resendInterval);
        btnResend.disabled = false;
        btnResend.textContent = "Resend code";
      }
    }, 1000);
  }

  if (btnResend) {
    btnResend.addEventListener("click", function () {
      resetCodeDigits();
      sendCode();
      codeDigits[0].focus();
    });
  }

  if (btnToAccount) {
    btnToAccount.addEventListener("click", function () {
      if (!emailVerified) return;
      goToStep(4);
    });
  }

  /* ===== STEP 4: Username & password ===== */

  var regUsername = $("reg-username");
  var regPassword = $("reg-password");
  var regConfirm = $("reg-confirm");
  var usernameTimer = null;

  function setUsernameStatus(html) {
    var status = $("username-status");
    status.style.display = html ? "flex" : "none";
    status.innerHTML = html || "";
  }

  if (regUsername) {
    regUsername.addEventListener("input", function () {
      var val = regUsername.value.trim();
      usernameValid = false;
      updateCreateButton();
      clearTimeout(usernameTimer);

      var formatError = null;
      if (!val) formatError = "";
      else if (val.length < 3) formatError = "Minimum 3 characters";
      else if (val.length > 20) formatError = "Maximum 20 characters";
      else if (!/^[a-zA-Z0-9_]+$/.test(val)) formatError = "Only letters, numbers, and underscores allowed";

      if (formatError !== null) {
        setGroupState("reg-username-group", "reg-username-error", formatError ? "invalid" : null, formatError);
        setUsernameStatus("");
        return;
      }

      // Availability check, debounced (offline demo: a fixed list)
      setGroupState("reg-username-group", "reg-username-error", null);
      setUsernameStatus('<div class="spinner-sm"></div>');

      function show(reason) {
        if (regUsername.value.trim() !== val) return; // the field changed meanwhile
        if (reason === "not_allowed") {
          setGroupState("reg-username-group", "reg-username-error", "invalid", "This username isn't allowed");
          setUsernameStatus('<span class="bad">✗</span>');
        } else if (reason) {
          setGroupState("reg-username-group", "reg-username-error", "invalid", "This username is already taken");
          setUsernameStatus('<span class="bad">✗</span>');
        } else {
          setGroupState("reg-username-group", "reg-username-error", "valid");
          setUsernameStatus('<span class="ok">✓</span>');
          usernameValid = true;
        }
        updateCreateButton();
      }

      usernameTimer = setTimeout(function () {
        if (online) {
          api.get("auth/username?u=" + encodeURIComponent(val)).then(function (res) {
            show(res.available ? null : res.reason);
          }, function () {
            setUsernameStatus("");
            setGroupState("reg-username-group", "reg-username-error", "invalid", "Couldn't check the username. Try again.");
          });
          return;
        }
        var lower = val.toLowerCase();
        var blocked = BLOCKED_USERNAME_TERMS.some(function (t) { return lower.indexOf(t) !== -1; });
        var taken = RESERVED_USERNAMES.indexOf(lower) !== -1;
        show(blocked ? "not_allowed" : taken ? "taken" : null);
      }, online ? 400 : 800);
    });
  }

  if (regPassword) {
    regPassword.addEventListener("input", function () {
      var val = regPassword.value;
      var rules = {
        length: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        number: /[0-9]/.test(val),
        special: /[^A-Za-z0-9]/.test(val)
      };

      var metCount = 0;
      Object.keys(rules).forEach(function (key) {
        var el = $("rule-" + key);
        el.classList.toggle("met", rules[key]);
        el.querySelector(".rule-icon").textContent = rules[key] ? "✓" : "○";
        if (rules[key]) metCount++;
      });

      var labels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
      var colors = ["", "var(--error)", "var(--coral)", "var(--warning)", "#a7e9c5", "var(--success)"];
      $("strength-fill").dataset.level = metCount;
      $("strength-label").textContent = val ? labels[metCount] : "Enter password";
      $("strength-label").style.color = val ? colors[metCount] : "";

      passwordValid = metCount === 5;
      checkPasswordMatch();
      updateCreateButton();
    });
  }

  if (regConfirm) {
    regConfirm.addEventListener("input", function () {
      checkPasswordMatch();
      updateCreateButton();
    });
  }

  function checkPasswordMatch() {
    var pass = regPassword.value;
    var conf = regConfirm.value;
    if (!conf) {
      setGroupState("reg-confirm-group", "reg-confirm-error", null);
      confirmValid = false;
    } else if (pass === conf) {
      setGroupState("reg-confirm-group", "reg-confirm-error", "valid");
      confirmValid = true;
    } else {
      setGroupState("reg-confirm-group", "reg-confirm-error", "invalid", "Passwords do not match");
      confirmValid = false;
    }
  }

  function updateCreateButton() {
    $("btn-create-account").disabled = !(usernameValid && passwordValid && confirmValid);
  }

  var accountForm = $("account-form");
  if (accountForm) {
    accountForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!(usernameValid && passwordValid && confirmValid)) return;

      var btn = $("btn-create-account");
      setLoading(btn, true);
      var username = regUsername.value.trim();

      function done() {
        $("success-username").textContent = username;
        goToStep("success");
        animateSuccess();
      }
      if (!online) {
        setTimeout(done, 2000);
        return;
      }
      api.post("auth/register", {
        verifiedToken: verifiedToken,
        username: username,
        password: regPassword.value,
        course: selectedLang,
        timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ""),
        placement: { answers: placementAnswers(), seconds: quizState.seconds || 0 }
      }).then(done, function (err) {
        setLoading(btn, false);
        if (err.code === "email_not_verified" || err.code === "email_taken") {
          resetVerification();
          goToStep(3);
          setGroupState("reg-email-group", "reg-email-error", "invalid", apiMessage(err));
          return;
        }
        var field = err.code === "weak_password" ? ["reg-password-group", null] : ["reg-username-group", "reg-username-error"];
        if (err.code.indexOf("username_") === 0) usernameValid = false;
        setGroupState(field[0], field[1], "invalid", apiMessage(err));
        if (!field[1]) $("strength-label").textContent = apiMessage(err);
        updateCreateButton();
      });
    });
  }

  /** The quiz answers as question / answer ids, so the server can grade them itself. */
  function placementAnswers() {
    return (quizState.questions || []).map(function (q, i) {
      var a = quizState.answers[i];
      return { questionId: q.id, answerId: q.answerIds && a < q.answerIds.length ? q.answerIds[a] : null };
    }).filter(function (x) { return x.questionId; });
  }

  function animateSuccess() {
    setTimeout(function () {
      var circle = $("success-circle");
      circle.style.transition = "stroke-dashoffset 1s var(--lg-spring)";
      circle.style.strokeDashoffset = "0";
      setTimeout(function () {
        var check = $("success-checkmark");
        check.style.transition = "stroke-dashoffset .6s var(--lg-spring)";
        check.style.strokeDashoffset = "0";
      }, 600);
    }, 200);
  }

})();
