/**
 * Codle — themes
 *
 * Load this synchronously in <head>, right after js/perf.js and before the
 * stylesheets, so the page never paints in the wrong colours first.
 *
 * A theme is a name on <html data-theme="…"> (css/themes.css). Light themes
 * also get <html data-light>, and a theme with its own typeface gets a
 * Google Fonts stylesheet appended to <head> (only the active theme's).
 * The default "codle" theme is the one you can mix yourself: dark or light,
 * its custom values become inline tokens on <html> plus data-mode /
 * data-scene / data-grain attributes.
 * Full and lite looks are not decided here — js/perf.js sets <html class="lite">
 * and every theme has styles for both.
 *
 *   CodleTheme.id                       // "codle", "overworld", …
 *   CodleTheme.themes                   // the catalogue (id, name, tag, colours)
 *   CodleTheme.set("dust")              // "codle", "notebook", "overworld", "dust", "hallownest"
 *   CodleTheme.custom                   // Codle theme: { mode, accent, bg, glass, corners, scene, grain }
 *   CodleTheme.customize({ mode: "light" })
 *   CodleTheme.resetCustom()
 *   CodleTheme.settings()               // { appTheme, appThemeCustom } as the API stores them
 *   CodleTheme.configure(settings)      // apply what the account has
 *   CodleTheme.onChange(fn)             // fn(api) now and after every change
 *
 * Override for a quick look: ?theme=dust in the URL (kept like a choice).
 */
