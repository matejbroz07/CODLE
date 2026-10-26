/**
 * Codle — Profile tab
 *
 * Fills #view-profile when the API is on (offline the static "Coming soon" stays):
 *   Overview  — level, stats, courses, badges
 *   Activity  — 26-week heatmap, XP by source, game stats, recent XP
 *   Settings  — picture (with a crop step), bio, visibility, username (password +
 *               cooldown), e-mail (code to the new address), password, daily goal,
 *               time zone, visual effects, devices, data export, delete account
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
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'
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
    emailStep: null     // { email, devCode } while waiting for the code
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

  var TABS = [["overview", "Overview"], ["activity", "Activity"], ["settings", "Settings"]];

  function buildShell() {
    var view = $("view-profile");
    if (!view) return;
    view.innerHTML =
      '<div class="practice-shell online-view pf-shell">' +
        '<div id="pf-hero"></div>' +
        '<div class="pf-tabs liquid-glass" role="tablist" aria-label="Profile sections" id="pf-tabs">' +
          TABS.map(function (t) {
            var on = t[0] === state.tab;
            return '<button type="button" role="tab" class="pf-tab" id="pf-tab-' + t[0] + '" aria-controls="pf-panel-' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tab="' + t[0] + '">' + t[1] + "</button>";
          }).join("") +
        "</div>" +
        TABS.map(function (t) {
          return '<section class="pf-panel" role="tabpanel" id="pf-panel-' + t[0] + '" aria-labelledby="pf-tab-' + t[0] + '"' + (t[0] === state.tab ? "" : " hidden") + ">" +
            '<div class="pf-loading" aria-live="polite"><span class="pf-spinner" aria-hidden="true"></span>Loading your profile…</div></section>';
        }).join("") +
      "</div>";
    state.built = true;
    state.settingsBuilt = false;
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
    animateBars($("pf-panel-overview"));
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
      if (p.stats) meta.push('<li>' + icon("trophy") + "#" + fmt(p.stats.weeklyRank) + " this week</li>");
      if (p.streak) meta.push('<li class="pf-meta-hot">' + icon("flame") + p.streak + "-day streak</li>");
      if (own && p.timezone) meta.push('<li>' + icon("globe") + esc(p.timezone.replace(/_/g, " ")) + "</li>");
    }
    var chips = '<span class="pf-chip">Level ' + p.level + "</span>";
    if (own && p.account && !p.account.profilePublic) chips += '<span class="pf-chip pf-chip-muted">' + icon("lock") + "Private</span>";
    return '<section class="pf-hero liquid-glass">' +
      '<div class="pf-hero-avatar">' + ringHtml(p) +
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
      p = { username: u.username, avatarUrl: u.avatarUrl, bio: u.bio, joinedAt: u.joinedAt, level: u.level,
            levelXp: u.levelXp, levelXpNeeded: u.levelXpNeeded, streak: u.streakCount, timezone: u.timezone,
            account: { profilePublic: u.profilePublic } };
    }
    if (!p) return;
    host.innerHTML = heroHtml(p, true);
    animateRing(host);
  }

  function animateRing(root) {
    var ring = root.querySelector(".pf-ring-fill");
    if (!ring) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ring.style.strokeDashoffset = ring.getAttribute("data-offset"); });
    });
  }

  /** Progress bars start empty and grow in, like the rest of the app. */
  function animateBars(root) {
    if (!root) return;
    var bars = root.querySelectorAll("[data-w]");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bars.forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
      });
    });
  }

  /* ===============================================================
     Overview
  ================================================================*/

  function tile(value, label, cls) {
    return '<div class="pf-stat liquid-glass' + (cls ? " " + cls : "") + '"><b>' + value + "</b><span>" + label + "</span></div>";
  }

  function bar(pct, cls) {
    return '<div class="pf-bar"><div class="pf-bar-fill' + (cls ? " " + cls : "") + '" data-w="' + Math.max(0, Math.min(100, pct)) + '"></div></div>';
  }

  function statsHtml(p) {
    var s = p.stats;
    return '<div class="pf-stats">' +
      tile(fmt(p.xp), "Total XP") +
      tile(p.level, "Level") +
      tile(p.streak, "Day streak", p.streak ? "is-hot" : "") +
      tile(p.streakBest, "Best streak") +
      tile(fmt(s.lessonsCompleted), "Lessons done") +
      tile(p.badges.length, "Badges") +
      tile(fmt(s.activeDays), "Active days") +
      tile("#" + fmt(s.weeklyRank), "Rank this week") +
    "</div>";
  }

  function levelHtml(p) {
    var needed = p.levelXpNeeded || 1;
    var have = Math.min(p.levelXp || 0, needed);
    return '<section class="pf-card liquid-glass"><h3>Level progress</h3>' +
      '<div class="pf-level-row"><b>Level ' + p.level + "</b><span>" + fmt(have) + " / " + fmt(needed) + " XP</span><b>Level " + (p.level + 1) + "</b></div>" +
      bar(100 * have / needed) +
      '<p class="pf-note">' + fmt(needed - have) + " XP to go. Each level needs 100 XP more than the one before.</p>" +
    "</section>";
  }

  function goalHtml(p) {
    if (!p.account) return "";
    var a = p.account;
    var pct = a.dailyGoal ? 100 * a.xpToday / a.dailyGoal : 0;
    var done = a.xpToday >= a.dailyGoal;
    return '<section class="pf-card liquid-glass"><h3>Today</h3>' +
      '<div class="pf-level-row"><b>' + fmt(a.xpToday) + " XP</b><span>" + (done ? "Daily goal reached" : fmt(a.dailyGoal - a.xpToday) + " XP to your daily goal") + "</span><b>" + fmt(a.dailyGoal) + " XP</b></div>" +
      bar(pct, done ? "is-done" : "") +
      '<p class="pf-note">Goal reached on ' + fmt(p.stats.goalDays) + " day" + (p.stats.goalDays === 1 ? "" : "s") + " so far.</p>" +
    "</section>";
  }

  function coursesHtml(p) {
    if (!p.courses || !p.courses.length) return "";
    return '<section class="pf-card liquid-glass"><h3>Courses</h3><ul class="pf-courses">' +
      p.courses.map(function (c) {
        var sub = [];
        if (c.currentLesson && c.completed < c.total) sub.push("Next: " + esc(c.currentLesson));
        else if (c.total && c.completed >= c.total) sub.push("Course complete");
        if (c.placementLevel) sub.push("Placed at " + esc(PLACEMENT[c.placementLevel] || "level " + c.placementLevel));
        return "<li>" +
          '<div class="pf-course-head"><b>' + esc(c.name) + "</b>" + (c.active ? '<span class="pf-chip">Active</span>' : "") +
          '<span class="pf-course-num">' + c.completed + " / " + c.total + " lessons</span></div>" +
          bar(c.percent, c.percent >= 100 ? "is-done" : "") +
          (sub.length ? '<p class="pf-note">' + sub.join(" · ") + "</p>" : "") +
        "</li>";
      }).join("") +
    "</ul></section>";
  }

  function badgesHtml(p) {
    var earned = p.badges.map(function (b) {
      return '<li class="pf-badge is-earned">' + icon("medal", "pf-badge-ic") + "<div><b>" + esc(b.name) + "</b><span>" + esc(b.label) +
        (b.earnedAt ? " · " + esc(longDate(b.earnedAt)) : "") + "</span></div></li>";
    }).join("");
    var next = (p.nextBadges || []).map(function (b) {
      return '<li class="pf-badge">' + icon("medal", "pf-badge-ic") + '<div class="pf-badge-body"><b>' + esc(b.name) + "</b><span>" + esc(b.label) + " · " + esc(b.course) + "</span>" +
        bar(b.progressPercent) + "</div></li>";
    }).join("");
    if (!earned && !next) {
      return '<section class="pf-card liquid-glass"><h3>Badges</h3><p class="pf-muted">No badges yet. Finish a unit to earn one.</p></section>';
    }
    return '<section class="pf-card liquid-glass"><h3>Badges</h3>' +
      (earned ? '<ul class="pf-badges">' + earned + "</ul>" : '<p class="pf-muted">No badges yet. Finish a unit to earn one.</p>') +
      (next ? '<h4 class="pf-sub">Up next</h4><ul class="pf-badges">' + next + "</ul>" : "") +
    "</section>";
  }

  function overviewHtml(p) {
    return statsHtml(p) +
      '<div class="pf-grid">' + levelHtml(p) + goalHtml(p) + "</div>" +
      coursesHtml(p) +
      badgesHtml(p);
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
    return '<section class="pf-card liquid-glass"><h3>Where your XP comes from</h3><ul class="pf-hbars">' +
      rows.map(function (r) {
        return '<li><span class="pf-hbar-label">' + esc(SOURCES[r.source] || r.source) + "</span>" +
          '<div class="pf-hbar-track"><div class="pf-bar-fill" data-w="' + (100 * r.xp / max).toFixed(1) + '"></div></div>' +
          '<span class="pf-hbar-val">' + fmt(r.xp) + " XP <small>" + Math.round(100 * r.xp / total) + "%</small></span></li>";
      }).join("") +
    "</ul></section>";
  }

  function gamesHtml(p) {
    var g = p.games;
    var w = g.wordle;
    var maxDist = Math.max.apply(null, w.dist.concat([1]));
    // "–" instead of a misleading 0 % before the first game
    var winPct = w.played ? Math.round(100 * w.won / w.played) + "%" : "–";
    var storyPct = g.story.played ? Math.round(100 * g.story.correct / g.story.played) + "%" : "–";
    function mini(v, l) { return '<div class="pf-mini"><b>' + v + "</b><span>" + l + "</span></div>"; }
    return '<section class="pf-card liquid-glass"><h3>Practice games</h3><div class="pf-games">' +
      '<div class="pf-game"><h4>Wordle</h4><div class="pf-minis">' +
        mini(w.played, "Played") + mini(winPct, "Won") + mini(w.streak, "Streak") + mini(w.maxStreak, "Best") +
      "</div>" +
      (w.won ? '<ol class="pf-dist" aria-label="Wins by number of guesses">' + w.dist.map(function (n, i) {
        return '<li><span>' + (i + 1) + '</span><div class="pf-hbar-track"><div class="pf-bar-fill" data-w="' + (100 * n / maxDist).toFixed(1) + '"></div></div><b>' + n + "</b></li>";
      }).join("") + "</ol>" : '<p class="pf-muted pf-small">No wins yet. Today\'s word is waiting in Practice.</p>') +
      "</div>" +
      '<div class="pf-game"><h4>Older or Younger</h4><div class="pf-minis">' +
        mini(g.older.best, "Best run") + mini(g.older.runs, "Runs") +
      "</div></div>" +
      '<div class="pf-game"><h4>Daily Story</h4><div class="pf-minis">' +
        mini(g.story.played, "Answered") + mini(storyPct, "Correct") + mini(g.story.streak, "Streak") + mini(g.story.best, "Best") +
      "</div></div>" +
    "</div></section>";
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

  function recentHtml(p) {
    if (!p.recent) return "";
    return '<section class="pf-card liquid-glass"><h3>Recent activity</h3>' +
      (p.recent.length ? '<ul class="pf-feed">' + p.recent.map(function (r) {
        return '<li><span class="pf-feed-text">' + recentLabel(r) + '</span><time datetime="' + esc(r.at) + '" title="' + esc(new Date(r.at).toLocaleString("en-GB")) + '">' + esc(ago(r.at)) + "</time>" +
          '<b class="pf-feed-xp">' + (r.xp >= 0 ? "+" : "") + fmt(r.xp) + " XP</b></li>";
      }).join("") + "</ul>" : '<p class="pf-muted">Nothing yet. Finish a lesson or play today\'s Wordle to get started.</p>') +
    "</section>";
  }

  function activityHtml(p) {
    return heatCardHtml(p) + sourcesHtml(p) + gamesHtml(p) + recentHtml(p);
  }

  function revealHeatmap() {
    var panel = $("pf-panel-activity");
    if (panel && !panel.hidden) animateBars(panel);
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

      // Data + account
      '<section class="pf-card liquid-glass" id="pf-set-account"><h3>Your data</h3>' +
        '<p class="pf-note">Download everything Codle stores about you as a JSON file: account, progress, XP history, game results and saved code.</p>' +
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
        (step.devCode ? '<p class="pf-note pf-dev">Development mode, no e-mail was sent. Your code is <b>' + esc(step.devCode) + "</b>.</p>" : "") +
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
          : statsHtml(p) + heatCardHtml(p) + coursesHtml(p) + badgesHtml(p) + gamesHtml(p));
      animateRing(body);
      animateBars(body);
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
      api.put("me/settings", { effects: t.value }).catch(function () { /* the device keeps it in localStorage anyway */ });
    }
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
        state.emailStep = { email: email, devCode: res.devCode || null, minutes: res.expiresInMinutes };
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

  window.CodleProfile = {
    update: update,
    showUser: showUser,
    reload: function () { return load(true); }
  };
})();
