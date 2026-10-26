/**
 * Codle — Code editor
 *
 * Lesson workspace: quest panel, code editor (HTML / CSS / JS tabs) and
 * live output. The workspace is customizable (layout, panels, font size,
 * tab size, word wrap, line numbers, theme); those preferences are shared
 * by every lesson, while code and progress are saved per lesson.
 *
 * editor.html?lesson=ID with the API (js/api.js) loads that lesson's quest
 * from the database, autosaves the code to the server and completes the
 * lesson (XP) once every objective passes. Without a lesson id or without the
 * API the sample quest below runs, saved in localStorage only.
 *
 * Objective checks run inside the sandboxed preview iframe and report back
 * with postMessage, so the preview never needs same-origin access to this page.
 */

/** Builds the editor. `lesson` is the API's GET lessons/{id} answer, or null for the sample quest. */
function codleEditor(lesson) {
  "use strict";

  function $(id) { return document.getElementById(id); }
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* ===============================================================
     1. LANGUAGE LOGOS
  ================================================================*/

  var LOGO_FONT = 'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-weight="800"';
  function shield(dark, light, digit) {
    return '<svg class="ed-logo" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="' + dark + '" d="M3.5 1.5h17l-1.55 17.4L12 21.5l-6.95-2.6z"/>' +
      '<path fill="' + light + '" d="M12 3.1v16.8l5.62-2.07 1.33-14.73z"/>' +
      '<text x="12" y="15.3" text-anchor="middle" font-size="10.5" fill="#fff" ' + LOGO_FONT + '>' + digit + '</text></svg>';
  }
  var LOGOS = {
    html: shield("#E44D26", "#F16529", "5"),
    css: shield("#1572B6", "#33A9DC", "3"),
    js: '<svg class="ed-logo" viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#F7DF1E"/>' +
      '<text x="20.2" y="19.8" text-anchor="end" font-size="10" fill="#1c1c1c" ' + LOGO_FONT + '>JS</text></svg>'
  };
  var LANG_LABEL = { html: "HTML", css: "CSS", js: "JavaScript" };

  document.querySelectorAll("[data-logo]").forEach(function (el) { el.innerHTML = LOGOS[el.dataset.logo]; });

  /* ===============================================================
     2. QUEST — from the lesson (online) or the sample below
     An objective's check is a function (sample) or the body of
     function (doc) { … } as a string (database, quest_objectives.check_js).
  ================================================================*/

  var api = window.CodleApi;
  var remote = !!lesson;

  var SAMPLE_QUEST = {
    id: "u1-l3-profile-card",
    crumb: "Unit 1 · Lesson 3",
    title: "Build a profile card",
    xp: 20,
    descHtml:
      "<p>Every developer needs a place to say hi. The output already shows a card with a placeholder name, a role and a button.</p>" +
      "<p>Make it yours: put in your name, soften the corners, and make the <b>Follow</b> button react when someone clicks it.</p>",
    objectives: [
      {
        lang: "html",
        text: "Replace <code>Your name</code> in the <code>&lt;h1&gt;</code> with your own name.",
        hint: "Open the <b>HTML</b> tab and change the text between <code>&lt;h1&gt;</code> and <code>&lt;/h1&gt;</code>.",
        check: function (doc) {
          var h = doc.querySelector(".card h1") || doc.querySelector("h1");
          var t = h ? h.textContent.trim() : "";
          return t.length > 1 && t.toLowerCase() !== "your name";
        }
      },
      {
        lang: "css",
        text: "Give <code>.card</code> a <code>border-radius</code> of at least <code>12px</code>.",
        hint: "In the <b>CSS</b> tab, add this line inside the <code>.card</code> rule:<pre>border-radius: 16px;</pre>",
        check: function (doc) {
          var c = doc.querySelector(".card");
          return !!c && parseFloat(getComputedStyle(c).borderTopLeftRadius) >= 12;
        }
      },
      {
        lang: "js",
        text: "When the button is clicked, change its text to <code>Following</code>.",
        hint: "Inside the click handler in the <b>JS</b> tab, set the button's text:<pre>button.textContent = \"Following\";</pre>",
        check: function (doc) {
          var b = doc.getElementById("follow");
          if (!b) return false;
          b.click();
          return /following/i.test(b.textContent);
        }
      }
    ],
    starter: {
      html: [
        '<div class="card">',
        '  <div class="avatar">?</div>',
        '  <h1>Your name</h1>',
        '  <p class="role">Junior developer</p>',
        '  <button id="follow">Follow</button>',
        '</div>',
        ''
      ].join("\n"),
      css: [
        'body {',
        '  margin: 0;',
        '  min-height: 100vh;',
        '  display: grid;',
        '  place-items: center;',
        '  background: #f2f4f8;',
        '  font-family: system-ui, sans-serif;',
        '}',
        '',
        '.card {',
        '  width: 240px;',
        '  padding: 28px 24px;',
        '  text-align: center;',
        '  background: #ffffff;',
        '  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);',
        '  /* Objective 2: round the corners here */',
        '}',
        '',
        '.avatar {',
        '  width: 72px;',
        '  height: 72px;',
        '  margin: 0 auto 12px;',
        '  border-radius: 50%;',
        '  display: grid;',
        '  place-items: center;',
        '  background: #0a84ff;',
        '  color: #ffffff;',
        '  font-size: 28px;',
        '  font-weight: 700;',
        '}',
        '',
        'h1 {',
        '  margin: 0;',
        '  font-size: 22px;',
        '}',
        '',
        '.role {',
        '  margin: 4px 0 18px;',
        '  color: #6b7280;',
        '}',
        '',
        'button {',
        '  padding: 10px 22px;',
        '  border: none;',
        '  border-radius: 999px;',
        '  background: #0a84ff;',
        '  color: #ffffff;',
        '  font-weight: 600;',
        '  cursor: pointer;',
        '}',
        ''
      ].join("\n"),
      js: [
        'const button = document.getElementById("follow");',
        '',
        'button.addEventListener("click", () => {',
        '  // Objective 3: change the button text here',
        '  console.log("Button clicked!");',
        '});',
        ''
      ].join("\n")
    }
  };

  var QUEST = remote ? {
    id: lesson.quest.id,
    crumb: lesson.lesson.crumb,
    title: lesson.quest.title,
    xp: lesson.lesson.xp,
    descHtml: lesson.quest.descHtml,
    objectives: lesson.quest.objectives,
    starter: lesson.quest.starter
  } : SAMPLE_QUEST;

  /* ===============================================================
     3. STATE + STORAGE
     Online the server keeps the code (quest_saves) and the workspace
     (user_settings); offline both live in localStorage.
  ================================================================*/

  var LESSON_KEY = "codle.editor." + QUEST.id;
  var WS_KEY = "codle.editor.workspace";

  function loadJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  // Lesson state: code + objective results
  var saved = (remote ? lesson.save : loadJSON(LESSON_KEY)) || {};
  var files = {
    html: saved.files && typeof saved.files.html === "string" ? saved.files.html : QUEST.starter.html,
    css:  saved.files && typeof saved.files.css  === "string" ? saved.files.css  : QUEST.starter.css,
    js:   saved.files && typeof saved.files.js   === "string" ? saved.files.js   : QUEST.starter.js
  };
  var done = QUEST.objectives.map(function (_, i) { return !!(saved.done && saved.done[i]); });

  var saveTimer = null;
  var unsaved = false;     // online: code changed since the last save reached the server
  function lessonPath(action) { return "lessons/" + lesson.lesson.id + "/" + action; }
  function payload() { return { html: files.html, css: files.css, js: files.js, done: done }; }

  function persist() {
    clearTimeout(saveTimer);
    if (!remote) { saveJSON(LESSON_KEY, { files: files, done: done }); return; }
    unsaved = false;
    api.put(lessonPath("save"), payload()).catch(function (err) {
      unsaved = true;
      if (err.status === 401) toast("You were logged out. Log in again to keep your work.", 4000);
    });
  }
  function persistSoon() {
    clearTimeout(saveTimer);
    unsaved = true;
    saveTimer = setTimeout(persist, remote ? 1500 : 400);
  }
  // Leaving the page: send what is not saved yet (keepalive lets the request outlive the page).
  if (remote) {
    window.addEventListener("pagehide", function () {
      if (unsaved) api.put(lessonPath("save"), payload(), { keepalive: true });
    });
  }

  // Workspace preferences
  var FONT_MIN = 11, FONT_MAX = 22;
  var DEFAULTS = {
    layout: "split", split: 0.5, quest: true, console: true,
    fontSize: 14, tabSize: 2, wrap: false, lines: true, autorun: true, theme: "codle"
  };
  function sanitize(w) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = w && w[k] !== undefined ? w[k] : DEFAULTS[k]; });
    if (["split", "swap", "stacked"].indexOf(o.layout) < 0) o.layout = DEFAULTS.layout;
    if (["codle", "ember", "paper"].indexOf(o.theme) < 0) o.theme = DEFAULTS.theme;
    if (o.tabSize !== 2 && o.tabSize !== 4) o.tabSize = DEFAULTS.tabSize;
    o.fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(+o.fontSize) || DEFAULTS.fontSize));
    o.split = Math.min(0.8, Math.max(0.2, +o.split || DEFAULTS.split));
    ["quest", "console", "wrap", "lines", "autorun"].forEach(function (k) { o[k] = !!o[k]; });
    return o;
  }
  var ws = sanitize(remote ? lesson.settings : loadJSON(WS_KEY));
  var wsTimer = null;
  function saveWs() {
    saveJSON(WS_KEY, ws);
    if (!remote) return;
    clearTimeout(wsTimer);
    wsTimer = setTimeout(function () { api.put("me/settings", ws).catch(function () { /* kept locally */ }); }, 800);
  }

  var lang = "html";
  var viewState = { html: null, css: null, js: null }; // caret + scroll per tab
  var dirty = true; // code changed since the last run

  /* ===============================================================
     4. SYNTAX HIGHLIGHTING
     Small sticky-regex tokenizer per language. Good enough for
     lesson-sized snippets; not a full parser.
  ================================================================*/

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function span(cls, s) { return '<span class="t-' + cls + '">' + esc(s) + "</span>"; }

  function tokenize(code, getRules) {
    var out = "", plain = "", i = 0;
    while (i < code.length) {
      var rules = typeof getRules === "function" ? getRules() : getRules;
      var hit = false;
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r];
        rule.re.lastIndex = i;
        var m = rule.re.exec(code);
        if (m && m[0].length) {
          if (plain) { out += esc(plain); plain = ""; }
          out += typeof rule.cls === "function" ? rule.cls(m) : span(rule.cls, m[0]);
          i += m[0].length;
          hit = true;
          break;
        }
      }
      if (!hit) { plain += code[i]; i++; }
    }
    return out + esc(plain);
  }

  var JS_KEYWORDS = /^(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|super|switch|throw|try|typeof|var|void|while|with|yield|async|await|static|get|set)$/;
  var JS_LITERALS = /^(?:true|false|null|undefined|this|NaN|Infinity)$/;

  var JS_RULES = [
    { re: /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y, cls: "com" },
    { re: /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?/y, cls: "str" },
    { re: /\b(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/y, cls: "num" },
    {
      re: /[A-Za-z_$][\w$]*/y,
      cls: function (m) {
        var w = m[0];
        if (JS_KEYWORDS.test(w)) return span("kw", w);
        if (JS_LITERALS.test(w)) return span("num", w);
        if (/^\s*\(/.test(m.input.slice(m.index + w.length, m.index + w.length + 8))) return span("fn", w);
        return esc(w);
      }
    },
    { re: /=>|[{}()[\];,.]/y, cls: "punc" }
  ];

  var ATTR_RULES = [
    { re: /"[^"]*"?|'[^']*'?/y, cls: "str" },
    { re: /[A-Za-z_:][\w:.-]*/y, cls: "attr" },
    { re: /[=\/>]/y, cls: "punc" }
  ];

  var HTML_RULES = [
    { re: /<!--[\s\S]*?(?:-->|$)/y, cls: "com" },
    { re: /<!doctype[^>]*>?/iy, cls: "com" },
    {
      re: /<\/?[A-Za-z][\w-]*(?:"[^"]*"?|'[^']*'?|[^'">])*>?/y,
      cls: function (m) {
        var head = /^(<\/?)([\w-]+)/.exec(m[0]);
        return span("punc", head[1]) + span("tag", head[2]) + tokenize(m[0].slice(head[0].length), ATTR_RULES);
      }
    },
    { re: /&[#\w]+;/y, cls: "num" }
  ];

  function cssRules() {
    var depth = 0;
    var common = [
      { re: /\/\*[\s\S]*?(?:\*\/|$)/y, cls: "com" },
      { re: /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y, cls: "str" }
    ];
    var open = { re: /\{/y, cls: function () { depth++; return span("punc", "{"); } };
    var close = { re: /\}/y, cls: function () { depth = Math.max(0, depth - 1); return span("punc", "}"); } };
    var outside = common.concat([
      { re: /@[\w-]+/y, cls: "kw" },
      open, close,
      { re: /[^{}\/"'@\s][^{}\/"']*?(?=\s*\{|$)/y, cls: "sel" }
    ]);
    var inside = common.concat([
      open, close,
      { re: /--?[A-Za-z][\w-]*(?=\s*:)|[A-Za-z][\w-]*(?=\s*:)/y, cls: "prop" },
      { re: /#[\da-fA-F]{3,8}\b/y, cls: "num" },
      { re: /-?(?:\d+\.?\d*|\.\d+)(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch)?/y, cls: "num" },
      { re: /!important/y, cls: "kw" },
      { re: /[A-Za-z-][\w-]*(?=\()/y, cls: "fn" },
      { re: /[:;,()]/y, cls: "punc" }
    ]);
    return function () { return depth > 0 ? inside : outside; };
  }

  function highlight(code, which) {
    if (which === "js") return tokenize(code, JS_RULES);
    if (which === "css") return tokenize(code, cssRules());
    return tokenize(code, HTML_RULES);
  }

  // Split highlighted HTML into one string per source line. A token that spans
  // lines (block comment, template string) is closed and reopened at each break.
  function splitLines(html) {
    var lines = [], cur = "", open = null, last = 0, m;
    var re = /<span class="([^"]+)">|<\/span>|\n/g;
    while ((m = re.exec(html))) {
      cur += html.slice(last, m.index);
      last = re.lastIndex;
      if (m[0] === "\n") {
        if (open) cur += "</span>";
        lines.push(cur);
        cur = open ? '<span class="' + open + '">' : "";
      } else if (m[0] === "</span>") {
        cur += m[0];
        open = null;
      } else {
        cur += m[0];
        open = m[1];
      }
    }
    lines.push(cur + html.slice(last));
    return lines;
  }

  /* ===============================================================
     5. EDITOR
  ================================================================*/

  var editorPanel = $("ed-editor");
  var input = $("ed-input");
  var codeEl = $("ed-highlight");
  var gutter = $("ed-gutter");
  var activeLine = $("ed-active-line");
  var lineEls = codeEl.children;
  var caretLine = 0;
  var gutterCount = 0;

  function indentUnit() { return ws.tabSize === 4 ? "    " : "  "; }

  function renderCode() {
    var lines = splitLines(highlight(input.value, lang));
    codeEl.innerHTML = lines.map(function (l) { return '<div class="ed-line">' + l + "</div>"; }).join("");
    // Line numbers only change when the number of lines does.
    if (lines.length !== gutterCount) {
      var g = "";
      for (var i = 1; i <= lines.length; i++) g += "<div>" + i + "</div>";
      gutter.innerHTML = g;
      gutterCount = lines.length;
    }
    fitWrap();
    syncScroll();
    updateCaret();
  }

  // With word wrap on, the highlight layer must be exactly as wide as the
  // textarea's content box, and each line number as tall as its wrapped line.
  function fitWrap() {
    if (!ws.wrap) {
      codeEl.style.width = "";
      return;
    }
    codeEl.style.width = input.clientWidth + "px";
    var rows = gutter.children;
    // Read every height first, then write, so the browser lays out once.
    var heights = [];
    for (var j = 0; j < rows.length && j < lineEls.length; j++) heights.push(lineEls[j].offsetHeight);
    for (var i = 0; i < heights.length; i++) rows[i].style.height = heights[i] + "px";
  }

  function syncScroll() {
    var x = ws.wrap ? 0 : input.scrollLeft, y = input.scrollTop;
    codeEl.style.transform = "translate(" + (-x) + "px," + (-y) + "px)";
    gutter.style.transform = "translateY(" + (-y) + "px)";
    positionActiveLine();
  }

  function updateCaret() {
    var before = input.value.slice(0, input.selectionStart);
    var lines = before.split("\n");
    var line = lines.length - 1;
    $("ed-status-pos").textContent = "Ln " + (line + 1) + ", Col " + (lines[line].length + 1);
    var prev = gutter.querySelector(".active");
    if (prev) prev.classList.remove("active");
    if (gutter.children[line]) gutter.children[line].classList.add("active");
    caretLine = line;
    positionActiveLine();
  }

  function positionActiveLine() {
    var el = lineEls[caretLine];
    if (!el) return;
    activeLine.style.height = el.offsetHeight + "px";
    activeLine.style.transform = "translateY(" + (el.offsetTop - input.scrollTop) + "px)";
  }

  // Insert text through execCommand so the browser's undo stack keeps working.
  function insertText(text) {
    var ok = false;
    try { ok = document.execCommand("insertText", false, text); } catch (e) { ok = false; }
    if (!ok) {
      input.setRangeText(text, input.selectionStart, input.selectionEnd, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  var VOID_TAGS = /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

  function opensBlock(textBeforeCaret) {
    var t = textBeforeCaret.replace(/[ \t]+$/, "");
    if (/[{([]$/.test(t)) return true;
    if (lang === "html") {
      var m = /<([A-Za-z][\w-]*)(?:\s[^<>]*)?>$/.exec(t);
      return !!m && !VOID_TAGS.test(m[1]) && !/\/>$/.test(t);
    }
    return false;
  }

  function handleEnter() {
    var v = input.value, s = input.selectionStart, e = input.selectionEnd;
    var lineStart = v.lastIndexOf("\n", s - 1) + 1;
    var before = v.slice(lineStart, s);
    var indent = /^[ \t]*/.exec(before)[0];
    var unit = indentUnit();
    if (opensBlock(before)) {
      if (/^[ \t]*(?:[})\]]|<\/)/.test(v.slice(e))) {
        insertText("\n" + indent + unit + "\n" + indent);
        var caret = input.selectionStart - (1 + indent.length);
        input.setSelectionRange(caret, caret);
        updateCaret();
        return;
      }
      insertText("\n" + indent + unit);
      return;
    }
    insertText("\n" + indent);
  }

  function handleTab(outdent) {
    var v = input.value, s = input.selectionStart, e = input.selectionEnd;
    var unit = indentUnit();
    var multi = v.slice(s, e).indexOf("\n") >= 0;
    if (!outdent && !multi) { insertText(unit); return; }
    var blockStart = v.lastIndexOf("\n", s - 1) + 1;
    var blockEnd = v.indexOf("\n", e - (e > s && v[e - 1] === "\n" ? 1 : 0));
    if (blockEnd < 0) blockEnd = v.length;
    var lines = v.slice(blockStart, blockEnd).split("\n");
    var firstDelta = 0, total = 0;
    var cutRe = new RegExp("^ {1," + unit.length + "}|^\\t");
    var changed = lines.map(function (l, i) {
      if (outdent) {
        var cut = cutRe.exec(l);
        var n = cut ? cut[0].length : 0;
        if (i === 0) firstDelta = -n;
        total -= n;
        return l.slice(n);
      }
      if (i === 0) firstDelta = unit.length;
      total += unit.length;
      return unit + l;
    }).join("\n");
    input.setSelectionRange(blockStart, blockEnd);
    insertText(changed);
    if (multi) {
      input.setSelectionRange(blockStart, blockEnd + total);
    } else {
      var c = Math.max(blockStart, s + firstDelta);
      input.setSelectionRange(c, c);
    }
    updateCaret();
  }

  input.addEventListener("keydown", function (e) {
    if (e.isComposing) return;
    var mod = e.metaKey || e.ctrlKey;
    if (e.key === "Tab" && !mod && !e.altKey) {
      e.preventDefault();
      handleTab(e.shiftKey);
    } else if (e.key === "Enter" && !mod && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleEnter();
    } else if (e.key === "Escape") {
      input.blur(); // lets keyboard users Tab out of the editor
    }
  });

  // Re-highlight at most once per frame: fast typing on a slow machine
  // queues one render instead of one per keystroke. rAF runs before the
  // next paint, so the text never visibly lags.
  var renderQueued = false;
  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      renderCode();
    });
  }

  input.addEventListener("input", function () {
    files[lang] = input.value;
    dirty = true;
    queueRender();
    persistSoon();
    scheduleAutorun();
  });
  input.addEventListener("scroll", syncScroll, { passive: true });
  ["keyup", "click", "select", "focus"].forEach(function (ev) { input.addEventListener(ev, updateCaret); });
  document.addEventListener("selectionchange", function () { if (document.activeElement === input) updateCaret(); });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { fitWrap(); syncScroll(); moveFileIndicator(); }).observe(input);
  }

  /* ===============================================================
     6. FILE TABS
  ================================================================*/

  var fileTabs = $("ed-file-tabs");
  var fileIndicator = $("ed-file-indicator");

  function moveFileIndicator() {
    var btn = fileTabs.querySelector('[aria-selected="true"]');
    if (!btn || !btn.offsetWidth) return;
    fileIndicator.style.width = btn.offsetWidth + "px";
    fileIndicator.style.transform = "translateX(" + btn.offsetLeft + "px)";
  }

  function setLang(next, focus) {
    if (next !== lang) {
      viewState[lang] = { s: input.selectionStart, e: input.selectionEnd, x: input.scrollLeft, y: input.scrollTop };
      lang = next;
    }
    fileTabs.querySelectorAll(".ed-file-tab").forEach(function (b) {
      b.setAttribute("aria-selected", b.dataset.lang === lang ? "true" : "false");
    });
    moveFileIndicator();
    input.value = files[lang];
    gutterCount = 0;
    var vs = viewState[lang];
    input.setSelectionRange(vs ? vs.s : 0, vs ? vs.e : 0);
    input.scrollLeft = vs ? vs.x : 0;
    input.scrollTop = vs ? vs.y : 0;
    $("ed-status-lang").innerHTML = LOGOS[lang] + LANG_LABEL[lang];
    renderCode();
    if (focus) input.focus({ preventScroll: true });
  }

  fileTabs.addEventListener("click", function (e) {
    var b = e.target.closest(".ed-file-tab");
    if (b) setLang(b.dataset.lang, true);
  });

  /* ===============================================================
     7. PREVIEW + CONSOLE
  ================================================================*/

  var preview = $("ed-preview");

  // Runs inside the iframe before the learner's code: forwards console
  // output and errors, says when it has loaded, and answers "check"
  // requests with the objective results.
  function prelude() {
    var runId = window.__CODLE_RUN__;
    var logs = window.__codleLogs = []; // what console.log printed; checks can read doc.defaultView.__codleLogs
    var send = function (type, args) {
      try { parent.postMessage({ __codle: 1, run: runId, type: type, args: args }, "*"); } catch (e) { /* ignore */ }
    };
    var fmt = function (v) {
      if (typeof v === "string") return v;
      if (v instanceof Error) return v.name + ": " + v.message;
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    };
    ["log", "info", "warn", "error"].forEach(function (m) {
      var orig = console[m];
      console[m] = function () {
        var args = Array.prototype.map.call(arguments, fmt);
        if (m === "log" || m === "info") logs.push(args.join(" "));
        send(m === "info" ? "log" : m, args);
        if (orig) orig.apply(console, arguments);
      };
    });
    window.addEventListener("error", function (e) { send("error", [e.message || "Script error"]); });
    window.addEventListener("load", function () { send("ready", []); });
    window.addEventListener("message", function (e) {
      if (!e.data || e.data.__codle !== "check") return;
      var results = window.__CODLE_CHECKS__.map(function (src) {
        try { return !!new Function("doc", src)(document); } catch (err) { return false; }
      });
      send("check", results);
    });
  }

  // Every check as a function body, compiled one by one in the iframe so one broken check fails alone.
  var CHECK_SRC = QUEST.objectives.map(function (o) {
    return typeof o.check === "function" ? "return (" + o.check.toString() + ")(doc);" : String(o.check);
  });
  var PRELUDE_SRC =
    "window.__CODLE_CHECKS__=" + JSON.stringify(CHECK_SRC).replace(/</g, "\\u003c") + ";" +
    "(" + prelude.toString() + ")();";

  var runId = 0; // every run gets an id so messages from replaced documents are ignored

  function buildDocument() {
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      "<script>window.__CODLE_RUN__=" + runId + ";" + PRELUDE_SRC + "<\/script>" +
      "<style>" + files.css.replace(/<\/style/gi, "<\\/style") + "</style>" +
      "</head><body>" + files.html +
      "<script>" + files.js.replace(/<\/script/gi, "<\\/script") + "\n<\/script>" +
      "</body></html>";
  }

  var autorunTimer = null;
  function scheduleAutorun() {
    clearTimeout(autorunTimer);
    // Reloading the preview is the heaviest thing the editor does; wait longer on slow devices.
    if (ws.autorun) autorunTimer = setTimeout(run, window.CodlePerf && window.CodlePerf.lite ? 1500 : 700);
  }

  function run() {
    clearTimeout(autorunTimer);
    clearConsole();
    runId++;
    preview.srcdoc = buildDocument();
    dirty = false;
    var dot = $("ed-live-dot");
    dot.classList.remove("flash");
    void dot.offsetWidth;
    dot.classList.add("flash");
  }

  function runFromButton() {
    var btn = $("ed-run");
    btn.classList.remove("pulse");
    void btn.offsetWidth;
    btn.classList.add("pulse");
    run();
    if (isPhone()) setPane("output");
  }

  var consoleEl = $("ed-console");
  var consoleBody = $("ed-console-body");
  var logCount = 0;

  function clearConsole() {
    logCount = 0;
    consoleBody.innerHTML = '<div class="ed-console-empty">Output from console.log() shows up here.</div>';
    $("ed-console-count").textContent = "0";
    consoleEl.classList.remove("has-error");
  }

  function addLog(type, args) {
    if (!logCount) consoleBody.innerHTML = "";
    logCount++;
    var row = document.createElement("div");
    row.className = "ed-log " + type;
    row.textContent = (args || []).join(" ");
    consoleBody.appendChild(row);
    consoleBody.scrollTop = consoleBody.scrollHeight;
    $("ed-console-count").textContent = String(logCount);
    if (type === "error") {
      consoleEl.classList.add("has-error");
      setConsoleOpen(true);
    }
  }

  function setConsoleOpen(open) {
    consoleEl.classList.toggle("open", open);
    $("ed-console-toggle").setAttribute("aria-expanded", open ? "true" : "false");
  }

  $("ed-console-toggle").addEventListener("click", function () { setConsoleOpen(!consoleEl.classList.contains("open")); });
  $("ed-console-clear").addEventListener("click", clearConsole);

  var pendingCheck = null;
  window.addEventListener("message", function (e) {
    if (e.source !== preview.contentWindow || !e.data || e.data.__codle !== 1) return;
    if (e.data.run !== runId) return; // from a document that has since been replaced
    if (e.data.type === "ready") {
      if (pendingCheck) preview.contentWindow.postMessage({ __codle: "check" }, "*");
      return;
    }
    if (e.data.type === "check") {
      if (pendingCheck) pendingCheck(e.data.args);
      return;
    }
    addLog(e.data.type, e.data.args);
    if (e.data.type === "error" && mascot) {
      mascot.mood("surprised", 1500);
      mascot.tip("Your JavaScript threw an error. Open the console under the preview to see what went wrong.", { key: "ed-error:" + (lesson ? lesson.lesson.id : "demo"), mood: "surprised" });
    }
  });

  /* ===============================================================
     8. QUEST PANEL + CHECKING
  ================================================================*/

  var objectiveList = $("quest-objectives");
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  function renderQuest() {
    document.title = QUEST.title + " — Codle";
    $("ed-crumb").textContent = QUEST.crumb;
    $("ed-title").textContent = QUEST.title;
    $("quest-title").textContent = QUEST.title;
    $("quest-desc").innerHTML = QUEST.descHtml;
    $("ed-xp").textContent = "+" + QUEST.xp + " XP";
    $("ed-modal-xp").textContent = "+" + QUEST.xp + " XP";
    objectiveList.innerHTML = QUEST.objectives.map(function (o, i) {
      return '<li class="ed-objective" data-index="' + i + '">' +
        '<button class="ed-objective-btn" type="button" data-lang="' + o.lang + '" title="Open the ' + LANG_LABEL[o.lang] + ' tab">' +
          '<span class="ed-objective-check" aria-hidden="true">' + CHECK_SVG + "</span>" +
          '<span class="ed-objective-text">' + o.text + "</span>" +
          '<span class="ed-objective-lang">' + LOGOS[o.lang] + "</span>" +
        "</button></li>";
    }).join("");
    renderProgress();
  }

  function renderProgress() {
    var n = done.filter(Boolean).length, total = done.length;
    objectiveList.querySelectorAll(".ed-objective").forEach(function (li, i) {
      li.classList.toggle("done", done[i]);
      li.querySelector(".ed-objective-btn").setAttribute("aria-label",
        (done[i] ? "Done: " : "To do: ") + li.querySelector(".ed-objective-text").textContent);
    });
    $("ed-progress-fill").style.width = (total ? (n / total) * 100 : 0) + "%";
    $("ed-progress-label").textContent = n + " / " + total;
    $("ed-rail-progress").textContent = n + "/" + total;
    var next = QUEST.objectives[done.indexOf(false)];
    $("quest-hint").innerHTML = next ? next.hint : "All objectives are complete. Nice work!";
  }

  objectiveList.addEventListener("click", function (e) {
    var b = e.target.closest(".ed-objective-btn");
    if (!b) return;
    closeDrawer();
    if (isPhone()) setPane("code");
    setLang(b.dataset.lang, true);
  });

  var checking = false;
  function check() {
    if (checking) return;
    checking = true;
    var btn = $("ed-check");
    btn.classList.add("loading");
    btn.disabled = true;

    var timeout = setTimeout(function () { finish(null); }, 8000);
    pendingCheck = function (results) { clearTimeout(timeout); finish(results); };
    run(); // the fresh document reports "ready", then the check is sent to it

    function finish(results) {
      pendingCheck = null;
      checking = false;
      btn.classList.remove("loading");
      btn.disabled = false;
      if (!results) {
        if (mascot) mascot.say("Hmm, I couldn't check your code. Is the page stuck in a loop? Try again.", { mood: "surprised" });
        else toast("Couldn't check your code. Try again.");
        return;
      }
      applyResults(results);
    }
  }

  function applyResults(results) {
    done = QUEST.objectives.map(function (_, i) { return !!results[i]; });
    renderProgress();
    var n = done.filter(Boolean).length;
    if (remote) {
      // The check is the attempt: the server records it and completes the lesson when all pass.
      clearTimeout(saveTimer);
      unsaved = false;
      api.post(lessonPath("check"), payload()).then(function (res) {
        if (res.completed) setTimeout(function () { openModal(res); }, 350);
      }, function (err) {
        unsaved = true;
        toast(err.status === 401 ? "You were logged out. Log in again to save your progress." : "Couldn't save your result: " + err.message, 3500);
      });
    } else {
      persist();
      if (n === done.length) setTimeout(openModal, 350);
    }
    if (n === done.length) {
      if (mascot) mascot.say("Every objective passed. That's how it's done!", { mood: "happy", ms: 5000 });
      return;
    }
    objectiveList.querySelectorAll(".ed-objective").forEach(function (li, i) {
      if (done[i]) return;
      li.classList.remove("failed");
      void li.offsetWidth;
      li.classList.add("failed");
      setTimeout(function () { li.classList.remove("failed"); }, 1600);
    });
    if (mascot) {
      failedChecks++;
      var next = QUEST.objectives[done.indexOf(false)];
      var lead = n === 0 ? "Not yet. " : n + " of " + done.length + " done. ";
      if (failedChecks >= 2 && next) {
        mascot.say(lead + "Here's a nudge: " + next.hint, { html: true, mood: "think", ms: 0 });
      } else {
        mascot.say(lead + "Check the objective that flashed red, then try again. Click me if you want a hint.", { mood: "sad" });
      }
    } else {
      toast(n + " of " + done.length + " objectives complete");
    }
  }

  /* ===============================================================
     8b. MASCOT — hints on request, reactions to checks and errors,
         and a nudge when the editor goes quiet
  ================================================================*/

  var mascot = window.CodleMascot || null;
  var failedChecks = 0;
  var lastEdit = Date.now();

  if (mascot) {
    mascot.help(function () {
      var next = QUEST.objectives[done.indexOf(false)];
      if (!next) return { text: "All objectives are complete. Nice work! Head back to the path for the next lesson.", mood: "happy" };
      return {
        text: "<b>" + next.text + "</b><br>" + next.hint,
        html: true,
        mood: "think"
      };
    });

    $("quest-hint-box").addEventListener("toggle", function () {
      if (this.open) mascot.mood("think", 2500);
    });

    input.addEventListener("input", function () { lastEdit = Date.now(); });
    setInterval(function () {
      if (document.hidden || done.indexOf(false) < 0) return;
      if (Date.now() - lastEdit < 90000 || input !== document.activeElement && Date.now() - lastEdit < 180000) return;
      lastEdit = Date.now();
      mascot.tip("Stuck? Click me and I'll point you to the next step.", { key: "ed-idle:" + (lesson ? lesson.lesson.id : "demo"), mood: "think" });
    }, 15000);

    setTimeout(function () {
      mascot.tip("Read the quest, edit the code, then hit <b>Check solution</b>. I'm here if you get stuck.", { key: "ed-intro", html: true, mood: "happy", ms: 7000 });
    }, 1200);
  }

  /* ===============================================================
     9. WORKSPACE: layout, splitter, preferences
  ================================================================*/

  var layoutEl = $("ed-layout");
  var work = $("ed-work");
  var outputPanel = $("ed-output");
  var splitter = $("ed-splitter");

  function applySplit() {
    work.style.setProperty("--ed-a", ws.split + "fr");
    work.style.setProperty("--ed-b", (1 - ws.split) + "fr");
    splitter.setAttribute("aria-valuenow", Math.round(ws.split * 100));
  }

  function setChecked(container, attr, value) {
    container.querySelectorAll("[" + attr + "]").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute(attr) === String(value) ? "true" : "false");
    });
  }

  function applyWorkspace() {
    layoutEl.dataset.quest = ws.quest ? "open" : "collapsed";
    work.dataset.layout = ws.layout;
    splitter.setAttribute("aria-orientation", ws.layout === "stacked" ? "horizontal" : "vertical");
    applySplit();
    outputPanel.dataset.console = ws.console ? "on" : "off";

    editorPanel.dataset.theme = ws.theme;
    editorPanel.dataset.wrap = ws.wrap ? "on" : "off";
    editorPanel.dataset.lines = ws.lines ? "on" : "off";
    editorPanel.style.setProperty("--ed-fs", ws.fontSize + "px");
    editorPanel.style.setProperty("--ed-lh", Math.round(ws.fontSize * 1.6) + "px");
    editorPanel.style.setProperty("--ed-tab", ws.tabSize);
    input.setAttribute("wrap", ws.wrap ? "soft" : "off");

    // Controls
    setChecked($("ed-settings"), "data-layout", ws.layout);
    setChecked($("ed-settings"), "data-theme", ws.theme);
    setChecked($("set-tab"), "data-tab", ws.tabSize);
    $("set-quest").checked = ws.quest;
    $("set-console").checked = ws.console;
    $("set-wrap").checked = ws.wrap;
    $("set-lines").checked = ws.lines;
    $("set-autorun").checked = ws.autorun;
    $("ed-autorun").checked = ws.autorun;
    $("set-font-val").textContent = ws.fontSize + "px";
    $("ed-status-font").textContent = ws.fontSize + "px";
    $("ed-status-indent").textContent = "Spaces: " + ws.tabSize;
    $("set-font-dec").disabled = $("ed-font-dec").disabled = ws.fontSize <= FONT_MIN;
    $("set-font-inc").disabled = $("ed-font-inc").disabled = ws.fontSize >= FONT_MAX;

    renderCode();
    requestAnimationFrame(function () { fitWrap(); syncScroll(); moveFileIndicator(); });
  }

  function update(patch) {
    var layoutChanged = patch.layout && patch.layout !== ws.layout;
    Object.keys(patch).forEach(function (k) { ws[k] = patch[k]; });
    ws = sanitize(ws);
    saveWs();
    if (layoutChanged) {
      work.classList.remove("relayout");
      void work.offsetWidth;
      work.classList.add("relayout");
      setTimeout(function () { work.classList.remove("relayout"); }, 520);
    }
    applyWorkspace();
  }

  function stepFont(d) { update({ fontSize: ws.fontSize + d }); }

  // Splitter: --ed-a is always the editor's share, whatever the layout.
  splitter.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    splitter.setPointerCapture(e.pointerId);
    document.body.classList.add("is-resizing");
    document.body.classList.toggle("is-rows", ws.layout === "stacked");
  });
  var splitPending = null;
  splitter.addEventListener("pointermove", function (e) {
    if (!document.body.classList.contains("is-resizing")) return;
    var first = !splitPending;
    splitPending = { x: e.clientX, y: e.clientY };
    if (!first) return;
    // Resize once per frame, not once per pointer event.
    requestAnimationFrame(function () {
      var p = splitPending;
      splitPending = null;
      if (!p) return;
      var r = work.getBoundingClientRect(), v;
      if (ws.layout === "stacked") v = (p.y - r.top) / r.height;
      else if (ws.layout === "swap") v = (r.right - p.x) / r.width;
      else v = (p.x - r.left) / r.width;
      ws.split = Math.min(0.8, Math.max(0.2, v));
      applySplit();
    });
  });
  function endResize(e) {
    if (!document.body.classList.contains("is-resizing")) return;
    document.body.classList.remove("is-resizing", "is-rows");
    if (splitter.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
    saveWs();
    fitWrap();
    moveFileIndicator();
  }
  splitter.addEventListener("pointerup", endResize);
  splitter.addEventListener("pointercancel", endResize);
  splitter.addEventListener("dblclick", function () { update({ split: 0.5 }); });
  splitter.addEventListener("keydown", function (e) {
    var dir = 0;
    if (ws.layout === "stacked") {
      if (e.key === "ArrowUp") dir = -1;
      if (e.key === "ArrowDown") dir = 1;
    } else {
      if (e.key === "ArrowLeft") dir = ws.layout === "swap" ? 1 : -1;
      if (e.key === "ArrowRight") dir = ws.layout === "swap" ? -1 : 1;
    }
    if (!dir) return;
    e.preventDefault();
    update({ split: ws.split + dir * 0.05 });
  });

  // Settings panel
  var settings = $("ed-settings");
  var settingsBtn = $("ed-settings-btn");
  function openSettings() {
    settings.classList.add("open");
    settings.setAttribute("aria-hidden", "false");
    settingsBtn.setAttribute("aria-expanded", "true");
    var first = settings.querySelector("button, input");
    if (first) first.focus({ preventScroll: true });
  }
  function closeSettings(returnFocus) {
    if (!settings.classList.contains("open")) return;
    settings.classList.remove("open");
    settings.setAttribute("aria-hidden", "true");
    settingsBtn.setAttribute("aria-expanded", "false");
    if (returnFocus) settingsBtn.focus({ preventScroll: true });
  }
  settingsBtn.addEventListener("click", function () {
    if (settings.classList.contains("open")) closeSettings(); else openSettings();
  });
  $("ed-settings-close").addEventListener("click", function () { closeSettings(true); });
  document.addEventListener("pointerdown", function (e) {
    if (settings.classList.contains("open") && !settings.contains(e.target) && !settingsBtn.contains(e.target)) closeSettings();
  });

  settings.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.layout) update({ layout: b.dataset.layout });
    else if (b.dataset.theme) update({ theme: b.dataset.theme });
    else if (b.dataset.tab) update({ tabSize: +b.dataset.tab });
    else if (b.dataset.effects && window.CodlePerf) { window.CodlePerf.setMode(b.dataset.effects); renderEffects(); }
    else if (b.id === "set-font-dec") stepFont(-1);
    else if (b.id === "set-font-inc") stepFont(1);
    else if (b.id === "set-reset") {
      if (window.CodlePerf) window.CodlePerf.setMode("auto");
      renderEffects();
      ws = sanitize(null);
      saveWs();
      applyWorkspace();
      toast("Workspace restored to defaults");
    }
  });
  $("set-quest").addEventListener("change", function () { update({ quest: this.checked }); });
  $("set-console").addEventListener("change", function () { update({ console: this.checked }); });
  $("set-wrap").addEventListener("change", function () { update({ wrap: this.checked }); });
  $("set-lines").addEventListener("change", function () { update({ lines: this.checked }); });
  $("set-autorun").addEventListener("change", function () { update({ autorun: this.checked }); if (this.checked && dirty) run(); });
  $("ed-autorun").addEventListener("change", function () { update({ autorun: this.checked }); if (this.checked && dirty) run(); });
  $("ed-font-dec").addEventListener("click", function () { stepFont(-1); });
  $("ed-font-inc").addEventListener("click", function () { stepFont(1); });

  // Visual effects (js/perf.js): Auto / Full / Lite
  var REASON_TEXT = {
    "hardware": "this device looks low-powered",
    "data saver": "data saver is on",
    "dropped frames": "the page was dropping frames"
  };
  function renderEffects() {
    var perf = window.CodlePerf;
    var group = $("set-effects");
    if (!perf || !group) return;
    setChecked(group, "data-effects", perf.mode);
    var note;
    if (perf.mode === "lite") note = "Lite: no blur or animated effects";
    else if (perf.mode === "full") note = "Full effects, even on slow devices";
    else if (perf.lite) note = "Lite is on because " + (REASON_TEXT[perf.reasons[0]] || "this device is slow");
    else note = "Full effects; switches to Lite if the page slows down";
    $("set-effects-note").textContent = note;
  }
  if (window.CodlePerf) window.CodlePerf.onChange(renderEffects);

  // Quest panel: collapse to a rail (desktop) or close the drawer (tablet)
  var questPanel = $("ed-quest");
  var questToggle = $("ed-quest-toggle");
  function isPhone() { return window.matchMedia("(max-width: 768px)").matches; }
  function isTablet() { return window.matchMedia("(max-width: 1100px) and (min-width: 769px)").matches; }
  function openDrawer() {
    if (!isTablet()) return;
    questPanel.classList.add("open");
    document.body.classList.add("quest-open");
    questToggle.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    questPanel.classList.remove("open");
    document.body.classList.remove("quest-open");
    questToggle.setAttribute("aria-expanded", "false");
  }
  questToggle.addEventListener("click", function () {
    if (questPanel.classList.contains("open")) closeDrawer(); else openDrawer();
  });
  $("ed-scrim").addEventListener("click", closeDrawer);
  $("ed-quest-collapse").addEventListener("click", function () {
    if (isTablet()) closeDrawer(); else update({ quest: false });
  });
  $("ed-quest-expand").addEventListener("click", function () { update({ quest: true }); });

  // Phone: one pane at a time
  var PANES = ["quest", "code", "output"];
  var mobileTabs = $("ed-mobile-tabs");
  function setPane(p) {
    layoutEl.dataset.pane = p;
    mobileTabs.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-selected", b.dataset.pane === p ? "true" : "false");
    });
    $("ed-mobile-indicator").style.transform = "translateX(" + (PANES.indexOf(p) * 100) + "%)";
    if (p === "code") requestAnimationFrame(function () { moveFileIndicator(); fitWrap(); syncScroll(); });
    if (p === "output" && dirty) run();
  }
  mobileTabs.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-pane]");
    if (b) setPane(b.dataset.pane);
  });

  /* ===============================================================
     10. TOAST, MODAL, RESET, SHORTCUTS
  ================================================================*/

  var toastTimer = null;
  function toast(msg, ms) {
    var el = $("ed-toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, ms || 1800);
  }

  var modal = $("ed-modal");
  /** `res` is the API's check answer (online): XP actually earned and the next lesson. */
  function openModal(res) {
    if (res) {
      var gained = res.reward ? res.reward.xpGained : 0;
      $("ed-modal-xp").textContent = "+" + gained + " XP";
      $("ed-modal-sub").textContent = res.firstCompletion
        ? "Every objective passed." + (res.badges && res.badges.length ? " New badge: " + res.badges.join(", ") + "!" : "")
        : "Every objective passed. You already earned the XP for this lesson.";
      var next = $("ed-modal-next");
      if (res.next && res.next.playable) {
        next.href = "editor.html?lesson=" + res.next.id;
        next.textContent = "Next: " + res.next.title;
      } else {
        next.href = "index.html";
        next.textContent = "Back to the path";
      }
    }
    modal.classList.add("open");
    $("ed-modal-next").focus();
  }
  function closeModal() { modal.classList.remove("open"); }
  $("ed-modal-stay").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  // Reset asks for a second click so work is never wiped by accident.
  var resetBtn = $("ed-reset");
  var resetTimer = null;
  function disarmReset() {
    resetBtn.classList.remove("confirm");
    resetBtn.setAttribute("aria-label", "Reset code to the starting point");
  }
  resetBtn.addEventListener("click", function () {
    if (!resetBtn.classList.contains("confirm")) {
      resetBtn.classList.add("confirm");
      resetBtn.setAttribute("aria-label", "Click again to reset all files");
      toast("Click again to reset all three files", 2500);
      resetTimer = setTimeout(disarmReset, 2500);
      return;
    }
    clearTimeout(resetTimer);
    disarmReset();
    files = { html: QUEST.starter.html, css: QUEST.starter.css, js: QUEST.starter.js };
    viewState = { html: null, css: null, js: null };
    setLang(lang, false);
    persist();
    run();
    toast("Code reset");
  });

  $("ed-refresh").addEventListener("click", function () {
    var b = $("ed-refresh");
    b.classList.remove("spin");
    void b.offsetWidth;
    b.classList.add("spin");
    run();
  });
  $("ed-run").addEventListener("click", runFromButton);
  $("ed-check").addEventListener("click", check);

  document.addEventListener("keydown", function (e) {
    var mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key === "Enter") { e.preventDefault(); runFromButton(); return; }
    if (mod && (e.key === "s" || e.key === "S")) { e.preventDefault(); persist(); run(); toast("Saved"); return; }
    if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); stepFont(1); return; }
    if (mod && e.key === "-") { e.preventDefault(); stepFont(-1); return; }
    if (mod && e.key === ",") { e.preventDefault(); openSettings(); return; }
    if (e.key === "Escape") {
      if (modal.classList.contains("open")) closeModal();
      else if (settings.classList.contains("open")) closeSettings(true);
      else if (questPanel.classList.contains("open")) closeDrawer();
    }
  });

  window.addEventListener("resize", function () {
    if (!isTablet()) closeDrawer();
    fitWrap();
    syncScroll();
    moveFileIndicator();
  });

  /* ===============================================================
     11. INIT
  ================================================================*/

  $("ed-run-kbd").textContent = isMac ? "⌘↵" : "Ctrl ↵";
  renderQuest();
  setLang("html", false);
  applyWorkspace();
  setPane(isPhone() ? "quest" : "code");
  run();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add("ed-ready"); });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveFileIndicator(); fitWrap(); });
}

/* Loader: a lesson from the API when the URL names one, otherwise the sample quest. */
(function () {
  "use strict";
  var match = /[?&]lesson=(\d+)/.exec(location.search);
  var api = window.CodleApi;
  if (!match || !api) { codleEditor(null); return; }

  function giveUp(message) {
    var el = document.getElementById("ed-toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(function () { window.location.replace("index.html"); }, 2500);
  }

  api.ready.then(function (s) {
    if (!s.online) { codleEditor(null); return; } // static demo: sample quest
    if (!s.user) { window.location.replace("register.html"); return; }
    api.get("lessons/" + match[1]).then(codleEditor, function (err) {
      giveUp(err.code === "lesson_locked" ? "This lesson is still locked." :
        err.code === "no_content" ? "This lesson isn't ready yet." : "Couldn't open the lesson: " + err.message);
    });
  });
})();
