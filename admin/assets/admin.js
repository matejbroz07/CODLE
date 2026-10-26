/**
 * Codle — Admin
 *
 * Small progressive enhancements on top of plain PHP forms:
 * confirmations, clickable rows, code tabs, the objectives editor,
 * table filtering, the navbar glare from the app, and the objective
 * tester (runs the check_js of every objective in a sandboxed iframe,
 * like the learner's editor does).
 */

(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ===============================================================
     0. LANGUAGE — the page sets <html lang>; English is the source
  ================================================================*/

  var CS = {
    "Remove this objective?": "Odebrat tento cíl?",
    "Overwrite the test solution with the starter code?": "Přepsat testovací řešení startovním kódem?",
    "Testing…": "Testuji…",
    "Run test": "Spustit test",
    "This quest has no objectives yet.": "Úloha zatím nemá žádné cíle.",
    "(no text)": "(bez textu)",
    "did not finish": "nedoběhlo",
    "The code did not load within 6 s (infinite loop?).": "Kód se nenačetl do 6 s (nekonečná smyčka?).",
    "✓ passed": "✓ splněno",
    "✗ failed": "✗ nesplněno",
    "Already passes with the starter code.": "Cíl je splněný už na startu.",
    "Error in the check: ": "Chyba v kontrole: ",
    "Exception: ": "Výjimka: ",
    "test: solution passed": "test: řešení prošlo",
    "test: solution failed": "test: řešení neprošlo",
    "[start]": "[start]",
    "[solution]": "[řešení]"
  };
  var isCs = document.documentElement.lang === "cs";
  function t(s) { return (isCs && CS[s]) || s; }

  /* ===============================================================
     1. LIQUID GLASS — pointer glare on the navbar (as in js/app.js)
  ================================================================*/

  document.addEventListener("pointermove", function (e) {
    if (document.documentElement.classList.contains("lite")) return;
    var el = e.target.closest ? e.target.closest(".liquid-glass--bar") : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  }, { passive: true });

  /* ===============================================================
     2. FORMS: confirmations, dirty state, inputs
  ================================================================*/

  document.addEventListener("submit", function (e) {
    var msg = e.target.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  // Warn before leaving a big form with unsaved edits.
  $$("form[data-dirty-guard]").forEach(function (form) {
    var dirty = false;
    form.addEventListener("input", function () { dirty = true; });
    form.addEventListener("submit", function () { dirty = false; });
    window.addEventListener("beforeunload", function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
  });

  // Unit titles: the Save button appears once the title is edited.
  $$(".unit-rename").forEach(function (form) {
    var input = form.querySelector("input[name=title]");
    input.addEventListener("input", function () {
      form.classList.toggle("is-dirty", input.value !== input.defaultValue);
    });
  });

  // Wordle words: A–Z only, upper case.
  $$("input.upper").forEach(function (input) {
    input.addEventListener("input", function () {
      var v = input.value.toUpperCase().replace(/[^A-Z]/g, "");
      if (v !== input.value) input.value = v;
    });
  });

  // Tab inserts two spaces in code fields; Esc leaves the field so Tab moves focus again.
  document.addEventListener("keydown", function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains("code")) return;
    if (e.key === "Escape") { el.blur(); return; }
    if (e.key !== "Tab" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    el.setRangeText("  ", el.selectionStart, el.selectionEnd, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  /* ===============================================================
     3. TABLES: clickable rows, filter
  ================================================================*/

  document.addEventListener("click", function (e) {
    var row = e.target.closest("tr.row-link");
    if (!row || e.target.closest("a, button, input, select, textarea, form, summary")) return;
    var link = row.querySelector("a[href]");
    if (link) window.location.href = link.href;
  });

  $$("input.filter[data-filter]").forEach(function (input) {
    var table = document.querySelector(input.getAttribute("data-filter"));
    if (!table) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      $$("tbody tr", table).forEach(function (tr) {
        tr.hidden = q !== "" && tr.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
  });

  // Wordle day editor: show the hint of the word picked in the select.
  var wordSelect = $("word-select");
  if (wordSelect) {
    wordSelect.addEventListener("change", function () {
      var opt = wordSelect.options[wordSelect.selectedIndex];
      $("word-select-hint").textContent = opt && opt.dataset.hint ? opt.dataset.word + " — " + opt.dataset.hint : "";
    });
  }

  /* ===============================================================
     4. CODE TABS
  ================================================================*/

  $$("[data-tabs]").forEach(function (box) {
    box.addEventListener("click", function (e) {
      var tab = e.target.closest(".tab");
      if (!tab) return;
      $$(".tab", box).forEach(function (b) {
        var on = b === tab;
        b.classList.toggle("is-active", on);
        b.classList.toggle("glass-pill", on);
      });
      $$(".tab-panel", box).forEach(function (p) { p.classList.toggle("is-active", p.id === tab.dataset.tab); });
      $(tab.dataset.tab).focus();
    });
  });

  /* ===============================================================
     5. OBJECTIVES EDITOR
  ================================================================*/

  var objList = $("objectives");
  var objTemplate = $("objective-template");

  function clearResults() {
    $$(".objective-result", objList).forEach(function (el) { el.textContent = ""; el.className = "objective-result"; });
  }

  if (objList && objTemplate) {
    $("add-objective").addEventListener("click", function () {
      var node = objTemplate.content.firstElementChild.cloneNode(true);
      objList.appendChild(node);
      node.querySelector("textarea").focus();
      objList.closest("form").dispatchEvent(new Event("input"));
    });

    objList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-obj]");
      if (!btn) return;
      var item = btn.closest(".objective");
      var op = btn.dataset.obj;
      if (op === "up" && item.previousElementSibling) objList.insertBefore(item, item.previousElementSibling);
      if (op === "down" && item.nextElementSibling) objList.insertBefore(item.nextElementSibling, item);
      if (op === "remove") {
        var untouched = $$("textarea", item).every(function (el) { return el.value.trim() === "" || el.value === el.defaultValue; });
        if (!untouched && !window.confirm(t("Remove this objective?"))) return;
        item.remove();
      }
      clearResults();
      objList.closest("form").dispatchEvent(new Event("input"));
    });
  }

  /* ===============================================================
     6. OBJECTIVE TESTER
  ================================================================*/

  var tester = $("tester");
  if (!tester) return;

  var LANGS = ["html", "css", "js"];
  var storeKey = "codle.admin.solution." + tester.dataset.questKey;

  function read(prefix) {
    var files = {};
    LANGS.forEach(function (l) { files[l] = $(prefix + l).value; });
    return files;
  }

  function loadSolution() {
    try {
      var saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved) LANGS.forEach(function (l) { $("solution-" + l).value = saved[l] || ""; });
    } catch (e) { /* private mode etc. */ }
  }

  var saveTimer = null;
  function saveSolution() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(storeKey, JSON.stringify(read("solution-"))); } catch (e) { /* ignore */ }
    }, 400);
  }

  loadSolution();
  LANGS.forEach(function (l) { $("solution-" + l).addEventListener("input", saveSolution); });

  $("copy-starter").addEventListener("click", function () {
    var hasCode = LANGS.some(function (l) { return $("solution-" + l).value.trim() !== ""; });
    if (hasCode && !window.confirm(t("Overwrite the test solution with the starter code?"))) return;
    LANGS.forEach(function (l) { $("solution-" + l).value = $("starter-" + l).value; });
    saveSolution();
  });

  // Runs inside the iframe before the page's own code: forwards console output,
  // then after load compiles every check as function (doc) { … } and reports results.
  function prelude() {
    var run = window.__RUN__, checks = window.__CHECKS__;
    var logs = window.__codleLogs = []; // same as js/editor.js: checks can read doc.defaultView.__codleLogs
    var send = function (type, data) {
      try { parent.postMessage({ __codleAdmin: 1, run: run, type: type, data: data }, "*"); } catch (e) { /* ignore */ }
    };
    var fmt = function (v) {
      if (typeof v === "string") return v;
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    };
    ["log", "warn", "error"].forEach(function (m) {
      var orig = console[m];
      console[m] = function () {
        if (m === "log") logs.push(Array.prototype.map.call(arguments, fmt).join(" "));
        send("log", m + ": " + Array.prototype.map.call(arguments, fmt).join(" "));
        if (orig) orig.apply(console, arguments);
      };
    });
    window.addEventListener("error", function (e) { send("log", "error: " + (e.message || "Script error")); });
    window.addEventListener("load", function () {
      setTimeout(function () {
        send("results", checks.map(function (src) {
          var fn;
          try { fn = new Function("doc", src); } catch (e) { return { ok: false, syntax: true, error: e.message }; }
          try { return { ok: !!fn(document) }; } catch (e) { return { ok: false, error: e.message }; }
        }));
      }, 30);
    });
  }
  var PRELUDE_SRC = "(" + prelude.toString() + ")();";

  function buildDocument(files, checks, run) {
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      "<script>window.__RUN__=" + run + ";window.__CHECKS__=" + JSON.stringify(checks).replace(/</g, "\\u003c") + ";" + PRELUDE_SRC + "<\/script>" +
      "<style>" + files.css.replace(/<\/style/gi, "<\\/style") + "</style>" +
      "</head><body>" + files.html +
      "<script>" + files.js.replace(/<\/script/gi, "<\\/script") + "\n<\/script>" +
      "</body></html>";
  }

  var runSeq = 0;
  var pending = {};

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.__codleAdmin !== 1) return;
    var p = pending[d.run];
    if (!p || e.source !== p.frame.contentWindow) return;
    if (d.type === "log") p.logs.push(d.data);
    if (d.type === "results") p.done(d.data);
  });

  function runIn(frame, files, checks) {
    return new Promise(function (resolve) {
      var run = ++runSeq;
      var entry = { frame: frame, logs: [] };
      var timer = setTimeout(function () { entry.done(null); }, 6000);
      entry.done = function (results) {
        clearTimeout(timer);
        delete pending[run];
        resolve({ results: results, logs: entry.logs });
      };
      pending[run] = entry;
      frame.srcdoc = buildDocument(files, checks, run);
    });
  }

  // Objective text is authored HTML; parse it inertly and show plain text.
  function plain(html) {
    return new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
  }

  function cell(res, expectPass) {
    var td = document.createElement("td");
    var label = document.createElement("span");
    var note = "";
    if (!res) {
      label.className = "res-fail";
      label.textContent = t("did not finish");
      note = t("The code did not load within 6 s (infinite loop?).");
    } else if (res.ok) {
      label.className = expectPass ? "res-pass" : "res-warn";
      label.textContent = t("✓ passed");
      if (!expectPass) note = t("Already passes with the starter code.");
    } else {
      label.className = expectPass ? "res-fail" : "muted";
      label.textContent = t("✗ failed");
      if (res.error) note = (res.syntax ? t("Error in the check: ") : t("Exception: ")) + res.error;
    }
    td.appendChild(label);
    if (note) {
      var n = document.createElement("span");
      n.className = "res-note";
      n.textContent = note;
      td.appendChild(n);
    }
    return td;
  }

  $("run-tests").addEventListener("click", function () {
    var btn = this;
    var items = $$(".objective", objList);
    var checks = items.map(function (it) { return it.querySelector("[name='obj_check[]']").value; });
    var texts = items.map(function (it) { return it.querySelector("[name='obj_text[]']").value; });
    var table = $("test-results");
    var body = table.querySelector("tbody");
    var con = $("test-console");

    if (!checks.length) {
      body.innerHTML = "";
      var tr = body.insertRow();
      var td = tr.insertCell();
      td.colSpan = 4;
      td.className = "empty";
      td.textContent = t("This quest has no objectives yet.");
      table.hidden = false;
      return;
    }

    btn.disabled = true;
    btn.textContent = t("Testing…");
    Promise.all([
      runIn($("preview-starter"), read("starter-"), checks),
      runIn($("preview-solution"), read("solution-"), checks)
    ]).then(function (out) {
      var start = out[0], sol = out[1];
      body.innerHTML = "";
      checks.forEach(function (_, i) {
        var tr = document.createElement("tr");
        var no = document.createElement("td");
        no.className = "num muted";
        no.textContent = i + 1;
        var text = document.createElement("td");
        text.textContent = plain(texts[i]) || t("(no text)");
        tr.appendChild(no);
        tr.appendChild(text);
        tr.appendChild(cell(start.results && start.results[i], false));
        tr.appendChild(cell(sol.results && sol.results[i], true));
        body.appendChild(tr);

        var badge = items[i].querySelector(".objective-result");
        var ok = sol.results && sol.results[i] && sol.results[i].ok;
        badge.className = "objective-result " + (ok ? "res-pass" : "res-fail");
        badge.textContent = ok ? t("test: solution passed") : t("test: solution failed");
      });
      table.hidden = false;

      var logs = start.logs.map(function (l) { return t("[start]") + " " + l; })
        .concat(sol.logs.map(function (l) { return t("[solution]") + " " + l; }));
      con.textContent = logs.join("\n");
      con.hidden = logs.length === 0;
    }).then(function () {
      btn.disabled = false;
      btn.textContent = t("Run test");
    });
  });
})();
