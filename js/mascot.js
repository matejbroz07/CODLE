/**
 * Codle — Curly, the mascot
 *
 * A slim pair of curly braces made of white Liquid Glass, with big eyes
 * between them, that lives in a corner of every page
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
 *   CodleMascot.hide(); CodleMascot.show()       // remove / restore entirely
 *   CodleMascot.dock(); CodleMascot.undock()     // slide away to the screen edge, a sliver stays tappable
 *
 * Staying out of the way: "Hide me" in the bubble (or shoving it past a screen edge) docks it
 * until it is tapped again. It also ducks to the edge by itself when it would cover something
 * clickable, and on phones while you type or scroll down. A sliver with one eye always stays
 * on screen; tapping it brings the mascot back, and messages that arrived meanwhile wait
 * behind a "…" badge on that sliver.
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
  var DOCK_RATIO = .4;             // shove this much of the figure past the screen edge to dock it
  var PHONE = 768;                 // px; below this the mascot tucks itself away while you type or scroll
  var PUPIL_RANGE = 5;             // how far pupils travel (SVG units)
  var TILT = 11;                   // max degrees the body turns toward the pointer

  // all mouths share one shape (M … Q …) so the browser can morph between them
  var MOUTHS = {
    idle: "M51 78 Q60 88 69 78",
    happy: "M46 76 Q60 96 74 76",
    sad: "M52 86 Q60 77 68 86",
    think: "M55 82 Q60.5 82 66 82",
    surprised: "M57 80 Q60 80 63 80",
    sleep: "M55 82 Q60 82 65 82"
  };
  var PUPIL_BIAS = { think: [3, -4], sad: [0, 2] };

  var BRACE_L = "M41 14 C30 14 27 21 27 30 V47 C27 54 23 57 15 60 C23 63 27 66 27 73 V90 C27 99 30 106 41 106";
  var BRACE_R = "M79 14 C90 14 93 21 93 30 V47 C93 54 97 57 105 60 C97 63 93 66 93 73 V90 C93 99 90 106 79 106";

  var SVG =
    '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<defs>' +
        // the braces are slim tubes of white glass, lit from the top-left
        '<linearGradient id="mascot-g-tube" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#fff" stop-opacity=".95"/>' +
          '<stop offset=".45" stop-color="#eef3fa" stop-opacity=".7"/>' +
          '<stop offset="1" stop-color="#aebdd4" stop-opacity=".85"/>' +
        '</linearGradient>' +
        '<radialGradient id="mascot-g-sclera" cx="38%" cy="30%" r="75%">' +
          '<stop offset="0" stop-color="#fff"/>' +
          '<stop offset=".72" stop-color="#f4f8fd"/>' +
          '<stop offset="1" stop-color="#b9c9df"/>' +
        '</radialGradient>' +
        '<radialGradient id="mascot-g-iris" cx="40%" cy="35%" r="70%">' +
          '<stop offset="0" stop-color="#3b4859"/>' +
          '<stop offset=".6" stop-color="#121922"/>' +
          '<stop offset="1" stop-color="#04060a"/>' +
        '</radialGradient>' +
        '<filter id="mascot-f-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '</defs>' +
      // braces (the real blur comes from the .mascot-glass div underneath, masked to the same paths)
      '<g class="mascot-brace mascot-brace-l">' +
        '<path class="mascot-tube" d="' + BRACE_L + '"/>' +
        '<path class="mascot-tube-shine" d="' + BRACE_L + '"/>' +
      '</g>' +
      '<g class="mascot-brace mascot-brace-r">' +
        '<path class="mascot-tube" d="' + BRACE_R + '"/>' +
        '<path class="mascot-tube-shine" d="' + BRACE_R + '"/>' +
      '</g>' +
      // eyes sit on the braces; eyelids are a clip-path polygon that animates
      '<g class="mascot-eye mascot-eye-l">' +
        '<g class="mascot-eye-open">' +
          '<circle class="mascot-socket" cx="41" cy="55.5" r="12.5"/>' +
          '<circle class="mascot-sclera" cx="41" cy="54" r="12"/>' +
          '<g class="mascot-pupil"><g class="mascot-iris">' +
            '<circle cx="41" cy="54" r="6.5"/>' +
            '<circle class="mascot-glint" cx="38.5" cy="51.2" r="2.6"/>' +
            '<circle class="mascot-glint mascot-glint-sm" cx="44.2" cy="57.2" r="1.2"/>' +
          '</g></g>' +
        '</g>' +
        '<path class="mascot-eye-happy" d="M31 56 Q41 42 51 56"/>' +
      '</g>' +
      '<g class="mascot-eye mascot-eye-r">' +
        '<g class="mascot-eye-open">' +
          '<circle class="mascot-socket" cx="79" cy="55.5" r="12.5"/>' +
          '<circle class="mascot-sclera" cx="79" cy="54" r="12"/>' +
          '<g class="mascot-pupil"><g class="mascot-iris">' +
            '<circle cx="79" cy="54" r="6.5"/>' +
            '<circle class="mascot-glint" cx="76.5" cy="51.2" r="2.6"/>' +
            '<circle class="mascot-glint mascot-glint-sm" cx="82.2" cy="57.2" r="1.2"/>' +
          '</g></g>' +
        '</g>' +
        '<path class="mascot-eye-happy" d="M69 56 Q79 42 89 56"/>' +
      '</g>' +
      '<path class="mascot-mouth" d="' + MOUTHS.idle + '"/>' +
      '<circle class="mascot-mouth-o" cx="60" cy="82" r="4.5"/>' +
      '<text class="mascot-zz" x="88" y="26">z</text>' +
      '<text class="mascot-zz" x="97" y="15">z</text>' +
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
  if (prefs.docked) root.classList.add("is-docked");
  root.innerHTML =
    '<div class="mascot-bubble" role="status" aria-live="polite">' +
      '<i class="mascot-bubble-sheen" aria-hidden="true"></i>' +
      '<svg class="mascot-bubble-tail" viewBox="0 0 26 18" aria-hidden="true" focusable="false"><path d="M1 0 C8 7 13 12 19 17.5 C17 11 18.5 5 25 0 Z"/></svg>' +
      '<button class="mascot-bubble-close" type="button" aria-label="Close">' + CLOSE_SVG + '</button>' +
      '<div class="mascot-bubble-name" aria-hidden="true">' + NAME + '</div>' +
      '<div class="mascot-bubble-text"></div>' +
      '<div class="mascot-bubble-foot">' +
        '<button class="mascot-link" type="button" data-action="quiet"></button>' +
        '<button class="mascot-link" type="button" data-action="hide">Hide me</button>' +
      '</div>' +
    '</div>' +
    '<button class="mascot-body" type="button" aria-label="' + NAME + ', your guide. Click for help.">' +
      '<span class="mascot-figure"><span class="mascot-glass"><span class="mascot-glass-l"></span><span class="mascot-glass-r"></span></span>' + SVG + '</span>' +
      '<span class="mascot-badge" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '</button>';

  var body = root.querySelector(".mascot-body");
  var bubble = root.querySelector(".mascot-bubble");
  var bubbleText = root.querySelector(".mascot-bubble-text");
  var quietBtn = root.querySelector('[data-action="quiet"]');
  var hideBtn = root.querySelector('[data-action="hide"]');
  var mouth = root.querySelector(".mascot-mouth");
  var pupils = root.querySelectorAll(".mascot-pupil");

  /* ----- moods ----- */
  function setMouth(d) {
    mouth.setAttribute("d", d);
    try { mouth.style.d = 'path("' + d + '")'; } catch (e) { /* no CSS `d`: the attribute already did it */ }
  }
  var mood = "idle";
  var moodTimer = null;
  function setMood(name, ms) {
    if (!MOUTHS.hasOwnProperty(name)) name = "idle";
    clearTimeout(moodTimer);
    mood = name;
    root.dataset.mood = name;
    setMouth(MOUTHS[name] || MOUTHS.idle);
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
    // 3D: the whole figure turns toward the pointer
    var nx = look[0] / PUPIL_RANGE, ny = look[1] / PUPIL_RANGE;
    root.style.setProperty("--tilt-x", (-ny * TILT).toFixed(2) + "deg");
    root.style.setProperty("--tilt-y", (nx * TILT * 1.2).toFixed(2) + "deg");
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
  var hideTimer = null, talkTimer = null;
  var current = null;   // the message on screen: { content, opts, until }
  var pending = null;   // a message that arrived while the mascot was out of the way
  var openedAt = 0;
  function calm() {
    return document.documentElement.classList.contains("lite") ||
      !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function bubbleOpen() { return root.classList.contains("bubble-open"); }
  function placeBubble() {
    var r = body.getBoundingClientRect();
    root.classList.toggle("bubble-below", r.top < 220);
  }
  /** Wraps each word in a span with a staggered delay so the text writes itself in.
      A <pre> block counts as one unit. Returns how long the whole cascade takes (ms). */
  function cascade(el) {
    if (calm()) return 0;
    var texts = [], units = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (t) {
      var pre = t.parentNode.closest("pre");
      if (pre && el.contains(pre)) {
        if (!pre.classList.contains("mascot-word")) { pre.classList.add("mascot-word"); units.push(pre); }
        return;
      }
      if (!t.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (!p.trim()) { frag.appendChild(document.createTextNode(p)); return; }
        var s = document.createElement("span");
        s.className = "mascot-word";
        s.textContent = p;
        frag.appendChild(s);
        units.push(s);
      });
      t.parentNode.replaceChild(frag, t);
    });
    if (!units.length) return 0;
    var step = Math.min(38, 1100 / units.length);
    units.forEach(function (u, i) { u.style.animationDelay = Math.round(160 + i * step) + "ms"; });
    return Math.round(160 + units.length * step + 200);
  }
  function show(content, opts) {
    opts = opts || {};
    pending = null;
    if (opts.html) bubbleText.innerHTML = content; else bubbleText.textContent = content;
    placeBubble();
    root.classList.remove("bubble-open");
    void bubble.offsetWidth; // restart the pop when a new message replaces an open one
    root.classList.add("bubble-open");
    openedAt = Date.now();
    var talk = cascade(bubbleText);
    clearTimeout(talkTimer);
    root.classList.toggle("is-talking", talk > 0);
    if (talk) talkTimer = setTimeout(function () { root.classList.remove("is-talking"); }, talk);
    clearTimeout(hideTimer);
    var ms = opts.ms === undefined ? Math.min(9000, 2600 + content.replace(/<[^>]+>/g, "").length * 45) : opts.ms;
    if (ms > 0) { ms += Math.min(talk, 1200); hideTimer = setTimeout(hideBubble, ms); }
    current = { content: content, opts: opts, until: ms > 0 ? Date.now() + ms : 0 };
    if (opts.mood) setMood(opts.mood, opts.moodMs === undefined ? Math.max(1800, Math.min(ms || 3200, 4000)) : opts.moodMs);
    updateBadge();
    armSleep();
  }
  function hideBubble() {
    clearTimeout(hideTimer);
    clearTimeout(talkTimer);
    root.classList.remove("is-talking");
    current = null;
    if (!bubbleOpen()) return;
    root.classList.remove("bubble-open");
    scheduleCheck(450);
  }
  /** Keeps the message on screen for later when the mascot has to duck away mid-sentence. */
  function stash() {
    if (!bubbleOpen() || !current) return;
    var left = current.until ? current.until - Date.now() : 0;
    if (!current.until || left > 1500) pending = { content: current.content, opts: current.opts };
    updateBadge();
  }
  function queue(content, opts) {
    pending = { content: content, opts: opts || {} };
    updateBadge();
  }
  function updateBadge() {
    root.classList.toggle("has-pending", !!pending);
    updateLabel();
  }
  function say(content, opts) {
    if (root.classList.contains("is-hidden")) return;
    // put away on purpose, or ducked for the keyboard: wait behind the badge until tapped
    if (docked() || (tucked() && tuckReason === "type")) { queue(content, opts); return; }
    untuck();
    show(content, opts);
  }
  /** An automatic tip: shown once per session per key, and never when tips are muted or the mascot is out of the way. */
  function tip(content, opts) {
    opts = opts || {};
    if (prefs.quiet || docked() || tucked()) return;
    if (opts.key) { if (seen(opts.key)) return; markSeen(opts.key); }
    say(content, opts);
  }

  var helpFn = null;
  function showHelp() {
    if (pending) { var p = pending; show(p.content, p.opts); return; }
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
  // on a phone a tap anywhere else dismisses the bubble, so it never sits on top of the page
  document.addEventListener("pointerdown", function (e) {
    if (!bubbleOpen() || root.contains(e.target) || !isPhone()) return;
    if (Date.now() - openedAt > 400) hideBubble();
  }, true);

  /* ----- out of the way -----
     docked: the user put it away ("Hide me", or shoving it past the screen edge). Remembered.
     tucked: it ducked away by itself. Temporary, and the reason decides what brings it back:
       "type"    a text field has focus on a phone (keyboard up)   -> back when focus leaves
       "scroll"  scrolling down on a phone                          -> back when scrolling up
       "overlap" it sits on top of something clickable              -> back when that clears
     Either way a sliver with one eye stays at the screen edge and a tap brings it back.
     Messages that arrive meanwhile wait behind a "…" badge on the sliver. */
  var RANK = { overlap: 1, scroll: 2, type: 3 };
  var tuckReason = null;
  function docked() { return root.classList.contains("is-docked"); }
  function tucked() { return root.classList.contains("is-tucked"); }
  function dock() {
    hideBubble();
    tuckReason = null;
    root.classList.add("is-docked");
    root.classList.remove("is-tucked");
    prefs.docked = true;
    savePrefs();
    updateLabel();
  }
  function undock() {
    tuckReason = null;
    root.classList.remove("is-docked");
    root.classList.remove("is-tucked");
    if (prefs.docked) { prefs.docked = false; savePrefs(); }
    updateLabel();
  }
  function tuck(reason) {
    if (docked() || root.classList.contains("is-hidden") || (drag && drag.moved)) return;
    if (tucked() && RANK[tuckReason] > RANK[reason]) return;
    tuckReason = reason;
    if (tucked()) return;
    stash();
    hideBubble();
    root.classList.add("is-tucked");
    updateLabel();
  }
  function untuck() {
    tuckReason = null;
    if (!tucked()) return;
    root.classList.remove("is-tucked");
    updateLabel();
  }
  /** Undo an automatic tuck, but only the kind that caused it; stay put if it would be in the way. */
  function release(reason) {
    if (!tucked() || tuckReason !== reason) return;
    if (inTheWay()) tuckReason = "overlap"; else untuck();
  }
  function updateLabel() {
    var away = docked() || tucked();
    body.setAttribute("aria-label",
      away ? "Show " + NAME + (pending ? ", new message" : "") :
      pending ? NAME + " has a message. Click to read it." :
      NAME + ", your guide. Click for help.");
  }
  hideBtn.addEventListener("click", dock);

  function isPhone() { return window.innerWidth <= PHONE; }

  /* is it in the way? Look at what sits right under the figure at a few points */
  var INTERACTIVE = "a[href], button, input, select, textarea, label, summary, [role='button'], [role='link'], " +
    "[role='tab'], [role='checkbox'], [role='switch'], [role='option'], [contenteditable=''], [contenteditable='true'], [onclick]";
  function homeRect() {
    // where the figure is when it is out, even while it is tucked (the tuck is a translateX on the root)
    var r = body.getBoundingClientRect(), dx = 0;
    var t = getComputedStyle(root).transform;
    if (t && t !== "none") { try { dx = new DOMMatrixReadOnly(t).m41; } catch (e) { /* old browser: assume no offset */ } }
    return { left: r.left - dx, top: r.top, width: r.width, height: r.height };
  }
  function clickable(el) {
    var hit = el.closest(INTERACTIVE);
    if (!hit && getComputedStyle(el).cursor === "pointer") hit = el;
    if (!hit || hit === document.body || hit === document.documentElement) return false;
    // a huge clickable wrapper (a whole panel, a full-height editor) is not a reason to hide
    var b = hit.getBoundingClientRect();
    return b.width * b.height < window.innerWidth * window.innerHeight * .35;
  }
  function inTheWay() {
    if (!document.elementsFromPoint) return false;
    var r = homeRect(), W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var x = r.left + r.width * (.22 + .28 * i), y = r.top + r.height * (.2 + .3 * j);
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        var stack = document.elementsFromPoint(x, y);
        for (var k = 0; k < stack.length; k++) {
          if (root.contains(stack[k])) continue;
          if (clickable(stack[k])) return true;
          break; // only the element directly under the mascot matters
        }
      }
    }
    return false;
  }
  var checkTimer = null;
  function scheduleCheck(ms) { clearTimeout(checkTimer); checkTimer = setTimeout(check, ms || 220); }
  function check() {
    if (root.classList.contains("is-hidden") || docked() || drag || bubbleOpen()) return;
    if (tucked() && tuckReason !== "overlap") return;
    var blocking = inTheWay();
    if (blocking && !tucked()) tuck("overlap");
    else if (!blocking && tucked()) untuck();
  }
  // re-check when the page under it changes: scrolling stops, the window resizes, something is clicked
  window.addEventListener("resize", function () { scheduleCheck(300); });
  document.addEventListener("click", function (e) { if (!root.contains(e.target)) scheduleCheck(450); }, true);

  // typing on a phone: get out of the way of the keyboard and the field
  var TEXT_FIELD = "input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']), textarea, select, [contenteditable=''], [contenteditable='true']";
  var releaseTimer = null;
  document.addEventListener("focusin", function (e) {
    if (!isPhone()) return;
    var t = e.target;
    if (root.contains(t)) return;
    if (t.matches && t.matches(TEXT_FIELD)) { clearTimeout(releaseTimer); tuck("type"); }
  });
  document.addEventListener("focusout", function () {
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(function () {
      var a = document.activeElement;
      if (!a || !(a.matches && a.matches(TEXT_FIELD))) release("type");
    }, 250);
  });
  // scrolling down on a phone hides it, scrolling up brings it back (like a floating button);
  // on any screen, when scrolling stops it checks whether it now covers something
  var lastScroll = null, lastScroller = null;
  document.addEventListener("scroll", function (e) {
    var el = e.target === document ? (document.scrollingElement || document.documentElement) : e.target;
    if (!el || root.contains(el)) return;
    scheduleCheck(260);
    if (!isPhone()) return;
    var top = el.scrollTop;
    if (el !== lastScroller) { lastScroller = el; lastScroll = top; return; }
    var d = top - lastScroll;
    if (d > 14) { tuck("scroll"); lastScroll = top; }
    else if (d < -14) { release("scroll"); lastScroll = top; }
  }, { capture: true, passive: true });

  /* a tap on the sliver (or Enter on it) brings it back, with whatever it was waiting to say */
  function comeBack() {
    undock();
    if (pending) showHelp(); else setMood("happy", 1200);
  }

  /* ----- drag anywhere, snap to an edge; a short press is a click ----- */
  var drag = null;
  body.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    var r = root.getBoundingClientRect();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false };
    try { body.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone: the drag still works without capture */ }
  });
  body.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return;
    if (!drag.moved) { drag.moved = true; root.classList.add("is-dragging"); hideBubble(); tuckReason = null; root.classList.remove("is-docked"); root.classList.remove("is-tucked"); }
    var w = root.offsetWidth, h = root.offsetHeight;
    // it may be shoved partly past the left/right edge: that is how it gets docked
    var left = Math.min(window.innerWidth - w * (1 - DOCK_RATIO) - 1, Math.max(-w * DOCK_RATIO - 1, e.clientX - drag.ox));
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
      if (docked() || tucked()) { comeBack(); return; }
      if (bubbleOpen()) hideBubble(); else showHelp();
      return;
    }
    var r = root.getBoundingClientRect();
    var side = r.left + r.width / 2 < window.innerWidth / 2 ? "left" : "right";
    var offscreen = side === "left" ? -r.left : r.right - window.innerWidth;
    var shoved = offscreen >= r.width * DOCK_RATIO - 2;
    var bottom = Math.round(Math.max(EDGE, Math.min(window.innerHeight - r.height - EDGE, window.innerHeight - r.bottom)));
    root.style.left = root.style.right = root.style.top = root.style.bottom = "";
    root.dataset.side = side;
    root.style.setProperty("--mascot-bottom", bottom + "px");
    prefs.side = side;
    prefs.bottom = bottom;
    savePrefs();
    root.classList.remove("is-dragging");
    if (shoved) dock(); else undock(); // dragged back onto the screen: no longer docked
  }
  body.addEventListener("pointerup", endDrag);
  body.addEventListener("pointercancel", endDrag);
  body.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (docked() || tucked()) comeBack();
      else if (bubbleOpen()) hideBubble();
      else showHelp();
    }
  });

  /* ----- mount ----- */
  function mount() {
    document.body.appendChild(root);
    updateLabel();
    scheduleBlink();
    armSleep();
    scheduleCheck(900);
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
    dock: dock,                                   // slide away to the edge (remembered)
    undock: undock,
    isDocked: docked,
    close: hideBubble,
    isQuiet: function () { return !!prefs.quiet; }
  };
})();
