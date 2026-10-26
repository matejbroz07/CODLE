/**
 * Codle — Curly, the mascot
 *
 * A pair of curly braces with big eyes that lives in a corner of every page
 * (like Duo in Duolingo, or a desktop pet). It watches the pointer, blinks,
 * falls asleep when nothing happens, reacts to what the user does and talks
 * in a glass speech bubble. Click it for help; drag it anywhere.
 *
 * Pages talk to it through window.CodleMascot:
 *
 *   CodleMascot.say("Nice work!", { mood: "happy", ms: 4000 })
 *   CodleMascot.say("<b>Tip:</b> …", { html: true })
 *   CodleMascot.tip("…", { key: "learn-intro" })   // automatic tip: once per session, muted by "Quiet"
 *   CodleMascot.mood("sad", 2000)                     // temporary mood, then back to idle
 *   CodleMascot.help(function () { return { text: "…", html: true, mood: "think" }; })
 *   CodleMascot.hide(); CodleMascot.show();
 *
 * Moods: idle, happy, sad, think, surprised, sleep.
 */
(function () {
  "use strict";

  var NAME = "Curly";
  var STORE_KEY = "codle.mascot";
  var SLEEP_AFTER = 120000;        // ms without activity before dozing off
  var DRAG_THRESHOLD = 6;          // px of movement that turns a click into a drag
  var EDGE = 18;                   // px from the screen edge after snapping
  var PUPIL_RANGE = 5;             // how far pupils travel (SVG units)

  var MOUTHS = {
    idle: "M52 80 Q60 86 68 80",
    happy: "M47 78 Q60 94 73 78",
    sad: "M52 85 Q60 78 68 85",
    think: "M56 82 H67",
    surprised: "",
    sleep: "M55 82 H65"
  };
  var PUPIL_BIAS = { think: [3, -4], sad: [0, 2] };

  var SVG =
    '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<clipPath id="mascot-lid-sad-l"><path d="M30 57 L62 46 L62 74 L30 74 Z"/></clipPath>' +
        '<clipPath id="mascot-lid-sad-r"><path d="M90 57 L58 46 L58 74 L90 74 Z"/></clipPath>' +
        '<clipPath id="mascot-lid-think"><path d="M30 53 L62 53 L62 74 L30 74 Z"/></clipPath>' +
        '<clipPath id="mascot-lid-think-r"><path d="M58 49 L90 49 L90 74 L58 74 Z"/></clipPath>' +
      '</defs>' +
      '<rect class="mascot-face" x="31" y="23" width="58" height="74" rx="24"/>' +
      '<path class="mascot-brace" d="M37 15 C27 15 24 21 24 29 V47 C24 54 20 57 13 60 C20 63 24 66 24 73 V91 C24 99 27 105 37 105"/>' +
      '<path class="mascot-brace" d="M83 15 C93 15 96 21 96 29 V47 C96 54 100 57 107 60 C100 63 96 66 96 73 V91 C96 99 93 105 83 105"/>' +
      '<g class="mascot-eye mascot-eye-l">' +
        '<g class="mascot-eye-open">' +
          '<circle class="mascot-sclera" cx="46" cy="57" r="13"/>' +
          '<g class="mascot-pupil"><circle cx="46" cy="57" r="6.5"/><circle class="mascot-glint" cx="43.4" cy="54.4" r="2.4"/></g>' +
        '</g>' +
        '<path class="mascot-eye-happy" d="M35 60 Q46 45 57 60"/>' +
      '</g>' +
      '<g class="mascot-eye mascot-eye-r">' +
        '<g class="mascot-eye-open">' +
          '<circle class="mascot-sclera" cx="74" cy="57" r="13"/>' +
          '<g class="mascot-pupil"><circle cx="74" cy="57" r="6.5"/><circle class="mascot-glint" cx="71.4" cy="54.4" r="2.4"/></g>' +
        '</g>' +
        '<path class="mascot-eye-happy" d="M63 60 Q74 45 85 60"/>' +
      '</g>' +
      '<path class="mascot-mouth" d="' + MOUTHS.idle + '"/>' +
      '<circle class="mascot-mouth-o" cx="60" cy="82" r="4.5"/>' +
      '<text class="mascot-zz" x="86" y="30">z</text>' +
      '<text class="mascot-zz" x="94" y="20">z</text>' +
    '</svg>';

  var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  /* ----- preferences (position, quiet) ----- */
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePrefs() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch (e) { /* private mode */ }
  }
  function seen(key) {
    try { return sessionStorage.getItem(STORE_KEY + ".seen." + key) === "1"; } catch (e) { return false; }
  }
  function markSeen(key) {
    try { sessionStorage.setItem(STORE_KEY + ".seen." + key, "1"); } catch (e) { /* ignore */ }
  }
  var prefs = loadPrefs();

  /* ----- DOM ----- */
  var root = document.createElement("div");
  root.className = "mascot";
  root.id = "codle-mascot";
  root.dataset.mood = "idle";
  root.dataset.side = prefs.side === "left" ? "left" : "right";
  if (typeof prefs.bottom === "number") root.style.setProperty("--mascot-bottom", prefs.bottom + "px");
  root.innerHTML =
    '<div class="mascot-bubble liquid-glass" role="status" aria-live="polite">' +
      '<button class="mascot-bubble-close" type="button" aria-label="Close">' + CLOSE_SVG + '</button>' +
      '<div class="mascot-bubble-text"></div>' +
      '<div class="mascot-bubble-foot"><button class="mascot-link" type="button" data-action="quiet"></button></div>' +
    '</div>' +
    '<button class="mascot-body" type="button" aria-label="' + NAME + ', your guide. Click for help.">' + SVG + '</button>';

  var body = root.querySelector(".mascot-body");
  var bubble = root.querySelector(".mascot-bubble");
  var bubbleText = root.querySelector(".mascot-bubble-text");
  var quietBtn = root.querySelector('[data-action="quiet"]');
  var mouth = root.querySelector(".mascot-mouth");
  var pupils = root.querySelectorAll(".mascot-pupil");

  /* ----- moods ----- */
  var mood = "idle";
  var moodTimer = null;
  function setMood(name, ms) {
    if (!MOUTHS.hasOwnProperty(name)) name = "idle";
    clearTimeout(moodTimer);
    mood = name;
    root.dataset.mood = name;
    mouth.setAttribute("d", MOUTHS[name] || MOUTHS.idle);
    movePupils();
    if (ms) moodTimer = setTimeout(function () { setMood("idle"); }, ms);
  }

  /* ----- eyes follow the pointer ----- */
  var look = [0, 0];
  var lookTimer = null;
  function movePupils() {
    var bias = PUPIL_BIAS[mood] || [0, 0];
    var t = "translate(" + (look[0] + bias[0]) + "px, " + (look[1] + bias[1]) + "px)";
    for (var i = 0; i < pupils.length; i++) pupils[i].style.transform = t;
  }
  function lookAt(x, y) {
    var r = body.getBoundingClientRect();
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    var d = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, d / 160) * PUPIL_RANGE;
    look = [dx / d * k, dy / d * k];
    movePupils();
  }
  var lookQueued = false, lastPointer = null;
  function onPointer(e) {
    lastPointer = [e.clientX, e.clientY];
    if (lookQueued) return;
    lookQueued = true;
    requestAnimationFrame(function () {
      lookQueued = false;
      if (lastPointer) lookAt(lastPointer[0], lastPointer[1]);
    });
  }
  document.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerdown", function (e) {
    onPointer(e);
    if (e.pointerType === "touch") {
      // a tap: glance at it, then recentre
      clearTimeout(lookTimer);
      lookTimer = setTimeout(function () { look = [0, 0]; movePupils(); }, 900);
    }
  }, { passive: true });
  document.addEventListener("pointerleave", function () { look = [0, 0]; movePupils(); });

  /* ----- blinking ----- */
  var blinkTimer = null;
  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(blink, 2600 + Math.random() * 3800);
  }
  function blink() {
    if (!document.hidden && mood !== "sleep" && mood !== "happy") {
      root.classList.add("is-blinking");
      setTimeout(function () {
        root.classList.remove("is-blinking");
        if (Math.random() < .2) setTimeout(function () { // a double blink now and then
          root.classList.add("is-blinking");
          setTimeout(function () { root.classList.remove("is-blinking"); }, 120);
        }, 180);
      }, 130);
    }
    scheduleBlink();
  }

  /* ----- dozing off ----- */
  var sleepTimer = null;
  function armSleep() {
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(function () { if (mood === "idle" && !root.classList.contains("bubble-open")) setMood("sleep"); }, SLEEP_AFTER);
  }
  function wake() {
    if (mood === "sleep") { setMood("surprised", 900); }
    armSleep();
  }
  ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, wake, { passive: true });
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) wake(); });

  /* ----- speech bubble ----- */
  var hideTimer = null;
  function placeBubble() {
    var r = body.getBoundingClientRect();
    root.classList.toggle("bubble-below", r.top < 220);
  }
  function show(content, opts) {
    opts = opts || {};
    if (opts.html) bubbleText.innerHTML = content; else bubbleText.textContent = content;
    placeBubble();
    root.classList.add("bubble-open");
    clearTimeout(hideTimer);
    var ms = opts.ms === undefined ? Math.min(9000, 2600 + content.replace(/<[^>]+>/g, "").length * 45) : opts.ms;
    if (ms > 0) hideTimer = setTimeout(hideBubble, ms);
    if (opts.mood) setMood(opts.mood, opts.moodMs === undefined ? Math.max(1800, Math.min(ms || 3200, 4000)) : opts.moodMs);
    armSleep();
  }
  function hideBubble() {
    clearTimeout(hideTimer);
    root.classList.remove("bubble-open");
  }
  function say(content, opts) {
    if (root.classList.contains("is-hidden")) return;
    show(content, opts);
  }
  /** An automatic tip: shown once per session per key, and never when tips are muted. */
  function tip(content, opts) {
    opts = opts || {};
    if (prefs.quiet) return;
    if (opts.key) { if (seen(opts.key)) return; markSeen(opts.key); }
    say(content, opts);
  }

  var helpFn = null;
  function showHelp() {
    var h = helpFn ? helpFn() : null;
    if (typeof h === "string") h = { text: h };
    if (!h) h = { text: "I'm " + NAME + ". I'll point out what to do next, cheer when you get things right, and help when you're stuck.", mood: "happy" };
    show(h.text, { html: !!h.html, mood: h.mood || "think", ms: h.ms === undefined ? 0 : h.ms });
  }
  function renderQuiet() { quietBtn.textContent = prefs.quiet ? "Tips: off" : "Tips: on"; }
  quietBtn.addEventListener("click", function () {
    prefs.quiet = !prefs.quiet;
    savePrefs();
    renderQuiet();
    show(prefs.quiet ? "Got it, I'll keep quiet. Click me whenever you need help." : "Tips are back on.", { mood: prefs.quiet ? "sad" : "happy", ms: 2600 });
  });
  renderQuiet();
  root.querySelector(".mascot-bubble-close").addEventListener("click", hideBubble);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideBubble(); });

  /* ----- drag anywhere, snap to an edge; a short press is a click ----- */
  var drag = null;
  body.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    var r = root.getBoundingClientRect();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false };
    body.setPointerCapture(e.pointerId);
  });
  body.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return;
    if (!drag.moved) { drag.moved = true; root.classList.add("is-dragging"); hideBubble(); }
    var w = root.offsetWidth, h = root.offsetHeight;
    var left = Math.min(window.innerWidth - w, Math.max(0, e.clientX - drag.ox));
    var top = Math.min(window.innerHeight - h, Math.max(0, e.clientY - drag.oy));
    root.style.left = left + "px";
    root.style.right = "auto";
    root.style.top = top + "px";
    root.style.bottom = "auto";
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var wasDrag = drag.moved;
    drag = null;
    if (!wasDrag) { // a click
      if (root.classList.contains("bubble-open")) hideBubble(); else showHelp();
      return;
    }
    var r = root.getBoundingClientRect();
    var side = r.left + r.width / 2 < window.innerWidth / 2 ? "left" : "right";
    var bottom = Math.round(Math.max(EDGE, Math.min(window.innerHeight - r.height - EDGE, window.innerHeight - r.bottom)));
    root.style.left = root.style.right = root.style.top = root.style.bottom = "";
    root.dataset.side = side;
    root.style.setProperty("--mascot-bottom", bottom + "px");
    prefs.side = side;
    prefs.bottom = bottom;
    savePrefs();
    root.classList.remove("is-dragging");
  }
  body.addEventListener("pointerup", endDrag);
  body.addEventListener("pointercancel", endDrag);
  body.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (root.classList.contains("bubble-open")) hideBubble(); else showHelp(); }
  });

  /* ----- mount ----- */
  function mount() {
    document.body.appendChild(root);
    scheduleBlink();
    armSleep();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  window.CodleMascot = {
    name: NAME,
    say: say,
    tip: tip,
    mood: setMood,
    help: function (fn) { helpFn = fn; },
    hide: function () { hideBubble(); root.classList.add("is-hidden"); },
    show: function () { root.classList.remove("is-hidden"); },
    close: hideBubble,
    isQuiet: function () { return !!prefs.quiet; }
  };
})();
