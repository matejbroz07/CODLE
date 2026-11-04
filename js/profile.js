/**
 * Codle — Profile tab
 *
 * Fills #view-profile from the API:
 *   Overview  — daily goal ring + last 7 days with the streak, courses (one segment
 *               per lesson), badge shelf
 *   Activity  — 26-week heatmap, XP by source, games (win-rate rings, Wordle
 *               guesses), recent XP as a timeline grouped by day
 *   Settings  — picture (with a crop step), bio, visibility, username (password +
 *               cooldown), e-mail (code to the new address), password, daily goal,
 *               time zone, visual effects, devices, data export, delete account
 *   Curly     — the mascot: live preview, name, "Surprise me", and collapsed sections for
 *               glass color, eyes, hats, face, neck, effects, size (many items unlock
 *               with level or best streak) and behavior switches
 *
 * Other learners' profiles open in a dialog from the leaderboard rows.
 * Talks to the API through js/api.js; app.js calls CodleProfile.update(user)
 * whenever the user's numbers change.
 */

(function () {
  "use strict";

  var api = window.CodleApi;
  var Avatar = window.CodleAvatar;
  if (!api || !Avatar) return;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
  function app() { return window.CodleApp || {}; }
  function toast(msg, ms) { if (app().toast) app().toast(msg, ms); }
  function online() { return !!(app().isOnline && app().isOnline()); }

  var LEVEL_RING = 289; // 2 * PI * 46, same ring as the sidebar
  var BIO_MAX = 300;
  var GOALS = [20, 50, 100, 200, 300, 500];
  var PLACEMENT = { 1: "Beginner", 2: "Basics", 3: "Intermediate", 4: "Advanced", 5: "Master" };
  var SOURCES = {
    lesson: "Lessons", quest: "Quests", quiz: "Quizzes", exam: "Exams", wordle: "Wordle",
    older_younger: "Older or Younger", daily_story: "Daily Story", streak_bonus: "Streak bonus",
    badge: "Badges", admin: "Adjustments"
  };

  var I = {
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    trophy: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    medal: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    device: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>',
    zoomIn: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    updown: '<polyline points="7 15 12 20 17 15"/><polyline points="7 9 12 4 17 9"/>',
    story: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
  };
  var SOURCE_ICON = {
    lesson: "book", quest: "code", quiz: "check", exam: "check", wordle: "grid",
    older_younger: "updown", daily_story: "story", streak_bonus: "flame", badge: "medal", admin: "star"
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || "pf-ic") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[name] + "</svg>";
  }

  /* ===============================================================
     Dates
  ================================================================*/

  function parseDay(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayKey(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function longDate(v) {
    if (!v) return "";
    var d = typeof v === "string" && v.length === 10 ? parseDay(v) : new Date(v);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function ago(iso) {
    if (!iso) return "";
    var s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 172800) return "yesterday";
    if (s < 7 * 86400) return Math.floor(s / 86400) + " days ago";
    return longDate(iso);
  }

  /* ===============================================================
     State + loading
  ================================================================*/

  var state = {
    profile: null,      // GET me/profile
    user: null,         // user summary (sidebar numbers)
    loadedAt: 0,
    loading: null,
    tab: "overview",
    built: false,       // the view skeleton exists
    settingsBuilt: false,
    sessions: null,
    emailStep: null     // { email, minutes } while waiting for the code
  };

  function viewActive() {
    var v = $("view-profile");
    return !!(v && v.classList.contains("active"));
  }

  function load(force) {
    if (state.loading) return state.loading;
    if (!force && state.profile && Date.now() - state.loadedAt < 60000) return Promise.resolve(state.profile);
    state.loading = api.get("me/profile").then(function (res) {
      state.loading = null;
      state.profile = res.profile;
      state.loadedAt = Date.now();
      if (res.user) state.user = res.user;
      render();
      return res.profile;
    }, function (err) {
      state.loading = null;
      if (!state.profile) renderError(err);
      else toast("Couldn't refresh your profile: " + err.message, 3000);
      throw err;
    });
    return state.loading;
  }

  /** Called by app.js whenever the user summary changes (XP, settings …). */
  function update(user) {
    if (!user) return;
    state.user = user;
    syncCurly();
    if (cy.built && cy.locks !== lockKey()) refreshCurly(); // a new level or streak unlocked something
    if (!state.profile) {
      // First call on page load: fetch the full profile once the path is drawn.
      if (!state.prefetch) state.prefetch = setTimeout(function () { load().catch(function () {}); }, 1200);
      if (!state.built) buildShell();
      renderHero();
      return;
    }
    var p = state.profile;
    var xpChanged = p.xp !== user.gems;
    p.username = user.username;
    p.avatarUrl = user.avatarUrl;
    p.bio = user.bio;
    if (p.account) {
      p.account.email = user.email;
      p.account.profilePublic = user.profilePublic;
      p.account.dailyGoal = user.dailyGoal;
    }
    p.timezone = user.timezone;
    renderHero();
    if (xpChanged) {
      state.loadedAt = 0;
      if (viewActive()) load(true).catch(function () {});
    }
  }

  function applyUser(user) {
    if (app().applyUser) app().applyUser(user);
    else update(user);
  }

  /* ===============================================================
     Shell
  ================================================================*/

  // "curly" is labelled with the mascot's current name (it can be renamed there)
  var TABS = [["overview", "Overview"], ["activity", "Activity"], ["settings", "Settings"], ["theme", "Theme"], ["curly", "Curly"]];
  function tabLabel(t) { return t[0] === "curly" ? esc(curlyName()) : t[1]; }

  function buildShell() {
    var view = $("view-profile");
    if (!view) return;
    view.innerHTML =
      '<div class="practice-shell online-view pf-shell">' +
        '<div id="pf-hero"></div>' +
        '<div class="pf-tabs liquid-glass" role="tablist" aria-label="Profile sections" id="pf-tabs">' +
          TABS.map(function (t) {
            var on = t[0] === state.tab;
            return '<button type="button" role="tab" class="pf-tab" id="pf-tab-' + t[0] + '" aria-controls="pf-panel-' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tab="' + t[0] + '"' + (t[0] === "curly" && !mascot() ? " hidden" : "") + ">" + tabLabel(t) + "</button>";
          }).join("") +
        "</div>" +
        TABS.map(function (t) {
          return '<section class="pf-panel" role="tabpanel" id="pf-panel-' + t[0] + '" aria-labelledby="pf-tab-' + t[0] + '"' + (t[0] === state.tab ? "" : " hidden") + ">" +
            '<div class="pf-loading" aria-live="polite"><span class="pf-spinner" aria-hidden="true"></span>Loading your profile…</div></section>';
        }).join("") +
      "</div>";
    state.built = true;
    state.settingsBuilt = false;
    // the Theme and Curly tabs need no profile data: draw them right away
    th.built = false;
    renderTheme();
    cy.built = false;
    renderCurly();
  }

  function selectTab(name, focus) {
    state.tab = name;
    TABS.forEach(function (t) {
      var on = t[0] === name;
      var tab = $("pf-tab-" + t[0]);
      var panel = $("pf-panel-" + t[0]);
      if (tab) { tab.setAttribute("aria-selected", on); tab.tabIndex = on ? 0 : -1; if (on && focus) tab.focus(); }
      if (panel) panel.hidden = !on;
    });
    if (name === "settings") {
      if (state.profile && !state.settingsBuilt) renderSettings();
      loadSessions();
    }
    if (name === "activity") revealHeatmap();
    if (name === "theme") openTheme();
    if (name === "curly") openCurly();
  }

  function renderError(err) {
    ["overview", "activity", "settings"].forEach(function (t) {
      var panel = $("pf-panel-" + t);
      if (panel) {
        panel.innerHTML = '<div class="pf-card liquid-glass pf-empty"><p>Couldn\'t load your profile: ' + esc(err.message) + "</p>" +
          '<button type="button" class="wordle-btn ghost" data-act="retry">Try again</button></div>';
      }
    });
  }

  function render() {
    if (!state.built) buildShell();
    renderHero();
    $("pf-panel-overview").innerHTML = overviewHtml(state.profile);
    $("pf-panel-activity").innerHTML = activityHtml(state.profile);
    animateIn($("pf-panel-overview"));
    if (state.tab === "activity") revealHeatmap();
    if (!state.settingsBuilt) {
      if (state.tab === "settings") renderSettings();
      else $("pf-panel-settings").innerHTML = '<div class="pf-loading"><span class="pf-spinner" aria-hidden="true"></span>Loading…</div>';
    } else {
      renderAccountNotes();
    }
  }

  /* ===============================================================
     Hero (shared by your profile and other learners')
  ================================================================*/

  function ringHtml(p) {
    var needed = p.levelXpNeeded || 0;
    var ratio = needed ? Math.min(1, (p.levelXp || 0) / needed) : 0;
    return '<svg class="level-ring pf-ring" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle class="level-ring-track" cx="50" cy="50" r="46"/>' +
      '<circle class="level-ring-fill pf-ring-fill" cx="50" cy="50" r="46" data-offset="' + (LEVEL_RING * (1 - ratio)).toFixed(1) + '"/></svg>';
  }

  function heroHtml(p, own) {
    var bio = p.bio
      ? '<p class="pf-bio">' + esc(p.bio) + "</p>"
      : own ? '<p class="pf-bio pf-bio-empty"><button type="button" class="pf-link" data-act="edit-bio">Add a short bio</button> so others know what you are learning.</p>' : "";
    var meta = ['<li>' + icon("calendar") + "Joined " + esc(longDate(p.joinedAt)) + "</li>"];
    if (!p.private) {
      if (p.xp != null) meta.push('<li>' + icon("bolt") + fmt(p.xp) + " XP</li>");
      if (p.stats) meta.push('<li>' + icon("book") + fmt(p.stats.lessonsCompleted) + " lesson" + (p.stats.lessonsCompleted === 1 ? "" : "s") + "</li>");
      if (p.stats) meta.push('<li>' + icon("trophy") + "#" + fmt(p.stats.weeklyRank) + " this week</li>");
      if (own && p.timezone) meta.push('<li>' + icon("globe") + esc(p.timezone.replace(/_/g, " ")) + "</li>");
    }
    var chips = '<span class="pf-chip">Level ' + p.level + "</span>";
    if (own && p.account && !p.account.profilePublic) chips += '<span class="pf-chip pf-chip-muted">' + icon("lock") + "Private</span>";
    var needed = p.levelXpNeeded || 0;
    var levelTip = needed ? "Level " + p.level + ": " + fmt(Math.min(p.levelXp || 0, needed)) + " / " + fmt(needed) + " XP, " + fmt(Math.max(0, needed - (p.levelXp || 0))) + " XP to level " + (p.level + 1) : "";
    return '<section class="pf-hero">' +
      '<div class="pf-hero-avatar"' + (levelTip ? ' title="' + esc(levelTip) + '"' : "") + ">" + ringHtml(p) +
        Avatar.html(p, "pf-avatar-lg", p.username + "'s profile picture") +
        (own ? '<button type="button" class="pf-avatar-edit" data-act="pick-avatar" aria-label="Change profile picture">' + icon("camera") + "</button>" : "") +
      "</div>" +
      '<div class="pf-hero-body">' +
        '<div class="pf-hero-title"><h2>' + esc(p.username) + "</h2>" + chips + "</div>" +
        bio +
        '<ul class="pf-meta">' + meta.join("") + "</ul>" +
      "</div>" +
      (own ? '<button type="button" class="wordle-btn ghost pf-hero-edit" data-act="edit-profile">' + icon("edit") + "Edit profile</button>" : "") +
    "</section>";
  }

  function renderHero() {
    var host = $("pf-hero");
    if (!host) return;
    var p = state.profile;
    if (!p && state.user) {
      var u = state.user;
      p = { username: u.username, avatarUrl: u.avatarUrl, bio: u.bio, joinedAt: u.joinedAt, level: u.level, xp: u.gems,
            levelXp: u.levelXp, levelXpNeeded: u.levelXpNeeded, streak: u.streakCount, timezone: u.timezone,
            account: { profilePublic: u.profilePublic } };
    }
    if (!p) return;
    host.innerHTML = heroHtml(p, true);
    animateIn(host);
  }

  /** Bars, columns and rings start empty and grow in, like the rest of the app. */
  function animateIn(root) {
    if (!root) return;
    var els = root.querySelectorAll("[data-w], [data-h], [data-offset]");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        els.forEach(function (el) {
          if (el.hasAttribute("data-w")) el.style.width = el.getAttribute("data-w") + "%";
          if (el.hasAttribute("data-h")) el.style.height = el.getAttribute("data-h") + "%";
          if (el.hasAttribute("data-offset")) el.style.strokeDashoffset = el.getAttribute("data-offset");
        });
      });
    });
  }

  var DONUT = 2 * Math.PI * 42;

  /** Ring for a 0–1 share with a label in the middle (daily goal, win rate, badge progress). */
  function donut(ratio, inner, cls) {
    ratio = Math.max(0, Math.min(1, ratio || 0));
    return '<div class="pf-donut' + (cls ? " " + cls : "") + '">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="pf-donut-track" cx="50" cy="50" r="42"/>' +
        '<circle class="pf-donut-fill" cx="50" cy="50" r="42" stroke-dasharray="' + DONUT.toFixed(1) + '" stroke-dashoffset="' + DONUT.toFixed(1) +
        '" data-offset="' + (DONUT * (1 - ratio)).toFixed(1) + '"/></svg>' +
      '<div class="pf-donut-inner">' + inner + "</div></div>";
  }

  function section(title, body, cls) {
    return '<section class="pf-section' + (cls ? " " + cls : "") + '"><h3>' + title + "</h3>" + body + "</section>";
  }

  /* ===============================================================
     Overview
  ================================================================*/

  /** Daily goal as a ring; only on your own profile (others have no account block). */
  function todayHtml(p) {
    if (!p.account) return "";
    var a = p.account;
    var done = a.xpToday >= a.dailyGoal;
    return '<div class="pf-today">' +
      donut(a.dailyGoal ? a.xpToday / a.dailyGoal : 0,
        (done ? icon("check", "pf-donut-check") : "<b>" + fmt(a.xpToday) + "</b><span>/ " + fmt(a.dailyGoal) + " XP</span>"),
        done ? "is-done" : "") +
      '<p class="pf-today-label">' + (done ? "Goal reached" : "Today") + "</p>" +
      '<p class="pf-today-sub">Goal hit on ' + fmt(p.stats.goalDays) + " day" + (p.stats.goalDays === 1 ? "" : "s") + "</p>" +
    "</div>";
  }

  /** XP per day for the last 7 days (from the heatmap), with the streak on top. */
  function weekHtml(p) {
    var days = (p.heatmap && p.heatmap.days) || {};
    var end = p.heatmap ? parseDay(p.heatmap.to) : new Date();
    var goal = p.account ? p.account.dailyGoal : 0;
    var week = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(end);
      d.setDate(d.getDate() - i);
      week.push({ date: d, xp: days[dayKey(d)] || 0, today: i === 0 });
    }
    var top = Math.max.apply(null, week.map(function (w) { return w.xp; }).concat([1]));
    // The goal line only shows when it fits near the bars; a far-off goal would flatten them.
    if (goal > top * 1.5) goal = 0;
    else top = Math.max(top, goal);
    var cols = week.map(function (w) {
      var label = w.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }) + ": " + (w.xp ? fmt(w.xp) + " XP" : "no activity");
      return '<li' + (w.today ? ' class="is-today"' : "") + ' title="' + esc(label) + '">' +
        '<div class="pf-col-track"><div class="pf-col' + (goal && w.xp >= goal ? " is-done" : "") + '" data-h="' + (w.xp ? Math.max(4, 100 * w.xp / top) : 0).toFixed(1) + '"></div></div>' +
        "<span>" + w.date.toLocaleDateString("en-GB", { weekday: "narrow" }) + "</span></li>";
    }).join("");
    var quiet = !week.some(function (w) { return w.xp; });
    return '<div class="pf-week">' +
      '<div class="pf-streak' + (p.streak ? " is-hot" : "") + '">' + icon("flame", "pf-streak-ic") +
        "<b>" + fmt(p.streak) + '</b><span>day streak<small>Best ' + fmt(p.streakBest) + "</small></span></div>" +
      (quiet ? '<p class="pf-muted pf-small">No XP in the last 7 days.</p>'
        : '<ol class="pf-cols pf-week-cols" style="--goal:' + (goal ? (goal / top).toFixed(3) : 0) + '" role="img" aria-label="XP per day over the last 7 days">' +
          (goal ? '<li class="pf-goal-line" aria-hidden="true"></li>' : "") + cols + "</ol>") +
    "</div>";
  }

  function highlightsHtml(p) {
    return '<section class="pf-highlights">' + todayHtml(p) + weekHtml(p) + "</section>";
  }

  /** One segment per lesson; filled ones are done. */
  function stepsHtml(c) {
    var done = c.total && c.completed >= c.total;
    var steps = "";
    for (var i = 0; i < c.total; i++) steps += '<span class="' + (i < c.completed ? "is-done" : "") + '"></span>';
    return '<div class="pf-steps' + (done ? " is-complete" : "") + '" role="img" aria-label="' + c.completed + " of " + c.total + ' lessons done">' + steps + "</div>";
  }

  function pipsHtml(level) {
    var name = PLACEMENT[level] || "level " + level;
    var pips = "";
    for (var i = 1; i <= 5; i++) pips += '<span class="' + (i <= level ? "is-on" : "") + '"></span>';
    return '<span class="pf-pips" title="Placed at ' + esc(name) + '" role="img" aria-label="Placed at ' + esc(name) + '">' + pips + "</span>";
  }

  function coursesHtml(p) {
    if (!p.courses || !p.courses.length) return "";
    return section("Courses", '<ul class="pf-courses">' +
      p.courses.map(function (c) {
        var complete = c.total && c.completed >= c.total;
        var next = complete ? '<span class="pf-course-next is-done">' + icon("check") + "Course complete</span>"
          : c.currentLesson ? '<span class="pf-course-next">Next: ' + esc(c.currentLesson) + "</span>" : "";
        return '<li class="pf-course">' +
          '<div class="pf-course-head"><b>' + esc(c.name) + "</b>" + (c.active ? '<span class="pf-chip">Active</span>' : "") +
            (c.placementLevel ? pipsHtml(c.placementLevel) : "") +
            '<span class="pf-course-num">' + c.completed + "/" + c.total + "</span></div>" +
          stepsHtml(c) +
          next +
        "</li>";
      }).join("") +
    "</ul>");
  }

  /** A shelf of medals: earned ones in gold, the next ones with a progress ring. */
  function badgesHtml(p) {
    var earned = p.badges.map(function (b) {
      return '<li class="pf-medal is-earned" title="' + esc(b.label + (b.earnedAt ? " · earned " + longDate(b.earnedAt) : "")) + '">' +
        '<div class="pf-medal-disc">' + icon("medal", "pf-medal-ic") + "</div><b>" + esc(b.name) + "</b><span>" + esc(b.label) + "</span></li>";
    });
    var next = (p.nextBadges || []).map(function (b) {
      return '<li class="pf-medal" title="' + esc(b.label + " · " + b.course + " · " + b.progressPercent + "% done") + '">' +
        donut(b.progressPercent / 100, icon("medal", "pf-medal-ic"), "pf-medal-ring") + "<b>" + esc(b.name) + "</b><span>" + esc(b.label) + "</span></li>";
    });
    var body = earned.length || next.length
      ? '<ul class="pf-shelf">' + earned.join("") + next.join("") + "</ul>"
      : '<p class="pf-muted">No badges yet. Finish a unit to earn one.</p>';
    return section("Badges", body);
  }

  function overviewHtml(p) {
    return highlightsHtml(p) + coursesHtml(p) + badgesHtml(p);
  }

  /* ===============================================================
     Activity
  ================================================================*/

  /** GitHub-style calendar: one column per week (Mon–Sun), one hue from dim to bright. */
  function heatmapHtml(h) {
    var days = h.days || {};
    var from = parseDay(h.from);
    var to = parseDay(h.to);
    var start = new Date(from);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // back to Monday
    var max = 0;
    Object.keys(days).forEach(function (k) { max = Math.max(max, days[k]); });

    var cells = "";
    var months = [];
    var col = 0;
    var lastMonth = -1;
    for (var d = new Date(start); d <= to; d.setDate(d.getDate() + 1)) {
      var dow = (d.getDay() + 6) % 7;
      if (dow === 0) {
        col++;
        if (d.getMonth() !== lastMonth) {
          // A month that starts right after the first (partial) one would overlap its label: keep the newer.
          var prev = months[months.length - 1];
          if (prev && col - prev.col < 3) months.pop();
          months.push({ col: col, text: d.toLocaleDateString("en-GB", { month: "short" }) });
          lastMonth = d.getMonth();
        }
      }
      var key = dayKey(d);
      if (d < from) { cells += '<span class="pf-heat-cell is-out" style="grid-row:' + (dow + 1) + '"></span>'; continue; }
      var xp = days[key] || 0;
      var lvl = xp ? Math.max(1, Math.ceil(4 * xp / max)) : 0;
      var label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + ": " + (xp ? fmt(xp) + " XP" : "no activity");
      cells += '<span class="pf-heat-cell l' + lvl + '" style="grid-row:' + (dow + 1) + '" data-tip="' + esc(label) + '"></span>';
    }
    return '<div class="pf-heat" style="--weeks:' + col + '">' +
      '<div class="pf-heat-months" aria-hidden="true">' + months.map(function (m) {
        return '<span style="grid-column:' + m.col + '">' + m.text + "</span>";
      }).join("") + "</div>" +
      '<div class="pf-heat-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div>' +
      '<div class="pf-heat-grid" role="img" aria-label="XP per day over the last 26 weeks">' + cells + "</div>" +
      "</div>" +
      '<div class="pf-heat-legend" aria-hidden="true">Less<span class="pf-heat-cell l0"></span><span class="pf-heat-cell l1"></span><span class="pf-heat-cell l2"></span><span class="pf-heat-cell l3"></span><span class="pf-heat-cell l4"></span>More</div>';
  }

  function heatCardHtml(p) {
    var s = p.stats;
    var summary = [
      "<b>" + fmt(s.xpWeek) + "</b> XP this week",
      "<b>" + fmt(s.xpMonth) + "</b> XP in 30 days",
      "<b>" + fmt(s.activeDays) + "</b> active day" + (s.activeDays === 1 ? "" : "s")
    ];
    if (s.bestDay) summary.push("best day <b>" + fmt(s.bestDay.xp) + " XP</b> (" + esc(longDate(s.bestDay.day)) + ")");
    return '<section class="pf-card liquid-glass"><h3>Activity</h3>' +
      '<p class="pf-summary">' + summary.join('<span class="pf-dot" aria-hidden="true">·</span>') + "</p>" +
      heatmapHtml(p.heatmap) +
      '<div class="pf-tip" role="tooltip" hidden></div>' +
    "</section>";
  }

  function sourcesHtml(p) {
    var rows = p.xpBySource || [];
    if (!rows.length) return "";
    var max = rows[0].xp || 1;
    var total = rows.reduce(function (a, r) { return a + r.xp; }, 0) || 1;
    return section("Where your XP comes from", '<ul class="pf-hbars">' +
      rows.map(function (r) {
        return '<li title="' + Math.round(100 * r.xp / total) + '% of your XP"><span class="pf-hbar-label">' + icon(SOURCE_ICON[r.source] || "star") + esc(SOURCES[r.source] || r.source) + "</span>" +
          '<div class="pf-hbar-track"><div class="pf-bar-fill" data-w="' + (100 * r.xp / max).toFixed(1) + '"></div></div>' +
          '<span class="pf-hbar-val">' + fmt(r.xp) + "</span></li>";
      }).join("") +
    "</ul>");
  }

  function streakBit(now, best) {
    return '<span class="pf-game-streak' + (now ? " is-hot" : "") + '" title="Current streak ' + now + ", best " + best + '">' + icon("flame") + now + "<small>/ best " + best + "</small></span>";
  }

  function gamesHtml(p) {
    var g = p.games;
    var w = g.wordle;
    var maxDist = Math.max.apply(null, w.dist.concat([1]));
    // "–" instead of a misleading 0 % before the first game
    var winPct = w.played ? Math.round(100 * w.won / w.played) + "%" : "–";
    var storyPct = g.story.played ? Math.round(100 * g.story.correct / g.story.played) + "%" : "–";
    function head(ic, title, sub) {
      return '<div class="pf-game-head">' + icon(ic, "pf-game-ic") + "<h4>" + title + "<small>" + sub + "</small></h4></div>";
    }
    var dist = w.won
      ? '<ol class="pf-cols pf-dist" role="img" aria-label="Wins by number of guesses: ' + w.dist.join(", ") + '">' + w.dist.map(function (n, i) {
          return '<li title="' + n + " win" + (n === 1 ? "" : "s") + " in " + (i + 1) + '"><div class="pf-col-track"><div class="pf-col" data-h="' + (n ? Math.max(6, 100 * n / maxDist) : 0).toFixed(1) + '"></div></div><span>' + (i + 1) + "</span></li>";
        }).join("") + "</ol>"
      : '<p class="pf-muted pf-small">No wins yet. Today\'s word is waiting in Practice.</p>';
    return section("Practice games", '<div class="pf-games">' +
      '<div class="pf-game">' + head("grid", "Wordle", w.played + " played") +
        '<div class="pf-game-body">' + donut(w.played ? w.won / w.played : 0, "<b>" + winPct + "</b><span>won</span>", "is-ok") + dist + "</div>" +
        streakBit(w.streak, w.maxStreak) +
      "</div>" +
      '<div class="pf-game">' + head("updown", "Older or Younger", g.older.runs + " run" + (g.older.runs === 1 ? "" : "s")) +
        '<div class="pf-game-body"><div class="pf-best">' + icon("star") + "<b>" + fmt(g.older.best) + "</b><span>best run</span></div></div>" +
      "</div>" +
      '<div class="pf-game">' + head("story", "Daily Story", g.story.played + " answered") +
        '<div class="pf-game-body">' + donut(g.story.played ? g.story.correct / g.story.played : 0, "<b>" + storyPct + "</b><span>correct</span>", "is-ok") + "</div>" +
        streakBit(g.story.streak, g.story.best) +
      "</div>" +
    "</div>");
  }

  function recentLabel(r) {
    switch (r.source) {
      case "lesson": case "quest": case "quiz": case "exam":
        return (r.source === "quiz" ? "Passed quiz " : r.source === "exam" ? "Passed exam " : "Completed ") + (r.title ? "“" + esc(r.title) + "”" : "a lesson");
      case "wordle": return "Solved Wordle" + (r.ref ? " #" + r.ref : "");
      case "older_younger": return "Played Older or Younger";
      case "daily_story": return "Answered the Daily Story" + (r.title ? ": " + esc(r.title) : "");
      case "badge": return "Earned a badge";
      default: return esc(SOURCES[r.source] || r.source);
    }
  }

  function dayHeading(iso) {
    var d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diff = Math.round((today - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  }

  /** Timeline grouped by day, one icon per kind of XP. */
  function recentHtml(p) {
    if (!p.recent) return "";
    if (!p.recent.length) return section("Recent activity", '<p class="pf-muted">Nothing yet. Finish a lesson or play today\'s Wordle to get started.</p>');
    var groups = [];
    p.recent.forEach(function (r) {
      var day = dayHeading(r.at);
      if (!groups.length || groups[groups.length - 1].day !== day) groups.push({ day: day, items: [] });
      groups[groups.length - 1].items.push(r);
    });
    return section("Recent activity", '<div class="pf-timeline">' + groups.map(function (g) {
      return '<h4 class="pf-tl-day">' + esc(g.day) + '</h4><ul class="pf-tl">' + g.items.map(function (r) {
        var at = new Date(r.at);
        return '<li><span class="pf-tl-ic">' + icon(SOURCE_ICON[r.source] || "star") + '</span><span class="pf-tl-text">' + recentLabel(r) + "</span>" +
          '<time datetime="' + esc(r.at) + '" title="' + esc(at.toLocaleString("en-GB")) + '">' + esc(at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })) + "</time>" +
          '<b class="pf-tl-xp">' + (r.xp >= 0 ? "+" : "") + fmt(r.xp) + "</b></li>";
      }).join("") + "</ul>";
    }).join("") + "</div>");
  }

  function activityHtml(p) {
    return heatCardHtml(p) + sourcesHtml(p) + gamesHtml(p) + recentHtml(p);
  }

  function revealHeatmap() {
    var panel = $("pf-panel-activity");
    if (panel && !panel.hidden) animateIn(panel);
  }

  /* Heatmap tooltip: one floating element per card, follows the hovered cell. */
  var shownTip = null;
  function heatTip(e) {
    var cell = e.target.closest ? e.target.closest(".pf-heat-cell[data-tip]") : null;
    if (!cell) {
      if (shownTip) { shownTip.hidden = true; shownTip = null; }
      return;
    }
    var card = cell.closest(".pf-card");
    var tip = card && card.querySelector(".pf-tip");
    if (!tip) return;
    if (shownTip && shownTip !== tip) shownTip.hidden = true;
    shownTip = tip;
    var cr = card.getBoundingClientRect();
    var r = cell.getBoundingClientRect();
    tip.textContent = cell.getAttribute("data-tip");
    tip.hidden = false;
    var x = r.left - cr.left + r.width / 2;
    x = Math.max(tip.offsetWidth / 2 + 8, Math.min(cr.width - tip.offsetWidth / 2 - 8, x));
    tip.style.left = x + "px";
    tip.style.top = (r.top - cr.top - 8) + "px";
  }
  document.addEventListener("pointerover", heatTip);
  document.addEventListener("pointerdown", heatTip);

  /* ===============================================================
     Settings
  ================================================================*/

  function field(id, label, input, hint) {
    return '<div class="pf-field"><label for="' + id + '">' + label + "</label>" + input +
      (hint != null ? '<p class="pf-hint" id="' + id + '-hint" aria-live="polite">' + hint + "</p>" : "") + "</div>";
  }
  function passInput(id, auto, placeholder) {
    return '<div class="pf-pass"><input type="password" class="pf-input" id="' + id + '" autocomplete="' + auto + '" placeholder="' + (placeholder || "") + '" maxlength="200">' +
      '<button type="button" class="pf-eye" data-act="toggle-pass" data-for="' + id + '" aria-label="Show password" aria-pressed="false">' + icon("eye") + "</button></div>";
  }

  function settingsHtml(p) {
    var a = p.account;
    var u = state.user || {};
    return '' +
      // Profile: picture, bio, visibility
      '<section class="pf-card liquid-glass" id="pf-set-profile"><h3>Profile</h3>' +
        '<div class="pf-avatar-row">' +
          '<div class="pf-drop" id="pf-drop" data-act="pick-avatar" role="button" tabindex="0" aria-label="Upload a profile picture">' +
            '<span id="pf-avatar-preview"></span><span class="pf-drop-hint">' + icon("upload") + "Drop image</span></div>" +
          '<div class="pf-avatar-side">' +
            "<p>JPG, PNG or GIF. You can crop it before it is saved. Without a picture, your avatar is a gradient made from your username.</p>" +
            '<div class="pf-actions"><button type="button" class="wordle-btn" data-act="pick-avatar">' + icon("upload") + "Upload picture</button>" +
            '<button type="button" class="wordle-btn ghost" data-act="remove-avatar" id="pf-avatar-remove"' + (p.avatarUrl ? "" : " hidden") + ">Remove</button></div>" +
          "</div>" +
        "</div>" +
        '<form id="pf-bio-form" class="pf-form" novalidate>' +
          field("pf-bio", "Bio", '<textarea class="pf-input pf-textarea" id="pf-bio" rows="3" maxlength="' + BIO_MAX + '" placeholder="What are you learning? What would you like to build?">' + esc(p.bio) + "</textarea>" +
            '<div class="pf-field-foot"><span id="pf-bio-count" aria-live="polite">' + (p.bio || "").length + " / " + BIO_MAX + "</span></div>") +
          '<div class="pf-form-foot"><button type="submit" class="wordle-btn" id="pf-bio-save" disabled>Save bio</button><p class="pf-error" id="pf-bio-error" role="alert"></p></div>' +
        "</form>" +
        '<label class="pf-switch"><input type="checkbox" id="pf-public"' + (a.profilePublic ? " checked" : "") + '><span class="pf-switch-ui" aria-hidden="true"></span>' +
          "<span><b>Public profile</b><small>Other learners can open your profile from the leaderboard and see your bio, stats and badges. When off, they see only your name, picture and level.</small></span></label>" +
      "</section>" +

      // Username
      '<section class="pf-card liquid-glass" id="pf-set-name"><h3>Username</h3>' +
        '<div id="pf-name-note"></div>' +
        '<form id="pf-name-form" class="pf-form" novalidate>' +
          field("pf-name", "New username", '<div class="pf-input-wrap"><input type="text" class="pf-input" id="pf-name" value="' + esc(p.username) + '" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false" aria-describedby="pf-name-hint"><span class="pf-status" id="pf-name-status" aria-hidden="true"></span></div>',
            "3–20 letters, numbers or underscores.") +
          field("pf-name-pass", "Current password", passInput("pf-name-pass", "current-password")) +
          '<div class="pf-form-foot"><button type="submit" class="wordle-btn" id="pf-name-save" disabled>Change username</button><p class="pf-error" id="pf-name-error" role="alert"></p></div>' +
        "</form>" +
      "</section>" +

      // E-mail
      '<section class="pf-card liquid-glass" id="pf-set-email"><h3>E-mail</h3><div id="pf-email-body"></div></section>' +

      // Password
      '<section class="pf-card liquid-glass" id="pf-set-pass"><h3>Password</h3>' +
        '<p class="pf-note" id="pf-pass-note"></p>' +
        '<form id="pf-pass-form" class="pf-form" novalidate>' +
          '<input type="text" autocomplete="username" value="' + esc(p.username) + '" hidden aria-hidden="true" tabindex="-1">' +
          field("pf-pass-current", "Current password", passInput("pf-pass-current", "current-password")) +
          field("pf-pass-new", "New password", passInput("pf-pass-new", "new-password") +
            '<div class="pf-strength"><div class="pf-strength-bar"><div class="pf-strength-fill" id="pf-strength-fill" data-level="0"></div></div><span id="pf-strength-label">Enter a password</span></div>' +
            '<ul class="pf-rules" id="pf-rules">' +
              [["length", "8+ characters"], ["upper", "Uppercase letter"], ["lower", "Lowercase letter"], ["number", "Number"], ["special", "Symbol"]].map(function (r) {
                return '<li data-rule="' + r[0] + '"><span aria-hidden="true">○</span>' + r[1] + "</li>";
              }).join("") +
            "</ul>") +
          field("pf-pass-confirm", "Repeat new password", passInput("pf-pass-confirm", "new-password"), "") +
          '<div class="pf-form-foot"><button type="submit" class="wordle-btn" id="pf-pass-save" disabled>Change password</button><p class="pf-error" id="pf-pass-error" role="alert"></p></div>' +
        "</form>" +
      "</section>" +

      // Preferences
      '<section class="pf-card liquid-glass" id="pf-set-prefs"><h3>Preferences</h3>' +
        '<label class="pf-row" for="pf-goal"><span><b>Daily goal</b><small>XP you aim for each day. It fills the ring in the sidebar.</small></span>' +
          '<select id="pf-goal" class="pf-select">' + goalOptions(a.dailyGoal) + "</select></label>" +
        '<label class="pf-row" for="pf-tz"><span><b>Time zone</b><small>Your day, streak and daily Wordle roll over at midnight here.</small></span>' +
          '<select id="pf-tz" class="pf-select">' + tzOptions(u.timezone || p.timezone) + "</select></label>" +
        '<p class="pf-tz-detect" id="pf-tz-detect"></p>' +
        '<label class="pf-row" for="pf-effects"><span><b>Visual effects</b><small id="pf-effects-note"></small></span>' +
          '<select id="pf-effects" class="pf-select"><option value="auto">Auto</option><option value="full">Full</option><option value="lite">Lite</option></select></label>' +
      "</section>" +

      // Devices
      '<section class="pf-card liquid-glass" id="pf-set-devices"><h3>Devices</h3>' +
        '<p class="pf-note">Where you are logged in. Sign out anything you don\'t recognise, then change your password.</p>' +
        '<ul class="pf-devices" id="pf-devices"><li class="pf-muted">Loading…</li></ul>' +
        '<div class="pf-actions"><button type="button" class="wordle-btn ghost" data-act="signout-others" id="pf-signout-others" hidden>Sign out all other devices</button></div>' +
      "</section>" +

      // Google / GitHub
      '<section class="pf-card liquid-glass" id="pf-set-providers"><h3>Sign-in methods</h3>' + providersHtml(a) + "</section>" +

      // Data + account
      '<section class="pf-card liquid-glass" id="pf-set-account"><h3>Your data</h3>' +
        '<p class="pf-note">Download everything Codle stores about you as a JSON file: account, progress, XP history, game results and saved code.</p>' +
        '<p class="pf-note">How Codle handles your data: <a class="pf-link" href="privacy.html">Privacy Policy</a> · <a class="pf-link" href="terms.html">Terms of Service</a></p>' +
        '<div class="pf-actions">' +
          '<button type="button" class="wordle-btn ghost" data-act="export">' + icon("download") + "Download my data</button>" +
          '<button type="button" class="wordle-btn ghost" data-act="logout">Log out</button>' +
          '<button type="button" class="wordle-btn ghost pf-danger" data-act="toggle-delete">Delete account</button>' +
        "</div>" +
        '<form class="pf-delete-form" id="pf-delete-form" hidden>' +
          "<p>This deletes your account, your progress and your profile picture for good. It cannot be undone. Enter your password to confirm.</p>" +
          passInput("pf-delete-pass", "current-password", "Password") +
          '<button type="submit" class="wordle-btn pf-danger-solid">Delete for good</button>' +
          '<p class="pf-error" id="pf-delete-error" role="alert"></p>' +
        "</form>" +
      "</section>";
  }

  function goalOptions(current) {
    var goals = GOALS.indexOf(current) < 0 ? GOALS.concat([current]).sort(function (x, y) { return x - y; }) : GOALS;
    return goals.map(function (g) { return '<option value="' + g + '"' + (g === current ? " selected" : "") + ">" + g + " XP</option>"; }).join("");
  }

  function tzOptions(current) {
    var zones = [];
    try { if (Intl.supportedValuesOf) zones = Intl.supportedValuesOf("timeZone"); } catch (e) { /* older browser */ }
    if (!zones.length) zones = ["Europe/Prague", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "UTC"];
    if (current && zones.indexOf(current) < 0) zones = [current].concat(zones);
    return zones.map(function (z) { return '<option value="' + esc(z) + '"' + (z === current ? " selected" : "") + ">" + esc(z.replace(/_/g, " ")) + "</option>"; }).join("");
  }

  function renderSettings() {
    var panel = $("pf-panel-settings");
    if (!panel || !state.profile) return;
    panel.innerHTML = settingsHtml(state.profile);
    state.settingsBuilt = true;
    renderAvatarPreview();
    renderAccountNotes();
    renderEmail();
    renderEffects();
    renderTzDetect();
    if (state.sessions) renderSessions();
  }

  function renderAvatarPreview() {
    var host = $("pf-avatar-preview");
    if (host && state.profile) host.innerHTML = Avatar.html(state.profile, "pf-avatar-md");
    var rm = $("pf-avatar-remove");
    if (rm) rm.hidden = !state.profile.avatarUrl;
  }

  /** Username cooldown and password dates; refreshed after every load. */
  /** Google / GitHub linked to the account, with a link to connect the other one. */
  var PROVIDER_NAMES = { google: "Google", github: "GitHub" };
  function providersHtml(a) {
    var linked = a.providers || [];
    var available = a.providersAvailable || [];
    var all = ["google", "github"].filter(function (p) { return linked.indexOf(p) >= 0 || available.indexOf(p) >= 0; });
    if (!all.length) return '<p class="pf-note">Signing in with Google or GitHub is not available on this server.</p>';
    var rows = all.map(function (p) {
      var on = linked.indexOf(p) >= 0;
      return '<div class="pf-row"><span><b>' + PROVIDER_NAMES[p] + "</b><small>" + (on ? "Connected. You can log in with it." : "Not connected.") + "</small></span>" +
        (on ? '<span class="pf-chip pf-chip-ok">Connected</span>'
            : '<a class="wordle-btn ghost" href="api/auth/oauth/' + p + '/start">Connect</a>') + "</div>";
    }).join("");
    return '<p class="pf-note">Log in with one click, no password needed. Your password keeps working too.</p>' + rows;
  }

  function renderAccountNotes() {
    var a = state.profile && state.profile.account;
    if (!a) return;
    var note = $("pf-name-note");
    if (note) {
      var html = '<p class="pf-note">You can change your username once every ' + a.usernameCooldownDays + " days. Your old name stays reserved for you for a while, so nobody else can pose as you.</p>";
      if (a.usernameNextChange) {
        html += '<p class="pf-note pf-warn">' + icon("lock") + "Next change possible on <b>" + esc(longDate(a.usernameNextChange)) + "</b>. Until then you can only change the letter case.</p>";
      }
      if (a.previousNames && a.previousNames.length) {
        html += '<p class="pf-note">Previously: ' + a.previousNames.map(esc).join(", ") + "</p>";
      }
      note.innerHTML = html;
    }
    var pn = $("pf-pass-note");
    if (pn) {
      pn.textContent = (a.passwordChangedAt ? "Last changed " + longDate(a.passwordChangedAt) + ". " : "") +
        "Changing it signs you out on every other device.";
    }
  }

  function renderEffects() {
    var sel = $("pf-effects");
    var note = $("pf-effects-note");
    var perf = window.CodlePerf;
    if (!sel || !perf) { if (sel) sel.closest(".pf-row").hidden = true; return; }
    sel.value = perf.mode;
    var text = "Blur, glass and animations. ";
    if (perf.mode === "lite") text += "Lite turns them off for slower devices.";
    else if (perf.mode === "full") text += "Always on, even on slow devices.";
    else text += perf.lite ? "Auto picked Lite here (" + perf.reasons.join(", ") + ")." : "Auto switches to Lite if the page slows down.";
    note.textContent = text;
  }

  function renderTzDetect() {
    var box = $("pf-tz-detect");
    if (!box) return;
    var device = "";
    try { device = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
    var current = $("pf-tz").value;
    box.innerHTML = device && device !== current
      ? 'This device is in <b>' + esc(device.replace(/_/g, " ")) + '</b>. <button type="button" class="pf-link" data-act="use-device-tz" data-tz="' + esc(device) + '">Use it</button>'
      : "";
  }

  /* ----- E-mail (two steps) ----- */

  function renderEmail() {
    var box = $("pf-email-body");
    var a = state.profile && state.profile.account;
    if (!box || !a) return;
    var current = '<p class="pf-current">' + esc(a.email) + (a.emailVerified ? ' <span class="pf-chip pf-chip-ok">Verified</span>' : "") + "</p>";
    if (!state.emailStep) {
      box.innerHTML = current +
        '<form id="pf-email-form" class="pf-form" novalidate>' +
          field("pf-email-new", "New e-mail", '<input type="email" class="pf-input" id="pf-email-new" autocomplete="email" maxlength="254" inputmode="email">') +
          field("pf-email-pass", "Current password", passInput("pf-email-pass", "current-password")) +
          '<div class="pf-form-foot"><button type="submit" class="wordle-btn" id="pf-email-send">Send code</button><p class="pf-error" id="pf-email-error" role="alert"></p></div>' +
          '<p class="pf-note">We send a 6-digit code to the new address. Your e-mail changes only after you enter it.</p>' +
        "</form>";
      return;
    }
    var step = state.emailStep;
    box.innerHTML = current +
      '<form id="pf-code-form" class="pf-form" novalidate>' +
        '<p class="pf-note">We sent a code to <b>' + esc(step.email) + "</b>. It is valid for " + (step.minutes || 15) + " minutes.</p>" +
        field("pf-email-code", "Code", '<input type="text" class="pf-input pf-code" id="pf-email-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}">') +
        '<div class="pf-form-foot"><button type="submit" class="wordle-btn">Confirm e-mail</button>' +
        '<button type="button" class="wordle-btn ghost" data-act="email-back">Back</button><p class="pf-error" id="pf-code-error" role="alert"></p></div>' +
      "</form>";
    var code = $("pf-email-code");
    if (code) code.focus();
  }

  /* ----- Devices ----- */

  function loadSessions() {
    if (!online()) return;
    api.get("me/sessions").then(function (res) {
      state.sessions = res.sessions;
      renderSessions();
    }, function (err) {
      var list = $("pf-devices");
      if (list) list.innerHTML = '<li class="pf-muted">Couldn\'t load your devices: ' + esc(err.message) + "</li>";
    });
  }

  function renderSessions() {
    var list = $("pf-devices");
    if (!list || !state.sessions) return;
    var others = 0;
    list.innerHTML = state.sessions.map(function (s) {
      if (!s.current) others++;
      var mobile = /iOS|Android/.test(s.device);
      return "<li>" + icon(mobile ? "phone" : "device", "pf-device-ic") +
        '<div><b>' + esc(s.device) + "</b>" + (s.current ? ' <span class="pf-chip pf-chip-ok">This device</span>' : "") +
        "<span>Active " + esc(ago(s.lastSeenAt)) + " · signed in " + esc(longDate(s.createdAt)) + "</span></div>" +
        (s.current ? "" : '<button type="button" class="wordle-btn ghost pf-small-btn" data-act="signout" data-id="' + esc(s.id) + '">Sign out</button>') +
      "</li>";
    }).join("") || '<li class="pf-muted">No active sessions.</li>';
    var all = $("pf-signout-others");
    if (all) all.hidden = others < 1;
  }

  /* ----- Username check ----- */

  var nameTimer = null;
  var nameOk = false;

  function checkName() {
    var input = $("pf-name");
    var status = $("pf-name-status");
    var hint = $("pf-name-hint");
    var p = state.profile;
    if (!input || !p) return;
    var val = input.value.trim();
    clearTimeout(nameTimer);
    nameOk = false;
    function set(ok, text, mark) {
      nameOk = ok;
      hint.textContent = text;
      hint.className = "pf-hint" + (ok ? " is-ok" : mark === "bad" ? " is-bad" : "");
      status.textContent = mark === "ok" ? "✓" : mark === "bad" ? "✗" : mark === "wait" ? "…" : "";
      status.className = "pf-status" + (mark ? " is-" + mark : "");
      updateNameButton();
    }
    if (val === p.username) return set(false, "This is your current username.", "");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(val)) return set(false, "3–20 letters, numbers or underscores.", val ? "bad" : "");
    var caseOnly = val.toLowerCase() === p.username.toLowerCase();
    if (caseOnly) return set(true, "Only the letter case changes. That's allowed any time.", "ok");
    if (p.account.usernameNextChange) return set(false, "You can pick a new name on " + longDate(p.account.usernameNextChange) + ".", "bad");
    set(false, "Checking…", "wait");
    nameTimer = setTimeout(function () {
      api.get("auth/username?u=" + encodeURIComponent(val)).then(function (res) {
        if (input.value.trim() !== val) return;
        if (res.available) set(true, "@" + val + " is available.", "ok");
        else set(false, res.reason === "not_allowed" ? "This username isn't allowed." : "This username is already taken.", "bad");
      }, function () { set(false, "Couldn't check the username. Try again.", "bad"); });
    }, 400);
  }

  function updateNameButton() {
    var btn = $("pf-name-save");
    if (btn) btn.disabled = !(nameOk && $("pf-name-pass").value);
  }

  /* ----- Password strength (same rules as registration and the API) ----- */

  var passOk = false;

  function checkPassword() {
    var val = $("pf-pass-new").value;
    var rules = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val)
    };
    var met = 0;
    $("pf-rules").querySelectorAll("li").forEach(function (li) {
      var ok = rules[li.getAttribute("data-rule")];
      li.classList.toggle("met", ok);
      li.firstChild.textContent = ok ? "✓" : "○";
      if (ok) met++;
    });
    var labels = ["Enter a password", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
    $("pf-strength-fill").setAttribute("data-level", val ? met : 0);
    $("pf-strength-label").textContent = val ? labels[met] : labels[0];

    var confirm = $("pf-pass-confirm").value;
    var hint = $("pf-pass-confirm-hint");
    var match = confirm !== "" && confirm === val;
    hint.textContent = confirm ? (match ? "Passwords match." : "Passwords don't match.") : "";
    hint.className = "pf-hint" + (confirm ? (match ? " is-ok" : " is-bad") : "");
    passOk = met === 5 && match && $("pf-pass-current").value !== "";
    $("pf-pass-save").disabled = !passOk;
  }

  /* ===============================================================
     Avatar: pick → crop → upload
  ================================================================*/

  var crop = null;

  /** One file input for every "change picture" button (hero, Settings, drop box). */
  function pickAvatar() {
    var input = $("pf-avatar-file");
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.id = "pf-avatar-file";
      input.accept = "image/jpeg,image/png,image/gif,image/webp";
      input.hidden = true;
      document.body.appendChild(input);
    }
    input.value = "";
    input.click();
  }

  function openCrop(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast("Choose an image (JPG, PNG or GIF)."); return; }
    if (file.size > 25 * 1024 * 1024) { toast("That image is over 25 MB. Choose a smaller one.", 2600); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      if (img.naturalWidth < 32 || img.naturalHeight < 32) { URL.revokeObjectURL(url); toast("The image must be at least 32 × 32 px."); return; }
      showCrop(img, url, file);
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast("This image can't be opened. Try a JPG or PNG."); };
    img.src = url;
  }

  function cropDialog() {
    var dlg = $("pf-crop");
    if (dlg) return dlg;
    dlg = document.createElement("div");
    dlg.className = "pf-modal";
    dlg.id = "pf-crop";
    dlg.hidden = true;
    dlg.innerHTML =
      '<div class="pf-modal-card liquid-glass" role="dialog" aria-modal="true" aria-labelledby="pf-crop-title">' +
        '<h3 id="pf-crop-title">Position your picture</h3>' +
        '<div class="pf-crop-stage" id="pf-crop-stage" tabindex="0" aria-label="Picture position. Use the arrow keys to move, plus and minus to zoom.">' +
          '<canvas id="pf-crop-canvas" width="640" height="640"></canvas><div class="pf-crop-mask" aria-hidden="true"></div></div>' +
        '<div class="pf-zoom">' + icon("zoomOut") + '<input type="range" id="pf-crop-zoom" min="1" max="4" step="0.01" value="1" aria-label="Zoom">' + icon("zoomIn") + "</div>" +
        '<p class="pf-note">Drag to move, scroll or use the slider to zoom.</p>' +
        '<div class="pf-actions pf-modal-actions"><button type="button" class="wordle-btn ghost" data-act="crop-cancel">Cancel</button>' +
        '<button type="button" class="wordle-btn" data-act="crop-save" id="pf-crop-save">Save picture</button></div>' +
      "</div>";
    document.body.appendChild(dlg);

    var stage = dlg.querySelector("#pf-crop-stage");
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      if (!crop) return;
      drag = { x: e.clientX, y: e.clientY, cx: crop.cx, cy: crop.cy };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag || !crop) return;
      var k = 640 / stage.getBoundingClientRect().width; // CSS px → canvas px
      crop.cx = drag.cx + (e.clientX - drag.x) * k;
      crop.cy = drag.cy + (e.clientY - drag.y) * k;
      drawCrop();
    });
    stage.addEventListener("pointerup", function () { drag = null; });
    stage.addEventListener("pointercancel", function () { drag = null; });
    stage.addEventListener("wheel", function (e) {
      if (!crop) return;
      e.preventDefault();
      setZoom(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    }, { passive: false });
    stage.addEventListener("keydown", function (e) {
      if (!crop) return;
      var step = e.shiftKey ? 40 : 12;
      var moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (moves[e.key]) { crop.cx += moves[e.key][0]; crop.cy += moves[e.key][1]; drawCrop(); e.preventDefault(); }
      else if (e.key === "+" || e.key === "=") { setZoom(crop.zoom * 1.1); e.preventDefault(); }
      else if (e.key === "-") { setZoom(crop.zoom / 1.1); e.preventDefault(); }
    });
    dlg.querySelector("#pf-crop-zoom").addEventListener("input", function () { setZoom(+this.value); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeCrop(); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCrop(); });
    return dlg;
  }

  function showCrop(img, url, file) {
    var dlg = cropDialog();
    crop = { img: img, url: url, file: file, zoom: 1, cx: 320, cy: 320, back: document.activeElement };
    dlg.querySelector("#pf-crop-zoom").value = 1;
    dlg.hidden = false;
    document.documentElement.classList.add("pf-modal-open");
    drawCrop();
    dlg.querySelector("#pf-crop-stage").focus();
  }

  function setZoom(z) {
    if (!crop) return;
    crop.zoom = Math.max(1, Math.min(4, z));
    $("pf-crop-zoom").value = crop.zoom;
    drawCrop();
  }

  /** The image always covers the whole square; cx/cy is its centre in canvas px. */
  function drawCrop() {
    var canvas = $("pf-crop-canvas");
    if (!canvas || !crop) return;
    var ctx = canvas.getContext("2d");
    var img = crop.img;
    var s = 640 / Math.min(img.naturalWidth, img.naturalHeight) * crop.zoom;
    var w = img.naturalWidth * s;
    var h = img.naturalHeight * s;
    crop.cx = Math.min(w / 2, Math.max(640 - w / 2, crop.cx));
    crop.cy = Math.min(h / 2, Math.max(640 - h / 2, crop.cy));
    ctx.fillStyle = "#1b1d23";
    ctx.fillRect(0, 0, 640, 640);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, crop.cx - w / 2, crop.cy - h / 2, w, h);
  }

  function closeCrop() {
    var dlg = $("pf-crop");
    if (dlg) dlg.hidden = true;
    document.documentElement.classList.remove("pf-modal-open");
    if (crop) {
      URL.revokeObjectURL(crop.url);
      if (crop.back && crop.back.focus) crop.back.focus();
    }
    crop = null;
  }

  function saveCrop() {
    if (!crop) return;
    var btn = $("pf-crop-save");
    btn.disabled = true;
    btn.textContent = "Saving…";
    var canvas = $("pf-crop-canvas");
    var done = function (blob) {
      var form = new FormData();
      // The crop is re-encoded on the server anyway; the original goes up only if the canvas can't export.
      form.append("avatar", blob || crop.file, blob ? "avatar.jpg" : crop.file.name);
      api.upload("me/avatar", form).then(function (res) {
        closeCrop();
        applyUser(res.user);
        renderAvatarPreview();
        toast("Profile picture updated");
      }, function (err) {
        toast(err.message, 3200);
      }).then(function () { btn.disabled = false; btn.textContent = "Save picture"; });
    };
    if (canvas.toBlob) canvas.toBlob(done, "image/jpeg", 0.92);
    else done(null);
  }

  /* ===============================================================
     Other learners' profiles (dialog)
  ================================================================*/

  function userDialog() {
    var dlg = $("pf-user");
    if (dlg) return dlg;
    dlg = document.createElement("div");
    dlg.className = "pf-modal";
    dlg.id = "pf-user";
    dlg.hidden = true;
    dlg.innerHTML = '<div class="pf-modal-card pf-user-card" role="dialog" aria-modal="true" aria-labelledby="pf-user-title">' +
      '<button type="button" class="pf-close" data-act="user-close" aria-label="Close">' + icon("close") + "</button>" +
      '<div id="pf-user-body"></div></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeUser(); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") closeUser(); });
    return dlg;
  }

  var userBack = null;

  function showUser(name) {
    if (!name || !online()) return;
    if (state.user && name.toLowerCase() === state.user.username.toLowerCase()) {
      if (app().showView) app().showView("view-profile");
      return;
    }
    var dlg = userDialog();
    var body = $("pf-user-body");
    userBack = document.activeElement;
    body.innerHTML = '<div class="pf-loading"><span class="pf-spinner" aria-hidden="true"></span>Loading ' + esc(name) + "…</div>";
    dlg.hidden = false;
    document.documentElement.classList.add("pf-modal-open");
    dlg.querySelector(".pf-close").focus();
    api.get("users/profile?u=" + encodeURIComponent(name)).then(function (res) {
      var p = res.profile;
      body.innerHTML = heroHtml(p, false).replace("<h2>", '<h2 id="pf-user-title">') +
        (p.private
          ? '<div class="pf-card liquid-glass pf-empty">' + icon("lock", "pf-big-ic") + "<p><b>" + esc(p.username) + "</b> keeps their profile private.</p></div>"
          : highlightsHtml(p) + heatCardHtml(p) + coursesHtml(p) + badgesHtml(p) + gamesHtml(p));
      animateIn(body);
    }, function (err) {
      body.innerHTML = '<div class="pf-card liquid-glass pf-empty"><p>' + esc(err.message) + "</p></div>";
    });
  }

  function closeUser() {
    var dlg = $("pf-user");
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    document.documentElement.classList.remove("pf-modal-open");
    if (userBack && userBack.focus) userBack.focus();
  }

  /* ===============================================================
     Events (delegated: the panels are re-rendered)
  ================================================================*/

  function busy(btn, on, text) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.textContent = text || "Saving…"; }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }

  function download(name, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  var ACTIONS = {
    retry: function () { load(true).catch(function () {}); },
    "edit-profile": function () { selectTab("settings"); focusLater("pf-bio"); },
    "edit-bio": function () { selectTab("settings"); focusLater("pf-bio"); },
    "pick-avatar": pickAvatar,
    "remove-avatar": function (btn) {
      busy(btn, true, "Removing…");
      api.del("me/avatar").then(function (res) {
        applyUser(res.user);
        renderAvatarPreview();
        toast("Picture removed. Your gradient is back.");
      }, function (err) { toast(err.message); busy(btn, false); });
    },
    "crop-cancel": closeCrop,
    "crop-save": saveCrop,
    "user-close": closeUser,
    "toggle-pass": function (btn) {
      var input = $(btn.getAttribute("data-for"));
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show);
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    },
    "email-back": function () { state.emailStep = null; renderEmail(); },
    "use-device-tz": function (btn) {
      var sel = $("pf-tz");
      sel.value = btn.getAttribute("data-tz");
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    },
    signout: function (btn) {
      busy(btn, true, "…");
      api.del("me/sessions", { id: btn.getAttribute("data-id") }).then(function (res) {
        state.sessions = res.sessions;
        renderSessions();
        toast("Device signed out");
      }, function (err) { toast(err.message); busy(btn, false); });
    },
    "signout-others": function (btn) {
      busy(btn, true, "Signing out…");
      api.del("me/sessions", {}).then(function (res) {
        state.sessions = res.sessions;
        renderSessions();
        busy(btn, false);
        toast("Signed out of all other devices");
      }, function (err) { toast(err.message); busy(btn, false); });
    },
    "export": function (btn) {
      busy(btn, true, "Preparing…");
      api.get("me/export").then(function (data) {
        download("codle-" + state.profile.username + "-" + dayKey(new Date()) + ".json", data);
        busy(btn, false);
      }, function (err) { toast(err.message); busy(btn, false); });
    },
    logout: function () {
      api.post("auth/logout").then(function () { window.location.href = "register.html"; });
    },
    "toggle-delete": function () {
      var form = $("pf-delete-form");
      form.hidden = !form.hidden;
      if (!form.hidden) $("pf-delete-pass").focus();
    }
  };

  function focusLater(id) {
    setTimeout(function () {
      var el = $(id);
      if (el) { el.focus(); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    }, 60);
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var tab = e.target.closest(".pf-tab");
    if (tab) { selectTab(tab.getAttribute("data-tab")); return; }
    var btn = e.target.closest("[data-act]");
    if (btn && ACTIONS[btn.getAttribute("data-act")] && (btn.closest("#view-profile") || btn.closest(".pf-modal"))) {
      e.preventDefault();
      ACTIONS[btn.getAttribute("data-act")](btn);
      return;
    }
    // Leaderboard rows (sidebar card and Leaderboard tab) open that learner's profile.
    var row = e.target.closest(".leaderboard-item[data-user]");
    if (row) showUser(row.getAttribute("data-user"));
  });

  document.addEventListener("keydown", function (e) {
    if (!e.target.closest) return;
    // Arrow keys move between the profile tabs (WAI-ARIA tabs pattern).
    if (e.target.classList.contains("pf-tab") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      var i = TABS.map(function (t) { return t[0]; }).indexOf(e.target.getAttribute("data-tab"));
      selectTab(TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length][0], true);
      e.preventDefault();
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".leaderboard-item[data-user], #pf-drop")) {
      e.preventDefault();
      e.target.click();
    }
  });

  document.addEventListener("input", function (e) {
    var id = e.target.id;
    // the colour pickers preview live; the "change" event saves
    if (id === "th-accent-custom" && themeApi()) { themeApi().customize({ accent: e.target.value }); return; }
    if (id === "th-bg-custom" && themeApi()) { themeApi().customize({ bg: e.target.value }); return; }
    if (id === "pf-bio") {
      var len = e.target.value.length;
      $("pf-bio-count").textContent = len + " / " + BIO_MAX;
      $("pf-bio-save").disabled = e.target.value.trim() === (state.profile.bio || "");
    } else if (id === "pf-name") {
      checkName();
    } else if (id === "pf-name-pass") {
      updateNameButton();
    } else if (id === "pf-pass-new" || id === "pf-pass-confirm" || id === "pf-pass-current") {
      checkPassword();
    } else if (id === "pf-email-code") {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "pf-avatar-file") {
      openCrop(t.files && t.files[0]);
    } else if (t.id === "pf-public") {
      var on = t.checked;
      api.patch("me", { profilePublic: on }).then(function (res) {
        applyUser(res.user);
        toast(on ? "Your profile is public" : "Your profile is private");
      }, function (err) { t.checked = !on; toast(err.message); });
    } else if (t.id === "pf-goal") {
      var goal = +t.value;
      api.patch("me", { dailyGoal: goal }).then(function (res) {
        applyUser(res.user);
        state.loadedAt = 0;
        toast("Daily goal: " + goal + " XP");
      }, function (err) { toast(err.message); });
    } else if (t.id === "pf-tz") {
      var tz = t.value;
      api.patch("me", { timezone: tz }).then(function (res) {
        applyUser(res.user);
        renderTzDetect();
        toast("Time zone: " + tz.replace(/_/g, " "));
      }, function (err) { toast(err.message); });
    } else if (t.id === "pf-effects") {
      if (window.CodlePerf) window.CodlePerf.setMode(t.value);
      renderEffects();
      syncThemeUI();
      api.put("me/settings", { effects: t.value }).catch(function () { /* the device keeps it in localStorage anyway */ });
    } else if (t.name === "th-theme") {
      themeChange({ theme: t.value });
      var m = mascot(), look = themeApi() && themeApi().theme(t.value);
      if (m && look && window.innerWidth > 860) m.tip(look.id === "codle" ? "Back to the classic. Dark or light, mix the colours below if you like." : "Ooh, " + look.name + ". It suits you.", { key: "theme", mood: "surprised", ms: 4500 });
    } else if (t.name === "th-mode") themeChange({ mode: t.value });
    else if (t.name === "th-accent") themeChange({ accent: t.value });
    else if (t.name === "th-bg") themeChange({ bg: t.value });
    else if (t.name === "th-glass") themeChange({ glass: t.value });
    else if (t.name === "th-corners") themeChange({ corners: t.value });
    else if (t.name === "th-scene") themeChange({ scene: t.value });
    else if (t.id === "th-grain") themeChange({ grain: t.checked });
    else if (t.id === "th-accent-custom") themeChange({ accent: t.value });
    else if (t.id === "th-bg-custom") themeChange({ bg: t.value });
  });

  // Drag and drop onto the picture box
  ["dragenter", "dragover"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var drop = e.target.closest && e.target.closest("#pf-drop");
      if (!drop) return;
      e.preventDefault();
      drop.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var drop = e.target.closest && e.target.closest("#pf-drop");
      if (!drop) return;
      e.preventDefault();
      drop.classList.remove("is-over");
      if (type === "drop" && e.dataTransfer && e.dataTransfer.files.length) openCrop(e.dataTransfer.files[0]);
    });
  });

  document.addEventListener("submit", function (e) {
    var form = e.target;
    var handler = SUBMITS[form.id];
    if (!handler) return;
    e.preventDefault();
    handler(form);
  });

  function showError(id, err) {
    var el = $(id);
    if (el) el.textContent = err ? err.message || String(err) : "";
  }

  var SUBMITS = {
    "pf-bio-form": function () {
      var btn = $("pf-bio-save");
      var bio = $("pf-bio").value;
      showError("pf-bio-error");
      busy(btn, true);
      api.patch("me", { bio: bio }).then(function (res) {
        busy(btn, false);
        btn.disabled = true;
        $("pf-bio").value = res.user.bio;
        applyUser(res.user);
        toast("Bio saved");
      }, function (err) { busy(btn, false); showError("pf-bio-error", err); });
    },

    "pf-name-form": function () {
      if (!nameOk) return;
      var btn = $("pf-name-save");
      var name = $("pf-name").value.trim();
      showError("pf-name-error");
      busy(btn, true);
      api.post("me/username", { username: name, password: $("pf-name-pass").value }).then(function (res) {
        $("pf-name-pass").value = "";
        applyUser(res.user);
        toast("You are now @" + res.user.username, 2400);
        // Cooldown and earlier names come with the full profile.
        load(true).then(function () { renderAccountNotes(); checkName(); }, function () {});
        busy(btn, false);
        btn.disabled = true;
      }, function (err) {
        busy(btn, false);
        showError("pf-name-error", err);
        if (err.code === "wrong_password") $("pf-name-pass").select();
      });
    },

    "pf-email-form": function () {
      var email = $("pf-email-new").value.trim();
      var pass = $("pf-email-pass").value;
      if (!email || !pass) { showError("pf-email-error", "Enter the new e-mail and your password."); return; }
      var btn = $("pf-email-send");
      showError("pf-email-error");
      busy(btn, true, "Sending…");
      api.post("me/email/code", { email: email, password: pass }).then(function (res) {
        state.emailStep = { email: email, minutes: res.expiresInMinutes };
        renderEmail();
      }, function (err) { busy(btn, false); showError("pf-email-error", err); });
    },

    "pf-code-form": function (form) {
      var code = $("pf-email-code").value;
      if (!/^\d{6}$/.test(code)) { showError("pf-code-error", "The code has 6 digits."); return; }
      var btn = form.querySelector('button[type="submit"]');
      busy(btn, true, "Checking…");
      api.post("me/email", { email: state.emailStep.email, code: code }).then(function (res) {
        state.emailStep = null;
        applyUser(res.user);
        renderEmail();
        toast("E-mail changed to " + res.user.email, 2600);
      }, function (err) {
        busy(btn, false);
        showError("pf-code-error", err.data && err.data.attemptsLeft != null ? err.message + " " + err.data.attemptsLeft + " attempts left." : err);
      });
    },

    "pf-pass-form": function () {
      if (!passOk) return;
      var btn = $("pf-pass-save");
      showError("pf-pass-error");
      busy(btn, true);
      api.post("me/password", { current: $("pf-pass-current").value, password: $("pf-pass-new").value }).then(function (res) {
        ["pf-pass-current", "pf-pass-new", "pf-pass-confirm"].forEach(function (id) { $(id).value = ""; });
        busy(btn, false);
        checkPassword();
        if (state.profile.account) state.profile.account.passwordChangedAt = new Date().toISOString();
        renderAccountNotes();
        if (res.user) applyUser(res.user);
        loadSessions();
        toast("Password changed. Other devices were signed out.", 2800);
      }, function (err) {
        busy(btn, false);
        showError("pf-pass-error", err);
        if (err.code === "wrong_password") $("pf-pass-current").select();
      });
    },

    "pf-delete-form": function () {
      api.del("me", { password: $("pf-delete-pass").value }).then(function () {
        window.location.href = "register.html";
      }, function (err) { showError("pf-delete-error", err); });
    }
  };

  // app.js tells us when a view becomes visible.
  document.addEventListener("codle:view", function (e) {
    if (e.detail !== "view-profile" || !online()) return;
    if (!state.built) buildShell();
    if (state.user) renderHero();
    load().catch(function () {});
    if (state.tab === "settings") loadSessions();
    if (state.settingsBuilt) { renderEffects(); renderTzDetect(); }
  });

  /* ===============================================================
     Theme — the look of every page (js/theme.js applies it, css/themes.css draws it).
     A pick applies at once, is kept in this browser, and is saved to the account
     (me/settings → appTheme, appThemeCustom) shortly after, like Curly's wardrobe.
     Full / Lite (js/perf.js) is picked here as well: every theme has both looks.
  ================================================================*/

  var th = { built: false, saveTimer: null, account: null };
  var TH_MODE = { dark: ["Dark", "Glass on a dark backdrop"], light: ["Light", "White glass on a pale backdrop"] };
  var TH_GLASS = { clear: ["Clear", "Thin glass, little blur"], normal: ["Normal", "The Codle look"], frosted: ["Frosted", "Thick, milky glass"] };
  var TH_CORNERS = { sharp: ["Sharp", "Tight corners"], soft: ["Soft", "The Codle look"], round: ["Round", "Big, pillowy corners"] };
  var TH_SCENES = { none: ["None", "Just the backdrop"], aurora: ["Aurora", "Slow drifting colour"], stars: ["Stars", "A quiet night sky"], grid: ["Grid", "Blueprint lines"] };
  var TH_FX = [["auto", "Auto"], ["full", "Full"], ["lite", "Lite"]];

  function themeApi() { return window.CodleTheme || null; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function thRgb(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255); }

  function thTile(t, on) {
    return '<label class="th-tile' + (on ? " is-on" : "") + (t.light ? " is-light" : "") + '" style="--t-bg:' + t.bg + ";--t-accent:" + t.accent + ";--t-fg:" + thRgb(t.ink) + ";--t-glow:" + (t.glow || t.accent) + '">' +
        '<input type="radio" name="th-theme" value="' + t.id + '"' + (on ? " checked" : "") + ">" +
        '<span class="th-pre th-pre--' + t.id + '" aria-hidden="true"><i class="th-pre-bar"></i><i class="th-pre-card"></i><i class="th-pre-dot"></i><i class="th-pre-type">Aa</i></span>' +
        '<span class="th-tile-text"><b>' + esc(t.name) + (t.custom ? ' <span class="pf-chip">Customizable</span>' : "") + "</b><small>" + esc(t.tag) + "</small></span>" +
      "</label>";
  }
  function thSwatch(group, hex, label, on) {
    return '<label class="cy-opt cy-opt--round' + (on ? " is-on" : "") + '" title="' + esc(label) + '">' +
        '<input type="radio" name="th-' + group + '" value="' + hex + '"' + (on ? " checked" : "") + ">" +
        '<span class="cy-swatch th-flat" style="--c:' + hex + '" aria-hidden="true"></span>' +
        '<span class="cy-opt-label">' + esc(label) + "</span>" +
      "</label>";
  }
  function thCustomSwatch(group, hex, on) {
    return '<label class="cy-opt cy-opt--round th-custom-swatch' + (on ? " is-on" : "") + '" title="Any colour">' +
        '<input type="color" id="th-' + group + '-custom" value="' + hex + '" aria-label="Custom ' + group + ' colour">' +
        '<span class="cy-swatch th-flat th-rainbow" style="--c:' + hex + '" aria-hidden="true"></span>' +
        '<span class="cy-opt-label">Custom</span>' +
      "</label>";
  }
  function thSeg(group, table, current, label) {
    return '<div class="cy-grid cy-grid--seg th-seg-grid" role="radiogroup" aria-label="' + label + '">' + Object.keys(table).map(function (id) {
      var on = id === current;
      return '<label class="cy-opt th-opt' + (on ? " is-on" : "") + '"><input type="radio" name="th-' + group + '" value="' + id + '"' + (on ? " checked" : "") + ">" +
        '<span class="cy-opt-label">' + table[id][0] + '</span><span class="th-opt-sub">' + table[id][1] + "</span></label>";
    }).join("") + "</div>";
  }
  function thSceneTiles(current) {
    return '<div class="cy-grid cy-grid--tiles" role="radiogroup" aria-label="Scene">' + Object.keys(TH_SCENES).map(function (id) {
      var on = id === current;
      return '<label class="cy-opt th-opt' + (on ? " is-on" : "") + '"><input type="radio" name="th-scene" value="' + id + '"' + (on ? " checked" : "") + ">" +
        '<span class="th-scene th-scene--' + id + '" aria-hidden="true"></span>' +
        '<span class="cy-opt-label">' + TH_SCENES[id][0] + '</span><span class="th-opt-sub">' + TH_SCENES[id][1] + "</span></label>";
    }).join("") + "</div>";
  }
  function thFxNote() {
    var perf = window.CodlePerf;
    if (!perf) return "";
    if (perf.mode === "lite") return "Lite: opaque surfaces, no blur, nothing moving. Every theme has this look.";
    if (perf.mode === "full") return "Full: glass, blur and a living scene, even on slow devices.";
    return perf.lite ? "Auto picked Lite here (" + perf.reasons.join(", ") + ")." : "Auto: the full look now; switches to Lite if the page slows down.";
  }
  function thCustomHtml() {
    var T = themeApi(), c = T.custom;
    var accents = T.accentsFor(c.mode), backdrops = T.backdropsFor(c.mode);
    var presetAccent = accents.some(function (a) { return a[1] === c.accent; });
    var presetBg = backdrops.some(function (b) { return b[1] === c.bg; });
    return '<section class="pf-card liquid-glass th-card"><h3>Appearance</h3>' + thSeg("mode", TH_MODE, c.mode, "Appearance") + "</section>" +
      '<section class="pf-card liquid-glass th-card"><h3>Accent</h3>' +
        '<div class="cy-grid cy-grid--round" role="radiogroup" aria-label="Accent colour">' +
          accents.map(function (a) { return thSwatch("accent", a[1], cap(a[0]), a[1] === c.accent); }).join("") +
          thCustomSwatch("accent", c.accent, !presetAccent) +
        "</div></section>" +
      '<section class="pf-card liquid-glass th-card"><h3>Backdrop</h3>' +
        '<div class="cy-grid cy-grid--round" role="radiogroup" aria-label="Backdrop colour">' +
          backdrops.map(function (b) { return thSwatch("bg", b[1], cap(b[0]), b[1] === c.bg); }).join("") +
          thCustomSwatch("bg", c.bg, !presetBg) +
        "</div></section>" +
      '<section class="pf-card liquid-glass th-card"><h3>Scene</h3>' + thSceneTiles(c.scene) +
        '<p class="pf-hint th-hint">Scenes move only with full effects; in Lite they stand still.</p></section>' +
      '<section class="pf-card liquid-glass th-card"><h3>Glass</h3>' + thSeg("glass", TH_GLASS, c.glass, "Glass") + "</section>" +
      '<section class="pf-card liquid-glass th-card"><h3>Corners</h3>' + thSeg("corners", TH_CORNERS, c.corners, "Corners") + "</section>" +
      '<section class="pf-card liquid-glass th-card">' +
        '<label class="pf-switch th-switch"><input type="checkbox" id="th-grain"' + (c.grain ? " checked" : "") + '><span class="pf-switch-ui" aria-hidden="true"></span>' +
          "<span><b>Film grain</b><small>A fine texture over the backdrop. Lite leaves it out anyway.</small></span></label>" +
        '<div class="pf-actions cy-actions"><button type="button" class="wordle-btn ghost" data-act="th-reset"' + (T.isCustomDefault() ? " disabled" : "") + ">Back to the Codle defaults</button></div>" +
      "</section>";
  }

  function renderTheme() {
    var panel = $("pf-panel-theme"), T = themeApi();
    if (!panel) return;
    if (!T) { panel.innerHTML = '<div class="pf-card liquid-glass pf-empty"><p>Themes are not available on this page.</p></div>'; return; }
    panel.innerHTML =
      '<section class="pf-card liquid-glass th-fx"><div class="pf-row">' +
          '<span><b>Visual effects</b><small id="th-fx-note">' + esc(thFxNote()) + "</small></span>" +
          '<div class="th-seg" role="radiogroup" aria-label="Visual effects" id="th-fx">' +
            TH_FX.map(function (f) { return '<button type="button" role="radio" data-act="th-fx" data-fx="' + f[0] + '" aria-checked="' + (!!window.CodlePerf && window.CodlePerf.mode === f[0]) + '">' + f[1] + "</button>"; }).join("") +
          "</div>" +
      "</div></section>" +
      '<section class="pf-section th-pick"><h3>Pick a look</h3>' +
        '<div class="th-grid" role="radiogroup" aria-label="Theme">' + T.themes.map(function (t) { return thTile(t, t.id === T.id); }).join("") + "</div>" +
      "</section>" +
      '<section class="pf-section th-custom" id="th-custom"' + (T.id === "codle" ? "" : " hidden") + '><h3>Make Codle yours</h3>' + thCustomHtml() + "</section>" +
      '<p class="cy-status" id="th-status" aria-live="polite"></p>';
    th.built = true;
  }
  /** Marks the picked options in place (no redraw: focus and open colour pickers stay). */
  function syncThemeUI() {
    var T = themeApi(), panel = $("pf-panel-theme");
    if (!T || !panel || !th.built) return;
    var c = T.custom;
    var current = { theme: T.id, mode: c.mode, accent: c.accent, bg: c.bg, glass: c.glass, corners: c.corners, scene: c.scene };
    panel.querySelectorAll('input[type="radio"]').forEach(function (r) {
      var on = r.value === current[r.name.slice(3)];
      r.checked = on;
      r.closest("label").classList.toggle("is-on", on);
    });
    ["accent", "bg"].forEach(function (g) {
      var input = $("th-" + g + "-custom");
      if (!input) return;
      var preset = panel.querySelector('input[name="th-' + g + '"][value="' + current[g] + '"]');
      if (document.activeElement !== input) input.value = current[g];
      var label = input.closest("label");
      label.classList.toggle("is-on", !preset);
      label.querySelector(".cy-swatch").style.setProperty("--c", current[g]);
    });
    var grain = $("th-grain");
    if (grain) grain.checked = c.grain;
    var custom = $("th-custom");
    if (custom) custom.hidden = T.id !== "codle";
    var reset = panel.querySelector('[data-act="th-reset"]');
    if (reset) reset.disabled = T.isCustomDefault();
    var note = $("th-fx-note");
    if (note) note.textContent = thFxNote();
    panel.querySelectorAll("#th-fx [role=radio]").forEach(function (b) {
      b.setAttribute("aria-checked", String(!!window.CodlePerf && window.CodlePerf.mode === b.getAttribute("data-fx")));
    });
  }
  function thStatus(text) { var el = $("th-status"); if (el) el.textContent = text; }
  /** Saves to the account a moment after the last change. */
  function saveTheme() {
    clearTimeout(th.saveTimer);
    thStatus("Saving…");
    th.saveTimer = setTimeout(function () {
      var T = themeApi();
      if (!T || !online()) { thStatus("Saved on this device"); return; }
      api.put("me/settings", T.settings()).then(function (res) {
        th.account = !!(res && res.settings && res.settings.hasOwnProperty("appTheme"));
        thStatus(th.account ? "Saved to your account" : "Saved on this device");
      }, function () { thStatus("Saved on this device. Couldn't reach the server."); });
    }, 600);
  }
  /** On the first page load: take the theme saved with the account, or upload this device's the first time. */
  function syncThemeFrom(st) {
    var T = themeApi();
    if (!T || !st) return;
    if (!st.hasOwnProperty("appTheme")) { th.account = false; return; } // migration 004 not run yet
    th.account = true;
    if (st.appTheme) { if (T.configure(st)) syncThemeUI(); }
    else if (T.id !== "codle" || !T.isCustomDefault()) saveTheme(); // a look picked before logging in goes to the account
  }
  /** One change from the tab: apply, mark, save. */
  function themeChange(patch) {
    var T = themeApi();
    if (!T) return;
    if (patch.theme) T.set(patch.theme); else T.customize(patch);
    // dark and light have their own accent and backdrop swatches: draw the mix again
    if (patch.mode) { var custom = $("th-custom"); if (custom) custom.innerHTML = "<h3>Make Codle yours</h3>" + thCustomHtml(); }
    syncThemeUI();
    saveTheme();
  }
  function openTheme() {
    if (!th.built) renderTheme();
    syncThemeUI();
  }

  ACTIONS["th-fx"] = function (btn) {
    if (!window.CodlePerf) return;
    var mode = btn.getAttribute("data-fx");
    window.CodlePerf.setMode(mode);
    syncThemeUI();
    renderEffects();
    api.put("me/settings", { effects: mode }).catch(function () { /* the device keeps it in localStorage anyway */ });
  };
  ACTIONS["th-reset"] = function () {
    var T = themeApi();
    if (!T) return;
    T.resetCustom();
    syncThemeUI();
    saveTheme();
  };
  if (window.CodlePerf) window.CodlePerf.onChange(function () { if (th.built) syncThemeUI(); });

  /* ===============================================================
     Curly — the mascot's wardrobe and behaviour (js/mascot.js does the drawing).
     Every change applies at once to the preview and to the floating mascot, is kept
     in this browser, and is saved to the account (me/settings → mascot) shortly after.
  ================================================================*/

  var cy = { built: false, preview: null, saveTimer: null, fetched: false, account: null, locks: "", open: null };
  var CY_MOODS = [["happy", "Happy"], ["sad", "Sad"], ["think", "Thinking"], ["surprised", "Surprised"], ["sleep", "Sleepy"]];

  function mascot() { return window.CodleMascot || null; }
  function curlyName() { var m = mascot(); return m ? m.name : "Curly"; }
  function bestStreak() { var u = state.user || {}; return Math.max(u.streakBest || 0, u.streakCount || 0); }
  function isUnlocked(item) {
    var r = item.unlock;
    if (!r) return true;
    if (r.level && ((state.user && state.user.level) || 1) < r.level) return false;
    if (r.streak && bestStreak() < r.streak) return false;
    return true;
  }
  function lockShort(r) { return r.level ? "Level " + r.level : "Streak " + r.streak; }
  function lockLong(r) { return r.level ? "Reach level " + r.level + " to unlock" : "Keep a " + r.streak + "-day streak to unlock"; }
  /** A fingerprint of what is unlocked, so the pickers only redraw when it changes. */
  function lockKey() { return ((state.user && state.user.level) || 1) + ":" + bestStreak(); }

  function cyOptions(group, items, current, visual) {
    return Object.keys(items).map(function (id) {
      var it = items[id], open = isUnlocked(it), on = id === current;
      return '<label class="cy-opt cy-opt--' + group + (on ? " is-on" : "") + (open ? "" : " is-locked") + '" title="' + esc(it.label + (open ? "" : " · " + lockLong(it.unlock))) + '">' +
          '<input type="radio" name="cy-' + group + '" value="' + id + '"' + (on ? " checked" : "") + (open ? "" : ' disabled aria-describedby="cy-lock-' + group + "-" + id + '"') + ">" +
          visual(id, it) +
          '<span class="cy-opt-label">' + esc(it.label) + "</span>" +
          (open ? "" : '<span class="cy-lock" id="cy-lock-' + group + "-" + id + '">' + icon("lock", "cy-lock-ic") + lockShort(it.unlock) + "</span>") +
        "</label>";
    }).join("");
  }
  function gradVars(c) { return "--s1:" + c[0] + ";--s2:" + c[1] + ";--s3:" + c[2]; }

  /* The pickers are collapsed sections (one open at a time). Each header shows what is
     picked now and how many options are unlocked; a click opens it. */
  var CY_SECTIONS = [
    { id: "color", title: "Glass color", table: "colors", kind: "round" },
    { id: "eyes", title: "Eyes", table: "eyes", kind: "round" },
    { id: "hat", title: "Hats", table: "hats", kind: "tiles" },
    { id: "face", title: "Face", table: "faces", kind: "tiles" },
    { id: "neck", title: "Neck", table: "necks", kind: "tiles" },
    { id: "fx", title: "Effects", table: "fx", kind: "tiles" },
    { id: "size", title: "Size", table: "sizes", kind: "seg" }
  ];
  var CHEVRON = '<svg class="cy-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  var GEAR = '<svg class="cy-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.6" fill="currentColor"/><circle cx="15" cy="17" r="2.6" fill="currentColor"/></svg>';

  function cyTable(sec) { return mascot().catalog[sec.table]; }
  function cyVisual(sec, id, it) {
    var cat = mascot().catalog, parts = {};
    if (sec.id === "color") return '<span class="cy-swatch" style="' + gradVars(it.tube) + (it.glow ? ";--glow:" + it.glow : "") + '" aria-hidden="true"></span>';
    if (sec.id === "eyes") return '<span class="cy-eye" style="' + gradVars(it.iris) + '" aria-hidden="true"></span>';
    if (sec.id === "size") return '<span class="cy-size cy-size--' + id + '" aria-hidden="true">{ }</span>';
    parts[sec.id] = id;
    return '<span class="cy-art" aria-hidden="true">' + cat.mini(parts) + "</span>";
  }
  function cyCount(sec) {
    var t = cyTable(sec), ids = Object.keys(t);
    return ids.filter(function (id) { return isUnlocked(t[id]); }).length + " of " + ids.length + " unlocked";
  }
  function cyHeadHtml(sec, s) {
    var it = cyTable(sec)[s[sec.id]];
    return '<span class="cy-sec-pic" aria-hidden="true">' + cyVisual(sec, s[sec.id], it) + "</span>" +
      '<span class="cy-sec-text"><b>' + sec.title + "</b><small>" + esc(it.label) + " · " + cyCount(sec) + "</small></span>" + CHEVRON;
  }
  function behaviorSummary(s) {
    var on = [];
    if (!s.visible) return "Hidden on every page";
    on.push(s.tips ? "Tips on" : "Tips off");
    on.push(s.autohide ? "smart hiding" : "always out");
    if (!s.follow) on.push("eyes still");
    return on.join(" · ");
  }
  function cySection(id, head, body) {
    var open = cy.open === id;
    return '<section class="pf-card liquid-glass cy-sec' + (open ? " is-open" : "") + '" data-sec="' + id + '">' +
        '<h3 class="cy-sec-h"><button type="button" class="cy-sec-btn" id="cy-btn-' + id + '" aria-expanded="' + open + '" aria-controls="cy-body-' + id + '" data-act="cy-toggle" data-sec="' + id + '">' + head + "</button></h3>" +
        '<div class="cy-sec-body" id="cy-body-' + id + '" role="region" aria-labelledby="cy-btn-' + id + '"' + (open ? "" : " inert") + '><div class="cy-sec-inner">' + body + "</div></div>" +
      "</section>";
  }

  function curlyOptionsHtml() {
    var m = mascot(), s = m.settings(), n = esc(s.name);
    function sw2(id, label, sub, on) {
      return '<label class="pf-switch"><input type="checkbox" id="cy-' + id + '"' + (on ? " checked" : "") + '><span class="pf-switch-ui" aria-hidden="true"></span>' +
        "<span><b>" + label + "</b><small>" + sub + "</small></span></label>";
    }
    return CY_SECTIONS.map(function (sec) {
      return cySection(sec.id, cyHeadHtml(sec, s),
        '<div class="cy-grid cy-grid--' + sec.kind + '" role="radiogroup" aria-label="' + sec.title + '">' +
          cyOptions(sec.id, cyTable(sec), s[sec.id], function (id, it) { return cyVisual(sec, id, it); }) +
        "</div>");
    }).join("") +
    cySection("behavior",
      '<span class="cy-sec-pic" aria-hidden="true">' + GEAR + '</span><span class="cy-sec-text"><b>Behavior</b><small id="cy-behavior-sum">' + behaviorSummary(s) + "</small></span>" + CHEVRON,
      '<div class="cy-sec-pad">' +
        sw2("visible", "Show " + n + " on every page", "Turn off to keep " + n + " hidden everywhere. Your look stays saved.", s.visible) +
        sw2("tips", "Tips", n + " points out what to do next and cheers when you get things right.", s.tips) +
        sw2("autohide", "Smart hiding", "Ducks to the screen edge when it would cover a button, and on phones while you type or scroll.", s.autohide) +
        sw2("follow", "Follow my pointer", "Eyes and head turn toward your cursor or finger.", s.follow) +
        '<div class="pf-actions cy-actions">' +
          '<button type="button" class="wordle-btn ghost" data-act="cy-reset-pos">Move back to the corner</button>' +
          '<button type="button" class="wordle-btn ghost" data-act="cy-reset-look">Reset look</button>' +
        "</div>" +
      "</div>");
  }
  /** After a pick: only that section's header changes (the open/closed state stays). */
  function cyRefreshHead(id) {
    var btn = $("cy-btn-" + id), s = mascot().settings();
    if (!btn) return;
    if (id === "behavior") { var sum = $("cy-behavior-sum"); if (sum) sum.textContent = behaviorSummary(s); return; }
    var sec = CY_SECTIONS.filter(function (x) { return x.id === id; })[0];
    if (sec) btn.innerHTML = cyHeadHtml(sec, s);
  }
  function cyToggle(id) {
    cy.open = cy.open === id ? null : id;
    document.querySelectorAll("#cy-options .cy-sec").forEach(function (el) {
      var open = el.getAttribute("data-sec") === cy.open;
      el.classList.toggle("is-open", open);
      var btn = el.querySelector(".cy-sec-btn"), body = el.querySelector(".cy-sec-body");
      btn.setAttribute("aria-expanded", open);
      if (open) body.removeAttribute("inert"); else body.setAttribute("inert", "");
      if (open) setTimeout(function () { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 380);
    });
  }
  /** A random look from what is unlocked (the name and the size stay). */
  function cyRandom() {
    var patch = {};
    CY_SECTIONS.forEach(function (sec) {
      if (sec.id === "size") return;
      var t = cyTable(sec), ids = Object.keys(t).filter(function (id) { return isUnlocked(t[id]); });
      patch[sec.id] = ids[Math.floor(Math.random() * ids.length)];
    });
    return patch;
  }

  function renderCurly() {
    var panel = $("pf-panel-curly"), m = mascot();
    if (!panel || !m) return;
    var s = m.settings();
    panel.innerHTML =
      '<div class="cy-layout">' +
        '<section class="pf-card liquid-glass cy-stage-card" aria-label="Preview">' +
          '<div class="cy-stage" id="cy-stage"><span class="cy-floor" aria-hidden="true"></span></div>' +
          '<div class="cy-moods" role="group" aria-label="Try a mood">' +
            CY_MOODS.map(function (md) { return '<button type="button" class="cy-chip" data-act="cy-mood" data-mood="' + md[0] + '">' + md[1] + "</button>"; }).join("") +
          "</div>" +
          '<button type="button" class="wordle-btn ghost cy-random" data-act="cy-random">' + icon("dice") + "Surprise me</button>" +
          '<div class="pf-field cy-name">' +
            '<label for="cy-name">Name</label>' +
            '<input class="pf-input" id="cy-name" maxlength="' + m.catalog.nameMax + '" autocomplete="off" spellcheck="false" placeholder="' + esc(m.catalog.defaults.name) + '" value="' + esc(s.name) + '">' +
            '<p class="pf-hint" id="cy-name-hint" aria-live="polite">Up to ' + m.catalog.nameMax + " letters or numbers.</p>" +
          "</div>" +
          '<p class="cy-status" id="cy-status" aria-live="polite"></p>' +
        "</section>" +
        '<div class="cy-options" id="cy-options">' + curlyOptionsHtml() + "</div>" +
      "</div>";
    if (cy.preview) cy.preview.destroy();
    cy.preview = m.preview($("cy-stage"));
    cy.locks = lockKey();
    cy.built = true;
  }
  /** Redraws the pickers (after a sync, a reset or a new unlock) without touching the preview or the name field. */
  function refreshCurly() {
    if (!cy.built || !$("cy-options")) return;
    $("cy-options").innerHTML = curlyOptionsHtml();
    cy.locks = lockKey();
    var input = $("cy-name");
    if (input && document.activeElement !== input) input.value = mascot().settings().name;
    var tab = $("pf-tab-curly");
    if (tab) tab.textContent = curlyName();
  }

  function cyStatus(text) { var el = $("cy-status"); if (el) el.textContent = text; }
  /** Saves to the account a moment after the last change. */
  function saveCurly() {
    clearTimeout(cy.saveTimer);
    cyStatus("Saving…");
    cy.saveTimer = setTimeout(function () {
      var m = mascot();
      if (!m || !online()) { cyStatus("Saved on this device"); return; }
      api.put("me/settings", { mascot: m.settings() }).then(function (res) {
        cy.account = !!(res && res.settings && res.settings.hasOwnProperty("mascot"));
        cyStatus(cy.account ? "Saved to your account" : "Saved on this device");
      }, function () {
        cyStatus("Saved on this device. Couldn't reach the server.");
      });
    }, 600);
  }
  /** On the first page load: take the look saved with the account, or upload this device's look the first time. */
  function syncCurly() {
    var m = mascot();
    if (cy.fetched || !m || !online()) return;
    cy.fetched = true;
    api.get("me/settings").then(function (res) {
      var st = res && res.settings;
      syncThemeFrom(st); // the Theme tab shares this one fetch
      if (!st || !st.hasOwnProperty("mascot")) { cy.account = false; return; } // migration 003 not run yet
      cy.account = true;
      if (st.mascot) { m.configure(st.mascot); refreshCurly(); if (cy.preview) cy.preview.refresh(); }
      else {
        // a new account on a browser someone else used: keep this device's look, minus what this learner has not unlocked
        var fix = {}, d = m.catalog.defaults, s = m.settings();
        CY_SECTIONS.forEach(function (sec) { if (!isUnlocked(cyTable(sec)[s[sec.id]])) fix[sec.id] = d[sec.id]; });
        if (Object.keys(fix).length) { m.configure(fix); refreshCurly(); }
        if (JSON.stringify(m.settings()) !== JSON.stringify(defaultsWithSwitches())) saveCurly();
      }
    }, function () { /* offline for now: the browser copy is used */ });
  }
  function defaultsWithSwitches() {
    var d = mascot().catalog.defaults, out = {};
    Object.keys(d).forEach(function (k) { out[k] = d[k]; });
    out.tips = true; out.autohide = true; out.follow = true; out.visible = true;
    return out;
  }
  /** One change from the tab: apply, react in the preview, save. */
  function curlyChange(patch, reaction) {
    var m = mascot();
    if (!m) return;
    m.configure(patch);
    if (cy.preview && reaction) cy.preview.mood(reaction, 1300);
    var tab = $("pf-tab-curly");
    if (tab) tab.textContent = curlyName();
    saveCurly();
  }
  function openCurly() {
    if (!cy.built) renderCurly();
    var m = mascot();
    // on narrow screens the bubble would sit right on top of the preview
    if (m && window.innerWidth > 860) m.tip("This is my wardrobe. Pick a color or a hat and I'll try it on right away.", { key: "wardrobe", mood: "happy", ms: 6000 });
  }

  ACTIONS["cy-mood"] = function (btn) {
    var md = btn.getAttribute("data-mood");
    if (cy.preview) cy.preview.mood(md, md === "sleep" ? 4000 : 2400);
  };
  ACTIONS["cy-toggle"] = function (btn) { cyToggle(btn.getAttribute("data-sec")); };
  ACTIONS["cy-random"] = function () {
    var m = mascot();
    if (!m) return;
    m.configure(cyRandom());
    refreshCurly();
    if (cy.preview) cy.preview.mood("surprised", 1400);
    saveCurly();
  };
  ACTIONS["cy-reset-pos"] = function () {
    var m = mascot();
    if (!m) return;
    m.resetPosition();
    toast(curlyName() + " is back in the corner.", 2200);
  };
  ACTIONS["cy-reset-look"] = function () {
    var m = mascot();
    if (!m) return;
    m.configure(m.catalog.defaults);
    refreshCurly();
    var input = $("cy-name");
    if (input) input.value = m.settings().name;
    if (cy.preview) cy.preview.mood("surprised", 1200);
    saveCurly();
  };

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t.closest || !t.closest("#pf-panel-curly")) return;
    if (t.type === "radio" && t.name.indexOf("cy-") === 0) {
      var group = t.name.slice(3), patch = {};
      patch[group] = t.value;
      // move the highlight to the picked option
      var grid = t.closest(".cy-grid");
      if (grid) grid.querySelectorAll(".cy-opt").forEach(function (o) { o.classList.toggle("is-on", o.contains(t)); });
      curlyChange(patch, group === "color" || group === "eyes" || group === "size" ? "happy" : "surprised");
      cyRefreshHead(group);
      return;
    }
    if (t.type === "checkbox" && t.id.indexOf("cy-") === 0) {
      var p = {};
      p[t.id.slice(3)] = t.checked;
      curlyChange(p, t.checked ? "happy" : null);
      cyRefreshHead("behavior");
    }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id !== "cy-name") return;
    var m = mascot();
    if (!m) return;
    curlyChange({ name: t.value }, null);
    var clean = m.settings().name, typed = t.value.trim();
    var hint = $("cy-name-hint");
    var bad = typed && clean !== typed.replace(/\s+/g, " ");
    hint.textContent = bad ? "Only letters, numbers, spaces and . _ - are kept: " + clean : "Up to " + m.catalog.nameMax + " letters or numbers.";
    hint.classList.toggle("is-bad", !!bad);
  });
  document.addEventListener("focusout", function (e) {
    if (e.target.id !== "cy-name" || !mascot()) return;
    e.target.value = mascot().settings().name;
    var hint = $("cy-name-hint");
    if (hint) { hint.textContent = "Up to " + mascot().catalog.nameMax + " letters or numbers."; hint.classList.remove("is-bad"); }
    if (cy.preview) cy.preview.mood("happy", 1200);
  });

  window.CodleProfile = {
    update: update,
    showUser: showUser,
    reload: function () { return load(true); }
  };
})();
