/**
 * Codle — editor snippets and Emmet abbreviations (used by js/editor.js)
 *
 * Works the way VS Code does: type a prefix and press Tab (or pick it from the
 * suggestion list). JavaScript uses VS Code's built-in snippet names; HTML and
 * CSS use Emmet, which is what VS Code runs for those languages.
 *
 *   HTML   !   div.card   ul>li*3   a:link   input:email   p>lorem10   btn{Send}
 *   CSS    df   jcc   m10   p8-16   w100p   bgc#0a84ff   @m   @kf
 *   JS     log   if   for   foreach   function   arrow   qs   ael   trycatch …
 *
 * Bodies use VS Code's snippet syntax: $1, ${1:placeholder}, $0 (final caret),
 * \t for one indent, \n for a new line (js/editor.js applies the line's indent).
 * Each number appears once: the editor does not mirror a repeated placeholder.
 *
 *   CodleSnippets.complete("js", textBeforeCaret, force)  -> { start, items } | null  (suggestion list)
 *   CodleSnippets.expand("html", textBeforeCaret)         -> { start, body } | null   (Tab)
 *   CodleSnippets.parse("for (${1:x}) {\n\t$0\n}")         -> { text, stops: [[from, to], …] }
 */
(function () {
  "use strict";

  /* ===============================================================
     Snippet syntax
  ================================================================*/

  /** Plain text plus the tab stops, in the order Tab visits them ($1, $2 … then $0). */
  function parse(body) {
    var text = "", marks = [], i = 0;
    while (i < body.length) {
      var ch = body[i];
      if (ch === "\\" && i + 1 < body.length) { text += body[i + 1]; i += 2; continue; }
      var m = ch === "$" && /^\$(?:(\d+)|\{(\d+)(?::((?:\\.|[^}\\])*))?\})/.exec(body.slice(i));
      if (m) {
        var def = (m[3] || "").replace(/\\(.)/g, "$1");
        marks.push({ n: +(m[1] || m[2]), from: text.length, to: text.length + def.length });
        text += def;
        i += m[0].length;
        continue;
      }
      text += ch;
      i++;
    }
    marks.sort(function (a, b) { return (a.n || 1e9) - (b.n || 1e9) || a.from - b.from; });
    if (!marks.length || marks[marks.length - 1].n !== 0) marks.push({ n: 0, from: text.length, to: text.length });
    return { text: text, stops: marks.map(function (k) { return [k.from, k.to]; }) };
  }
  function lit(s) { return String(s).replace(/[\\$}]/g, "\\$&"); }

  /* ===============================================================
     JavaScript — VS Code's built-in snippets, plus a few DOM ones
  ================================================================*/

  var JS = [
    ["log", "console.log()", "console.log($1);"],
    ["if", "if statement", "if (${1:condition}) {\n\t$0\n}"],
    ["ifelse", "if … else", "if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}"],
    ["for", "for loop", "for (let i = 0; i < ${1:array}.length; i++) {\n\t$0\n}"],
    ["foreach", "forEach loop", "${1:array}.forEach((${2:element}) => {\n\t$0\n});"],
    ["forof", "for … of loop", "for (const ${1:element} of ${2:array}) {\n\t$0\n}"],
    ["forin", "for … in loop", "for (const ${1:key} in ${2:object}) {\n\t$0\n}"],
    ["while", "while loop", "while (${1:condition}) {\n\t$0\n}"],
    ["dowhile", "do … while loop", "do {\n\t$0\n} while (${1:condition});"],
    ["switch", "switch statement", "switch (${1:key}) {\n\tcase ${2:value}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}"],
    ["function", "function", "function ${1:name}(${2:params}) {\n\t$0\n}"],
    ["arrow", "arrow function", "const ${1:name} = (${2:params}) => {\n\t$0\n};"],
    ["class", "class", "class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t$0\n\t}\n}"],
    ["new", "new object", "const ${1:name} = new ${2:Type}(${3:args});$0"],
    ["trycatch", "try … catch", "try {\n\t$0\n} catch (error) {\n\tconsole.error(error);\n}"],
    ["settimeout", "setTimeout()", "setTimeout(() => {\n\t$0\n}, ${1:1000});"],
    ["setinterval", "setInterval()", "setInterval(() => {\n\t$0\n}, ${1:1000});"],
    ["qs", "document.querySelector()", "document.querySelector(\"${1:selector}\")$0"],
    ["qsa", "document.querySelectorAll()", "document.querySelectorAll(\"${1:selector}\")$0"],
    ["gid", "document.getElementById()", "document.getElementById(\"${1:id}\")$0"],
    ["ael", "addEventListener()", "${1:element}.addEventListener(\"${2:click}\", (${3:event}) => {\n\t$0\n});"]
  ].map(function (s) { return { prefix: s[0], label: s[1], body: s[2] }; });

  /* ===============================================================
     HTML — Emmet
  ================================================================*/

  var TAGS = ("a abbr address article aside audio b blockquote body br button canvas caption cite code col colgroup " +
    "data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 " +
    "head header hgroup hr html i iframe img input ins kbd label legend li link main mark meta meter nav noscript ol " +
    "optgroup option output p picture pre progress q s samp script section select small source span strong style sub " +
    "summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr").split(" ");
  var TAG_SET = {};
  TAGS.forEach(function (t) { TAG_SET[t] = 1; });
  var VOID = /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;
  var INLINE = /^(?:a|abbr|b|br|button|cite|code|del|dfn|em|i|img|input|ins|kbd|label|mark|q|s|samp|select|small|span|strong|sub|sup|textarea|time|u|var)$/;
  // attributes Emmet adds by itself
  var DEFAULT_ATTRS = {
    a: [["href", ""]], img: [["src", ""], ["alt", ""]], input: [["type", "text"]], link: [["rel", "stylesheet"], ["href", ""]],
    label: [["for", ""]], form: [["action", ""]], iframe: [["src", ""]], video: [["src", ""]], audio: [["src", ""]],
    source: [["src", ""]], option: [["value", ""]], abbr: [["title", ""]], script: [], textarea: [], select: []
  };
  var ALIASES = {
    btn: { tag: "button" }, bq: { tag: "blockquote" }, fig: { tag: "figure" }, figc: { tag: "figcaption" },
    "a:link": { tag: "a", attrs: [["href", "https://"]] },
    "a:mail": { tag: "a", attrs: [["href", "mailto:"]] },
    "link:css": { tag: "link", attrs: [["rel", "stylesheet"], ["href", "style.css"]] },
    "script:src": { tag: "script", attrs: [["src", ""]] },
    "btn:s": { tag: "button", attrs: [["type", "submit"]] },
    "btn:r": { tag: "button", attrs: [["type", "reset"]] }
  };
  ["text", "email", "password", "number", "checkbox", "radio", "submit", "file", "date", "range", "color", "search"].forEach(function (t) {
    ALIASES["input:" + t] = { tag: "input", attrs: [["type", t], ["name", ""], ["id", ""]] };
  });
  // implicit tags: what ".x" means inside each parent
  var IMPLICIT = { ul: "li", ol: "li", table: "tr", tbody: "tr", thead: "tr", tfoot: "tr", tr: "td", select: "option", optgroup: "option", dl: "dt" };

  var HTML_SNIPPETS = [
    ["!", "HTML page", "<!DOCTYPE html>\n<html lang=\"${1:en}\">\n<head>\n\t<meta charset=\"UTF-8\">\n\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n\t<title>${2:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>"]
  ];

  var LOREM = ("lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore et dolore " +
    "magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat").split(" ");
  function lorem(n) {
    var words = [];
    for (var i = 0; i < n; i++) words.push(LOREM[i % LOREM.length]);
    var s = words.join(" ");
    return s.charAt(0).toUpperCase() + s.slice(1) + ".";
  }

  /** "ul>li.item$*3" -> tree of { tag, id, cls[], attrs[], text, count, children[] }, or null when it is not an abbreviation. */
  function parseEmmet(src) {
    var root = { children: [] }, parent = root, i = 0, n = src.length;
    function readElement() {
      var el = { tag: "", id: "", cls: [], attrs: [], text: null, count: 1, children: [] };
      var m = /^[A-Za-z!][\w:-]*/.exec(src.slice(i));
      if (m) {
        var name = m[0];
        var lm = /^lorem(\d*)$/.exec(name);
        if (lm) { el.text = lorem(lm[1] ? Math.min(+lm[1], 500) : 30); el.lorem = true; }
        else if (ALIASES[name]) { el.tag = ALIASES[name].tag; el.attrs = (ALIASES[name].attrs || []).slice(); el.alias = true; }
        else if (TAG_SET[name.toLowerCase()] || /^[a-z]\w*-[\w-]+$/.test(name)) el.tag = name.toLowerCase();
        else return null;
        i += name.length;
      }
      var any = !!m;
      for (;;) {
        var c = src[i];
        if (c === "#" || c === ".") {
          var w = /^[\w$-]+/.exec(src.slice(i + 1));
          if (!w) return null;
          if (c === "#") el.id = w[0]; else el.cls.push(w[0]);
          i += 1 + w[0].length;
        } else if (c === "[") {
          var end = src.indexOf("]", i);
          if (end < 0) return null;
          var re = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S*)))?/g, a, body = src.slice(i + 1, end);
          while ((a = re.exec(body))) el.attrs.push([a[1], a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] || ""]);
          i = end + 1;
        } else if (c === "{") {
          var close = src.indexOf("}", i);
          if (close < 0) return null;
          el.text = src.slice(i + 1, close);
          i = close + 1;
        } else break;
        any = true;
      }
      if (!any) return null;
      if (src[i] === "*") {
        var num = /^\*(\d+)/.exec(src.slice(i));
        if (!num) return null;
        el.count = Math.max(1, Math.min(+num[1], 100));
        i += num[0].length;
      }
      return el;
    }
    while (i < n) {
      var el = readElement();
      if (!el) return null;
      el.parent = parent;
      parent.children.push(el);
      if (i >= n) break;
      var op = src[i++];
      if (i >= n) return null; // "ul>" is not finished yet
      if (op === ">") parent = el;
      else if (op === "^") parent = parent.parent || root;
      else if (op !== "+") return null;
    }
    return root.children.length ? root : null;
  }

  function renderEmmet(root) {
    var stop = 1;
    function field() { return "${" + stop++ + "}"; }
    function num(s, k) { return s.replace(/\$+/g, function (d) { var v = String(k + 1); while (v.length < d.length) v = "0" + v; return v; }); }
    function tagOf(el) { return el.tag || (el.text !== null && !el.id && !el.cls.length && !el.attrs.length ? "" : IMPLICIT[el.parent && el.parent.tag] || "div"); }
    function one(el, k) {
      var tag = tagOf(el);
      var text = el.text === null ? null : lit(num(el.text, k));
      if (!tag) return text;
      var attrs = [];
      if (el.id) attrs.push(["id", num(el.id, k)]);
      if (el.cls.length) attrs.push(["class", el.cls.map(function (c) { return num(c, k); }).join(" ")]);
      var given = {};
      el.attrs.forEach(function (a) { given[a[0]] = 1; });
      (el.alias ? [] : DEFAULT_ATTRS[tag] || []).forEach(function (a) { if (!given[a[0]]) attrs.push(a); });
      el.attrs.forEach(function (a) { attrs.push([a[0], num(a[1], k)]); });
      var open = "<" + tag + attrs.map(function (a) { return " " + a[0] + '="' + (a[1] === "" ? field() : lit(a[1])) + '"'; }).join("") + ">";
      if (VOID.test(tag)) return open;
      var close = "</" + tag + ">";
      if (!el.children.length) return open + (text !== null ? text : field()) + close;
      var kids = many(el.children);
      var inline = el.children.length === 1 && el.children[0].count === 1 && !el.children[0].children.length &&
        (INLINE.test(tagOf(el.children[0])) || el.children[0].lorem);
      if (inline) return open + (text || "") + kids + close;
      return open + (text || "") + "\n" + kids.replace(/^/gm, "\t") + "\n" + close;
    }
    function many(list) {
      var out = [];
      list.forEach(function (el) { for (var k = 0; k < el.count; k++) out.push(one(el, k)); });
      return out.join("\n");
    }
    return many(root.children);
  }

  function emmet(abbr) {
    var tree = parseEmmet(abbr);
    return tree ? renderEmmet(tree) : null;
  }

  /** The abbreviation being typed right before the caret (Emmet's own rules, simplified). */
  function htmlAbbr(before) {
    var i = before.length, depth = 0;
    while (i > 0) {
      var c = before[i - 1];
      if (c === "}" || c === "]") depth++;
      else if ((c === "{" || c === "[") && depth) depth--;
      else if (!depth && !/[\w.#>+*^$:!@-]/.test(c)) break;
      i--;
    }
    var start = i, abbr = before.slice(start);
    // "<div>ul>li": the run began inside a tag, so the abbreviation starts after its ">"
    if (before[start - 1] === "<" || before[start - 1] === "/") {
      var gt = abbr.indexOf(">");
      if (gt < 0) return null;
      start += gt + 1;
      abbr = before.slice(start);
    }
    while (abbr[0] === ">") { start++; abbr = abbr.slice(1); }
    if (!abbr) return null;
    var lt = before.lastIndexOf("<", start), gt2 = before.lastIndexOf(">", start - 1);
    if (lt > gt2) return null; // typing inside a tag, e.g. <div cla
    return { word: abbr, start: start, lineStart: /(^|\n)[ \t]*$/.test(before.slice(0, start)) || before[start - 1] === ">" };
  }

  /* ===============================================================
     CSS — Emmet
  ================================================================*/

  var CSS_PROPS = {
    m: "margin", mt: "margin-top", mr: "margin-right", mb: "margin-bottom", ml: "margin-left",
    p: "padding", pt: "padding-top", pr: "padding-right", pb: "padding-bottom", pl: "padding-left",
    w: "width", h: "height", maw: "max-width", mah: "max-height", miw: "min-width", mih: "min-height",
    t: "top", r: "right", b: "bottom", l: "left", z: "z-index", pos: "position", d: "display", v: "visibility",
    fz: "font-size", fw: "font-weight", ff: "font-family", fs: "font-style", lh: "line-height", ls: "letter-spacing",
    ta: "text-align", td: "text-decoration", tt: "text-transform", ti: "text-indent", va: "vertical-align", ws: "white-space",
    c: "color", bg: "background", bgc: "background-color", bgi: "background-image", op: "opacity",
    bd: "border", bdt: "border-top", bdr: "border-right", bdb: "border-bottom", bdl: "border-left", bdrs: "border-radius",
    ol: "outline", bxsh: "box-shadow", bxz: "box-sizing", ov: "overflow", cur: "cursor", lis: "list-style",
    fx: "flex", fd: "flex-direction", fxw: "flex-wrap", fg: "flex-grow", fsh: "flex-shrink", jc: "justify-content",
    ai: "align-items", ac: "align-content", as: "align-self", gap: "gap", gtc: "grid-template-columns", gtr: "grid-template-rows",
    trs: "transition", trf: "transform", anim: "animation", ct: "content", obf: "object-fit"
  };
  var CSS_FIXED = {
    df: "display: flex", dif: "display: inline-flex", dg: "display: grid", db: "display: block", dib: "display: inline-block",
    di: "display: inline", dn: "display: none", posr: "position: relative", posa: "position: absolute", posf: "position: fixed",
    poss: "position: sticky", jcc: "justify-content: center", jcsb: "justify-content: space-between", jcsa: "justify-content: space-around",
    jcfs: "justify-content: flex-start", jcfe: "justify-content: flex-end", aic: "align-items: center", aifs: "align-items: flex-start",
    aife: "align-items: flex-end", ais: "align-items: stretch", fdc: "flex-direction: column", fdr: "flex-direction: row",
    fxww: "flex-wrap: wrap", tac: "text-align: center", tal: "text-align: left", tar: "text-align: right", taj: "text-align: justify",
    fwb: "font-weight: bold", fwn: "font-weight: normal", fsi: "font-style: italic", tdn: "text-decoration: none",
    tdu: "text-decoration: underline", ttu: "text-transform: uppercase", ttl: "text-transform: lowercase", ttc: "text-transform: capitalize",
    curp: "cursor: pointer", ovh: "overflow: hidden", ova: "overflow: auto", ovs: "overflow: scroll", bxzbb: "box-sizing: border-box",
    lisn: "list-style: none", wsnw: "white-space: nowrap", bdn: "border: none", vh: "visibility: hidden", obfc: "object-fit: cover"
  };
  var UNITLESS = { z: 1, fw: 1, op: 1, lh: 1, fg: 1, fsh: 1, fx: 1 };
  var UNITS = { p: "%", e: "em", r: "rem", x: "ex" };
  var CSS_SNIPPETS = [
    ["@m", "@media", "@media (${1:max-width: 768px}) {\n\t$0\n}"],
    ["@kf", "@keyframes", "@keyframes ${1:name} {\n\tfrom {\n\t\t$2\n\t}\n\tto {\n\t\t$0\n\t}\n}"],
    ["@i", "@import", "@import url(\"${1:style.css}\");"],
    ["@f", "@font-face", "@font-face {\n\tfont-family: \"${1:name}\";\n\tsrc: url(\"${2:font.woff2}\");\n}"]
  ];

  function cssValue(prop, v) {
    if (/^#[\da-f]{1,6}$/i.test(v)) {
      var hex = v.slice(1);
      return "#" + (hex.length === 1 ? hex + hex + hex : hex.length === 2 ? hex + hex + hex : hex);
    }
    var parts = v.split("-"), out = [];
    for (var i = 0; i < parts.length; i++) {
      var m = /^(\d*\.?\d+)([a-z%]*)$/.exec(parts[i]);
      if (!m) return null;
      var unit = UNITS[m[2]] || m[2];
      if (unit && !/^(?:px|%|em|rem|ex|vh|vw|vmin|vmax|ch|fr|s|ms|deg)$/.test(unit)) return null;
      if (!unit) unit = UNITLESS[prop] || +m[1] === 0 ? "" : "px";
      out.push(m[1] + unit);
    }
    return out.join(" ");
  }

  function cssEmmet(abbr) {
    var important = /!$/.test(abbr) ? " !important" : "";
    var a = important ? abbr.slice(0, -1) : abbr;
    if (CSS_FIXED[a]) return lit(CSS_FIXED[a] + important) + ";";
    var m = /^([a-z]+)(.*)$/.exec(a);
    if (!m) return null;
    for (var k = m[1].length; k > 0; k--) {
      var key = m[1].slice(0, k), rest = m[1].slice(k) + m[2];
      if (!CSS_PROPS[key]) continue;
      if (!rest) return CSS_PROPS[key] + ": ${1}" + lit(important) + ";";
      var val = cssValue(key, rest);
      if (val !== null) return CSS_PROPS[key] + ": " + lit(val + important) + ";";
    }
    return null;
  }

  /** Where the caret is in CSS: a declaration inside a rule, the top level, or neither (a value, a comment). */
  function cssWord(before) {
    var m = /[@\w#.!%-]+$/.exec(before);
    if (!m) return null;
    var start = before.length - m[0].length;
    if (before.lastIndexOf("/*") > before.lastIndexOf("*/")) return null; // in a comment
    var code = before.replace(/\/\*[\s\S]*?\*\//g, function (c) { return c.replace(/[^\n]/g, " "); });
    // the header of every open block; inside @media (and friends) come rules, not declarations
    var heads = [], from = 0;
    for (var i = 0; i < start; i++) {
      if (code[i] === "{") { heads.push(code.slice(from, i)); from = i + 1; }
      else if (code[i] === "}") { heads.pop(); from = i + 1; }
      else if (code[i] === ";") from = i + 1;
    }
    var inRule = heads.length > 0 && !/^\s*@(?:media|supports|container|layer|document)\b/.test(heads[heads.length - 1]);
    var lead = code.slice(0, start).replace(/\s+$/, "");
    if (!inRule) { if (m[0][0] !== "@") return null; }
    else if (!/[{;]$/.test(lead)) return null; // a value, e.g. "color: re"
    return { word: m[0], start: start, lineStart: true };
  }

  /* ===============================================================
     JavaScript context: not after a dot, not in a string or comment
  ================================================================*/

  function jsWord(before) {
    var m = /[A-Za-z_$][\w$]*$/.exec(before);
    if (!m) return null;
    var start = before.length - m[0].length;
    if (before[start - 1] === ".") return null;
    if (before.lastIndexOf("/*") > before.lastIndexOf("*/")) return null;
    var line = before.slice(before.lastIndexOf("\n") + 1, start);
    var q = null;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === "\\") i++; else if (c === q) q = null; }
      else if (c === '"' || c === "'" || c === "`") q = c;
      else if (c === "/" && line[i + 1] === "/") return null;
    }
    if (q) return null;
    return { word: m[0], start: start, lineStart: true };
  }

  /* ===============================================================
     Public API
  ================================================================*/

  function wordAt(lang, before) {
    return lang === "html" ? htmlAbbr(before) : lang === "css" ? cssWord(before) : jsWord(before);
  }

  /** What Tab turns the text before the caret into, or null (then Tab indents). */
  function expand(lang, before) {
    var w = wordAt(lang, before);
    if (!w) return null;
    var body = null, word = w.word;
    if (lang === "js") {
      JS.forEach(function (s) { if (s.prefix === word) body = s.body; });
    } else if (lang === "css") {
      CSS_SNIPPETS.forEach(function (s) { if (s[0] === word) body = s[2]; });
      if (body === null) body = cssEmmet(word);
    } else {
      HTML_SNIPPETS.forEach(function (s) { if (s[0] === word) body = s[2]; });
      if (body === null) body = emmet(word);
    }
    return body === null ? null : { start: w.start, body: body };
  }

  function firstLine(body) {
    var t = parse(body).text.split("\n");
    return t[0] + (t.length > 1 ? " …" : "");
  }

  /** The suggestion list for the text before the caret. Without force it stays quiet for
      one-letter words and, in HTML, for words in the middle of a sentence. */
  function complete(lang, before, force) {
    var w = wordAt(lang, before);
    if (!w) return null;
    var word = w.word, lower = word.toLowerCase();
    if (!force && (word.length < 2 && word !== "!" || !w.lineStart)) return null;
    var items = [];
    function add(prefix, label, body) {
      if (prefix.toLowerCase().indexOf(lower) !== 0 || body === null) return;
      items.push({ prefix: prefix, label: label, body: body, exact: prefix === word });
    }
    if (lang === "js") {
      JS.forEach(function (s) { add(s.prefix, s.label, s.body); });
    } else if (lang === "css") {
      CSS_SNIPPETS.forEach(function (s) { add(s[0], s[1], s[2]); });
      Object.keys(CSS_FIXED).forEach(function (k) { add(k, CSS_FIXED[k] + ";", lit(CSS_FIXED[k]) + ";"); });
      Object.keys(CSS_PROPS).forEach(function (k) { add(k, CSS_PROPS[k] + ": …;", CSS_PROPS[k] + ": ${1};"); });
      if (!items.some(function (it) { return it.exact; })) {
        var e = cssEmmet(word);
        if (e) items.unshift({ prefix: word, label: firstLine(e), body: e, exact: true });
      }
    } else {
      var tagLike = /^[a-z][a-z\d]*$/i.test(word);
      HTML_SNIPPETS.forEach(function (s) { add(s[0], s[1], s[2]); });
      Object.keys(ALIASES).forEach(function (k) { add(k, firstLine(emmet(k)), emmet(k)); });
      add("lorem", "Lorem ipsum, 30 words", emmet("lorem"));
      if (tagLike) TAGS.forEach(function (t) { add(t, firstLine(emmet(t)), emmet(t)); });
      if (!items.some(function (it) { return it.exact; }) && (!tagLike || /^lorem\d+$/.test(word))) {
        var x = emmet(word);
        if (x) items.unshift({ prefix: word, label: firstLine(x), body: x, exact: true, emmet: true });
      }
    }
    if (!items.length) return null;
    items.sort(function (a, b) { return (b.exact - a.exact) || a.prefix.length - b.prefix.length || (a.prefix < b.prefix ? -1 : 1); });
    return { start: w.start, items: items.slice(0, 8) };
  }

  window.CodleSnippets = { parse: parse, expand: expand, complete: complete };
})();
