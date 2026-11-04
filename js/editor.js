/**
 * Codle — Code editor
 *
 * Lesson workspace: quest panel, code editor (HTML / CSS / JS tabs) and
 * live output. The workspace is customizable (layout, panels, font size,
 * tab size, word wrap, line numbers, theme); those preferences are shared
 * by every lesson, while code and progress are saved per lesson.
 *
 * editor.html?lesson=ID loads that lesson's quest from the API (js/api.js),
 * autosaves the code to the server and completes the lesson (XP) once every
 * objective passes. Without a lesson id the page goes back to the path.
 *
 * Objective checks run inside the sandboxed preview iframe and report back
 * with postMessage, so the preview never needs same-origin access to this page.
 */

/** Builds the editor. `lesson` is the API's GET lessons/{id} answer. */
function codleEditor(lesson) {
  "use strict";

  function $(id) { return document.getElementById(id); }
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* ===============================================================
     1. LANGUAGE LOGOS
  ================================================================*/

  // The official logos, as Devicon 2.18.0 draws them (MIT; the same ones register.html shows).
  var LOGOS = {
    html: '<svg class="ed-logo" viewBox="0 0 128 128" aria-hidden="true"><path fill="#E44D26" d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"/><path fill="#F16529" d="M64 116.8l36.378-10.086 8.559-95.878H64z"/><path fill="#EBEBEB" d="M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.33 3.692 3.382 37.927H64zm0 35.743l-.061.017-15.327-4.14-.979-10.975H33.816l1.928 21.609 28.193 7.826.063-.017z"/><path fill="#fff" d="M63.952 52.455v13.763h16.947l-1.597 17.849-15.35 4.143v14.319l28.215-7.82.207-2.325 3.234-36.233.335-3.696h-3.708zm0-27.856v13.762h33.244l.276-3.092.628-6.978.329-3.692z"/></svg>',
    css: '<svg class="ed-logo" viewBox="0 0 128 128" aria-hidden="true"><path fill="#1572B6" d="M18.814 114.123L8.76 1.352h110.48l-10.064 112.754-45.243 12.543-45.119-12.526z"/><path fill="#33A9DC" d="M64.001 117.062l36.559-10.136 8.601-96.354h-45.16v106.49z"/><path fill="#fff" d="M64.001 51.429h18.302l1.264-14.163H64.001V23.435h34.682l-.332 3.711-3.4 38.114h-30.95V51.429z"/><path fill="#EBEBEB" d="M64.083 87.349l-.061.018-15.403-4.159-.985-11.031H33.752l1.937 21.717 28.331 7.863.063-.018v-14.39z"/><path fill="#fff" d="M81.127 64.675l-1.666 18.522-15.426 4.164v14.39l28.354-7.858.208-2.337 2.406-26.881H81.127z"/><path fill="#EBEBEB" d="M64.048 23.435v13.831H30.64l-.277-3.108-.63-7.012-.331-3.711h34.646zm-.047 27.996v13.831H48.792l-.277-3.108-.631-7.012-.33-3.711h16.447z"/></svg>',
    js: '<svg class="ed-logo" viewBox="0 0 128 128" aria-hidden="true"><path fill="#F0DB4F" d="M1.408 1.408h125.184v125.185H1.408z"/><path fill="#323330" d="M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z"/></svg>'
  };
  var LANG_LABEL = { html: "HTML", css: "CSS", js: "JavaScript" };

  document.querySelectorAll("[data-logo]").forEach(function (el) { el.innerHTML = LOGOS[el.dataset.logo]; });

  /* ===============================================================
     2. QUEST — from the lesson. An objective's check is the body of
     function (doc) { … } as a string (quest_objectives.check_js).
  ================================================================*/

  var api = window.CodleApi;
  var remote = !!lesson;

  var QUEST = remote ? {
    id: lesson.quest.id,
    crumb: lesson.lesson.crumb,
    title: lesson.quest.title,
    xp: lesson.lesson.xp,
    descHtml: lesson.quest.descHtml,
    objectives: lesson.quest.objectives,
    starter: lesson.quest.starter
  } : null;

  /* ===============================================================
     3. STATE + STORAGE
     The server keeps the code (quest_saves) and the workspace
     (user_settings).
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
  // the account's app theme (Profile → Theme) wins over this browser's copy
  if (remote && lesson.settings && window.CodleTheme) window.CodleTheme.configure(lesson.settings);
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
  // "editing" tells the input handler that the editor typed this, not the user.
  var editing = false;
  function insertText(text) {
    var ok = false;
    editing = true;
    try {
      try { ok = document.execCommand(text ? "insertText" : "delete", false, text); } catch (e) { ok = false; }
      if (!ok) {
        input.setRangeText(text, input.selectionStart, input.selectionEnd, "end");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } finally {
      editing = false;
    }
  }
  /** Replaces [from, to) through the undo stack, then selects [selFrom, selTo) (a caret when selTo is left out). */
  function replaceRange(from, to, text, selFrom, selTo) {
    input.setSelectionRange(from, to);
    if (text || from !== to) insertText(text);
    if (selFrom !== undefined) input.setSelectionRange(selFrom, selTo === undefined ? selFrom : selTo);
    updateCaret();
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

  /** Tab / Shift+Tab; wholeLines (Ctrl+] / Ctrl+[) indents the line even with a plain caret. */
  function handleTab(outdent, wholeLines) {
    var v = input.value, s = input.selectionStart, e = input.selectionEnd;
    var unit = indentUnit();
    var multi = v.slice(s, e).indexOf("\n") >= 0;
    if (!outdent && !multi && !wholeLines) { insertText(unit); return; }
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

  /* ----- snippets: Tab expands, then Tab / Shift+Tab walk the placeholders (js/editor-snippets.js) ----- */
  var Snippets = window.CodleSnippets || null;
  var snip = null; // the snippet being filled in: { stops: [[from, to], …], i, len }

  function insertSnippet(start, end, body) {
    var v = input.value;
    var lineStart = v.lastIndexOf("\n", start - 1) + 1;
    var indent = /^[ \t]*/.exec(v.slice(lineStart, start))[0];
    var p = Snippets.parse(body.replace(/\t/g, indentUnit()).replace(/\n/g, "\n" + indent));
    replaceRange(start, end, p.text);
    var stops = p.stops.map(function (st) { return [start + st[0], start + st[1]]; });
    snip = stops.length > 1 ? { stops: stops, i: 0, len: input.value.length } : null;
    if (snip) selectStop(); else replaceRange(stops[0][0], stops[0][0], "", stops[0][0]);
  }
  function selectStop() {
    var st = snip.stops[snip.i];
    input.setSelectionRange(st[0], st[1]);
    updateCaret();
    if (snip.i === snip.stops.length - 1) snip = null; // reached $0: done
  }
  /** Moves to the next (d = 1) or previous placeholder; false when the caret has left the snippet. */
  function nextStop(d) {
    var c = input.selectionStart, from = Infinity, to = -1;
    snip.stops.forEach(function (st) { from = Math.min(from, st[0]); to = Math.max(to, st[1]); });
    if (c < from || c > to) { snip = null; return false; }
    snip.i = Math.max(0, Math.min(snip.stops.length - 1, snip.i + d));
    selectStop();
    return true;
  }
  /** After an edit: typing inside the current placeholder grows it and moves the later ones. */
  function trackSnippet() {
    if (!snip) return;
    var d = input.value.length - snip.len;
    snip.len = input.value.length;
    var cur = snip.stops[snip.i], c = input.selectionEnd;
    if (c < cur[0] || c > cur[1] + d) { snip = null; return; }
    var oldEnd = cur[1];
    cur[1] += d;
    snip.stops.forEach(function (st, j) { if (j !== snip.i && st[0] >= oldEnd) { st[0] += d; st[1] += d; } });
  }

  /* ----- the suggestion list (IntelliSense-style): Ctrl+Space, or as you type ----- */
  var codeArea = input.parentNode;
  var suggestEl = document.createElement("div");
  suggestEl.className = "ed-suggest";
  suggestEl.id = "ed-suggest";
  suggestEl.setAttribute("role", "listbox");
  suggestEl.setAttribute("aria-label", "Suggestions");
  suggestEl.hidden = true;
  codeArea.appendChild(suggestEl);
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "ed-suggest");
  var sg = null; // { start, items, i }

  function closeSuggest() {
    if (!sg) return;
    sg = null;
    suggestEl.hidden = true;
    input.removeAttribute("aria-activedescendant");
  }
  function updateSuggest(force) {
    if (!Snippets || input.selectionStart !== input.selectionEnd) { closeSuggest(); return; }
    var r = Snippets.complete(lang, input.value.slice(0, input.selectionStart), force);
    if (!r) { closeSuggest(); return; }
    sg = { start: r.start, items: r.items, i: 0 };
    suggestEl.innerHTML = r.items.map(function (it, i) {
      return '<div class="ed-suggest-item" role="option" id="ed-sg-' + i + '" data-i="' + i + '" aria-selected="' + (i === 0) + '">' +
        '<span class="ed-suggest-key">' + esc(it.prefix) + '</span><span class="ed-suggest-label">' + esc(it.label) + "</span></div>";
    }).join("");
    suggestEl.hidden = false;
    input.setAttribute("aria-activedescendant", "ed-sg-0");
    placeSuggest();
  }
  function pickSuggest(i) {
    sg.i = (i + sg.items.length) % sg.items.length;
    suggestEl.querySelectorAll(".ed-suggest-item").forEach(function (el, j) { el.setAttribute("aria-selected", j === sg.i ? "true" : "false"); });
    input.setAttribute("aria-activedescendant", "ed-sg-" + sg.i);
  }
  function acceptSuggest() {
    var it = sg.items[sg.i], start = sg.start;
    closeSuggest();
    insertSnippet(start, input.selectionStart, it.body);
  }
  /** Under the word being completed (above it when there is no room below). */
  function placeSuggest() {
    if (!sg) return;
    var v = input.value, lineStart = v.lastIndexOf("\n", sg.start - 1) + 1, col = sg.start - lineStart;
    var el = lineEls[v.slice(0, sg.start).split("\n").length - 1];
    if (!el) return;
    var cs = getComputedStyle(input), lh = parseFloat(cs.lineHeight) || 22, padL = parseFloat(cs.paddingLeft) || 18;
    var ctx = placeSuggest.ctx || (placeSuggest.ctx = document.createElement("canvas").getContext("2d"));
    ctx.font = cs.fontSize + " " + cs.fontFamily;
    var cw = ctx.measureText("0000000000").width / 10;
    var x = padL + col * cw - (ws.wrap ? 0 : input.scrollLeft), y = el.offsetTop - input.scrollTop;
    if (ws.wrap) {
      var perRow = Math.max(1, Math.floor((input.clientWidth - 2 * padL) / cw));
      x = padL + (col % perRow) * cw;
      y += Math.floor(col / perRow) * lh;
    }
    y += lh + 2;
    var w = suggestEl.offsetWidth, h = suggestEl.offsetHeight;
    x = Math.max(4, Math.min(x - 6, codeArea.clientWidth - w - 4));
    if (y + h > codeArea.clientHeight - 4 && y - lh - h - 4 > 0) y -= lh + h + 4;
    suggestEl.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
  }
  suggestEl.addEventListener("mousedown", function (e) { e.preventDefault(); }); // keep the focus in the code
  suggestEl.addEventListener("click", function (e) {
    var item = e.target.closest(".ed-suggest-item");
    if (!item || !sg) return;
    pickSuggest(+item.dataset.i);
    acceptSuggest();
  });
  input.addEventListener("blur", closeSuggest);
  input.addEventListener("mousedown", closeSuggest);

  /* ----- brackets, quotes and HTML tags close themselves (as in VS Code) ----- */
  var PAIRS = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
  var ATTRS_RE = "(?:\\s(?:[^<>\"']|\"[^\"]*\"|'[^']*')*)?";
  var OPEN_TAG_END = new RegExp("<([A-Za-z][\\w-]*)" + ATTRS_RE + "$");
  var ANY_TAG = new RegExp("<(/?)([A-Za-z][\\w-]*)" + ATTRS_RE + "(/?)>", "g");

  function insideTag(before) { return before.lastIndexOf("<") > before.lastIndexOf(">"); }
  /** The innermost element still open before the caret, for "</" completion. */
  function unclosedTag(before) {
    var stack = [], m;
    before = before.replace(/<!--[\s\S]*?-->/g, "");
    ANY_TAG.lastIndex = 0;
    while ((m = ANY_TAG.exec(before))) {
      var name = m[2].toLowerCase();
      if (VOID_TAGS.test(name) || m[3]) continue;
      if (!m[1]) { stack.push(name); continue; }
      var at = stack.lastIndexOf(name);
      if (at >= 0) stack.length = at;
    }
    return stack.length ? stack[stack.length - 1] : null;
  }

  input.addEventListener("beforeinput", function (e) {
    if (editing || e.isComposing || e.inputType !== "insertText" || !e.data || e.data.length !== 1) return;
    var ch = e.data, v = input.value, s = input.selectionStart, en = input.selectionEnd;
    var prev = v.charAt(s - 1), next = v.charAt(en), quote = ch === '"' || ch === "'" || ch === "`";
    // typing the closer that is already there steps over it
    if (s === en && next === ch && (quote || ")]}".indexOf(ch) >= 0)) {
      e.preventDefault();
      replaceRange(s + 1, s + 1, "", s + 1);
      return;
    }
    if (PAIRS[ch] && !(lang === "html" && ch === "`")) {
      if (s !== en) { // wrap the selection
        e.preventDefault();
        replaceRange(s, en, ch + v.slice(s, en) + PAIRS[ch], s + 1, en + 1);
        return;
      }
      var ok = next === "" || /[\s)\]};,>]/.test(next);
      if (quote) ok = ok && !/[\w"'`]/.test(prev) && (lang !== "html" || insideTag(v.slice(0, s)));
      if (ok) {
        e.preventDefault();
        replaceRange(s, s, ch + PAIRS[ch], s + 1);
      }
      return;
    }
    if (lang !== "html" || s !== en) return;
    if (ch === ">") {
      var m = OPEN_TAG_END.exec(v.slice(0, s));
      if (!m || VOID_TAGS.test(m[1]) || /\/$/.test(v.slice(0, s))) return;
      var close = "</" + m[1] + ">";
      if (v.slice(en, en + close.length) === close) return;
      e.preventDefault();
      replaceRange(s, s, ">" + close, s + 1);
    } else if (ch === "/" && prev === "<") {
      var open = unclosedTag(v.slice(0, s - 1));
      if (!open) return;
      e.preventDefault();
      replaceRange(s, s, "/" + open + ">", s + open.length + 2);
    }
  });

  /* ----- VS Code's line commands ----- */
  /** The whole lines the selection touches, [start, end) without the last line break. */
  function lineBlock() {
    var v = input.value, s = input.selectionStart, e = input.selectionEnd;
    if (e > s && v[e - 1] === "\n") e--;
    var end = v.indexOf("\n", e);
    return [v.lastIndexOf("\n", s - 1) + 1, end < 0 ? v.length : end];
  }
  var COMMENT = { html: ["<!--", "-->"], css: ["/*", "*/"], js: ["/*", "*/"] };
  /** Wraps [from, to) in a block comment, or unwraps it when it already is one. */
  function toggleBlockComment(from, to) {
    var c = COMMENT[lang], v = input.value, text = v.slice(from, to), s = input.selectionStart, e = input.selectionEnd;
    var lead = /^\s*/.exec(text)[0], inner = text.slice(lead.length).replace(/\s+$/, ""), trail = text.slice(lead.length + inner.length);
    if (!inner) { replaceRange(from, to, lead + c[0] + "  " + c[1] + trail, from + lead.length + c[0].length + 1); return; }
    var on = inner.indexOf(c[0]) !== 0 || inner.slice(-c[1].length) !== c[1] || inner.length < c[0].length + c[1].length;
    var body = on ? c[0] + " " + inner + " " + c[1]
      : inner.slice(c[0].length, inner.length - c[1].length).replace(/^ /, "").replace(/ $/, "");
    var out = lead + body + trail, d = on ? c[0].length + 1 : -(text.length - out.length) / 2;
    if (s === e) { var caret = Math.max(from, Math.min(from + out.length, s + d)); replaceRange(from, to, out, caret); }
    else replaceRange(from, to, out, from + lead.length, from + lead.length + body.length);
  }
  /** Ctrl+/: "//" on each line in JavaScript; HTML and CSS have only block comments. */
  function toggleLineComment() {
    var b = lineBlock();
    if (lang !== "js") { toggleBlockComment(b[0], b[1]); return; }
    var v = input.value, s = input.selectionStart, e = input.selectionEnd;
    var lines = v.slice(b[0], b[1]).split("\n"), code = lines.filter(function (l) { return l.trim(); });
    if (!code.length) return;
    var off = code.every(function (l) { return /^\s*\/\//.test(l); });
    var col = Math.min.apply(null, code.map(function (l) { return /^\s*/.exec(l)[0].length; }));
    var out = lines.map(function (l) {
      if (!l.trim()) return l;
      return off ? l.replace(/^(\s*)\/\/ ?/, "$1") : l.slice(0, col) + "// " + l.slice(col);
    });
    var text = out.join("\n"), first = out[0].length - lines[0].length;
    if (s === e) replaceRange(b[0], b[1], text, Math.max(b[0], s + first));
    else replaceRange(b[0], b[1], text, b[0], b[0] + text.length);
  }
  /** Alt+↑ / Alt+↓ */
  function moveLines(dir) {
    var v = input.value, b = lineBlock(), s = input.selectionStart, e = input.selectionEnd, block = v.slice(b[0], b[1]);
    if (dir < 0) {
      if (b[0] === 0) return;
      var ps = v.lastIndexOf("\n", b[0] - 2) + 1, prev = v.slice(ps, b[0] - 1);
      replaceRange(ps, b[1], block + "\n" + prev, s - prev.length - 1, e - prev.length - 1);
    } else {
      if (b[1] >= v.length) return;
      var ne = v.indexOf("\n", b[1] + 1);
      if (ne < 0) ne = v.length;
      var next = v.slice(b[1] + 1, ne);
      replaceRange(b[0], ne, next + "\n" + block, s + next.length + 1, e + next.length + 1);
    }
  }
  /** Shift+Alt+↑ / Shift+Alt+↓ */
  function copyLines(dir) {
    var v = input.value, b = lineBlock(), s = input.selectionStart, e = input.selectionEnd, block = v.slice(b[0], b[1]);
    if (dir < 0) replaceRange(b[0], b[0], block + "\n", s, e);
    else replaceRange(b[1], b[1], "\n" + block, s + block.length + 1, e + block.length + 1);
  }
  /** Ctrl+Shift+K (and Ctrl+X with nothing selected) */
  function deleteLines() {
    var v = input.value, b = lineBlock(), from = b[0], to = b[1];
    if (to < v.length) to++;
    else if (from > 0) from--;
    replaceRange(from, to, "", to === b[1] + 1 ? from : v.lastIndexOf("\n", from - 1) + 1);
  }
  /** Ctrl+L: the whole line; again: one more line */
  function selectLine() {
    var v = input.value, s = input.selectionStart, e = input.selectionEnd;
    var start = v.lastIndexOf("\n", s - 1) + 1;
    var full = s === start && e > s && v[e - 1] === "\n";
    var nl = v.indexOf("\n", full ? e : e > s && v[e - 1] === "\n" ? e - 1 : e);
    input.setSelectionRange(start, nl < 0 ? v.length : nl + 1);
    updateCaret();
  }
  /** Home: to the first character of the line, again: to the very start */
  function smartHome(extend) {
    var v = input.value, back = input.selectionDirection === "backward";
    var head = back ? input.selectionStart : input.selectionEnd, anchor = back ? input.selectionEnd : input.selectionStart;
    var ls = v.lastIndexOf("\n", head - 1) + 1, first = ls + /^[ \t]*/.exec(v.slice(ls))[0].length;
    var to = head === first ? ls : first;
    if (extend) input.setSelectionRange(Math.min(anchor, to), Math.max(anchor, to), to < anchor ? "backward" : "forward");
    else input.setSelectionRange(to, to);
    updateCaret();
  }
  /** Ctrl+Shift+Enter: a new line above, at the same indent */
  function insertLineAbove() {
    var v = input.value, ls = v.lastIndexOf("\n", input.selectionStart - 1) + 1, indent = /^[ \t]*/.exec(v.slice(ls))[0];
    replaceRange(ls, ls, indent + "\n", ls + indent.length);
  }
  // Ctrl+C / Ctrl+X with nothing selected take the whole line, as in VS Code
  ["copy", "cut"].forEach(function (type) {
    input.addEventListener(type, function (e) {
      if (input.selectionStart !== input.selectionEnd || !e.clipboardData) return;
      var b = lineBlock();
      e.preventDefault();
      e.clipboardData.setData("text/plain", input.value.slice(b[0], b[1]) + "\n");
      if (type === "cut") deleteLines();
    });
  });

  input.addEventListener("keydown", function (e) {
    if (e.isComposing) return;
    var mod = isMac ? e.metaKey : e.ctrlKey;
    var key = e.key, code = e.code;
    if (sg) {
      if (key === "ArrowDown" || key === "ArrowUp") { e.preventDefault(); pickSuggest(sg.i + (key === "ArrowDown" ? 1 : -1)); return; }
      if ((key === "Enter" || key === "Tab") && !mod && !e.altKey && !e.shiftKey) { e.preventDefault(); acceptSuggest(); return; }
      if (key === "Escape") { e.preventDefault(); e.stopPropagation(); closeSuggest(); return; }
      if (/^(?:ArrowLeft|ArrowRight|Home|End|PageUp|PageDown)$/.test(key)) closeSuggest();
    }
    if (key === "Tab" && !mod && !e.altKey) {
      e.preventDefault();
      if (snip && nextStop(e.shiftKey ? -1 : 1)) return;
      var x = !e.shiftKey && Snippets && input.selectionStart === input.selectionEnd && Snippets.expand(lang, input.value.slice(0, input.selectionStart));
      if (x) insertSnippet(x.start, input.selectionStart, x.body);
      else handleTab(e.shiftKey);
    } else if (key === "Enter" && mod && e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation(); // not "Run"
      insertLineAbove();
    } else if (key === "Enter" && !mod && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleEnter();
    } else if (key === "Escape") {
      if (snip) { snip = null; e.stopPropagation(); return; }
      input.blur(); // lets keyboard users Tab out of the editor
    } else if (mod && !e.altKey && (key === "/" || code === "Slash" || code === "NumpadDivide")) {
      e.preventDefault();
      toggleLineComment();
    } else if (e.altKey && e.shiftKey && !mod && code === "KeyA") {
      e.preventDefault();
      toggleBlockComment(input.selectionStart, input.selectionEnd);
    } else if (e.altKey && !mod && (key === "ArrowUp" || key === "ArrowDown")) {
      e.preventDefault();
      (e.shiftKey ? copyLines : moveLines)(key === "ArrowUp" ? -1 : 1);
    } else if (mod && e.shiftKey && !e.altKey && code === "KeyK") {
      e.preventDefault();
      deleteLines();
    } else if (mod && !e.shiftKey && !e.altKey && code === "KeyL") {
      e.preventDefault();
      selectLine();
    } else if (mod && !e.altKey && (code === "BracketRight" || code === "BracketLeft")) {
      e.preventDefault();
      handleTab(code === "BracketLeft", true);
    } else if (e.ctrlKey && !e.altKey && (code === "Space" || key === " ")) {
      e.preventDefault();
      updateSuggest(true);
    } else if (key === "Home" && !mod && !e.altKey) {
      e.preventDefault();
      smartHome(e.shiftKey);
    } else if (key === "Backspace" && !mod && !e.altKey && input.selectionStart === input.selectionEnd) {
      // deleting an opener right before its closer removes the pair
      var v = input.value, s = input.selectionStart;
      if (s > 0 && PAIRS[v[s - 1]] && v[s] === PAIRS[v[s - 1]]) {
        e.preventDefault();
        replaceRange(s - 1, s + 1, "", s - 1);
      }
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

  input.addEventListener("input", function (e) {
    files[lang] = input.value;
    dirty = true;
    queueRender();
    persistSoon();
    scheduleAutorun();
    trackSnippet();
    // the list follows what the user types (and deletes, while it is open); edits made by the editor close it
    if (!editing && (e.inputType === "insertText" || (sg && /^delete/.test(e.inputType || "")))) updateSuggest(!!sg);
    else closeSuggest();
  });
  input.addEventListener("scroll", function () { syncScroll(); placeSuggest(); }, { passive: true });
  ["keyup", "click", "select", "focus"].forEach(function (ev) { input.addEventListener(ev, updateCaret); });
  document.addEventListener("selectionchange", function () { if (document.activeElement === input) updateCaret(); });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { fitWrap(); syncScroll(); moveFileIndicator(); }).observe(input);
    // the theme's web font changes the tab widths once it arrives
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", function () { requestAnimationFrame(moveFileIndicator); });
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
    closeSuggest();
    snip = null;
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
      mascot.tip("Your JavaScript threw an error. Open the console under the preview to see what went wrong.", { key: "ed-error:" + lesson.lesson.id, mood: "surprised" });
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
      mascot.tip("Stuck? Click me and I'll point you to the next step.", { key: "ed-idle:" + lesson.lesson.id, mood: "think" });
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

  // App theme (js/theme.js): the same list as Profile → Theme
  var appThemeSel = $("set-app-theme");
  if (appThemeSel && window.CodleTheme) {
    appThemeSel.innerHTML = window.CodleTheme.themes.map(function (t) { return '<option value="' + t.id + '">' + t.name + "</option>"; }).join("");
    window.CodleTheme.onChange(function (th) { appThemeSel.value = th.id; });
    appThemeSel.addEventListener("change", function () {
      window.CodleTheme.set(this.value);
      if (remote) api.put("me/settings", window.CodleTheme.settings()).catch(function () { /* kept in this browser */ });
    });
  } else if (appThemeSel) appThemeSel.closest(".ed-set-section").hidden = true;

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
        next.href = (res.next.kind === "quiz" || res.next.kind === "exam" ? "quiz.html" : "editor.html") + "?lesson=" + res.next.id;
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

  // Workspace → Keyboard shortcuts (written for Windows; a Mac shows ⌘ ⌥ ⇧, but Ctrl+Space stays Ctrl)
  var SHORTCUTS = [
    ["Ctrl+Enter", "Run"], ["Ctrl+S", "Save"], ["Tab", "Expand a snippet, then the next placeholder"],
    ["Ctrl+Space", "Show suggestions"], ["Ctrl+/", "Comment line"], ["Shift+Alt+A", "Block comment"],
    ["Alt+↑ / ↓", "Move line up / down"], ["Shift+Alt+↑ / ↓", "Copy line up / down"], ["Ctrl+Shift+K", "Delete line"],
    ["Ctrl+L", "Select line"], ["Ctrl+] / [", "Indent / outdent line"], ["Ctrl+Shift+Enter", "New line above"],
    ["Ctrl+X / C", "Cut / copy the line (nothing selected)"], ["Home", "Start of the code on the line"],
    ["Ctrl+Z", "Undo"], ["Ctrl+= / −", "Text size"], ["Ctrl+,", "Workspace settings"]
  ];
  $("set-keys").innerHTML = SHORTCUTS.map(function (s) {
    var keys = isMac && s[0] !== "Ctrl+Space" ? s[0].replace(/Ctrl\+/g, "⌘").replace(/Shift\+/g, "⇧").replace(/Alt\+/g, "⌥") : s[0];
    return "<dt><kbd>" + esc(keys) + "</kbd></dt><dd>" + esc(s[1]) + "</dd>";
  }).join("");
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

/* Loader: the lesson the URL names, from the API. Without one, back to the path. */
(function () {
  "use strict";
  var match = /[?&]lesson=(\d+)/.exec(location.search);
  var api = window.CodleApi;
  if (!match || !api) { window.location.replace("index.html"); return; }

  function giveUp(message) {
    var el = document.getElementById("ed-toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(function () { window.location.replace("index.html"); }, 2500);
  }

  api.ready.then(function (s) {
    if (!s.user) { window.location.replace("register.html"); return; }
    api.get("lessons/" + match[1]).then(codleEditor, function (err) {
      giveUp(err.code === "lesson_locked" ? "This lesson is still locked." :
        err.code === "no_content" ? "This lesson isn't ready yet." : "Couldn't open the lesson: " + err.message);
    });
  });
})();
