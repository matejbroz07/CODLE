/**
 * Codle — performance mode
 *
 * Load this synchronously in <head>, before the stylesheets render, so a slow
 * device never paints the expensive version first.
 *
 * Effects mode: "auto" (default), "full" or "lite".
 *   - lite adds <html class="lite">: no backdrop blur, no film grain, no
 *     continuous animations, lighter shadows (see the LITE block in base.css).
 *   - auto turns lite on for weak hardware (few cores, little memory) or data
 *     saver, and also when the page measurably drops frames. (Reduced motion
 *     is handled separately by the stylesheets and does not force lite.)
 *     A measured slowdown is remembered so the next page load starts in lite.
 *
 * Override: ?effects=lite | ?effects=full | ?effects=auto in the URL, or
 * CodlePerf.setMode(...) (used by the editor's Workspace panel).
 */
(function () {
  "use strict";

  var MODE_KEY = "codle.effects";
  var DETECTED_KEY = "codle.effects.detected";
  var root = document.documentElement;

  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable */ }
  }

  var fromUrl = /[?&]effects=(auto|full|lite)\b/.exec(location.search);
  if (fromUrl) set(MODE_KEY, fromUrl[1]);
  var mode = fromUrl ? fromUrl[1] : (get(MODE_KEY) || "auto");
  if (mode !== "full" && mode !== "lite") mode = "auto";

  var nav = navigator;
  var cores = nav.hardwareConcurrency || 8;
  var memory = nav.deviceMemory || 8; // GB, Chromium only
  var saveData = !!(nav.connection && nav.connection.saveData);
  // 4 GB RAM or less (navigator.deviceMemory, Chromium) covers practically every
  // budget Chromebook, including 8-core ARM ones; 2 cores catches the rest.
  var weakHardware = memory <= 4 || cores <= 2;
  // Reasons auto mode would pick lite. Recomputed on every mode change, so
  // clearing an earlier frame-drop detection really clears it.
  function autoReasons() {
    var r = [];
    if (weakHardware) r.push("hardware");
    if (saveData) r.push("data saver");
    if (get(DETECTED_KEY) === "lite") r.push("dropped frames");
    return r;
  }

  var listeners = [];
  var api = window.CodlePerf = {
    mode: mode,
    lite: false,
    reasons: autoReasons(),
    /** Run fn(isLite) now and whenever lite mode changes. */
    onChange: function (fn) { listeners.push(fn); fn(api.lite); },
    setMode: function (next) {
      api.mode = next;
      set(MODE_KEY, next === "auto" ? null : next);
      if (next !== "auto") set(DETECTED_KEY, null);
      api.reasons = autoReasons();
      apply(next === "lite" || (next === "auto" && api.reasons.length > 0));
      if (next === "auto" && !api.lite) watchFrames();
    }
  };

  function apply(lite) {
    if (lite === api.lite) return;
    api.lite = lite;
    root.classList.toggle("lite", lite);
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](lite); } catch (e) { /* a listener must not break the others */ }
    }
  }

  apply(mode === "lite" || (mode === "auto" && api.reasons.length > 0));

  // Auto mode on capable-looking hardware: watch real frame times for a few
  // seconds after load. If the page clearly struggles, switch to lite.
  var watching = false;
  function watchFrames() {
    if (watching || api.lite || api.mode !== "auto" || !window.requestAnimationFrame) return;
    watching = true;
    var gaps = [], last = 0, start = 0;
    function tick(t) {
      if (document.hidden) { last = 0; requestAnimationFrame(tick); return; } // background tabs are throttled on purpose
      if (!start) start = t;
      if (last) gaps.push(t - last);
      last = t;
      if (t - start < 4000 && api.mode === "auto" && !api.lite) { requestAnimationFrame(tick); return; }
      watching = false;
      if (gaps.length < 20) return;
      var sorted = gaps.slice().sort(function (a, b) { return a - b; });
      var median = sorted[Math.floor(sorted.length / 2)];
      var slow = gaps.filter(function (g) { return g > 50; }).length / gaps.length;
      if (median > 30 || slow > 0.15) {
        set(DETECTED_KEY, "lite");
        api.reasons = autoReasons();
        apply(true);
      }
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === "complete") watchFrames();
  else window.addEventListener("load", function () { setTimeout(watchFrames, 500); });
})();
