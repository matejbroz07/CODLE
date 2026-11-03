/**
 * Codle — themes
 *
 * Load this synchronously in <head>, right after js/perf.js and before the
 * stylesheets, so the page never paints in the wrong colours first.
 *
 * A theme is a name on <html data-theme="…"> (css/themes.css). The default
 * "codle" theme is the one you can mix yourself: its custom values become
 * inline tokens on <html> plus data-scene / data-grain attributes.
 * Full and lite looks are not decided here — js/perf.js sets <html class="lite">
 * and every theme has styles for both.
 *
 *   CodleTheme.id                       // "codle", "overworld", …
 *   CodleTheme.themes                   // the catalogue (id, name, tag, colours)
 *   CodleTheme.set("outrun")
 *   CodleTheme.custom                   // Codle theme: { accent, bg, glass, corners, scene, grain }
 *   CodleTheme.customize({ accent: "#bf5af2" })
 *   CodleTheme.resetCustom()
 *   CodleTheme.settings()               // { appTheme, appThemeCustom } as the API stores them
 *   CodleTheme.configure(settings)      // apply what the account has
 *   CodleTheme.onChange(fn)             // fn(api) now and after every change
 *
 * Override for a quick look: ?theme=outrun in the URL (kept like a choice).
 */
(function () {
  "use strict";

  var THEME_KEY = "codle.theme";
  var CUSTOM_KEY = "codle.theme.custom";
  var root = document.documentElement;

  var THEMES = [
    { id: "codle",      name: "Codle",      tag: "Liquid glass. Mix your own colours, scene and glass.", bg: "#08090c", accent: "#0a84ff", ink: "#eef1f6", custom: true },
    { id: "overworld",  name: "Overworld",  tag: "Blocky corners, moss green and torchlight.",           bg: "#141c12", accent: "#5fbf47", ink: "#eef4e6", glow: "#d79a3b" },
    { id: "nightcity",  name: "Night City", tag: "Neon yellow on black, cyan rims, scanlines.",          bg: "#07060c", accent: "#fcee0a", ink: "#f3f0ff", glow: "#00f0ff" },
    { id: "aperture",   name: "Aperture",   tag: "A clean, light test chamber in orange and blue.",      bg: "#e8ebef", accent: "#ff6a00", ink: "#171a20", glow: "#1b7fff", light: true },
    { id: "hallownest", name: "Hallownest", tag: "Deep blue caverns with pale, drifting spores.",        bg: "#0a0e1a", accent: "#8fb8ff", ink: "#e8eefb", glow: "#3c5aa0" },
    { id: "outrun",     name: "Outrun",     tag: "A sunset over a neon grid, pink and purple.",          bg: "#1b0b3a", accent: "#ff3ca6", ink: "#fdf2ff", glow: "#ff7a3c" },
    { id: "hyrule",     name: "Hyrule",     tag: "Ancient lines, teal glow and a little gold.",          bg: "#0b1516", accent: "#3fd1b0", ink: "#e8f3ef", glow: "#e8bd4f" }
  ];
  var IDS = THEMES.map(function (t) { return t.id; });

  /* The Codle theme's own options (Profile → Theme) */
  var ACCENTS = [["blue", "#0a84ff"], ["purple", "#bf5af2"], ["pink", "#ff375f"], ["orange", "#ff9f0a"], ["green", "#30d158"], ["teal", "#64d2ff"], ["red", "#ff453a"], ["white", "#ffffff"]];
  var BACKDROPS = [["graphite", "#08090c"], ["navy", "#060a14"], ["plum", "#0d0712"], ["forest", "#070d09"], ["mocha", "#0f0a07"], ["slate", "#0c0f14"]];
  var GLASS = { clear: { blur: "10px", k: "0.6" }, normal: { blur: "22px", k: "1" }, frosted: { blur: "36px", k: "1.6" } };
  var CORNERS = { sharp: ["10px", "8px"], soft: ["24px", "16px"], round: ["32px", "22px"] };
  var SCENES = ["none", "aurora", "stars", "grid"];
  var DEFAULTS = { accent: "#0a84ff", bg: "#08090c", glass: "normal", corners: "soft", scene: "none", grain: true };

  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable */ }
  }

  function isHex(v) { return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v); }
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** Dark or light text on top of a colour. */
  function inkFor(hex) {
    var c = hexToRgb(hex);
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.62 ? "#08090c" : "#fff";
  }
  /** Custom values from storage or the API, made safe. Unknown or invalid ones fall back to the default. */
  function cleanCustom(c) {
    c = c && typeof c === "object" ? c : {};
    return {
      accent: isHex(c.accent) ? c.accent.toLowerCase() : DEFAULTS.accent,
      bg: isHex(c.bg) ? c.bg.toLowerCase() : DEFAULTS.bg,
      glass: GLASS[c.glass] ? c.glass : DEFAULTS.glass,
      corners: CORNERS[c.corners] ? c.corners : DEFAULTS.corners,
      scene: SCENES.indexOf(c.scene) >= 0 ? c.scene : DEFAULTS.scene,
      grain: typeof c.grain === "boolean" ? c.grain : DEFAULTS.grain
    };
  }
  function isDefault(c) {
    return Object.keys(DEFAULTS).every(function (k) { return c[k] === DEFAULTS[k]; });
  }
  function parseJSON(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

  var fromUrl = /[?&]theme=([a-z]+)\b/.exec(location.search);
  var id = fromUrl ? fromUrl[1] : get(THEME_KEY);
  if (IDS.indexOf(id) < 0) id = "codle";
  if (fromUrl && IDS.indexOf(fromUrl[1]) >= 0) set(THEME_KEY, id);
  var custom = cleanCustom(parseJSON(get(CUSTOM_KEY)));

  var listeners = [];
  var api = window.CodleTheme = {
    id: id,
    custom: custom,
    themes: THEMES,
    accents: ACCENTS,
    backdrops: BACKDROPS,
    glass: Object.keys(GLASS),
    corners: Object.keys(CORNERS),
    scenes: SCENES,
    defaults: DEFAULTS,
    theme: function (which) {
      for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === (which || api.id)) return THEMES[i];
      return THEMES[0];
    },
    isCustomDefault: function () { return isDefault(api.custom); },
    inkFor: inkFor,
    onChange: function (fn) { listeners.push(fn); fn(api); },
    set: function (next) {
      if (IDS.indexOf(next) < 0 || next === api.id) return;
      api.id = next;
      set(THEME_KEY, next === "codle" ? null : next);
      apply();
    },
    customize: function (patch) {
      var merged = {};
      Object.keys(DEFAULTS).forEach(function (k) { merged[k] = patch && patch.hasOwnProperty(k) ? patch[k] : api.custom[k]; });
      api.custom = cleanCustom(merged);
      set(CUSTOM_KEY, isDefault(api.custom) ? null : JSON.stringify(api.custom));
      apply();
    },
    resetCustom: function () { api.customize(DEFAULTS); },
    settings: function () {
      return { appTheme: api.id, appThemeCustom: isDefault(api.custom) ? null : api.custom };
    },
    /** What the account stores (the API's keys). Unknown values are ignored. Returns true when something changed. */
    configure: function (s) {
      // appTheme null means the account never chose one: this browser's look stays
      if (!s || typeof s !== "object" || typeof s.appTheme !== "string") return false;
      var changed = false;
      if (s.hasOwnProperty("appThemeCustom")) {
        var c = cleanCustom(s.appThemeCustom);
        if (JSON.stringify(c) !== JSON.stringify(api.custom)) { api.custom = c; set(CUSTOM_KEY, isDefault(c) ? null : JSON.stringify(c)); changed = true; }
      }
      if (typeof s.appTheme === "string" && IDS.indexOf(s.appTheme) >= 0 && s.appTheme !== api.id) {
        api.id = s.appTheme;
        set(THEME_KEY, api.id === "codle" ? null : api.id);
        changed = true;
      }
      if (changed) apply();
      return changed;
    }
  };

  var INLINE = ["--accent", "--accent-rgb", "--accent-ink", "--bg", "--lg-blur", "--glass-k", "--lg-radius", "--lg-radius-sm"];

  function apply() {
    root.setAttribute("data-theme", api.id);
    var s = root.style;
    INLINE.forEach(function (p) { s.removeProperty(p); });
    var t = api.theme();
    var color = t.bg;
    if (t.custom) {
      // Only what differs from the defaults goes inline, so a page's own
      // tokens (the neutral auth page, for one) keep working for everyone else.
      var c = api.custom;
      if (c.accent !== DEFAULTS.accent) {
        s.setProperty("--accent", c.accent);
        s.setProperty("--accent-rgb", hexToRgb(c.accent).join(","));
        s.setProperty("--accent-ink", inkFor(c.accent));
      }
      if (c.bg !== DEFAULTS.bg) s.setProperty("--bg", c.bg);
      if (c.glass !== DEFAULTS.glass) {
        s.setProperty("--lg-blur", GLASS[c.glass].blur);
        s.setProperty("--glass-k", GLASS[c.glass].k);
      }
      if (c.corners !== DEFAULTS.corners) {
        s.setProperty("--lg-radius", CORNERS[c.corners][0]);
        s.setProperty("--lg-radius-sm", CORNERS[c.corners][1]);
      }
      if (c.scene !== "none") root.setAttribute("data-scene", c.scene); else root.removeAttribute("data-scene");
      if (c.grain) root.removeAttribute("data-grain"); else root.setAttribute("data-grain", "off");
      color = c.bg;
    } else {
      root.removeAttribute("data-scene");
      root.removeAttribute("data-grain");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](api); } catch (e) { /* a listener must not break the others */ }
    }
  }

  apply();
})();
