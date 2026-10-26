/**
 * Codle — history practice games
 *
 * Older or Younger: two moments from computing history; guess whether the
 *   second came before or after the first. Endless, best streak is saved.
 * Daily Story: one short story per day with a multiple-choice question.
 *   Same story for everyone on a given day (seeded order, like Wordle).
 *
 * Online (js/api.js, logged in): cards and today's story come from the API,
 * runs and answers are saved there (XP, best streak, story streak), and the
 * right answer to the story is only revealed by the server after answering.
 * Offline demo: content from js/history-data.js, progress in localStorage.
 */
(function () {
  "use strict";

  var H = window.CodleHistory;
  if (!H || !document.getElementById("game-older")) return;

  function $(id) { return document.getElementById(id); }
  var api = window.CodleApi;
  var remote = false; // true = the API holds the data (see header)
  function rewarded(res) { if (res && res.reward && window.CodleApp) window.CodleApp.refreshUser(); }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function calm() { return reduceMotion || !!(window.CodlePerf && window.CodlePerf.lite); }

  function load(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  // Same seeded RNG as the Wordle so daily content is identical for everyone.
  function mulberry32(seed) {
    var a = seed | 0;
    return function () {
      a = (a + 0x6D2A79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(list, seed) {
    var out = list.slice(), rnd = mulberry32(seed);
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  var LAUNCH = new Date(2026, 9, 13); // shared with the Wordle: story #1 is 13 Oct 2026
  function dayNumber(d) {
    var mid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((mid - LAUNCH) / 864e5);
  }

  var ICON = {
    lang: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
    hw: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    sw: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M7 9l3 2-3 2M12 13h4"/>',
    event: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 13.5h.01"/>'
  };
  var CAT_LABEL = { lang: "Language", hw: "Hardware", web: "Internet", sw: "Software", event: "Milestone", game: "Game" };
  function catChip(cat) {
    return '<span class="oy-cat" data-cat="' + cat + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICON[cat] + "</svg>" + CAT_LABEL[cat] + "</span>";
  }

  /* ===============================================================
     1. HUB NAVIGATION
  ================================================================*/

  var hub = $("practice-hub");
  var sections = { older: $("game-older"), story: $("game-story") };

  function openGame(name) {
    hub.hidden = true;
    document.querySelectorAll(".practice-game").forEach(function (s) { s.hidden = s !== sections[name]; });
    window.scrollTo(0, 0);
    if (name === "older") startOlder();
    else renderStory();
  }
  function backToHub() {
    document.querySelectorAll(".practice-game").forEach(function (s) { s.hidden = true; });
    hub.hidden = false;
    stopCountdown();
    updateHubCards();
    window.scrollTo(0, 0);
  }
  $("card-older").addEventListener("click", function () { openGame("older"); });
  $("card-story").addEventListener("click", function () { openGame("story"); });
  Object.keys(sections).forEach(function (k) {
    sections[k].querySelectorAll("[data-back]").forEach(function (b) { b.addEventListener("click", backToHub); });
  });
  function visible(name) {
    var view = $("view-practice");
    return !sections[name].hidden && view && view.classList.contains("active");
  }

  /* ===============================================================
     2. OLDER OR YOUNGER
  ================================================================*/

  var OY_BEST_KEY = "codle.history.older.best";
  var oy = { a: null, b: null, score: 0, best: +load(OY_BEST_KEY, 0) || 0, used: [], locked: false };
  var elA = $("oy-a"), elB = $("oy-b");

  // Early rounds use pairs far apart in time; the gap shrinks as the streak grows.
  function pickNext(ref) {
    var minGap = Math.max(1, 25 - oy.score * 3);
    function free(c) { return c !== ref && c.year !== ref.year && oy.used.indexOf(c) < 0; }
    var pool = H.cards.filter(function (c) { return free(c) && Math.abs(c.year - ref.year) >= minGap; });
    if (!pool.length) pool = H.cards.filter(free);
    if (!pool.length) {
      oy.used = [ref];
      pool = H.cards.filter(free);
    }
    var next = pool[Math.floor(Math.random() * pool.length)];
    oy.used.push(next);
    return next;
  }

  function knownHtml(c) {
    return catChip(c.cat) +
      '<h3 class="oy-name">' + esc(c.name) + "</h3>" +
      '<div class="oy-year">' + c.year + "</div>" +
      '<p class="oy-fact">' + esc(c.fact) + "</p>";
  }
  function questionHtml(c, ref) {
    return catChip(c.cat) +
      '<h3 class="oy-name">' + esc(c.name) + "</h3>" +
      '<div class="oy-year oy-year-hidden" aria-label="Year hidden">?</div>' +
      '<p class="oy-ask">Older or younger than <b>' + esc(ref.name) + "</b>?</p>" +
      '<div class="oy-actions">' +
        '<button class="oy-btn" type="button" data-guess="older"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>Older<small>before ' + ref.year + "</small></button>" +
        '<button class="oy-btn" type="button" data-guess="younger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Younger<small>after ' + ref.year + "</small></button>" +
      "</div>";
  }

  function renderOY(enter) {
    elA.className = "oy-card liquid-glass";
    elA.dataset.cat = oy.a.cat;
    elA.innerHTML = knownHtml(oy.a);
    elB.className = "oy-card liquid-glass is-question";
    elB.dataset.cat = oy.b.cat;
    elB.innerHTML = questionHtml(oy.b, oy.a);
    if (enter && !calm()) {
      [elA, elB].forEach(function (el) { el.classList.add("enter"); });
    }
    $("oy-score").textContent = oy.score;
    $("oy-best").textContent = oy.best;
    oy.locked = false;
  }

  function startOlder() {
    oy.score = 0;
    oy.used = [];
    oy.a = H.cards[Math.floor(Math.random() * H.cards.length)];
    oy.used.push(oy.a);
    oy.b = pickNext(oy.a);
    $("oy-over").hidden = true;
    renderOY(true);
  }

  function countUp(el, from, to, done) {
    if (calm()) { el.textContent = to; done(); return; }
    var start = performance.now(), dur = 650;
    function tick(t) {
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick); else done();
    }
    requestAnimationFrame(tick);
  }

  function guess(which) {
    if (oy.locked) return;
    oy.locked = true;
    var correct = which === "older" ? oy.b.year < oy.a.year : oy.b.year > oy.a.year;
    elB.querySelectorAll(".oy-btn").forEach(function (btn) {
      btn.disabled = true;
      if (btn.dataset.guess === which) btn.classList.add("chosen");
    });
    var yearEl = elB.querySelector(".oy-year");
    yearEl.classList.remove("oy-year-hidden");
    yearEl.removeAttribute("aria-label");
    countUp(yearEl, oy.a.year, oy.b.year, function () {
      elB.classList.remove("is-question");
      elB.classList.add(correct ? "is-correct" : "is-wrong");
      var ask = elB.querySelector(".oy-ask");
      if (ask) {
        ask.outerHTML = '<p class="oy-fact">' + esc(oy.b.fact) + "</p>";
      }
      if (correct) {
        oy.score++;
        if (oy.score > oy.best) { oy.best = oy.score; if (!remote) save(OY_BEST_KEY, oy.best); }
        $("oy-score").textContent = oy.score;
        $("oy-best").textContent = oy.best;
        setTimeout(function () {
          oy.a = oy.b;
          oy.b = pickNext(oy.a);
          renderOY(true);
        }, calm() ? 900 : 1500);
      } else {
        setTimeout(showOver, calm() ? 600 : 1100);
      }
    });
  }

  function showOver() {
    if (remote) {
      api.post("history/older", { score: oy.score }).then(function (res) {
        oy.best = Math.max(oy.best, res.best);
        $("oy-best").textContent = oy.best;
        if (res.reward) toastXp(res.reward.xpGained);
        rewarded(res);
      }, function () { /* the run still counts locally on this page */ });
    }
    var newBest = oy.score > 0 && oy.score === oy.best;
    $("oy-over-title").textContent = oy.score === 0 ? "Not this time" : "Streak over";
    $("oy-over-score").innerHTML = "You got <b>" + oy.score + "</b> in a row." + (newBest ? " That's a new best!" : " Best: " + oy.best + ".");
    var older = oy.a.year < oy.b.year ? oy.a : oy.b, younger = older === oy.a ? oy.b : oy.a;
    $("oy-over-facts").innerHTML =
      "<p><b>" + esc(older.name) + "</b> (" + older.year + ") came before <b>" + esc(younger.name) + "</b> (" + younger.year + ").</p>" +
      '<p class="oy-sources"><a href="' + esc(older.src) + '" target="_blank" rel="noopener noreferrer">' + esc(older.name) + '</a> · <a href="' + esc(younger.src) + '" target="_blank" rel="noopener noreferrer">' + esc(younger.name) + "</a></p>";
    $("oy-over").hidden = false;
    $("oy-again").focus({ preventScroll: true });
    $("oy-over").scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });
  }

  elB.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-guess]") : null;
    if (btn) guess(btn.dataset.guess);
  });
  $("oy-again").addEventListener("click", startOlder);

  /* ===============================================================
     3. DAILY STORY
  ================================================================*/

  var STORY_STATE_KEY = "codle.history.story.state";
  var STORY_STATS_KEY = "codle.history.story.stats";
  var STORY_ORDER = shuffled(H.stories, 19470909);
  var LETTERS = ["A", "B", "C", "D"];

  var story = { day: 0, item: null, options: [], state: null, stats: null };

  function initStory() {
    var today = new Date();
    story.day = dayNumber(today);
    var L = STORY_ORDER.length;
    story.item = STORY_ORDER[((story.day % L) + L) % L];
    // Answer order is shuffled per day, but the same for everyone that day.
    story.options = shuffled(story.item.options.map(function (_, i) { return i; }), 7919 + story.day);
    story.state = load(STORY_STATE_KEY, null);
    if (!story.state || story.state.day !== story.day) story.state = { day: story.day, picked: null };
    story.stats = load(STORY_STATS_KEY, { played: 0, correct: 0, streak: 0, best: 0, lastCorrectDay: null });
    // A day without a correct answer breaks the streak.
    if (story.stats.lastCorrectDay !== null && story.day - story.stats.lastCorrectDay > 1 && story.stats.streak) {
      story.stats.streak = 0;
      save(STORY_STATS_KEY, story.stats);
    }
  }

  /* Online: the server's story of the day (options as {id, text}, answer revealed after picking) */
  var rs = null;

  function loadStory() {
    return api.get("history/story").then(function (res) { rs = res; });
  }

  function renderStoryRemote() {
    if (!rs.available) {
      $("story-title").textContent = "No story today";
      $("story-text").textContent = "Come back tomorrow.";
      $("story-question").textContent = "";
      $("story-options").innerHTML = "";
      $("story-result").hidden = true;
      return;
    }
    var answered = rs.picked !== null;
    $("story-number").textContent = "#" + rs.number;
    $("story-year").textContent = rs.year;
    $("story-date").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    $("story-title").textContent = rs.title;
    $("story-text").textContent = rs.text;
    $("story-question").textContent = rs.question;
    $("story-options").innerHTML = rs.options.map(function (o, i) {
      var cls = "story-option";
      if (answered) {
        if (o.id === rs.correctId) cls += " is-correct";
        else if (o.id === rs.picked) cls += " is-wrong";
        else cls += " is-dim";
      }
      return '<button class="' + cls + '" type="button" data-i="' + o.id + '"' + (answered ? " disabled" : "") + ">" +
        '<span class="story-letter" aria-hidden="true">' + LETTERS[i] + "</span><span>" + esc(o.text) + "</span></button>";
    }).join("");
    $("story-streak").textContent = rs.stats.streak + " day streak";
    $("story-streak").classList.toggle("is-on", rs.stats.streak > 0);

    var result = $("story-result");
    result.hidden = !answered;
    if (answered) {
      var right = rs.picked === rs.correctId;
      var correct = rs.options.filter(function (o) { return o.id === rs.correctId; })[0];
      $("story-verdict").textContent = right ? "Correct!" : "Not quite. The answer is: " + (correct ? correct.text : "") + ".";
      $("story-verdict").className = "story-verdict " + (right ? "is-correct" : "is-wrong");
      $("story-why").textContent = rs.why;
      $("story-source").href = rs.source;
      startCountdown();
    } else {
      stopCountdown();
    }
  }

  var answering = false;
  function answerStoryRemote(optionId) {
    if (answering || rs.picked !== null) return;
    answering = true;
    api.post("history/story", { optionId: optionId }).then(function (res) {
      answering = false;
      rs = res;
      renderStoryRemote();
      if (res.reward) toastXp(res.reward.xpGained);
      rewarded(res);
      var el = $("story-result");
      if (!calm()) el.classList.add("enter");
      el.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });
    }, function (err) {
      answering = false;
      if (window.CodleApp) window.CodleApp.toast(err.message);
      if (err.code === "already_answered") loadStory().then(renderStoryRemote);
    });
  }

  function toastXp(xp) {
    if (xp && window.CodleApp) window.CodleApp.toast("+" + xp + " XP");
  }

  function renderStory() {
    if (remote) { renderStoryRemote(); return; }
    if (dayNumber(new Date()) !== story.day) initStory();
    var it = story.item, answered = story.state.picked !== null;
    $("story-number").textContent = "#" + (story.day + 1);
    $("story-year").textContent = it.year;
    $("story-date").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    $("story-title").textContent = it.title;
    $("story-text").textContent = it.text;
    $("story-question").textContent = it.q;
    $("story-options").innerHTML = story.options.map(function (orig, i) {
      var cls = "story-option";
      if (answered) {
        if (orig === it.answer) cls += " is-correct";
        else if (orig === story.state.picked) cls += " is-wrong";
        else cls += " is-dim";
      }
      return '<button class="' + cls + '" type="button" data-i="' + orig + '"' + (answered ? " disabled" : "") + ">" +
        '<span class="story-letter" aria-hidden="true">' + LETTERS[i] + "</span><span>" + esc(it.options[orig]) + "</span></button>";
    }).join("");
    renderStreak();

    var result = $("story-result");
    result.hidden = !answered;
    if (answered) {
      var right = story.state.picked === it.answer;
      $("story-verdict").textContent = right ? "Correct!" : "Not quite. The answer is: " + it.options[it.answer] + ".";
      $("story-verdict").className = "story-verdict " + (right ? "is-correct" : "is-wrong");
      $("story-why").textContent = it.why;
      $("story-source").href = it.src;
      startCountdown();
    } else {
      stopCountdown();
    }
  }

  function renderStreak() {
    var n = story.stats.streak;
    $("story-streak").textContent = n + " day streak";
    $("story-streak").classList.toggle("is-on", n > 0);
  }

  function answerStory(orig) {
    if (story.state.picked !== null) return;
    story.state.picked = orig;
    save(STORY_STATE_KEY, story.state);
    var right = orig === story.item.answer;
    var s = story.stats;
    s.played++;
    if (right) {
      s.correct++;
      s.streak = s.lastCorrectDay === story.day - 1 ? s.streak + 1 : 1;
      s.best = Math.max(s.best, s.streak);
      s.lastCorrectDay = story.day;
    } else {
      s.streak = 0;
    }
    save(STORY_STATS_KEY, s);
    renderStory();
    var res = $("story-result");
    if (!calm()) res.classList.add("enter");
    res.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });
  }

  $("story-options").addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-i]") : null;
    if (!btn || btn.disabled) return;
    if (remote) answerStoryRemote(+btn.dataset.i);
    else answerStory(+btn.dataset.i);
  });

  var countdownTimer = null;
  function fmt(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x;
  }
  function tickCountdown() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    $("story-countdown").textContent = fmt(next - now);
    if (dayNumber(now) !== story.day && visible("story")) {
      if (remote) { story.day = dayNumber(now); loadStory().then(renderStoryRemote); }
      else { initStory(); renderStory(); }
    }
  }
  function startCountdown() {
    tickCountdown();
    if (!countdownTimer) countdownTimer = setInterval(tickCountdown, 1000);
  }
  function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  /* ===============================================================
     4. HUB CARD STATUS + KEYBOARD
  ================================================================*/

  function updateHubCards() {
    $("older-card-status").textContent = "Best streak: " + oy.best;
    var el = $("story-card-status");
    el.className = "";
    if (remote) {
      if (!rs || !rs.available) el.textContent = "No story today";
      else if (rs.picked === null) el.textContent = "New story today";
      else if (rs.picked === rs.correctId) { el.textContent = "Answered correctly today"; el.className = "is-done"; }
      else { el.textContent = "Answered today"; el.className = "is-lost"; }
      return;
    }
    if (dayNumber(new Date()) !== story.day) initStory();
    if (story.state.picked === null) el.textContent = "New story today";
    else if (story.state.picked === story.item.answer) { el.textContent = "Answered correctly today"; el.className = "is-done"; }
    else { el.textContent = "Answered today"; el.className = "is-lost"; }
  }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (visible("older")) {
      if (!$("oy-over").hidden) {
        if (e.key === "Enter" && document.activeElement !== $("oy-again")) { e.preventDefault(); startOlder(); }
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); guess("older"); }
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); guess("younger"); }
    } else if (visible("story") && (remote ? rs && rs.available && rs.picked === null : story.state.picked === null)) {
      var i = ["a", "b", "c", "d"].indexOf(e.key.toLowerCase());
      if (i < 0) i = ["1", "2", "3", "4"].indexOf(e.key);
      if (remote) { if (i >= 0 && i < rs.options.length) answerStoryRemote(rs.options[i].id); }
      else if (i >= 0 && i < story.options.length) answerStory(story.options[i]);
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (dayNumber(new Date()) !== story.day) {
      if (remote) {
        story.day = dayNumber(new Date());
        loadStory().then(function () { if (visible("story")) renderStory(); updateHubCards(); });
        return;
      }
      initStory();
      if (visible("story")) renderStory();
      updateHubCards();
    }
  });

  initStory();
  updateHubCards();
  $("oy-best").textContent = oy.best;

  (api ? api.ready : Promise.resolve({ online: false })).then(function (s) {
    if (!s.online || !s.user) return;
    Promise.all([api.get("history/cards"), loadStory()]).then(function (res) {
      if (res[0].cards.length > 1) H.cards = res[0].cards;
      oy.best = res[0].best;
      remote = true;
      updateHubCards();
      $("oy-best").textContent = oy.best;
    }, function () { /* keep the offline content */ });
  });
})();
