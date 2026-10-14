/**
 * Codle — Practice
 *
 * Minigame hub plus the first game: Wordle. One 5-letter programming term
 * per day, six guesses. The word is the same for everyone on a given day
 * (seeded order over js/wordle-words.js, indexed by days since launch).
 * Progress and lifetime stats live in localStorage.
 */

(function () {
  "use strict";

  var WORD_LEN = 5;
  var MAX_GUESSES = 6;
  var LAUNCH = new Date(2026, 9, 13);          // puzzle #1, local midnight
  var SHUFFLE_SEED = 20261013;
  var STATE_KEY = "codle.wordle.state";
  var STATS_KEY = "codle.wordle.stats";
  var FLIP_STEP = 300;                         // ms between tile flips
  var FLIP_DURATION = 560;                     // must match .wordle-tile.flip
  var KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ENTER,Z,X,C,V,B,N,M,BACKSPACE"];
  var WIN_WORDS = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return document.getElementById(id); }

  /* ===============================================================
     1. DAILY WORD
  ================================================================*/

  function localMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dayNumber(d) { return Math.round((localMidnight(d) - LAUNCH) / 864e5); }
  function dateKey(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function mulberry32(seed) {
    var a = seed | 0;
    return function () {
      a = (a + 0x6D2A79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fixed shuffle so the list is not alphabetical but every visitor gets the same order.
  var ORDER = (function () {
    var list = (window.CodleWordleWords || []).slice();
    var rnd = mulberry32(SHUFFLE_SEED);
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  })();

  function puzzleForDay(n) {
    var L = ORDER.length;
    return ORDER[((n % L) + L) % L];
  }

  /* ===============================================================
     2. STORAGE
  ================================================================*/

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode etc. */ }
  }

  function freshState(key) {
    return { dateKey: key, guesses: [], status: "playing", hintUsed: false };
  }
  function freshStats() {
    return { played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0], lastDay: null };
  }

  /* ===============================================================
     3. GAME STATE
  ================================================================*/

  var today, day, puzzle, state, stats;
  var current = "";          // letters typed into the active row
  var busy = false;          // true while a row is flipping
  var modalKind = null;      // "result" | "stats" | "help" | null
  var countdownTimer = null;

  function initPuzzle() {
    today = new Date();
    day = dayNumber(today);
    puzzle = puzzleForDay(day);
    var key = dateKey(today);
    state = load(STATE_KEY, null);
    if (!state || state.dateKey !== key) state = freshState(key);
    stats = load(STATS_KEY, freshStats());
    if (!stats.dist || stats.dist.length !== MAX_GUESSES) stats.dist = [0, 0, 0, 0, 0, 0];
    // A missed day breaks the streak.
    if (stats.lastDay !== null && day - stats.lastDay > 1 && stats.streak) {
      stats.streak = 0;
      save(STATS_KEY, stats);
    }
    current = "";
    busy = false;
  }

  function answer() { return puzzle.word; }

  /* ===============================================================
     4. BOARD + KEYBOARD
  ================================================================*/

  var board = $("wordle-board");
  var keyboard = $("wordle-keyboard");
  var keyEls = {};

  function buildBoard() {
    if (!board) return;
    board.innerHTML = "";
    for (var r = 0; r < MAX_GUESSES; r++) {
      var row = document.createElement("div");
      row.className = "wordle-row";
      row.setAttribute("role", "row");
      for (var c = 0; c < WORD_LEN; c++) {
        var tile = document.createElement("div");
        tile.className = "wordle-tile";
        tile.setAttribute("role", "gridcell");
        row.appendChild(tile);
      }
      board.appendChild(row);
    }
  }

  function buildKeyboard() {
    if (!keyboard) return;
    keyboard.innerHTML = "";
    keyEls = {};
    KEY_ROWS.forEach(function (rowSpec) {
      var row = document.createElement("div");
      row.className = "wordle-kb-row";
      var keys = rowSpec.indexOf(",") >= 0 ? rowSpec.split(",") : rowSpec.split("");
      keys.forEach(function (k) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wordle-key" + (k.length > 1 ? " wide" : "");
        btn.dataset.key = k;
        if (k === "BACKSPACE") {
          btn.setAttribute("aria-label", "Backspace");
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>';
        } else {
          btn.textContent = k === "ENTER" ? "Enter" : k;
        }
        row.appendChild(btn);
        keyEls[k] = btn;
      });
      keyboard.appendChild(row);
    });
  }

  function rowEl(i) { return board.children[i]; }
  function tiles(i) { return Array.prototype.slice.call(rowEl(i).children); }

  function paintRow(i, word, result) {
    tiles(i).forEach(function (tile, c) {
      tile.textContent = word[c] || "";
      tile.className = "wordle-tile" + (word[c] ? " filled" : "") + (result ? " " + result[c] : "");
    });
  }

  function paintCurrentRow() {
    var i = state.guesses.length;
    if (i >= MAX_GUESSES) return;
    tiles(i).forEach(function (tile, c) {
      var ch = current[c] || "";
      var had = tile.textContent;
      tile.textContent = ch;
      tile.className = "wordle-tile" + (ch ? " filled" : "");
      // Re-trigger the pop only on the tile that just got a letter.
      if (ch && !had && !reduceMotion) { void tile.offsetWidth; }
    });
  }

  var RANK = { absent: 1, present: 2, correct: 3 };

  function paintKeyboard() {
    var best = {};
    state.guesses.forEach(function (g) {
      var res = evaluate(g, answer());
      for (var c = 0; c < WORD_LEN; c++) {
        var ch = g[c];
        if (!best[ch] || RANK[res[c]] > RANK[best[ch]]) best[ch] = res[c];
      }
    });
    Object.keys(keyEls).forEach(function (k) {
      var btn = keyEls[k];
      btn.classList.remove("correct", "present", "absent");
      if (best[k]) btn.classList.add(best[k]);
    });
  }

  function renderAll() {
    state.guesses.forEach(function (g, i) { paintRow(i, g, evaluate(g, answer())); });
    for (var i = state.guesses.length; i < MAX_GUESSES; i++) paintRow(i, "", null);
    paintCurrentRow();
    paintKeyboard();
    renderHint();
    var num = $("wordle-number");
    if (num) num.textContent = "#" + (day + 1);
    updateCardStatus();
  }

  /* ===============================================================
     5. EVALUATION
  ================================================================*/

  function evaluate(guess, target) {
    var res = new Array(WORD_LEN);
    var remaining = {};
    var c;
    for (c = 0; c < WORD_LEN; c++) {
      if (guess[c] === target[c]) {
        res[c] = "correct";
      } else {
        remaining[target[c]] = (remaining[target[c]] || 0) + 1;
      }
    }
    for (c = 0; c < WORD_LEN; c++) {
      if (res[c]) continue;
      if (remaining[guess[c]]) {
        res[c] = "present";
        remaining[guess[c]]--;
      } else {
        res[c] = "absent";
      }
    }
    return res;
  }

  /* ===============================================================
     6. INPUT
  ================================================================*/

  function onKey(k) {
    if (busy || modalKind || state.status !== "playing") return;
    if (k === "ENTER") { submitGuess(); return; }
    if (k === "BACKSPACE") {
      current = current.slice(0, -1);
      paintCurrentRow();
      return;
    }
    if (/^[A-Z]$/.test(k) && current.length < WORD_LEN) {
      current += k;
      paintCurrentRow();
    }
  }

  function shakeRow(i) {
    var row = rowEl(i);
    row.classList.remove("shake");
    void row.offsetWidth;
    row.classList.add("shake");
    setTimeout(function () { row.classList.remove("shake"); }, 520);
  }

  function submitGuess() {
    var rowIdx = state.guesses.length;
    if (current.length < WORD_LEN) {
      toast("Not enough letters");
      shakeRow(rowIdx);
      return;
    }
    var guess = current;
    var result = evaluate(guess, answer());
    state.guesses.push(guess);
    if (guess === answer()) state.status = "won";
    else if (state.guesses.length >= MAX_GUESSES) state.status = "lost";
    save(STATE_KEY, state);
    current = "";
    busy = true;

    revealRow(rowIdx, guess, result, function () {
      busy = false;
      paintKeyboard();
      updateCardStatus();
      if (state.status === "playing") return;
      renderHint(); // the bulb is no longer useful once the game is over
      finishGame(rowIdx);
    });
  }

  function revealRow(i, word, result, done) {
    var ts = tiles(i);
    if (reduceMotion) {
      paintRow(i, word, result);
      done();
      return;
    }
    ts.forEach(function (tile, c) {
      setTimeout(function () {
        tile.classList.add("flip");
        setTimeout(function () {
          tile.classList.remove("filled");
          tile.classList.add(result[c]);
        }, FLIP_DURATION / 2);
        setTimeout(function () { tile.classList.remove("flip"); }, FLIP_DURATION);
      }, c * FLIP_STEP);
    });
    setTimeout(done, (WORD_LEN - 1) * FLIP_STEP + FLIP_DURATION);
  }

  function finishGame(rowIdx) {
    var won = state.status === "won";
    var n = state.guesses.length;

    stats.played += 1;
    if (won) {
      stats.won += 1;
      stats.streak = stats.lastDay === day - 1 ? stats.streak + 1 : 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      stats.dist[n - 1] += 1;
    } else {
      stats.streak = 0;
    }
    stats.lastDay = day;
    save(STATS_KEY, stats);

    if (won) {
      toast(WIN_WORDS[n - 1] || "Nice", 1600);
      if (!reduceMotion) {
        tiles(rowIdx).forEach(function (tile, c) {
          setTimeout(function () { tile.classList.add("bounce"); }, c * 100);
        });
      }
    } else {
      toast(answer(), 2200);
    }
    setTimeout(function () { openModal("result"); }, won ? 1700 : 2000);
  }

  /* ===============================================================
     7. HINT
  ================================================================*/

  function renderHint() {
    var box = $("wordle-hint");
    var btn = $("wordle-hint-btn");
    if (!box || !btn) return;
    var show = state.hintUsed;
    box.hidden = !show;
    if (show) $("wordle-hint-text").textContent = puzzle.hint;
    btn.classList.toggle("is-on", show);
    btn.disabled = state.status !== "playing" || show;
  }

  function useHint() {
    if (state.status !== "playing" || state.hintUsed) return;
    state.hintUsed = true;
    save(STATE_KEY, state);
    renderHint();
  }

  /* ===============================================================
     8. TOAST + MODAL
  ================================================================*/

  var toastTimer = null;
  function toast(msg, ms) {
    var el = $("wordle-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, ms || 1200);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function msToMidnight() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return next - now;
  }
  function fmtCountdown(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function statsHtml(highlightRow) {
    var pct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
    var max = Math.max.apply(null, stats.dist.concat([1]));
    var dist = stats.dist.map(function (v, i) {
      var w = Math.max(8, Math.round((v / max) * 100));
      var cls = "wordle-dist-row" + (highlightRow === i ? " is-current" : "");
      return '<div class="' + cls + '"><span>' + (i + 1) + '</span><div class="wordle-dist-bar" style="width:' + w + '%">' + v + '</div></div>';
    }).join("");
    return (
      '<h4>Statistics</h4>' +
      '<div class="wordle-stats">' +
        '<div class="wordle-stat"><b>' + stats.played + '</b><span>Played</span></div>' +
        '<div class="wordle-stat"><b>' + pct + '</b><span>Win %</span></div>' +
        '<div class="wordle-stat"><b>' + stats.streak + '</b><span>Current streak</span></div>' +
        '<div class="wordle-stat"><b>' + stats.maxStreak + '</b><span>Max streak</span></div>' +
      '</div>' +
      '<h4>Guess distribution</h4>' +
      '<div class="wordle-dist">' + dist + '</div>'
    );
  }

  function answerHtml() {
    var letters = answer().split("").map(function (ch) { return "<span>" + ch + "</span>"; }).join("");
    return '<div class="wordle-answer"><div class="wordle-answer-word">' + letters + '</div><p>' + esc(puzzle.hint) + '</p></div>';
  }

  function footerHtml(withShare) {
    return (
      '<div class="wordle-modal-footer">' +
        '<div class="wordle-next"><span>Next word</span><b id="wordle-countdown">' + fmtCountdown(msToMidnight()) + '</b></div>' +
        (withShare
          ? '<button class="wordle-btn" type="button" id="wordle-share">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</button>'
          : "") +
      '</div>'
    );
  }

  function modalHtml(kind) {
    var finished = state.status !== "playing";
    if (kind === "help") {
      return (
        '<h3 id="wordle-modal-title">How to play</h3>' +
        '<p class="modal-sub">Guess the programming term in 6 tries.</p>' +
        '<ul class="wordle-help-list">' +
          '<li>Every guess must be 5 letters. Hit Enter to submit.</li>' +
          '<li>The tiles change colour to show how close you are.</li>' +
          '<li>Stuck? The bulb reveals a one-line definition.</li>' +
          '<li>A new word drops every day at midnight.</li>' +
        '</ul>' +
        '<div class="wordle-example"><span class="correct">S</span><span>T</span><span>A</span><span>C</span><span>K</span></div>' +
        '<p class="wordle-example-note"><b>S</b> is in the word and in the right spot.</p>' +
        '<div class="wordle-example"><span>Q</span><span class="present">U</span><span>E</span><span>U</span><span>E</span></div>' +
        '<p class="wordle-example-note"><b>U</b> is in the word but in the wrong spot.</p>' +
        '<div class="wordle-example"><span>F</span><span>L</span><span>O</span><span class="absent">A</span><span>T</span></div>' +
        '<p class="wordle-example-note"><b>A</b> is not in the word anywhere.</p>'
      );
    }
    if (kind === "result") {
      var won = state.status === "won";
      var n = state.guesses.length;
      return (
        '<h3 id="wordle-modal-title">' + (won ? "You got it!" : "Out of guesses") + '</h3>' +
        '<p class="modal-sub">' + (won ? "Solved in " + n + " of " + MAX_GUESSES + (state.hintUsed ? ", with a hint." : ".") : "Better luck tomorrow.") + '</p>' +
        answerHtml() +
        statsHtml(won ? n - 1 : -1) +
        footerHtml(true)
      );
    }
    // stats
    return (
      '<h3 id="wordle-modal-title">Statistics</h3>' +
      '<p class="modal-sub">Wordle #' + (day + 1) + (finished ? " is done for today." : " is still open.") + '</p>' +
      (finished ? answerHtml() : "") +
      statsHtml(state.status === "won" ? state.guesses.length - 1 : -1) +
      footerHtml(finished)
    );
  }

  function openModal(kind) {
    var modal = $("wordle-modal");
    var body = $("wordle-modal-body");
    if (!modal || !body) return;
    modalKind = kind;
    body.innerHTML = modalHtml(kind);
    modal.classList.toggle("is-lost", state.status === "lost");
    modal.classList.add("open");
    var share = $("wordle-share");
    if (share) share.addEventListener("click", shareResult);
    startCountdown();
    var close = $("wordle-modal-close");
    if (close) close.focus();
  }

  function closeModal() {
    var modal = $("wordle-modal");
    if (!modal) return;
    modal.classList.remove("open");
    modalKind = null;
    stopCountdown();
  }

  function startCountdown() {
    stopCountdown();
    countdownTimer = setInterval(function () {
      var el = $("wordle-countdown");
      if (el) el.textContent = fmtCountdown(msToMidnight());
    }, 1000);
  }
  function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  /* ===============================================================
     9. SHARE
  ================================================================*/

  function shareText() {
    var won = state.status === "won";
    var lines = state.guesses.map(function (g) {
      return evaluate(g, answer()).map(function (r) {
        return r === "correct" ? "🟩" : r === "present" ? "🟨" : "⬛";
      }).join("");
    });
    return "Codle Wordle #" + (day + 1) + " " + (won ? state.guesses.length : "X") + "/" + MAX_GUESSES +
      (state.hintUsed ? " 💡" : "") + "\n\n" + lines.join("\n");
  }

  function shareResult() {
    var text = shareText();
    function ok() { toast("Copied to clipboard", 1500); }
    function fail() { toast("Could not copy", 1500); }
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ text: text }).catch(function () { copyFallback(text, ok, fail); });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () { copyFallback(text, ok, fail); });
    } else {
      copyFallback(text, ok, fail);
    }
  }

  function copyFallback(text, ok, fail) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var done = false;
    try { done = document.execCommand("copy"); } catch (e) { done = false; }
    ta.remove();
    (done ? ok : fail)();
  }

  /* ===============================================================
     10. HUB <-> GAME
  ================================================================*/

  var hub = $("practice-hub");
  var game = $("game-wordle");

  function gameVisible() {
    var view = $("view-practice");
    return !!(game && !game.hidden && view && view.classList.contains("active"));
  }

  function showGame() {
    if (!hub || !game) return;
    checkDayRollover();
    hub.hidden = true;
    game.hidden = false;
    renderAll();
    window.scrollTo(0, 0);
    if (state.status !== "playing") setTimeout(function () { openModal("result"); }, 350);
  }

  function showHub() {
    if (!hub || !game) return;
    closeModal();
    game.hidden = true;
    hub.hidden = false;
    updateCardStatus();
    window.scrollTo(0, 0);
  }

  function updateCardStatus() {
    var el = $("wordle-card-status");
    if (!el) return;
    el.className = "";
    if (state.status === "won") {
      el.textContent = "Solved in " + state.guesses.length + "/" + MAX_GUESSES + " today";
      el.className = "is-done";
    } else if (state.status === "lost") {
      el.textContent = "Missed today's word";
      el.className = "is-lost";
    } else if (state.guesses.length) {
      el.textContent = "In progress · " + state.guesses.length + " of " + MAX_GUESSES + " used";
    } else {
      el.textContent = "Not played today";
    }
  }

  // If the clock passes midnight while the tab is open, swap in the new word.
  function checkDayRollover() {
    if (dayNumber(new Date()) === day) return;
    var wasOpen = gameVisible();
    closeModal();
    initPuzzle();
    renderAll();
    if (wasOpen) toast("A new word is ready", 1800);
  }

  /* ===============================================================
     11. EVENTS + INIT
  ================================================================*/

  function bind() {
    var card = $("card-wordle");
    if (card) card.addEventListener("click", showGame);
    var back = $("wordle-back");
    if (back) back.addEventListener("click", showHub);

    var hintBtn = $("wordle-hint-btn");
    if (hintBtn) hintBtn.addEventListener("click", useHint);
    var statsBtn = $("wordle-stats-btn");
    if (statsBtn) statsBtn.addEventListener("click", function () { openModal("stats"); });
    var helpBtn = $("wordle-help-btn");
    if (helpBtn) helpBtn.addEventListener("click", function () { openModal("help"); });

    var modal = $("wordle-modal");
    if (modal) {
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
      var close = $("wordle-modal-close");
      if (close) close.addEventListener("click", closeModal);
    }

    if (keyboard) {
      keyboard.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest(".wordle-key") : null;
        if (!btn) return;
        onKey(btn.dataset.key);
        btn.blur();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (modalKind) {
        if (e.key === "Escape") { e.preventDefault(); closeModal(); }
        return;
      }
      if (!gameVisible()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      if (e.key === "Enter") { e.preventDefault(); onKey("ENTER"); }
      else if (e.key === "Backspace") { e.preventDefault(); onKey("BACKSPACE"); }
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) checkDayRollover();
    });
    setInterval(checkDayRollover, 60 * 1000);
  }

  if (!ORDER.length || !board || !keyboard) return;
  initPuzzle();
  buildBoard();
  buildKeyboard();
  bind();
  renderAll();
})();
