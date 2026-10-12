/**
 * Codle — Registration & Login
 * Application Script
 *
 * Features:
 * - Login / Registration toggle
 * - Multi-step registration wizard
 * - Adaptive quiz engine (10 questions, difficulty adjusts based on answers)
 * - Email verification with 6-digit code simulation
 * - Username availability checking (simulated)
 * - Password strength meter with rule validation
 * - Floating particle background
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

  /* Simulated list of taken usernames */
  var TAKEN_USERNAMES = [
    "admin", "codle", "codemaster", "user", "test", "root", "system",
    "moderator", "developer", "python", "javascript", "webdev", "hacker",
    "john", "jane", "alex", "programmer", "null", "undefined","nigger"
  ];

  /* Simulated verification code */
  var VERIFICATION_CODE = "111111"; // Hardcoded per user request



  /* ===============================================================
     2. AUTH TOGGLE (Login / Register)
  ================================================================*/

  var toggleRegister = document.getElementById("toggle-register");
  var toggleLogin = document.getElementById("toggle-login");
  var slider = document.getElementById("auth-toggle-slider");
  var loginView = document.getElementById("login-view");
  var registerView = document.getElementById("register-view");

  function updateToggle() {
    var activeBtn = document.querySelector(".auth-toggle-btn.active");
    if (!activeBtn || !slider) return;
    slider.style.width = activeBtn.offsetWidth + "px";
    slider.style.transform = "translateX(" + activeBtn.offsetLeft + "px)";
  }

  if (toggleRegister) {
    toggleRegister.addEventListener("click", function () {
      toggleRegister.classList.add("active");
      toggleLogin.classList.remove("active");
      registerView.style.display = "";
      registerView.style.animation = "fadeSlideUp .5s var(--lg-spring) both";
      loginView.style.display = "none";
      updateToggle();
    });
  }
  if (toggleLogin) {
    toggleLogin.addEventListener("click", function () {
      toggleLogin.classList.add("active");
      toggleRegister.classList.remove("active");
      loginView.style.display = "";
      loginView.style.animation = "fadeSlideUp .5s var(--lg-spring) both";
      registerView.style.display = "none";
      updateToggle();
    });
  }

  window.addEventListener("load", updateToggle);
  window.addEventListener("resize", updateToggle);

  /* ===============================================================
     3. LOGIN FORM
  ================================================================*/

  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("login-email").value.trim();
      var pass = document.getElementById("login-password").value;
      var valid = true;

      // Email validation
      var emailGroup = document.getElementById("login-email-group");
      var emailError = document.getElementById("login-email-error");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailGroup.classList.add("invalid");
        emailGroup.classList.remove("valid");
        emailError.textContent = "Please enter a valid e-mail";
        valid = false;
      } else {
        emailGroup.classList.remove("invalid");
        emailGroup.classList.add("valid");
        emailError.textContent = "";
      }

      // Password validation
      var passGroup = document.getElementById("login-password-group");
      var passError = document.getElementById("login-password-error");
      if (!pass) {
        passGroup.classList.add("invalid");
        passGroup.classList.remove("valid");
        passError.textContent = "Please enter your password";
        valid = false;
      } else {
        passGroup.classList.remove("invalid");
        passGroup.classList.add("valid");
        passError.textContent = "";
      }

      if (valid) {
        var btn = document.getElementById("login-submit");
        btn.classList.add("loading");
        btn.disabled = true;
        setTimeout(function () {
          // Simulated login — redirect to main app
          window.location.href = "index.html";
        }, 1500);
      }
    });
  }

  // Toggle password visibility for login
  var loginToggleVis = document.getElementById("login-toggle-vis");
  if (loginToggleVis) {
    loginToggleVis.addEventListener("click", function () {
      var inp = document.getElementById("login-password");
      inp.type = inp.type === "password" ? "text" : "password";
      loginToggleVis.querySelector("svg").style.color =
        inp.type === "text" ? "var(--accent)" : "";
    });
  }

  /* ===============================================================
     4. REGISTRATION WIZARD
  ================================================================*/

  var currentStep = 1;
  var selectedLang = null;
  var quizState = {
    lang: null,
    questionIndex: 0,
    currentDifficulty: 1,
    score: 0,
    correct: 0,
    wrong: 0,
    currentAnswer: null,
    questions: [],
    startTime: null
  };
  var emailVerified = false;
  var usernameValid = false;
  var passwordValid = false;
  var confirmValid = false;

  function goToStep(step) {
    // Hide all panels
    document.querySelectorAll(".wizard-panel").forEach(function (p) {
      p.classList.remove("active");
    });

    // Show target panel
    var targetId = "step-" + step;
    if (step === "2-results") targetId = "step-2-results";
    if (step === "success") targetId = "step-success";
    var target = document.getElementById(targetId);
    if (target) {
      target.classList.add("active");
      target.style.animation = "panelIn .5s var(--lg-spring) both";
    }

    // Update progress dots
    var numericStep = parseInt(step) || currentStep;
    document.querySelectorAll(".wizard-step").forEach(function (s) {
      var sStep = parseInt(s.dataset.step);
      s.classList.remove("active", "completed");
      if (sStep < numericStep) s.classList.add("completed");
      else if (sStep === numericStep) s.classList.add("active");
    });

    // Update progress bar
    var progressEl = document.getElementById("wizard-progress");
    if (progressEl) progressEl.dataset.progress = numericStep;

    // Hide progress on success
    if (step === "success") {
      progressEl.style.display = "none";
    }

    currentStep = numericStep;
  }

  /* ===== STEP 1: Language Selection ===== */
  var langCards = document.querySelectorAll(".lang-card");
  var btnStartQuiz = document.getElementById("btn-start-quiz");

  var brandColors = {
    html: { a1: "#e34f26", a2: "#f16529" },
    css: { a1: "#1572b6", a2: "#33a9dc" },
    javascript: { a1: "#f7df1e", a2: "#f9e64f" },
    php: { a1: "#777bb4", a2: "#8892bf" }
  };

  langCards.forEach(function (card) {
    card.addEventListener("click", function () {
      langCards.forEach(function (c) { c.classList.remove("selected"); });
      card.classList.add("selected");
      selectedLang = card.dataset.lang;
      btnStartQuiz.disabled = false;
      
      // Dynamicky změnit accent barvu podle jazyka
      var colors = brandColors[selectedLang];
      if (colors) {
        document.documentElement.style.setProperty("--accent", colors.a1);
        document.documentElement.style.setProperty("--accent-2", colors.a2);
      }
    });
  });

  if (btnStartQuiz) {
    btnStartQuiz.addEventListener("click", function () {
      if (!selectedLang) return;
      initQuiz(selectedLang);
      goToStep(2);
    });
  }

  /* ===== STEP 2: Adaptive Quiz Engine ===== */

  function initQuiz(lang) {
    quizState.lang = lang;
    quizState.questionIndex = 0;
    quizState.currentDifficulty = 1;
    quizState.score = 0;
    quizState.correct = 0;
    quizState.wrong = 0;
    quizState.answered = false;
    quizState.startTime = Date.now();

    // Build adaptive question list
    var pool = QUESTIONS[lang] || [];
    quizState.questions = selectAdaptiveQuestions(pool, 10);

    // Update UI
    document.getElementById("quiz-lang-name").textContent = langDisplayName(lang);
    document.getElementById("quiz-total").textContent = quizState.questions.length;

    showQuestion(0);
  }

  function langDisplayName(lang) {
    var names = { html: "HTML", css: "CSS", javascript: "JavaScript", php: "PHP" };
    return names[lang] || lang;
  }

  /**
   * Adaptive question selection algorithm.
   * Starts with easy questions, adjusts difficulty based on performance.
   * Returns an ordered list of 10 questions from the pool.
   */
  function selectAdaptiveQuestions(pool, count) {
    // Sort pool by level
    var byLevel = {};
    pool.forEach(function (q) {
      if (!byLevel[q.level]) byLevel[q.level] = [];
      byLevel[q.level].push(q);
    });

    // Shuffle within each level
    Object.keys(byLevel).forEach(function (lvl) {
      byLevel[lvl] = shuffleArray(byLevel[lvl]);
    });

    // Pick questions adaptively — we'll start at level 1 and adjust
    var selected = [];
    var difficulty = 1;
    var used = {};

    for (var i = 0; i < count; i++) {
      // Try to find a question at current difficulty
      var candidates = (byLevel[difficulty] || []).filter(function (q) { return !used[q.q]; });

      // If no candidates at current level, look nearby
      if (candidates.length === 0) {
        for (var delta = 1; delta <= 5; delta++) {
          candidates = (byLevel[difficulty + delta] || []).filter(function (q) { return !used[q.q]; });
          if (candidates.length > 0) break;
          candidates = (byLevel[Math.max(1, difficulty - delta)] || []).filter(function (q) { return !used[q.q]; });
          if (candidates.length > 0) break;
        }
      }

      if (candidates.length === 0) break;

      var pick = candidates[0];
      selected.push(pick);
      used[pick.q] = true;

      // Adaptive: after every 2 questions, potentially increase difficulty
      if ((i + 1) % 2 === 0) {
        difficulty = Math.min(5, difficulty + 1);
      }
    }

    return selected;
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function showQuestion(idx) {
    var q = quizState.questions[idx];
    if (!q) return;

    quizState.currentAnswer = null;
    document.getElementById("quiz-current").textContent = idx + 1;
    document.getElementById("quiz-progress-fill").style.width =
      ((idx + 1) / quizState.questions.length * 100) + "%";

    // Difficulty indicator
    updateDifficultyIndicator(q.level);

    // Question
    document.getElementById("quiz-question").textContent = q.q;

    // Code block
    var codeBlock = document.getElementById("quiz-code-block");
    var codeEl = document.getElementById("quiz-code");
    if (q.code) {
      codeEl.textContent = q.code;
      codeBlock.style.display = "block";
    } else {
      codeBlock.style.display = "none";
    }

    // Answers
    var answersContainer = document.getElementById("quiz-answers");
    answersContainer.innerHTML = "";
    var letters = ["A", "B", "C", "D", "E"];
    var currentAnswers = q.answers.slice();
    currentAnswers.push("I don't know");
    
    currentAnswers.forEach(function (ans, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-answer";
      btn.dataset.idx = i;
      
      var spanLetter = document.createElement("span");
      spanLetter.className = "answer-letter";
      spanLetter.textContent = letters[i];
      
      var spanText = document.createElement("span");
      spanText.textContent = ans;
      
      btn.appendChild(spanLetter);
      btn.appendChild(spanText);
      
      btn.addEventListener("click", function () { handleAnswer(idx, i); });
      answersContainer.appendChild(btn);
    });

    // Hide feedback
    var feedback = document.getElementById("quiz-feedback");
    feedback.style.display = "none";

    // Disable next button
    document.getElementById("btn-quiz-next").disabled = true;
  }

  function updateDifficultyIndicator(level) {
    var labels = { 1: "Beginner", 2: "Basics", 3: "Intermediate", 4: "Advanced", 5: "Master" };
    document.getElementById("difficulty-label").textContent = labels[level] || "???";
    document.querySelectorAll(".diff-dot").forEach(function (dot) {
      var dotLevel = parseInt(dot.dataset.level);
      dot.classList.toggle("active", dotLevel <= level);
    });
  }

  function handleAnswer(questionIdx, answerIdx) {
    quizState.currentAnswer = answerIdx;

    // Mark answers
    var answerBtns = document.querySelectorAll(".quiz-answer");
    answerBtns.forEach(function (btn) {
      btn.classList.remove("selected");
      var bIdx = parseInt(btn.dataset.idx);
      if (bIdx === answerIdx) {
        btn.classList.add("selected");
      }
    });

    // Enable next button
    var btnNext = document.getElementById("btn-quiz-next");
    btnNext.disabled = false;

    // Update next question difficulty if applicable
    if (questionIdx + 1 < quizState.questions.length) {
      btnNext.querySelector(".btn-text").textContent = "Next Question";
    } else {
      btnNext.querySelector(".btn-text").textContent = "Show Results";
    }
  }

  // Keyboard support for quiz answers and next button
  window.addEventListener("keydown", function(e) {
    if (document.getElementById("step-2").classList.contains("active")) {
      var btnNext = document.getElementById("btn-quiz-next");
      
      if (e.key === "Enter") {
        if (btnNext && !btnNext.disabled) {
          btnNext.click();
        }
      } else {
        var keyMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };
        var k = e.key.toLowerCase();
        if (keyMap[k] !== undefined) {
          var buttons = document.querySelectorAll(".quiz-answer");
          if (buttons[keyMap[k]]) {
            buttons[keyMap[k]].click();
          }
        }
      }
    }
  });
  
  var btnQuizNext = document.getElementById("btn-quiz-next");
  if (btnQuizNext) {
    btnQuizNext.addEventListener("click", function () {
      if (quizState.currentAnswer === null) return;
      
      var q = quizState.questions[quizState.questionIndex];
      var isCorrect = quizState.currentAnswer === q.correct;
      
      if (isCorrect) {
        quizState.correct++;
        quizState.score += q.level * 10;
        quizState.currentDifficulty = Math.min(5, quizState.currentDifficulty + 1);
      } else {
        quizState.wrong++;
        quizState.currentDifficulty = Math.max(1, quizState.currentDifficulty - 1);
      }
      
      quizState.currentAnswer = null;
      quizState.questionIndex++;
      
      if (quizState.questionIndex < quizState.questions.length) {
        showQuestion(quizState.questionIndex);
      } else {
        showQuizResults();
      }
    });
  }

  var btnQuizBack = document.getElementById("btn-quiz-back");
  if (btnQuizBack) {
    btnQuizBack.addEventListener("click", function () {
      goToStep(1);
    });
  }

  function showQuizResults() {
    var total = quizState.questions.length;
    var pct = Math.round((quizState.correct / total) * 100);
    var elapsed = Math.round((Date.now() - quizState.startTime) / 1000);

    // Determine level
    var level = "Beginner";
    if (pct >= 90) level = "Master";
    else if (pct >= 70) level = "Advanced";
    else if (pct >= 50) level = "Intermediate";
    else if (pct >= 30) level = "Basics";

    goToStep("2-results");

    document.getElementById("results-score").textContent = pct + "%";
    document.getElementById("results-correct").textContent = quizState.correct;
    document.getElementById("results-wrong").textContent = quizState.wrong;
    document.getElementById("results-time").textContent = elapsed + "s";
    document.getElementById("results-level-name").textContent = level;

    // Determine title
    if (pct >= 80) document.getElementById("results-title").textContent = "Great job! 🎉";
    else if (pct >= 50) document.getElementById("results-title").textContent = "Well done! 👍";
    else document.getElementById("results-title").textContent = "Good start! 💪";

    // Animate ring
    setTimeout(function () {
      var ring = document.getElementById("results-ring-fill");
      var offset = 327 - (327 * pct / 100);
      ring.style.transition = "stroke-dashoffset 1.5s var(--lg-spring)";
      ring.style.strokeDashoffset = offset;
    }, 100);

    // Update step 2 as completed in progress
    var step2dot = document.querySelector('.wizard-step[data-step="2"]');
    if (step2dot) {
      step2dot.classList.add("completed");
      step2dot.classList.remove("active");
    }
  }

  var btnToEmail = document.getElementById("btn-to-email");
  if (btnToEmail) {
    btnToEmail.addEventListener("click", function () {
      goToStep(3);
    });
  }

  /* ===== STEP 3: Email Verification ===== */

  var regEmail = document.getElementById("reg-email");
  var btnSendCode = document.getElementById("btn-send-code");
  var verifySection = document.getElementById("verify-code-section");

  // Enable send button when valid email entered
  if (regEmail) {
    regEmail.addEventListener("input", function () {
      var val = regEmail.value.trim();
      var isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      btnSendCode.disabled = !isValid;

      var group = document.getElementById("reg-email-group");
      var error = document.getElementById("reg-email-error");
      if (val && !isValid) {
        group.classList.add("invalid");
        group.classList.remove("valid");
        error.textContent = "Please enter a valid e-mail";
      } else if (isValid) {
        group.classList.remove("invalid");
        group.classList.add("valid");
        error.textContent = "";
      } else {
        group.classList.remove("invalid", "valid");
        error.textContent = "";
      }
    });
  }

  if (btnSendCode) {
    btnSendCode.addEventListener("click", function () {
      var email = regEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

      // Verification code is hardcoded to 111111 per user instructions
      VERIFICATION_CODE = "111111";
      console.log("📧 Verification code (simulation):", VERIFICATION_CODE);

      // Show verification section
      verifySection.style.display = "block";
      document.getElementById("verify-email-display").textContent = email;

      // Update button
      btnSendCode.textContent = "Sent ✓";
      btnSendCode.classList.add("sent");
      btnSendCode.disabled = true;

      // Start resend countdown
      startResendTimer();

      // Focus first code digit
      setTimeout(function () {
        document.getElementById("code-digit-0").focus();
      }, 300);
    });
  }

  // Code digit inputs
  var codeDigits = document.querySelectorAll(".code-digit");
  codeDigits.forEach(function (digit, idx) {
    digit.addEventListener("input", function (e) {
      var val = e.target.value.replace(/[^0-9]/g, "");
      e.target.value = val;
      if (val) {
        e.target.classList.add("filled");
        // Auto-focus next
        if (idx < 5) {
          codeDigits[idx + 1].focus();
        }
        // Check if all filled
        checkVerificationCode();
      }
    });

    digit.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        codeDigits[idx - 1].focus();
        codeDigits[idx - 1].value = "";
        codeDigits[idx - 1].classList.remove("filled");
      }
    });

    // Allow paste of full code
    digit.addEventListener("paste", function (e) {
      e.preventDefault();
      var paste = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
      if (paste.length >= 6) {
        for (var i = 0; i < 6; i++) {
          codeDigits[i].value = paste[i] || "";
          if (paste[i]) codeDigits[i].classList.add("filled");
        }
        codeDigits[5].focus();
        checkVerificationCode();
      }
    });
  });

  function checkVerificationCode() {
    var code = "";
    codeDigits.forEach(function (d) { code += d.value; });
    if (code.length < 6) return;

    var status = document.getElementById("verify-status");
    var btnContinue = document.getElementById("btn-to-account");

    if (code === VERIFICATION_CODE) {
      status.className = "verify-status success";
      status.textContent = "✓ E-mail verified successfully!";
      emailVerified = true;
      btnContinue.disabled = false;
      codeDigits.forEach(function (d) { d.classList.add("correct"); d.disabled = true; });
    } else {
      status.className = "verify-status error";
      status.textContent = "✗ Incorrect code. Try again.";
      codeDigits.forEach(function (d) { d.classList.add("wrong"); });
      // Shake and reset after delay
      setTimeout(function () {
        codeDigits.forEach(function (d) {
          d.value = "";
          d.classList.remove("filled", "wrong");
        });
        codeDigits[0].focus();
        status.textContent = "";
      }, 1200);
    }
  }

  function startResendTimer() {
    var timer = 60;
    var timerEl = document.getElementById("resend-timer");
    var btnResend = document.getElementById("btn-resend");
    btnResend.disabled = true;

    var iv = setInterval(function () {
      timer--;
      timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(iv);
        btnResend.disabled = false;
        btnResend.innerHTML = "Resend Code";
      }
    }, 1000);
  }

  var btnResend = document.getElementById("btn-resend");
  if (btnResend) {
    btnResend.addEventListener("click", function () {
      VERIFICATION_CODE = "111111"; // Still hardcoded
      console.log("📧 New verification code (simulation):", VERIFICATION_CODE);
      btnResend.innerHTML = 'Resend in <span id="resend-timer">60</span>s';
      startResendTimer();
      // Reset digits
      codeDigits.forEach(function (d) {
        d.value = "";
        d.classList.remove("filled", "correct", "wrong");
        d.disabled = false;
      });
      document.getElementById("verify-status").textContent = "";
      codeDigits[0].focus();
    });
  }

  var btnToAccount = document.getElementById("btn-to-account");
  if (btnToAccount) {
    btnToAccount.addEventListener("click", function () {
      if (!emailVerified) return;
      goToStep(4);
    });
  }

  var btnEmailBack = document.getElementById("btn-email-back");
  if (btnEmailBack) {
    btnEmailBack.addEventListener("click", function () {
      goToStep("2-results");
    });
  }

  /* ===== STEP 4: Username & Password ===== */

  var regUsername = document.getElementById("reg-username");
  var regPassword = document.getElementById("reg-password");
  var regConfirm = document.getElementById("reg-confirm");
  var usernameTimer = null;

  // Username validation
  if (regUsername) {
    regUsername.addEventListener("input", function () {
      var val = regUsername.value.trim();
      var group = document.getElementById("reg-username-group");
      var error = document.getElementById("reg-username-error");
      var status = document.getElementById("username-status");

      usernameValid = false;
      updateCreateButton();

      if (!val) {
        group.classList.remove("valid", "invalid");
        error.textContent = "";
        status.style.display = "none";
        return;
      }

      // Format validation
      if (val.length < 3) {
        group.classList.add("invalid");
        group.classList.remove("valid");
        error.textContent = "Minimum 3 characters";
        status.style.display = "none";
        return;
      }
      if (val.length > 20) {
        group.classList.add("invalid");
        group.classList.remove("valid");
        error.textContent = "Maximum 20 characters";
        status.style.display = "none";
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(val)) {
        group.classList.add("invalid");
        group.classList.remove("valid");
        error.textContent = "Only letters, numbers, and underscores allowed";
        status.style.display = "none";
        return;
      }

      // Simulated availability check (with debounce)
      group.classList.remove("valid", "invalid");
      error.textContent = "";
      status.style.display = "flex";
      status.innerHTML = '<div class="spinner-sm"></div>';

      clearTimeout(usernameTimer);
      usernameTimer = setTimeout(function () {
        var taken = TAKEN_USERNAMES.indexOf(val.toLowerCase()) !== -1;
        if (taken) {
          group.classList.add("invalid");
          group.classList.remove("valid");
          error.textContent = "This username is already taken";
          status.style.display = "flex";
          status.innerHTML = '<span style="color:var(--error);font-size:16px;">✗</span>';
          usernameValid = false;
        } else {
          group.classList.add("valid");
          group.classList.remove("invalid");
          error.textContent = "";
          status.style.display = "flex";
          status.innerHTML = '<span style="color:var(--success);font-size:16px;">✓</span>';
          usernameValid = true;
        }
        updateCreateButton();
      }, 800);
    });
  }

  // Password validation
  if (regPassword) {
    regPassword.addEventListener("input", function () {
      var val = regPassword.value;
      var rules = {
        length: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        number: /[0-9]/.test(val),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)
      };

      var metCount = 0;
      Object.keys(rules).forEach(function (key) {
        var el = document.getElementById("rule-" + key);
        if (rules[key]) {
          el.classList.add("met");
          el.querySelector(".rule-icon").textContent = "✓";
          metCount++;
        } else {
          el.classList.remove("met");
          el.querySelector(".rule-icon").textContent = "○";
        }
      });

      // Strength meter
      var fill = document.getElementById("strength-fill");
      var label = document.getElementById("strength-label");
      fill.dataset.level = metCount;

      var labels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
      var colors = ["", "var(--error)", "var(--coral)", "var(--warning)", "var(--accent)", "var(--success)"];
      label.textContent = val ? labels[metCount] : "Enter password";
      label.style.color = colors[metCount] || "";

      passwordValid = metCount === 5;

      // Check confirm match
      checkPasswordMatch();
      updateCreateButton();
    });
  }

  // Toggle password visibility for register
  var regToggleVis = document.getElementById("reg-toggle-vis");
  if (regToggleVis) {
    regToggleVis.addEventListener("click", function () {
      var inp = document.getElementById("reg-password");
      inp.type = inp.type === "password" ? "text" : "password";
      regToggleVis.querySelector("svg").style.color =
        inp.type === "text" ? "var(--accent)" : "";
    });
  }

  // Password confirmation
  if (regConfirm) {
    regConfirm.addEventListener("input", function () {
      checkPasswordMatch();
      updateCreateButton();
    });
  }

  function checkPasswordMatch() {
    var pass = document.getElementById("reg-password").value;
    var conf = document.getElementById("reg-confirm").value;
    var group = document.getElementById("reg-confirm-group");
    var error = document.getElementById("reg-confirm-error");

    if (!conf) {
      group.classList.remove("valid", "invalid");
      error.textContent = "";
      confirmValid = false;
      return;
    }

    if (pass === conf) {
      group.classList.add("valid");
      group.classList.remove("invalid");
      error.textContent = "";
      confirmValid = true;
    } else {
      group.classList.add("invalid");
      group.classList.remove("valid");
      error.textContent = "Passwords do not match";
      confirmValid = false;
    }
  }

  function updateCreateButton() {
    var btn = document.getElementById("btn-create-account");
    btn.disabled = !(usernameValid && passwordValid && confirmValid);
  }

  var btnAccountBack = document.getElementById("btn-account-back");
  if (btnAccountBack) {
    btnAccountBack.addEventListener("click", function () {
      goToStep(3);
    });
  }

  // Account form submit
  var accountForm = document.getElementById("account-form");
  if (accountForm) {
    accountForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!(usernameValid && passwordValid && confirmValid)) return;

      var btn = document.getElementById("btn-create-account");
      btn.classList.add("loading");
      btn.disabled = true;

      var username = document.getElementById("reg-username").value.trim();

      setTimeout(function () {
        // Show success
        document.getElementById("success-username").textContent = username;
        goToStep("success");
        animateSuccess();
      }, 2000);
    });
  }

  function animateSuccess() {
    setTimeout(function () {
      var circle = document.getElementById("success-circle");
      circle.style.transition = "stroke-dashoffset 1s var(--lg-spring)";
      circle.style.strokeDashoffset = "0";

      setTimeout(function () {
        var check = document.getElementById("success-checkmark");
        check.style.transition = "stroke-dashoffset .6s var(--lg-spring)";
        check.style.strokeDashoffset = "0";
      }, 600);
    }, 200);
  }

})();
