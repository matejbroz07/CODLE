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
 *   CodleMascot.configure({ color: "mint", hat: "crown", face: "glasses", name: "Bit" })   // look + behaviour, saved locally
 *   CodleMascot.settings()                       // the same keys, current values
 *   CodleMascot.preview(container)               // a live copy of the figure for the profile
 *   CodleMascot.stage(el)                        // move into el, big and still (404, server down)
 *
 * A page that has an element with [data-mascot-stage] gets the mascot there from the start.
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

  /* ----- looks: everything the Profile → Curly tab can change -----
     Colors and eyes are three-stop gradients (light, mid, dark); a color may also glow.
     Hats, face and neck items and effects are SVG drawn in the figure's 120 × 120 space
     (braces x 15–105, y 14–106; eyes at 41/79, 54; mouth around 60, 80).
     `unlock` is checked by js/profile.js against the learner's level and best streak;
     the server only checks the ids (api/routes/me.php MASCOT_CHOICES). */
  var DEFAULT_NAME = "Curly";
  var NAME_MAX = 12;
  function glass(r, g, b) { return ["rgba(" + r + "," + g + "," + b + ",.5)", "rgba(" + r + "," + g + "," + b + ",.3)", "rgba(" + r + "," + g + "," + b + ",.45)"]; }
  var COLORS = {
    frost:    { label: "Frost",    tube: ["#ffffff", "#eef3fa", "#aebdd4"], glass: ["rgba(255,255,255,.55)", "rgba(240,245,255,.35)", "rgba(205,218,240,.45)"] },
    ocean:    { label: "Ocean",    tube: ["#e3f2ff", "#5db1ff", "#1b63c9"], glass: glass(93, 177, 255) },
    mint:     { label: "Mint",     tube: ["#e8fff6", "#5fdfb0", "#138c69"], glass: glass(95, 223, 176) },
    rose:     { label: "Rose",     tube: ["#ffedf4", "#ff8fbb", "#c43d76"], glass: glass(255, 143, 187) },
    grape:    { label: "Grape",    tube: ["#f3ebff", "#b28dff", "#6233c4"], glass: glass(178, 141, 255) },
    lemon:    { label: "Lemon",    tube: ["#fffde6", "#ffe866", "#c9a800"], glass: glass(255, 232, 102) },
    sky:      { label: "Sky",      tube: ["#f0fbff", "#8fdcff", "#2c94c9"], glass: glass(143, 220, 255), unlock: { level: 2 } },
    peach:    { label: "Peach",    tube: ["#fff3ea", "#ffb98a", "#d0703a"], glass: glass(255, 185, 138), unlock: { level: 3 } },
    lime:     { label: "Lime",     tube: ["#f6ffe3", "#b6f05a", "#5f9e12"], glass: glass(182, 240, 90), unlock: { level: 4 } },
    coral:    { label: "Coral",    tube: ["#fff0ec", "#ff8a72", "#d0402a"], glass: glass(255, 138, 114), unlock: { level: 5 } },
    lavender: { label: "Lavender", tube: ["#f8f4ff", "#d2c2ff", "#8d78d6"], glass: glass(210, 194, 255), unlock: { level: 6 } },
    teal:     { label: "Teal",     tube: ["#e6fffd", "#45d4c8", "#0f7f78"], glass: glass(69, 212, 200), unlock: { level: 7 } },
    gold:     { label: "Gold",     tube: ["#fff8db", "#ffd147", "#b98410"], glass: glass(255, 209, 71), unlock: { level: 8 } },
    ruby:     { label: "Ruby",     tube: ["#ffe3e6", "#ff4d6a", "#9e1030"], glass: glass(255, 77, 106), unlock: { level: 11 } },
    emerald:  { label: "Emerald",  tube: ["#e3fff0", "#2fd07a", "#0b7a3e"], glass: glass(47, 208, 122), unlock: { level: 13 } },
    ghost:    { label: "Ghost",    tube: ["#ffffff", "#ffffff", "#dfe7f5"], glass: ["rgba(255,255,255,.18)", "rgba(255,255,255,.08)", "rgba(255,255,255,.14)"], glow: "rgba(255,255,255,.8)", unlock: { level: 18 } },
    prism:    { label: "Prism",    tube: ["#ff8ad8", "#ffe066", "#5ce1ff"], glass: ["rgba(255,138,216,.45)", "rgba(255,224,102,.3)", "rgba(92,225,255,.45)"], unlock: { level: 20 } },
    obsidian: { label: "Obsidian", tube: ["#a9b4cc", "#3f4a64", "#121827"], glass: ["rgba(120,135,165,.5)", "rgba(50,60,85,.45)", "rgba(15,20,35,.6)"], unlock: { streak: 14 } },
    neon:     { label: "Neon",     tube: ["#e9fffe", "#3ff7ff", "#00a6c7"], glass: glass(63, 247, 255), glow: "rgba(63,247,255,.95)", unlock: { streak: 21 } },
    lava:     { label: "Lava",     tube: ["#fff1c2", "#ff8a1f", "#c42a0b"], glass: glass(255, 138, 31), glow: "rgba(255,110,20,.95)", unlock: { streak: 30 } }
  };
  var EYES = {
    ink:    { label: "Ink",    iris: ["#3b4859", "#121922", "#04060a"] },
    blue:   { label: "Blue",   iris: ["#7cc2ff", "#0f63d6", "#062a5c"] },
    green:  { label: "Green",  iris: ["#8eeab3", "#13874f", "#05331d"] },
    amber:  { label: "Amber",  iris: ["#ffd47e", "#c0700f", "#4d2604"] },
    hazel:  { label: "Hazel",  iris: ["#d9c27a", "#7d6a2a", "#30260b"], unlock: { level: 2 } },
    gray:   { label: "Gray",   iris: ["#d3dbe6", "#6f7d90", "#252c36"], unlock: { level: 3 } },
    violet: { label: "Violet", iris: ["#d2b4ff", "#7140d0", "#2c0f5c"], unlock: { level: 4 } },
    teal:   { label: "Teal",   iris: ["#9ff3ea", "#139c91", "#053a36"], unlock: { level: 6 } },
    ruby:   { label: "Ruby",   iris: ["#ff9cab", "#c8143a", "#4a0614"], unlock: { level: 9 } },
    gold:   { label: "Gold",   iris: ["#fff1a6", "#e0a800", "#5c3d00"], unlock: { level: 11 } },
    galaxy: { label: "Galaxy", iris: ["#ff9ff3", "#6a5cff", "#0b0630"], unlock: { level: 16 } },
    ice:    { label: "Ice",    iris: ["#ffffff", "#9fe8ff", "#2b7fa8"], unlock: { streak: 7 } },
    ember:  { label: "Ember",  iris: ["#fff0a0", "#ff6a1f", "#5a1000"], unlock: { streak: 21 } }
  };
  var HATS = {
    none: { label: "None", art: "" },
    beanie: {
      label: "Beanie",
      art: '<path d="M35 15 C35 -7 85 -7 85 15 Z" fill="#ff5d6c"/>' +
        '<path d="M45 1 C49 -3 54 -5 59 -5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"/>' +
        '<rect x="31" y="10" width="58" height="11" rx="5.5" fill="#e23e52"/>' +
        '<path d="M37 13 V18 M43 13 V18 M49 13 V18 M55 13 V18 M61 13 V18 M67 13 V18 M73 13 V18 M79 13 V18 M85 13 V18" stroke="#b72a3e" stroke-width="1.6" stroke-linecap="round"/>' +
        '<circle cx="60" cy="-9" r="6" fill="#fff"/><circle cx="58" cy="-11" r="2" fill="#fff" opacity=".9"/>'
    },
    cap: {
      label: "Cap",
      art: '<path d="M38 16 C38 -3 82 -3 82 16 Z" fill="#0a84ff"/>' +
        '<path d="M60 -1 V15" stroke="#0060d0" stroke-width="1.6"/>' +
        '<path d="M44 4 C47 0 52 -1 56 -1" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M40 15 C31 13 20 15 15 20 C25 22 34 21 42 18 Z" fill="#0060d0"/>' +
        '<circle cx="60" cy="-1.5" r="2.6" fill="#0060d0"/>'
    },
    headphones: {
      label: "Headphones", unlock: { level: 3 },
      art: '<path d="M17 50 C15 2 105 2 103 50" fill="none" stroke="#2a3346" stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="M22 34 C30 12 50 7 60 7" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>' +
        '<rect x="6" y="45" width="15" height="26" rx="7" fill="#0a84ff"/><rect x="99" y="45" width="15" height="26" rx="7" fill="#0a84ff"/>' +
        '<rect x="9" y="49" width="3.5" height="12" rx="1.75" fill="#fff" fill-opacity=".5"/><rect x="102" y="49" width="3.5" height="12" rx="1.75" fill="#fff" fill-opacity=".5"/>'
    },
    propeller: {
      label: "Propeller cap", unlock: { level: 5 },
      art: '<path d="M37 15 C37 -5 83 -5 83 15 Z" fill="#ff453a"/>' +
        '<path d="M53 -3 C57 -4.5 63 -4.5 67 -3 L70 15 L50 15 Z" fill="#ffd60a"/>' +
        '<rect x="35" y="11" width="50" height="6" rx="3" fill="#0a84ff"/>' +
        '<rect x="59" y="-13" width="2" height="10" rx="1" fill="#4a5367"/>' +
        '<g class="mascot-prop"><ellipse cx="52" cy="-13" rx="8" ry="2.6" fill="#4fc3ff"/><ellipse cx="68" cy="-13" rx="8" ry="2.6" fill="#30d158"/></g>' +
        '<circle cx="60" cy="-13" r="2.2" fill="#ffd60a"/>'
    },
    graduation: {
      label: "Graduation cap", unlock: { level: 6 },
      art: '<path d="M42 8 V17 Q60 22 78 17 V8 Z" fill="#2a3346"/>' +
        '<path d="M28 5 L60 -6 L92 5 L60 15 Z" fill="#1d2433"/>' +
        '<path d="M28 5 L60 -6 L92 5" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.2"/>' +
        '<circle cx="60" cy="4.5" r="2" fill="#ffd60a"/>' +
        '<path d="M60 4.5 L86 8 V20" fill="none" stroke="#ffd60a" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M83.5 19 H88.5 L89 26 H83 Z" fill="#ffd60a"/>'
    },
    party: {
      label: "Party hat", unlock: { streak: 7 },
      art: '<g transform="rotate(14 60 16)">' +
        '<path d="M47 17 L60 -18 L73 17 Z" fill="#ffd60a"/>' +
        '<path d="M54.8 -4 L65.2 -4 L67.4 2 L52.6 2 Z" fill="#ff5fa2"/><path d="M50.3 8 L69.7 8 L71.5 13 L48.5 13 Z" fill="#ff5fa2"/>' +
        '<path d="M47 17 L73 17" stroke="#e0a800" stroke-width="2.4" stroke-linecap="round"/>' +
        '<circle cx="60" cy="-19" r="4.5" fill="#4fc3ff"/></g>'
    },
    tophat: {
      label: "Top hat", unlock: { level: 9 },
      art: '<rect x="44" y="-22" width="32" height="37" rx="3" fill="#1a2233"/>' +
        '<rect x="44" y="5" width="32" height="6" fill="#ff453a"/>' +
        '<path d="M48 -18 V2" stroke="#fff" stroke-opacity=".16" stroke-width="2.4" stroke-linecap="round"/>' +
        '<ellipse cx="60" cy="15" rx="25" ry="4.8" fill="#111827"/>'
    },
    crown: {
      label: "Crown", unlock: { level: 10 },
      art: '<path d="M41 17 L43 -3 L52 7 L60 -8 L68 7 L77 -3 L79 17 Z" fill="#ffcc33" stroke="#c98a00" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<rect x="41" y="12" width="38" height="5" fill="#f0a800"/>' +
        '<circle cx="43" cy="-3" r="2.2" fill="#ffe68a"/><circle cx="60" cy="-8" r="2.4" fill="#ffe68a"/><circle cx="77" cy="-3" r="2.2" fill="#ffe68a"/>' +
        '<circle cx="60" cy="8" r="2.8" fill="#ff4d6d"/><circle cx="50" cy="11" r="1.8" fill="#4fc3ff"/><circle cx="70" cy="11" r="1.8" fill="#4fc3ff"/>'
    },
    cowboy: {
      label: "Cowboy hat", unlock: { level: 11 },
      art: '<path d="M42 13 C41 -6 50 -9 60 -2 C70 -9 79 -6 78 13 Z" fill="#a0642b"/>' +
        '<path d="M42 8 Q60 13 78 8 V13 Q60 18 42 13 Z" fill="#5a3415"/>' +
        '<path d="M22 11 Q60 28 98 11 Q93 21 60 23 Q27 21 22 11 Z" fill="#8a5222"/>' +
        '<path d="M48 -2 C51 -5 54 -5 56 -4" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>'
    },
    chef: {
      label: "Chef hat", unlock: { streak: 10 },
      art: '<circle cx="47" cy="-3" r="9.5" fill="#fff"/><circle cx="73" cy="-3" r="9.5" fill="#fff"/><circle cx="60" cy="-9" r="11" fill="#fff"/>' +
        '<rect x="42" y="0" width="36" height="16" rx="3" fill="#eef2f8" stroke="#d3dae6" stroke-width="1"/>' +
        '<path d="M50 3 V13 M60 3 V13 M70 3 V13" stroke="#d3dae6" stroke-width="1.2" stroke-linecap="round"/>'
    },
    viking: {
      label: "Viking helmet", unlock: { level: 13 },
      art: '<path d="M38 6 C26 2 22 -10 26 -20 C30 -8 35 -4 43 0 Z" fill="#f3ead7"/>' +
        '<path d="M82 6 C94 2 98 -10 94 -20 C90 -8 85 -4 77 0 Z" fill="#f3ead7"/>' +
        '<path d="M36 16 C36 -6 84 -6 84 16 Z" fill="#9aa5b8"/>' +
        '<path d="M45 1 C49 -3 54 -4 58 -4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>' +
        '<rect x="34" y="10" width="52" height="7" rx="3.5" fill="#6b7488"/>' +
        '<circle cx="42" cy="13.5" r="1.3" fill="#d6dbe5"/><circle cx="51" cy="13.5" r="1.3" fill="#d6dbe5"/><circle cx="60" cy="13.5" r="1.3" fill="#d6dbe5"/><circle cx="69" cy="13.5" r="1.3" fill="#d6dbe5"/><circle cx="78" cy="13.5" r="1.3" fill="#d6dbe5"/>'
    },
    pirate: {
      label: "Pirate hat", unlock: { level: 14 },
      art: '<path d="M24 15 Q60 -16 96 15 Q60 4 24 15 Z" fill="#1a1a24"/>' +
        '<path d="M24 15 Q60 4 96 15" fill="none" stroke="#ffd60a" stroke-width="1.6"/>' +
        '<circle cx="60" cy="1" r="3.6" fill="#fff"/><rect x="58" y="3.6" width="4" height="2.4" rx="1" fill="#fff"/>' +
        '<path d="M54 -3 L66 6 M66 -3 L54 6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>'
    },
    wizard: {
      label: "Wizard hat", unlock: { level: 15 },
      art: '<path d="M43 15 L67 -30 L77 15 Z" fill="#6b4bd8"/>' +
        '<path d="M67 -30 L62 -2" stroke="#fff" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M58 -6 L59.6 -1.6 L64 0 L59.6 1.6 L58 6 L56.4 1.6 L52 0 L56.4 -1.6 Z" fill="#ffd60a"/>' +
        '<path d="M68 -18 L69 -15 L72 -14 L69 -13 L68 -10 L67 -13 L64 -14 L67 -15 Z" fill="#ffd60a"/>' +
        '<ellipse cx="60" cy="16" rx="27" ry="5.5" fill="#5536b8"/>'
    },
    bunny: {
      label: "Bunny ears", unlock: { level: 18 },
      art: '<path d="M36 18 Q60 6 84 18" fill="none" stroke="#e9eef6" stroke-width="3.2" stroke-linecap="round"/>' +
        '<ellipse cx="48" cy="-8" rx="6.5" ry="17" transform="rotate(-14 48 -8)" fill="#fff"/><ellipse cx="48" cy="-7" rx="3" ry="12" transform="rotate(-14 48 -7)" fill="#ffb3cb"/>' +
        '<ellipse cx="72" cy="-8" rx="6.5" ry="17" transform="rotate(14 72 -8)" fill="#fff"/><ellipse cx="72" cy="-7" rx="3" ry="12" transform="rotate(14 72 -7)" fill="#ffb3cb"/>'
    },
    flowers: {
      label: "Flower crown", unlock: { streak: 21 },
      art: '<path d="M32 16 Q60 2 88 16" fill="none" stroke="#3aa35a" stroke-width="2.4" stroke-linecap="round"/>' +
        '<ellipse cx="41" cy="12" rx="4" ry="2" transform="rotate(-30 41 12)" fill="#4cc56f"/><ellipse cx="79" cy="12" rx="4" ry="2" transform="rotate(30 79 12)" fill="#4cc56f"/>' +
        '<circle cx="34" cy="14" r="5" fill="#ff7eb6"/><circle cx="34" cy="14" r="2" fill="#ffd60a"/>' +
        '<circle cx="47" cy="8" r="5.5" fill="#ffffff"/><circle cx="47" cy="8" r="2.2" fill="#ffd60a"/>' +
        '<circle cx="60" cy="5.5" r="6" fill="#b28dff"/><circle cx="60" cy="5.5" r="2.4" fill="#ffd60a"/>' +
        '<circle cx="73" cy="8" r="5.5" fill="#ffffff"/><circle cx="73" cy="8" r="2.2" fill="#ffd60a"/>' +
        '<circle cx="86" cy="14" r="5" fill="#ff7eb6"/><circle cx="86" cy="14" r="2" fill="#ffd60a"/>'
    },
    santa: {
      label: "Santa hat", unlock: { streak: 30 },
      art: '<path d="M38 14 C40 -10 70 -18 89 -5 C80 -7 71 -3 74 14 Z" fill="#e0302a"/>' +
        '<path d="M46 -1 C51 -7 58 -9 64 -9" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.2" stroke-linecap="round"/>' +
        '<rect x="34" y="9" width="52" height="9" rx="4.5" fill="#fff"/>' +
        '<circle cx="90" cy="-4" r="5.5" fill="#fff"/>'
    },
    halo: {
      label: "Halo", unlock: { level: 20 },
      art: '<g class="mascot-hover"><ellipse cx="60" cy="-5" rx="22" ry="5.5" fill="none" stroke="#ffe066" stroke-width="4"/>' +
        '<ellipse cx="60" cy="-5" rx="22" ry="5.5" fill="none" stroke="#fffbe0" stroke-width="1.4"/></g>'
    }
  };
  var FACES = {
    none: { label: "None", art: "" },
    glasses: {
      label: "Glasses",
      art: '<g fill="rgba(190,225,255,.16)" stroke="#16203a" stroke-width="2.6"><circle cx="41" cy="54" r="15"/><circle cx="79" cy="54" r="15"/></g>' +
        '<path d="M56 52 Q60 48.5 64 52" fill="none" stroke="#16203a" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M30 48 A12 12 0 0 1 37 41.5 M68 48 A12 12 0 0 1 75 41.5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round"/>'
    },
    freckles: {
      label: "Freckles",
      art: '<g fill="#c98a5a"><circle cx="33" cy="70" r="1.2"/><circle cx="37.5" cy="72.5" r="1.1"/><circle cx="42" cy="70" r="1.2"/><circle cx="78" cy="70" r="1.2"/><circle cx="82.5" cy="72.5" r="1.1"/><circle cx="87" cy="70" r="1.2"/></g>'
    },
    hipster: {
      label: "Thick frames", unlock: { level: 2 },
      art: '<g fill="rgba(255,236,200,.12)" stroke="#5a3a22" stroke-width="3.2" stroke-linejoin="round"><rect x="26" y="42" width="30" height="23" rx="7"/><rect x="64" y="42" width="30" height="23" rx="7"/></g>' +
        '<path d="M56 49 H64" stroke="#5a3a22" stroke-width="3.2"/>' +
        '<path d="M30 47 H37 M68 47 H75" stroke="#fff" stroke-opacity=".7" stroke-width="1.8" stroke-linecap="round"/>'
    },
    mustache: {
      label: "Mustache", unlock: { level: 3 },
      art: '<path d="M60 70 C55 64 44 63 37 70 C42 68 48 70 51 74.5 C55.5 74.5 58.5 72.5 60 70 Z M60 70 C65 64 76 63 83 70 C78 68 72 70 69 74.5 C64.5 74.5 61.5 72.5 60 70 Z" fill="#3b2a20"/>'
    },
    bandaid: {
      label: "Band-aid", unlock: { streak: 3 },
      art: '<g transform="rotate(-25 86 72)"><rect x="76" y="68.5" width="20" height="7" rx="3.5" fill="#f2c39b"/><rect x="83" y="68.5" width="6" height="7" fill="#e3a77a"/>' +
        '<circle cx="79.5" cy="72" r=".7" fill="#c98a5a"/><circle cx="92.5" cy="72" r=".7" fill="#c98a5a"/></g>'
    },
    star: {
      label: "Gold star", unlock: { level: 4 },
      art: '<path d="M30 66 L32.1 70.4 L37 71 L33.4 74.3 L34.4 79 L30 76.6 L25.6 79 L26.6 74.3 L23 71 L27.9 70.4 Z" fill="#ffd60a" stroke="#e0a800" stroke-width=".8" stroke-linejoin="round"/>'
    },
    shades: {
      label: "Shades", unlock: { level: 5 },
      art: '<path d="M26 45 H56 V51 C56 61 49 66 41 66 C32 66 26 60 26 51 Z" fill="#0d1220"/>' +
        '<path d="M64 45 H94 V51 C94 60 88 66 79 66 C71 66 64 61 64 51 Z" fill="#0d1220"/>' +
        '<path d="M55 48 H65" stroke="#0d1220" stroke-width="3.2"/>' +
        '<path d="M30 50 L39 50 M68 50 L77 50" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M26 45 H56 M64 45 H94" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/>'
    },
    monocle: {
      label: "Monocle", unlock: { level: 7 },
      art: '<circle cx="79" cy="54" r="14.5" fill="rgba(190,225,255,.14)" stroke="#e0b23a" stroke-width="2.6"/>' +
        '<path d="M70 46 A11 11 0 0 1 77 41.5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M79 68.5 Q85 84 97 92" fill="none" stroke="#e0b23a" stroke-width="1.3" stroke-dasharray="2 1.6"/>'
    },
    pixel: {
      label: "Pixel shades", unlock: { level: 12 },
      art: '<g fill="#0b0b0f"><rect x="24" y="45" width="72" height="4.5"/>' +
        '<rect x="26" y="49" width="28" height="4.5"/><rect x="28" y="53" width="24" height="4.5"/><rect x="31" y="57" width="15" height="4.5"/>' +
        '<rect x="66" y="49" width="28" height="4.5"/><rect x="68" y="53" width="24" height="4.5"/><rect x="71" y="57" width="15" height="4.5"/></g>' +
        '<g fill="#fff"><rect x="30" y="49" width="4" height="4"/><rect x="34" y="53" width="4" height="4"/><rect x="70" y="49" width="4" height="4"/><rect x="74" y="53" width="4" height="4"/></g>'
    },
    eyepatch: {
      label: "Eye patch", unlock: { level: 16 },
      art: '<path d="M16 42 L104 32" stroke="#111" stroke-width="2.6" stroke-linecap="round"/>' +
        '<ellipse cx="41" cy="54" rx="13.5" ry="12.5" fill="#15151b"/>' +
        '<path d="M33 48 Q37 45 41 45" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.6" stroke-linecap="round"/>'
    },
    nose: {
      label: "Red nose", unlock: { level: 19 },
      art: '<circle cx="60" cy="68" r="5.5" fill="#ff3b30"/><circle cx="58" cy="66" r="1.8" fill="#fff" fill-opacity=".75"/>'
    }
  };
  var NECKS = {
    none: { label: "None", art: "" },
    necktie: {
      label: "Necktie",
      art: '<path d="M56 92 H64 L62.5 98 H57.5 Z" fill="#0060d0"/>' +
        '<path d="M57.5 98 H62.5 L65.5 112 L60 117 L54.5 112 Z" fill="#0a84ff"/>' +
        '<path d="M57.5 102 L63.5 107 M56.5 108 L64.5 114" stroke="#5db1ff" stroke-width="1.4"/>'
    },
    bowtie: {
      label: "Bow tie", unlock: { level: 2 },
      art: '<path d="M60 99 L47 92 Q45 99 47 106 Z" fill="#ff453a"/><path d="M60 99 L73 92 Q75 99 73 106 Z" fill="#ff453a"/>' +
        '<rect x="56.5" y="95.5" width="7" height="7" rx="2.5" fill="#cf2a20"/>' +
        '<circle cx="51" cy="99" r="1.3" fill="#fff" fill-opacity=".75"/><circle cx="69" cy="99" r="1.3" fill="#fff" fill-opacity=".75"/>'
    },
    scarf: {
      label: "Scarf", unlock: { level: 4 },
      art: '<path d="M70 99 L78 98 L81 116 L72 117 Z" fill="#e88a00"/>' +
        '<path d="M37 92 Q60 102 83 92 L85 99 Q60 111 35 99 Z" fill="#ff9f0a"/>' +
        '<path d="M45 96 L44 102 M53 98 L52.5 104 M67 98 L67.5 104 M75 96 L76 102" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M73 107 H80 M73.5 112 H80.5" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>'
    },
    bandana: {
      label: "Bandana", unlock: { level: 6 },
      art: '<path d="M40 92 Q60 96 80 92 L60 112 Z" fill="#e0302a"/>' +
        '<g fill="#fff" fill-opacity=".8"><circle cx="50" cy="96" r="1.2"/><circle cx="60" cy="98" r="1.2"/><circle cx="70" cy="96" r="1.2"/><circle cx="55" cy="103" r="1.1"/><circle cx="65" cy="103" r="1.1"/><circle cx="60" cy="108" r="1"/></g>'
    },
    medal: {
      label: "Medal", unlock: { level: 10 },
      art: '<path d="M51 86 L57 103 H63 L69 86 H63.5 L60 96 L56.5 86 Z" fill="#0a84ff"/>' +
        '<circle cx="60" cy="108" r="7" fill="#ffcc33" stroke="#c98a00" stroke-width="1.4"/>' +
        '<path d="M60 103.5 L61.3 106.5 L64.5 106.8 L62 108.9 L62.8 112 L60 110.3 L57.2 112 L58 108.9 L55.5 106.8 L58.7 106.5 Z" fill="#fff3c4"/>'
    },
    badge: {
      label: "Dev badge", unlock: { streak: 14 },
      art: '<path d="M44 86 L56 103 M76 86 L64 103" stroke="#30d158" stroke-width="2.2" stroke-linecap="round"/>' +
        '<rect x="51" y="101" width="18" height="15" rx="2.5" fill="#fff"/>' +
        '<rect x="51" y="101" width="18" height="4" rx="2" fill="#30d158"/>' +
        '<path d="M55.5 109 L53.5 111 L55.5 113 M64.5 109 L66.5 111 L64.5 113 M61 108.5 L59 113.5" fill="none" stroke="#1d2433" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    chain: {
      label: "Gold chain", unlock: { level: 17 },
      art: '<path d="M39 93 Q60 107 81 93" fill="none" stroke="#ffd34d" stroke-width="2.6" stroke-dasharray="2.6 1.4" stroke-linecap="round"/>' +
        '<circle cx="60" cy="104" r="6" fill="#ffcc33" stroke="#c98a00" stroke-width="1.2"/>' +
        '<text x="60" y="106.4" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="6.4" font-weight="700" fill="#7a5200">{}</text>'
    }
  };
  /* effects: little things floating around the mascot. Each piece is a .mascot-p with its own
     delay (--d) and drift (--x); the animation comes from the .mascot-fx-<id> class in mascot.css */
  function pieces(list, make) { return list.map(function (p) { return '<g class="mascot-p" style="--d:' + p[2] + 's;--x:' + (p[3] || 0) + 'px">' + make(p[0], p[1], p) + "</g>"; }).join(""); }
  function star4(x, y, r) { return '<path d="M' + x + " " + (y - r) + " L" + (x + r * .28) + " " + (y - r * .28) + " L" + (x + r) + " " + y + " L" + (x + r * .28) + " " + (y + r * .28) + " L" + x + " " + (y + r) + " L" + (x - r * .28) + " " + (y + r * .28) + " L" + (x - r) + " " + y + " L" + (x - r * .28) + " " + (y - r * .28) + ' Z"/>'; }
  function heart(x, y, s) { return '<path transform="translate(' + x + " " + y + ") scale(" + s + ')" d="M0 3 C-4 0 -6 -2 -6 -4.5 C-6 -7 -3 -8 0 -5.5 C3 -8 6 -7 6 -4.5 C6 -2 4 0 0 3 Z"/>'; }
  var FX = {
    none: { label: "None", art: "" },
    sparkles: {
      label: "Sparkles",
      art: '<g fill="#fff">' + pieces([[8, 24, 0], [112, 36, .7], [4, 84, 1.4], [116, 92, 2.1], [100, 6, 1.05], [18, 4, 1.75]], function (x, y) { return star4(x, y, 5); }) + "</g>"
    },
    hearts: {
      label: "Hearts", unlock: { level: 3 },
      art: '<g fill="#ff5f8f">' + pieces([[10, 96, 0, -4], [110, 90, .9, 4], [20, 70, 1.8, -6], [102, 64, 2.7, 6]], function (x, y) { return heart(x, y, 1); }) + "</g>"
    },
    notes: {
      label: "Music notes", unlock: { level: 5 },
      art: '<g fill="#b28dff" font-family="system-ui, sans-serif" font-weight="700" font-size="15">' + pieces([[4, 96, 0, -6, "♪"], [106, 92, 1, 6, "♫"], [12, 66, 2, -4, "♫"], [104, 60, 3, 4, "♪"]], function (x, y, p) { return '<text x="' + x + '" y="' + y + '">' + p[4] + "</text>"; }) + "</g>"
    },
    code: {
      label: "Code bits", unlock: { level: 7 },
      art: '<g font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="10">' + pieces([[0, 98, 0, -4, "</>", "#5db1ff"], [100, 94, .8, 4, "{ }", "#30d158"], [6, 66, 1.6, -6, ";", "#ffd60a"], [102, 64, 2.4, 6, "01", "#ff8fbb"], [52, 0, 3.2, 0, "=>", "#b28dff"]], function (x, y, p) { return '<text x="' + x + '" y="' + y + '" fill="' + p[5] + '">' + p[4].replace("<", "&lt;").replace(">", "&gt;") + "</text>"; }) + "</g>"
    },
    bubbles: {
      label: "Bubbles", unlock: { level: 9 },
      art: '<g fill="rgba(160,215,255,.18)" stroke="#bfe6ff" stroke-width="1.2">' + pieces([[10, 100, 0, -3], [110, 96, .8, 3], [16, 74, 1.6, -5], [106, 70, 2.4, 5], [60, 4, 3.2, 0]], function (x, y, p) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (3 + (p[2] * 10 % 3)) + '"/>'; }) + "</g>"
    },
    stars: {
      label: "Stars", unlock: { streak: 7 },
      art: '<g fill="#ffd60a">' + pieces([[6, 30, 0], [114, 24, .5], [2, 78, 1], [118, 70, 1.5], [60, -14, 2]], function (x, y) {
        return '<path transform="translate(' + x + " " + y + ')" d="M0 -6 L1.8 -1.9 L6 -1.6 L2.8 1.2 L3.7 5.4 L0 3.2 L-3.7 5.4 L-2.8 1.2 L-6 -1.6 L-1.8 -1.9 Z"/>';
      }) + "</g>"
    },
    confetti: {
      label: "Confetti", unlock: { level: 15 },
      art: pieces([[14, -16, 0, 6, "#ff5f8f"], [34, -22, .5, -4, "#ffd60a"], [58, -18, 1, 5, "#5db1ff"], [82, -24, 1.5, -6, "#30d158"], [104, -16, 2, 4, "#b28dff"], [24, -28, 2.5, 5, "#ff9f0a"], [94, -30, 3, -5, "#5ce1ff"]], function (x, y, p) {
        return '<rect x="' + x + '" y="' + y + '" width="4" height="7" rx="1" fill="' + p[4] + '"/>';
      })
    },
    snow: {
      label: "Snow", unlock: { level: 12 },
      art: '<g fill="#fff">' + pieces([[10, -12, 0, 6], [32, -20, .9, -4], [56, -14, 1.8, 5], [80, -22, 2.7, -6], [104, -12, 3.6, 4], [44, -30, 4.5, 3]], function (x, y, p) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (1.6 + (p[2] * 10 % 2) * .6) + '"/>'; }) + "</g>"
    },
    fire: {
      label: "Fire", unlock: { streak: 30 },
      art: pieces([[20, 112, 0], [42, 116, .25], [60, 118, .5], [78, 116, .15], [100, 112, .35]], function (x, y) {
        return '<path d="M' + x + " " + y + " C" + (x - 7) + " " + (y - 6) + " " + (x - 3) + " " + (y - 14) + " " + x + " " + (y - 20) + " C" + (x + 3) + " " + (y - 14) + " " + (x + 7) + " " + (y - 6) + " " + x + " " + y + ' Z" fill="#ff8a1f"/>' +
          '<path d="M' + x + " " + y + " C" + (x - 3.5) + " " + (y - 3) + " " + (x - 1.5) + " " + (y - 8) + " " + x + " " + (y - 11) + " C" + (x + 1.5) + " " + (y - 8) + " " + (x + 3.5) + " " + (y - 3) + " " + x + " " + y + ' Z" fill="#ffe066"/>';
      })
    }
  };
  var SIZES = {
    xs: { label: "Tiny", scale: .72 },
    s: { label: "Small", scale: .86 },
    m: { label: "Medium", scale: 1 },
    l: { label: "Large", scale: 1.18 },
    xl: { label: "Huge", scale: 1.36, unlock: { level: 8 } }
  };
  var SLOTS = { hat: HATS, face: FACES, neck: NECKS, fx: FX };
  var DEFAULT_LOOK = { name: DEFAULT_NAME, color: "frost", eyes: "ink", hat: "none", face: "none", neck: "none", fx: "none", size: "m" };

  function cleanName(v) {
    v = String(v == null ? "" : v).replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim();
    return Array.from(v).slice(0, NAME_MAX).join("").trim();
  }
  function pick(table, id, fallback) { return table.hasOwnProperty(id) ? id : fallback; }
  /** Any stored or received look, made safe: unknown ids fall back to the defaults. */
  function cleanLook(l) {
    l = l && typeof l === "object" ? l : {};
    // first version had one "extra" slot: glasses/shades went to the face, the bow tie to the neck
    if (l.extra && l.face === undefined && l.neck === undefined) {
      if (l.extra === "bowtie") l.neck = "bowtie"; else l.face = l.extra;
    }
    return {
      name: cleanName(l.name) || DEFAULT_NAME,
      color: pick(COLORS, l.color, DEFAULT_LOOK.color),
      eyes: pick(EYES, l.eyes, DEFAULT_LOOK.eyes),
      hat: pick(HATS, l.hat, "none"),
      face: pick(FACES, l.face, "none"),
      neck: pick(NECKS, l.neck, "none"),
      fx: pick(FX, l.fx, "none"),
      size: pick(SIZES, l.size, DEFAULT_LOOK.size)
    };
  }

  /* ----- the figure: glass panes + SVG. `uid` keeps gradient ids unique, so a preview
     can sit on the same page as the floating mascot. Colors come from CSS variables
     set by applyLook(), with the Frost defaults as fallbacks. ----- */
  function figureSvg(uid) {
    function stops(v, c, op) {
      return [0, .45, 1].map(function (o, i) {
        return '<stop offset="' + o + '" style="stop-color:var(--' + v + (i + 1) + ',' + c[i] + ')"' + (op ? ' stop-opacity="' + op[i] + '"' : "") + '/>';
      }).join("");
    }
    function eye(cx) {
      return '<g class="mascot-eye-open">' +
          '<circle class="mascot-socket" cx="' + cx + '" cy="55.5" r="12.5" filter="url(#' + uid + '-soft)"/>' +
          '<circle class="mascot-sclera" cx="' + cx + '" cy="54" r="12" fill="url(#' + uid + '-sclera)"/>' +
          '<g class="mascot-pupil"><g class="mascot-iris">' +
            '<circle cx="' + cx + '" cy="54" r="6.5" fill="url(#' + uid + '-iris)"/>' +
            '<circle class="mascot-glint" cx="' + (cx - 2.5) + '" cy="51.2" r="2.6"/>' +
            '<circle class="mascot-glint mascot-glint-sm" cx="' + (cx + 3.2) + '" cy="57.2" r="1.2"/>' +
          '</g></g>' +
        '</g>';
    }
    function brace(side, d) {
      return '<g class="mascot-brace mascot-brace-' + side + '">' +
          '<path class="mascot-tube" d="' + d + '" stroke="url(#' + uid + '-tube)"/>' +
          '<path class="mascot-tube-shine" d="' + d + '"/>' +
        '</g>';
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<defs>' +
        // the braces are slim tubes of glass, lit from the top-left
        '<linearGradient id="' + uid + '-tube" x1="0" y1="0" x2="1" y2="0">' + stops("mt", COLORS.frost.tube, [.95, .7, .85]) + '</linearGradient>' +
        '<radialGradient id="' + uid + '-sclera" cx="38%" cy="30%" r="75%">' +
          '<stop offset="0" stop-color="#fff"/><stop offset=".72" stop-color="#f4f8fd"/><stop offset="1" stop-color="#b9c9df"/>' +
        '</radialGradient>' +
        '<radialGradient id="' + uid + '-iris" cx="40%" cy="35%" r="70%">' + stops("mi", EYES.ink.iris) + '</radialGradient>' +
        '<filter id="' + uid + '-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '</defs>' +
      // effects float behind the figure
      '<g class="mascot-wear mascot-wear-fx"></g>' +
      // braces (the real blur comes from the .mascot-glass panes underneath, masked to the same paths)
      brace("l", BRACE_L) + brace("r", BRACE_R) +
      // eyes sit on the braces; eyelids are a clip-path polygon that animates
      '<g class="mascot-eye mascot-eye-l">' + eye(41) + '<path class="mascot-eye-happy" d="M31 56 Q41 42 51 56"/></g>' +
      '<g class="mascot-eye mascot-eye-r">' + eye(79) + '<path class="mascot-eye-happy" d="M69 56 Q79 42 89 56"/></g>' +
      '<path class="mascot-mouth" d="' + MOUTHS.idle + '"/>' +
      '<circle class="mascot-mouth-o" cx="60" cy="82" r="4.5"/>' +
      // what it wears, drawn over the face (filled in by applyLook)
      '<g class="mascot-wear mascot-wear-neck"></g>' +
      '<g class="mascot-wear mascot-wear-face"></g>' +
      '<g class="mascot-wear mascot-wear-hat"></g>' +
      '<text class="mascot-zz" x="88" y="26">z</text>' +
      '<text class="mascot-zz" x="97" y="15">z</text>' +
    '</svg>';
  }
  function figureHtml(uid) {
    return '<span class="mascot-figure">' +
        '<span class="mascot-glass"><span class="mascot-glass-l"></span><span class="mascot-glass-r"></span></span>' +
        figureSvg(uid) +
      '</span>';
  }
  function wearArt(slot, id) { return '<g class="mascot-fx-' + (slot === "fx" ? id : "none") + '">' + (SLOTS[slot][id] || SLOTS[slot].none).art + "</g>"; }
  /** A small flat drawing of the mascot wearing some items ({ hat, face, neck, fx }), for the pickers. */
  function miniSvg(parts) {
    parts = parts || {};
    function eye(cx) { return '<circle cx="' + cx + '" cy="54" r="12" fill="#fff"/><circle cx="' + cx + '" cy="54" r="6.5" fill="#121922"/><circle cx="' + (cx - 2.5) + '" cy="51.2" r="2.4" fill="#fff"/>'; }
    return '<svg viewBox="-12 -34 144 156" aria-hidden="true" focusable="false">' +
      (parts.fx ? wearArt("fx", parts.fx) : "") +
      '<g fill="none" stroke="#e9eff8" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + BRACE_L + '"/><path d="' + BRACE_R + '"/></g>' +
      eye(41) + eye(79) +
      '<path d="' + MOUTHS.idle + '" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
      (parts.neck ? wearArt("neck", parts.neck) : "") + (parts.face ? wearArt("face", parts.face) : "") + (parts.hat ? wearArt("hat", parts.hat) : "") +
    '</svg>';
  }
  /** Paints a look onto a mascot element (the floating one or a preview). */
  function applyLook(el, l) {
    var c = COLORS[l.color], e = EYES[l.eyes];
    for (var i = 0; i < 3; i++) {
      el.style.setProperty("--mt" + (i + 1), c.tube[i]);
      el.style.setProperty("--mg" + (i + 1), c.glass[i]);
      el.style.setProperty("--mi" + (i + 1), e.iris[i]);
    }
    el.style.setProperty("--mascot-glow", c.glow || "transparent");
    el.style.setProperty("--mascot-scale", SIZES[l.size].scale);
    el.dataset.color = l.color;
    Object.keys(SLOTS).forEach(function (slot) {
      el.dataset[slot] = l[slot];
      var g = el.querySelector(".mascot-wear-" + slot);
      if (g && g.getAttribute("data-id") !== l[slot]) { g.innerHTML = wearArt(slot, l[slot]); g.setAttribute("data-id", l[slot]); }
    });
  }

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
  prefs.look = cleanLook(prefs.look);
  function nameOf() { return prefs.look.name; }
  function follows() { return prefs.follow !== false; }
  var previews = [];   // live previews in the profile (see preview())
  function autohides() { return prefs.autohide !== false; }

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
      '<div class="mascot-bubble-name" aria-hidden="true"></div>' +
      '<div class="mascot-bubble-text"></div>' +
      '<div class="mascot-bubble-foot">' +
        '<button class="mascot-link" type="button" data-action="quiet"></button>' +
        '<button class="mascot-link" type="button" data-action="hide">Hide me</button>' +
      '</div>' +
    '</div>' +
    '<button class="mascot-body" type="button">' +
      figureHtml("mascot-m") +
      '<span class="mascot-badge" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '</button>';

  var body = root.querySelector(".mascot-body");
  var bubble = root.querySelector(".mascot-bubble");
  var bubbleText = root.querySelector(".mascot-bubble-text");
  var quietBtn = root.querySelector('[data-action="quiet"]');
  var hideBtn = root.querySelector('[data-action="hide"]');
  var mouth = root.querySelector(".mascot-mouth");
  var pupils = root.querySelectorAll(".mascot-pupil");
  var bubbleName = root.querySelector(".mascot-bubble-name");
  applyLook(root, prefs.look);
  bubbleName.textContent = nameOf();
  if (prefs.off) root.classList.add("is-hidden");

  /* ----- face painting, shared by the floating mascot and the previews ----- */
  function paintMouth(m, name) {
    var d = MOUTHS[name] || MOUTHS.idle;
    m.setAttribute("d", d);
    try { m.style.d = 'path("' + d + '")'; } catch (e) { /* no CSS `d`: the attribute already did it */ }
  }
  function paintEyes(el, pups, name, lk) {
    var bias = PUPIL_BIAS[name] || [0, 0];
    var t = "translate(" + (lk[0] + bias[0]) + "px, " + (lk[1] + bias[1]) + "px)";
    for (var i = 0; i < pups.length; i++) pups[i].style.transform = t;
    // 3D: the whole figure turns toward the pointer
    var nx = lk[0] / PUPIL_RANGE, ny = lk[1] / PUPIL_RANGE;
    el.style.setProperty("--tilt-x", (-ny * TILT).toFixed(2) + "deg");
    el.style.setProperty("--tilt-y", (nx * TILT * 1.2).toFixed(2) + "deg");
  }
  /** Where the pupils should go for a pointer at (x, y), seen from an element. */
  function gaze(el, x, y) {
    var r = el.getBoundingClientRect();
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    var d = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, d / 160) * PUPIL_RANGE;
    return [dx / d * k, dy / d * k];
  }

  /* ----- moods ----- */
  var mood = "idle";
  var moodTimer = null;
  function setMood(name, ms) {
    if (!MOUTHS.hasOwnProperty(name)) name = "idle";
    clearTimeout(moodTimer);
    mood = name;
    root.dataset.mood = name;
    paintMouth(mouth, name);
    movePupils();
    paintFavicon();
    if (ms) moodTimer = setTimeout(function () { setMood("idle"); }, ms);
  }

  /* ----- favicon: a small Curly in the browser tab, in the current mood and colour -----
     Bolder than the real figure (thick tubes, big eyes, no wardrobe) and cropped to the figure,
     so it fills the whole icon. No background: a thin dark outline keeps it readable on light
     tab strips too. Turned off in the profile: the page's own icon. */
  var iconLink = document.querySelector('link[rel~="icon"]');
  var iconDefault = iconLink && { href: iconLink.getAttribute("href"), type: iconLink.getAttribute("type") };
  var iconLast = "";
  var FAV_INK = "#11141b"; // the outline
  // eyelids as the visible part of each eye, top edge from the left to the right side (0 = open)
  var FAV_LIDS = { sad: [[.5, .12], [.12, .5]], think: [[.4, .4], [.26, .26]] };
  /** A line drawn twice: the dark outline, then the colour on top. */
  function favLine(d, width, color) {
    var common = '" fill="none" stroke-linecap="round" stroke-linejoin="round" d="' + d + '"/>';
    return '<path stroke="' + FAV_INK + '" stroke-width="' + (width + 6) + common +
      '<path stroke="' + color + '" stroke-width="' + width + common;
  }
  function faviconSvg(name) {
    var c = COLORS[prefs.look.color] || COLORS.frost;
    var iris = (EYES[prefs.look.eyes] || EYES.ink).iris;
    var bias = PUPIL_BIAS[name] || [0, 0];
    function eye(x, i) {
      if (name === "happy") return favLine("M" + (x - 12) + " 58 Q" + x + " 40 " + (x + 12) + " 58", 9, "#fff");
      if (name === "sleep") return favLine("M" + (x - 13) + " 54 Q" + x + " 64 " + (x + 13) + " 54", 8, "#fff");
      var r = name === "surprised" ? 17 : 15, top = 54 - r, h = 2 * r;
      var ball = '<circle cx="' + x + '" cy="54" r="' + r + '" fill="#fff" stroke="' + FAV_INK + '" stroke-width="3"/>' +
        '<circle cx="' + (x + bias[0]) + '" cy="' + (54 + bias[1]) + '" r="' + (name === "surprised" ? 6 : 8.5) + '" fill="' + iris[1] + '"/>';
      var lid = FAV_LIDS[name] && FAV_LIDS[name][i];
      if (!lid) return ball;
      var y0 = top + lid[0] * h, y1 = top + lid[1] * h;
      return '<clipPath id="l' + i + '"><polygon points="' + (x - r - 3) + "," + y0 + " " + (x + r + 3) + "," + y1 + " " +
          (x + r + 3) + "," + (top + h + 3) + " " + (x - r - 3) + "," + (top + h + 3) + '"/></clipPath>' +
        '<g clip-path="url(#l' + i + ')">' + ball + "</g>" +
        '<path d="M' + (x - r) + " " + y0 + " L" + (x + r) + " " + y1 + '" stroke="' + FAV_INK + '" stroke-width="3.5" stroke-linecap="round"/>';
    }
    var mouth = name === "surprised"
      ? '<circle cx="60" cy="84" r="7" fill="#fff" stroke="' + FAV_INK + '" stroke-width="3"/>'
      : favLine(MOUTHS[name] || MOUTHS.idle, 8, "#fff");
    // the outlined braces reach from 6 to 114 on both axes
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 110 110">' +
      '<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.tube[0] + '"/><stop offset="1" stop-color="' + c.tube[2] + '"/></linearGradient></defs>' +
      favLine(BRACE_L, 12, "url(#t)") + favLine(BRACE_R, 12, "url(#t)") +
      eye(41, 0) + eye(79, 1) + mouth +
    "</svg>";
  }
  function paintFavicon() {
    if (!iconLink) return;
    var href = prefs.off ? iconDefault.href : "data:image/svg+xml," + encodeURIComponent(faviconSvg(mood));
    if (href === iconLast) return;
    iconLast = href;
    var type = prefs.off ? iconDefault.type : "image/svg+xml";
    if (type) iconLink.setAttribute("type", type); else iconLink.removeAttribute("type");
    iconLink.setAttribute("href", href);
  }
  paintFavicon();

  /* ----- eyes follow the pointer ----- */
  var look = [0, 0];
  var lookTimer = null;
  function movePupils() { paintEyes(root, pupils, mood, look); }
  function lookAt(x, y) {
    if (follows()) {
      look = gaze(body, x, y);
      movePupils();
    }
    for (var i = 0; i < previews.length; i++) previews[i].lookAt(x, y);
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
    previews.forEach(function (p) { p.blink(); });
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
    // in its corner it can assume a short bubble; on a stage, measure the real one
    root.classList.toggle("bubble-below", r.top < (staged() ? bubble.offsetHeight + 24 : 220));
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
    if (!h) h = { text: "I'm " + nameOf() + ". I'll point out what to do next, cheer when you get things right, and help when you're stuck.", mood: "happy" };
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
  function staged() { return root.classList.contains("is-staged"); }
  function dock() {
    if (staged()) return;
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
    if (!autohides() || docked() || staged() || root.classList.contains("is-hidden") || (drag && drag.moved)) return;
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
      away ? "Show " + nameOf() + (pending ? ", new message" : "") :
      pending ? nameOf() + " has a message. Click to read it." :
      nameOf() + ", your guide. Click for help.");
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
    if (root.classList.contains("is-hidden") || docked() || staged() || drag || bubbleOpen()) return;
    if (!autohides()) { if (tucked()) untuck(); return; }
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
    if (!drag || e.pointerId !== drag.id || staged()) return;
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

  /* ----- previews: a stand-alone copy of the figure for the Profile → Curly tab.
     It wears the same look, blinks with the floating one and follows the pointer. ----- */
  var uidSeq = 0;
  function preview(container) {
    var el = document.createElement("div");
    el.className = "mascot mascot--preview";
    el.dataset.mood = "idle";
    el.innerHTML = '<button class="mascot-body" type="button">' + figureHtml("mascot-p" + (++uidSeq)) + '</button>';
    container.appendChild(el);
    var pBody = el.querySelector(".mascot-body");
    var pMouth = el.querySelector(".mascot-mouth");
    var pPupils = el.querySelectorAll(".mascot-pupil");
    var pMood = "idle", pLook = [0, 0], pTimer = null;
    function label() { pBody.setAttribute("aria-label", "Preview of " + nameOf() + ". Click to make " + nameOf() + " react."); }
    function setPMood(name, ms) {
      if (!MOUTHS.hasOwnProperty(name)) name = "idle";
      clearTimeout(pTimer);
      // replay the mood's intro even when it is the same mood again
      el.dataset.mood = "idle";
      void el.offsetWidth;
      pMood = name;
      el.dataset.mood = name;
      paintMouth(pMouth, name);
      paintEyes(el, pPupils, pMood, pLook);
      if (ms) pTimer = setTimeout(function () { setPMood("idle"); }, ms);
    }
    var api = {
      el: el,
      mood: setPMood,
      lookAt: function (x, y) {
        if (!el.isConnected || !el.offsetParent) return; // hidden tab: nothing to do
        pLook = follows() ? gaze(pBody, x, y) : [0, 0];
        paintEyes(el, pPupils, pMood, pLook);
      },
      blink: function () {
        if (pMood === "sleep" || pMood === "happy" || !el.offsetParent) return;
        el.classList.add("is-blinking");
        setTimeout(function () { el.classList.remove("is-blinking"); }, 130);
      },
      refresh: function () { applyLook(el, prefs.look); label(); paintEyes(el, pPupils, pMood, pLook); },
      destroy: function () {
        clearTimeout(pTimer);
        var i = previews.indexOf(api);
        if (i >= 0) previews.splice(i, 1);
        el.remove();
      }
    };
    var MOODS = ["happy", "surprised", "think", "happy"];
    pBody.addEventListener("click", function () { setPMood(MOODS[Math.floor(Math.random() * MOODS.length)], 1600); });
    previews.push(api);
    api.refresh();
    paintMouth(pMouth, "idle");
    return api;
  }

  /* ----- settings: the look plus the behaviour switches, as one plain object ----- */
  var LOOK_KEYS = ["name", "color", "eyes", "hat", "face", "neck", "fx", "size"];
  function settings() {
    var l = prefs.look, out = {};
    LOOK_KEYS.forEach(function (k) { out[k] = l[k]; });
    out.tips = !prefs.quiet;
    out.autohide = autohides();
    out.follow = follows();
    out.visible = !prefs.off;
    return out;
  }
  /** Changes any of the settings at once; unknown or invalid values are ignored. Returns the result. */
  function configure(patch) {
    patch = patch && typeof patch === "object" ? patch : {};
    var next = {};
    LOOK_KEYS.forEach(function (k) { next[k] = patch.hasOwnProperty(k) ? patch[k] : prefs.look[k]; });
    prefs.look = cleanLook(next);
    if (typeof patch.tips === "boolean") { prefs.quiet = !patch.tips; renderQuiet(); }
    if (typeof patch.follow === "boolean") {
      prefs.follow = patch.follow;
      if (!patch.follow) { look = [0, 0]; movePupils(); }
    }
    if (typeof patch.autohide === "boolean") {
      prefs.autohide = patch.autohide;
      if (!patch.autohide) untuck(); else scheduleCheck(300);
    }
    if (typeof patch.visible === "boolean") {
      prefs.off = !patch.visible;
      if (prefs.off) { hideBubble(); root.classList.add("is-hidden"); }
      else { root.classList.remove("is-hidden"); scheduleCheck(300); }
    }
    savePrefs();
    applyLook(root, prefs.look);
    paintFavicon();
    bubbleName.textContent = nameOf();
    updateLabel();
    previews.forEach(function (p) { p.refresh(); });
    return settings();
  }
  /** Back to the bottom-right corner, out of the dock. */
  function resetPosition() {
    delete prefs.side;
    delete prefs.bottom;
    root.dataset.side = "right";
    root.style.removeProperty("--mascot-bottom");
    undock();
    savePrefs();
    scheduleCheck(600);
  }

  /* ----- mount ----- */
  /** Takes the mascot out of its corner into el: big, not draggable, never ducks away.
      The docked preference is left alone, so other pages still find it docked. */
  function stage(el) {
    hideBubble();
    tuckReason = null;
    root.classList.remove("is-docked");
    root.classList.remove("is-tucked");
    root.classList.add("is-staged");
    el.appendChild(root);
    updateLabel();
  }
  function mount() {
    var stageEl = document.querySelector("[data-mascot-stage]");
    if (stageEl) stage(stageEl); else document.body.appendChild(root);
    updateLabel();
    scheduleBlink();
    armSleep();
    scheduleCheck(900);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  window.CodleMascot = {
    say: say,
    tip: tip,
    mood: setMood,
    help: function (fn) { helpFn = fn; },
    hide: function () { hideBubble(); root.classList.add("is-hidden"); },   // for this page only
    show: function () { if (!prefs.off) root.classList.remove("is-hidden"); },
    dock: dock,                                   // slide away to the edge (remembered)
    undock: undock,
    isDocked: docked,
    stage: stage,
    close: hideBubble,
    isQuiet: function () { return !!prefs.quiet; },
    // customization (Profile → Curly tab)
    settings: settings,
    configure: configure,
    preview: preview,
    resetPosition: resetPosition,
    catalog: { colors: COLORS, eyes: EYES, hats: HATS, faces: FACES, necks: NECKS, fx: FX, sizes: SIZES, defaults: DEFAULT_LOOK, nameMax: NAME_MAX, mini: miniSvg }
  };
  // the name can be changed, so it is read live
  Object.defineProperty(window.CodleMascot, "name", { get: nameOf, enumerable: true });
})();