(function () {
  "use strict";

  var THEME_KEY = "codle.theme";
  var CUSTOM_KEY = "codle.theme.custom";
  var FONT_LINK_ID = "codle-theme-font";
  var root = document.documentElement;

  /* The catalogue. bg / accent / ink / glow paint the tiles in Profile → Theme;
     font is the Google Fonts request for the theme's typeface(s). */
  var THEMES = [
    { id: "codle",      name: "Codle",      tag: "Liquid glass, dark or light. Mix your own colours, scene and glass.", bg: "#08090c", accent: "#0a84ff", ink: "#eef1f6", custom: true },
    { id: "notebook",   name: "Notebook",   tag: "Cream paper, ruled lines, ink and a highlighter. Quiet.",             bg: "#f5efe3", accent: "#2456d6", ink: "#2a2723", glow: "#d6452f", light: true },
    { id: "overworld",  name: "Overworld",  tag: "Dirt, stone and pixel text. Blocky to the bone.",                     bg: "#1b140d", accent: "#55c43a", ink: "#f2f2f2", glow: "#d79a3b",
      font: "Pixelify+Sans:wght@400..700" },
    { id: "dust",       name: "Dust",       tag: "Tactical HUD: sand orange, a radar, condensed caps.",                 bg: "#14171c", accent: "#e6a23c", ink: "#e9ecef", glow: "#5d8bd1",
      font: "Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700" },
    { id: "hallownest", name: "Hallownest", tag: "Ink-blue caverns, serif script, pale spores.",                        bg: "#090d18", accent: "#9fb8ea", ink: "#e6ebf5", glow: "#3c5aa0",
      font: "Cinzel:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400" }
  ];
  var IDS = THEMES.map(function (t) { return t.id; });

  /* The Codle theme's own options (Profile → Theme) */
  var MODES = ["dark", "light"];
  var ACCENTS = [["blue", "#0a84ff"], ["purple", "#bf5af2"], ["pink", "#ff375f"], ["orange", "#ff9f0a"], ["green", "#30d158"], ["teal", "#64d2ff"], ["red", "#ff453a"], ["white", "#ffffff"]];
  var ACCENTS_LIGHT = [["blue", "#0a84ff"], ["purple", "#a550e0"], ["pink", "#e8285a"], ["orange", "#f08a00"], ["green", "#1f9d4f"], ["teal", "#0a9bd6"], ["red", "#e5362b"], ["black", "#1c1c1e"]];
  var BACKDROPS = [["graphite", "#08090c"], ["navy", "#060a14"], ["plum", "#0d0712"], ["forest", "#070d09"], ["mocha", "#0f0a07"], ["slate", "#0c0f14"]];
  var BACKDROPS_LIGHT = [["snow", "#f2f4f7"], ["cream", "#f7f3ea"], ["mist", "#e8edf3"], ["lilac", "#f0ecf7"], ["sage", "#ecf2ec"], ["sand", "#f4eee3"]];
  var GLASS = { clear: { blur: "10px", k: "0.6" }, normal: { blur: "22px", k: "1" }, frosted: { blur: "36px", k: "1.6" } };
  var CORNERS = { sharp: ["10px", "8px"], soft: ["24px", "16px"], round: ["32px", "22px"] };
  var SCENES = ["none", "aurora", "stars", "grid"];
  var DEFAULTS = { mode: "dark", accent: "#0a84ff", bg: "#08090c", glass: "normal", corners: "soft", scene: "none", grain: true };
  var LIGHT_BG = BACKDROPS_LIGHT[0][1];

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
  function defaultBg(mode) { return mode === "light" ? LIGHT_BG : DEFAULTS.bg; }
  function inList(list, hex) { return list.some(function (x) { return x[1] === hex; }); }
  /** Custom values from storage or the API, made safe. Unknown or invalid ones fall back to the default. */
  function cleanCustom(c) {
    c = c && typeof c === "object" ? c : {};
    var mode = MODES.indexOf(c.mode) >= 0 ? c.mode : DEFAULTS.mode;
    return {
      mode: mode,
      accent: isHex(c.accent) ? c.accent.toLowerCase() : DEFAULTS.accent,
      bg: isHex(c.bg) ? c.bg.toLowerCase() : defaultBg(mode),
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
    modes: MODES,
    accents: ACCENTS,
    backdrops: BACKDROPS,
    /** The accent and backdrop swatches for a mode of the Codle theme (the current one by default). */
    accentsFor: function (mode) { return (mode || api.custom.mode) === "light" ? ACCENTS_LIGHT : ACCENTS; },
    backdropsFor: function (mode) { return (mode || api.custom.mode) === "light" ? BACKDROPS_LIGHT : BACKDROPS; },
    glass: Object.keys(GLASS),
    corners: Object.keys(CORNERS),
    scenes: SCENES,
    defaults: DEFAULTS,
    theme: function (which) {
      for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === (which || api.id)) return THEMES[i];
      return THEMES[0];
    },
    /** True when the page is dark-on-light: a light theme, or the Codle theme in light mode. */
    isLight: function () { var t = api.theme(); return !!t.light || (!!t.custom && api.custom.mode === "light"); },
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
      // Switching dark <-> light: a backdrop or accent picked for the other mode would not read,
      // so the preset ones swap to the new mode's default (a custom colour of your own stays).
      if (patch && patch.mode && patch.mode !== api.custom.mode) {
        var was = api.custom.mode === "light";
        if (!patch.hasOwnProperty("bg") && (inList(was ? BACKDROPS_LIGHT : BACKDROPS, api.custom.bg) || api.custom.bg === defaultBg(api.custom.mode))) merged.bg = defaultBg(patch.mode);
        if (!patch.hasOwnProperty("accent") && (api.custom.accent === "#ffffff" || api.custom.accent === "#1c1c1e")) merged.accent = DEFAULTS.accent;
      }
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

  /** One <link> for the active theme's typeface; removed when the theme has none. */
  function loadFont(t) {
    var link = document.getElementById(FONT_LINK_ID);
    if (!t.font) { if (link) link.remove(); return; }
    var href = "https://fonts.googleapis.com/css2?family=" + t.font + "&display=swap";
    if (link && link.getAttribute("href") === href) return;
    if (!link) {
      link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
  }

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
      if (c.mode === "light") root.setAttribute("data-mode", "light"); else root.removeAttribute("data-mode");
      if (c.accent !== DEFAULTS.accent) {
        s.setProperty("--accent", c.accent);
        s.setProperty("--accent-rgb", hexToRgb(c.accent).join(","));
        s.setProperty("--accent-ink", inkFor(c.accent));
      }
      if (c.bg !== defaultBg(c.mode)) s.setProperty("--bg", c.bg);
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
      root.removeAttribute("data-mode");
      root.removeAttribute("data-scene");
      root.removeAttribute("data-grain");
    }
    if (api.isLight()) root.setAttribute("data-light", ""); else root.removeAttribute("data-light");
    loadFont(t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](api); } catch (e) { /* a listener must not break the others */ }
    }
  }

  apply();
})();
