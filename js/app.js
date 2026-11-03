/**
 * Codle — Learn to Code
 * Main application script
 *
 * Handles: hydrating the UI from CodleData, learning-path trail drawing
 * and reveal animation, background tinting on scroll, SPA view switching,
 * navbar indicators, the phone course sheet and the liquid-glass pointer effects.
 *
 * With the API (js/api.js) CodleData comes from the server: the path is built
 * from the database, lessons open in the editor, and the Leaderboard and
 * Profile tabs are filled in. Without it the static demo is shown (path from
 * js/curriculum.js, progress from js/data.js), and a visitor who is not logged
 * in goes to register.html.
 */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Lite mode (js/perf.js) on slow devices: skip the decorative motion as well.
  function isLite() { return !!(window.CodlePerf && window.CodlePerf.lite); }
  function calmMotion() { return reduceMotion || isLite(); }
  var RING_CIRCUMFERENCE = 283; // 2 * PI * 45 (progress-ring viewBox radius)
  var XP_RING_CIRCUMFERENCE = 264; // 2 * PI * 42 (XP ring radius)
  var LEVEL_RING_CIRCUMFERENCE = 289; // 2 * PI * 46 (level ring radius)

  function $(id) { return document.getElementById(id); }
  function activeCourseView() { return document.querySelector(".course-view.active") || document; }

  /* ===============================================================
     1. HYDRATE UI FROM CONFIG
  ================================================================*/

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  /** Stop the SMIL flame animation and park it on its first frame. */
  function freezeFlame(targetEl) {
    if (!targetEl) return;
    var svgEl = targetEl.tagName.toLowerCase() === "svg" ? targetEl : targetEl.querySelector("svg");
    if (!svgEl) return;
    if (svgEl.pauseAnimations) svgEl.pauseAnimations();
    svgEl.querySelectorAll("animate").forEach(function (a) {
      var attr = a.getAttribute("attributeName");
      var vals = a.getAttribute("values");
      if (attr && vals && a.parentNode) a.parentNode.setAttribute(attr, vals.split(";")[0]);
      a.remove();
    });
  }

  function hydrateUserStats(user) {
    setText("ui-streak-mobile", user.streakCount);
    setText("ui-streak-desktop", user.streakCount);
    setText("ui-gems-mobile", user.gems.toLocaleString("en-US"));
    setText("ui-gems-desktop", user.gems.toLocaleString("en-US") + " XP");
    var badgeCard = $("card-badge");
    if (badgeCard) badgeCard.hidden = !user.nextBadge;
    if (user.nextBadge) {
      setText("ui-badge-name", user.nextBadge.name);
      setText("ui-badge-label", user.nextBadge.label);
      var badgeProgress = $("ui-badge-progress");
      if (badgeProgress) badgeProgress.style.width = user.nextBadge.progressPercent + "%";
    }

    // Daily XP ring
    setText("ui-xp-current", user.xpToday);
    setText("ui-xp-goal", user.dailyGoal);
    var xpRing = $("ui-xp-ring");
    if (xpRing) {
      var ratio = Math.min(1, user.dailyGoal ? user.xpToday / user.dailyGoal : 0);
      var offset = XP_RING_CIRCUMFERENCE * (1 - ratio);
      // Let the first paint happen at "empty" so the ring animates in.
      requestAnimationFrame(function () { xpRing.setAttribute("stroke-dashoffset", offset); });
    }

    // Level: number, XP left to the next level, and the ring around the avatar
    if (user.level) {
      var needed = user.levelXpNeeded || 0;
      var earned = Math.min(user.levelXp || 0, needed);
      setText("ui-level-num", user.level);
      setText("ui-level-next", (needed - earned).toLocaleString("en-US") + " XP to level " + (user.level + 1));
      var levelRing = $("ui-level-ring");
      if (levelRing && needed) {
        var levelOffset = LEVEL_RING_CIRCUMFERENCE * (1 - earned / needed);
        requestAnimationFrame(function () { levelRing.style.strokeDashoffset = levelOffset; });
      }
    }

    var streakCard = $("card-streak");
    var streakStat = $("ui-streak-stat-mobile");
    if (!user.streakActive) {
      freezeFlame($("ui-fire-mobile"));
      freezeFlame($("ui-fire-desktop"));
      if (streakCard) streakCard.classList.add("inactive");
      if (streakStat) streakStat.classList.add("inactive");
    } else {
      // Practising today lights the card up again (the flame itself moves again after a reload).
      if (streakCard) streakCard.classList.remove("inactive");
      if (streakStat) streakStat.classList.remove("inactive");
    }
  }

  function setMilestoneState(milestone, state) {
    var circle = milestone.querySelector(".milestone-circle");
    milestone.classList.remove("completed", "current", "locked");
    milestone.classList.add(state);

    var isLocked = state === "locked";
    milestone.setAttribute("tabindex", isLocked ? "-1" : "0");
    if (isLocked) milestone.setAttribute("aria-disabled", "true");
    else milestone.removeAttribute("aria-disabled");

    var check = circle.querySelector(".milestone-check");
    var ring = circle.querySelector(".progress-ring");
    var btn = milestone.querySelector(".milestone-start-btn");

    if (state === "completed") {
      if (!check) {
        circle.insertAdjacentHTML("beforeend",
          '<div class="milestone-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>');
      }
      if (ring) ring.remove();
      if (btn) btn.remove();
    } else if (state === "current") {
      if (check) check.remove();
      if (!ring) {
        circle.insertAdjacentHTML("afterbegin",
          '<div class="progress-ring" aria-hidden="true"><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="45"/><circle class="fill" cx="50" cy="50" r="45"/></svg></div>');
      }
      if (!btn) {
        milestone.insertAdjacentHTML("beforeend", '<button class="milestone-start-btn" type="button" id="btn-continue">Continue</button>');
      }
    } else {
      if (check) check.remove();
      if (ring) ring.remove();
      if (btn) btn.remove();
    }
  }

  function hydrateCourse(data) {
    var courseId = data.activeCourse || "html";
    var progress = data.progress[courseId] || { currentUnit: 1, currentMilestone: 1, currentMilestoneProgress: 0 };
    var chapters = activeCourseView().querySelectorAll(".chapter-group");
    var currentUnitTitle = "";

    chapters.forEach(function (chapter, i) {
      var unitIndex = i + 1;
      var milestones = chapter.querySelectorAll(".milestone");
      var unitLocked = unitIndex > progress.currentUnit;
      chapter.classList.toggle("chapter-locked", unitLocked);

      milestones.forEach(function (milestone, j) {
        var msIndex = j + 1;
        var state;
        if (unitLocked) {
          state = "locked";
        } else if (unitIndex < progress.currentUnit || msIndex < progress.currentMilestone) {
          state = "completed";
        } else if (unitIndex === progress.currentUnit && msIndex === progress.currentMilestone) {
          state = "current";
          var heading = chapter.querySelector(".path-section-header h3");
          if (heading) currentUnitTitle = heading.textContent;
        } else {
          state = "locked";
        }
        setMilestoneState(milestone, state);
      });
    });

    // Course label under the dropdown mirrors the unit that holds the current lesson.
    setText("ui-course-label", currentUnitTitle.replace(" · ", " — "));
    // The phone header shows the course name in the chip instead
    var sel = $("course-selector");
    if (sel && sel.value !== courseId && sel.querySelector('option[value="' + courseId + '"]')) sel.value = courseId;
    if (sel && sel.selectedIndex >= 0) setText("ui-course-chip", sel.options[sel.selectedIndex].textContent);

    // Animate the progress ring on the current lesson.
    var fill = activeCourseView().querySelector(".milestone.current .progress-ring .fill");
    if (fill) {
      var pct = progress.currentMilestoneProgress || 0;
      requestAnimationFrame(function () {
        fill.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct / 100);
      });
    }
  }

  function hydrateApp() {
    var data = window.CodleData;
    if (!data) return;
    hydrateUserStats(data.user);
    hydrateCourse(data);
  }

  /**
   * Static demo: the same path object the API returns, built from js/curriculum.js
   * and the demo learner's position in js/data.js.
   */
  function demoPath(courseId) {
    var cur = window.CodleCurriculum || {};
    var course = cur[courseId] || cur[Object.keys(cur)[0]];
    if (!course) return null;
    var progress = (window.CodleData && window.CodleData.progress[courseId]) || { currentUnit: 1, currentMilestone: 1, currentMilestoneProgress: 0 };
    var id = 0;
    return {
      course: { slug: courseId, name: course.name },
      units: course.units.map(function (u, i) {
        var unitIndex = i + 1;
        var lessons = u.lessons.map(function (l, j) {
          var msIndex = j + 1;
          var state = unitIndex < progress.currentUnit || (unitIndex === progress.currentUnit && msIndex < progress.currentMilestone) ? "completed"
            : unitIndex === progress.currentUnit && msIndex === progress.currentMilestone ? "current" : "locked";
          return { id: ++id, slug: l[0], title: l[1], kind: l[2] || "lesson", xp: l[3] || 20, state: state,
                   progress: state === "current" ? progress.currentMilestoneProgress : 0, playable: state !== "locked" };
        });
        var done = lessons.filter(function (l) { return l.state === "completed"; }).length;
        return { position: unitIndex, title: u.title, total: lessons.length, completed: done, lessons: lessons };
      })
    };
  }

  /* ===============================================================
     1a. ONLINE — path, sidebar and tabs from the API
  ================================================================*/

  var online = false;
  var api = window.CodleApi;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  // Lesson icons (inner SVG markup), picked by lesson slug, otherwise by kind.
  var ICONS = {
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    text: '<path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    cycle: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>',
    bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    medal: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    back: '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    lambda: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    sets: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
    tuple: '<rect x="3" y="14" width="18" height="4" rx="2" ry="2"/><rect x="3" y="6" width="18" height="4" rx="2" ry="2"/>',
    bars: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    heading: '<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/>',
    form: '<rect x="3" y="5" width="18" height="5" rx="1.5"/><rect x="3" y="14" width="18" height="5" rx="1.5"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z"/>',
    type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    square: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
    ruler: '<path d="M21 3 3 21"/><path d="m15 5 2 2"/><path d="m11 9 2 2"/><path d="m7 13 2 2"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    move: '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
    sparkle: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.2 2.2M16.2 16.2l2.2 2.2M5.6 18.4l2.2-2.2M16.2 7.8l2.2-2.2"/>',
    branch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    scale: '<line x1="12" y1="3" x2="12" y2="21"/><path d="M5 7l-3 7a4 4 0 0 0 6 0z"/><path d="M19 7l-3 7a4 4 0 0 0 6 0z"/><line x1="3" y1="7" x2="21" y2="7"/>',
    repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    pointer: '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>',
    plus: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    quote: '<path d="M8 10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4"/><path d="M19 10h-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'
  };
  var SLUG_ICON = {
    // HTML
    "hello-html": "file", "headings": "heading", "paragraphs": "text", "comments": "quote",
    "links": "link", "lists": "list", "emphasis": "type", "line-breaks": "bars",
    "images": "image", "alt-text": "eye", "figures": "square", "audio-video": "play",
    "document-structure": "layout", "semantic-tags": "tag", "header-footer": "layout", "navigation": "move", "sections": "grid",
    "tables": "table", "table-headers": "table", "forms": "form", "inputs": "sliders", "buttons-labels": "pointer",
    "attributes": "hash", "classes": "tag", "meta-tags": "search", "accessibility": "eye",
    // CSS
    "hello-css": "palette", "selectors": "target", "colors": "palette", "classes-ids": "hash",
    "fonts": "type", "text-styling": "text", "text-spacing": "ruler", "web-fonts": "cloud",
    "box-model": "square", "padding-margin": "square", "borders": "square", "width-height": "ruler",
    "display": "layout", "flexbox": "grid", "flex-alignment": "move", "grid": "grid", "positioning": "move",
    "units": "ruler", "media-queries": "phone", "mobile-first": "phone", "responsive-images": "image",
    "transitions": "clock", "transforms": "move", "animations": "sparkle", "css-variables": "box",
    // JavaScript
    "console-log": "terminal", "variables": "box", "data-types": "grid", "operators": "plus", "strings": "text",
    "functions": "code", "parameters": "sliders", "scope": "target", "arrow-functions": "code", "closures": "target",
    "if-else": "branch", "comparisons": "scale", "boolean-logic": "bolt", "for-loops": "repeat", "while-loops": "cycle",
    "arrays": "list", "array-methods": "list", "objects": "braces", "json": "braces",
    "selecting-elements": "pointer", "changing-content": "text", "styles-classes": "palette", "events": "bolt", "creating-elements": "plus",
    "template-literals": "quote", "destructuring": "braces", "promises": "clock", "fetch": "cloud",
    "final-exam": "check"
  };
  var KIND_ICON = { lesson: "code", quest: "code", quiz: "medal", exam: "check" };
  // The winding of the path, repeated for longer courses.
  var POSITIONS = ["left", "right", "left-far", "center", "right-far", "left", "right", "center",
    "left-far", "right", "left", "right-far", "center", "left-far",
    "right", "left", "right-far", "center", "left-far", "right", "left-far", "right-far", "center"];

  function lessonIcon(l) {
    var name = SLUG_ICON[l.slug] || KIND_ICON[l.kind] || "code";
    return '<svg class="ms-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
  }

  function renderPath(path) {
    var host = $("path-nodes");
    if (!host || !path) return;
    var n = 0;
    var html = '<div id="course-view-' + esc(path.course.slug) + '" class="course-view active">';
    path.units.forEach(function (u) {
      html += '<div class="chapter-group"><div class="path-nodes">' +
        '<div class="path-node path-unit-head" data-pos="center" data-is-waypoint><div class="path-section-header liquid-glass">' +
        "<h3>Unit " + u.position + " · " + esc(u.title) + "</h3>" +
        "<p>" + (u.total ? u.completed + " / " + u.total + '<span class="unit-count-label"> lessons complete</span>' : "No lessons yet") + "</p></div></div>";
      u.lessons.forEach(function (l) {
        var tip = "";
        if (l.state !== "locked") {
          var sub = l.state === "current" && l.progress ? l.progress + "% complete" : "+" + l.xp + " XP";
          tip = '<div class="milestone-tooltip liquid-glass"><div class="tip-title">' + esc(l.title) + '</div><div class="tip-sub">' + sub + "</div></div>";
        }
        html += '<div class="path-node" data-pos="' + POSITIONS[n++ % POSITIONS.length] + '" data-is-waypoint>' +
          '<div class="milestone ' + l.state + '" id="ms-' + l.id + '" role="button" tabindex="0" data-lesson="' + l.id + '" data-kind="' + esc(l.kind) + '"' + (l.playable ? ' data-playable="1"' : "") + ">" +
          tip + '<div class="milestone-circle liquid-glass">' + lessonIcon(l) + "</div>" +
          '<div class="milestone-label">' + esc(l.title) + "</div></div></div>";
      });
      html += "</div></div>";
    });
    if (!path.units.length) {
      html += '<div class="chapter-group"><div class="path-nodes"><div class="path-node" data-pos="center">' +
        '<div class="path-section-header liquid-glass"><h3>' + esc(path.course.name) + "</h3><p>Lessons are on their way.</p></div></div></div></div>";
    }
    host.innerHTML = html + "</div>";
  }

  function renderCourseSelector(courses, active) {
    var sel = $("course-selector");
    if (!sel) return;
    sel.innerHTML = courses.map(function (c) {
      return '<option value="' + esc(c.slug) + '"' + (c.slug === active ? " selected" : "") + ">" + esc(c.name) + "</option>";
    }).join("");
  }

  function lbRow(r) {
    var name = r.you ? "You" : r.username;
    var avatar = window.CodleAvatar
      ? window.CodleAvatar.html(r, "lb-avatar")
      : '<div class="lb-avatar" aria-hidden="true">' + esc(r.username.charAt(0).toUpperCase()) + "</div>";
    // Each row opens that learner's profile (js/profile.js).
    return '<div class="leaderboard-item' + (r.you ? " you-row" : "") + '" data-user="' + esc(r.username) + '" role="button" tabindex="0"' +
      ' aria-label="' + esc((r.you ? "Your profile" : r.username + "'s profile") + ", rank " + r.rank + ", " + fmt(r.xp) + " XP") + '">' +
      '<span class="rank' + (r.rank === 1 ? " gold-rank" : "") + '">' + r.rank + "</span>" + avatar +
      '<span class="lb-name">' + esc(name) + '</span><span class="lb-xp">' + fmt(r.xp) + " XP</span></div>";
  }

  /** Sidebar card: the top of this week's board, with your own row always in it. */
  function renderLeaderboardCard(lb) {
    var box = $("ui-leaderboard");
    if (!box || !lb) return;
    var rows = lb.top.slice(0, 4);
    if (!rows.some(function (r) { return r.you; })) {
      rows = rows.slice(0, 3).concat([{ rank: lb.you.rank, username: lb.you.username, avatarUrl: lb.you.avatarUrl, xp: lb.you.xp, you: true }]);
    }
    box.innerHTML = rows.map(lbRow).join("");
  }

  function renderProfileCard(user) {
    setText("profile-username", user.username);
    setText("ui-joined", "Joined " + new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    setText("ui-top", "Top " + user.topPercent + "%");
    // Picture, or the gradient made from the username (js/avatar.js)
    var avatars = [$("nav-profile-desktop"), $("nav-profile-mobile"), $("sidebar-avatar")];
    if (window.CodleAvatar) {
      avatars.forEach(function (el) { window.CodleAvatar.paint(el, user); });
    } else {
      setText("nav-profile-desktop", user.username.charAt(0).toUpperCase());
      setText("nav-profile-mobile", user.username.charAt(0).toUpperCase());
    }
  }

  function renderLeaderboardView(lb) {
    var view = $("view-leaderboard");
    if (!view || !lb) return;
    var you = lb.top.some(function (r) { return r.you; }) ? "" :
      '<div class="lb-gap" aria-hidden="true">…</div>' + lbRow({ rank: lb.you.rank, username: lb.you.username, avatarUrl: lb.you.avatarUrl, xp: lb.you.xp, you: true });
    view.innerHTML =
      '<div class="practice-shell online-view">' +
        '<header class="practice-head"><h2>Leaderboard</h2><p>XP earned in the last 7 days. Lessons, Wordle and the history games all count. Tap a learner to see their profile.</p></header>' +
        '<div class="lb-board liquid-glass">' +
          (lb.top.length ? lb.top.map(lbRow).join("") + you : '<p class="lb-empty">Nobody has earned XP this week yet.</p>') +
        "</div>" +
      "</div>";
  }

  /** The Profile tab itself lives in js/profile.js. */
  function renderProfileView(user) {
    if (window.CodleProfile && user) window.CodleProfile.update(user);
  }

  /** New user numbers (after XP was earned somewhere on the page). */
  function applyUser(user) {
    if (!window.CodleData || !user) return;
    window.CodleData.user = user;
    hydrateUserStats(user);
    renderProfileCard(user);
    renderProfileView(user);
  }

  function applyAppData(data) {
    window.CodleData = data;
    renderCourseSelector(data.courses, data.activeCourse);
    renderPath(data.path);
    renderProfileCard(data.user);
    renderLeaderboardCard(data.leaderboard);
    renderProfileView(data.user);
    var container = $("path-container");
    if (container) delete container.dataset.animated;
    stopAutoScroll();
    hydrateApp();
    drawAndAnimate();
    updateUnitAccent();
  }

  /** Called by the practice games after they earned XP. */
  function refreshUser() {
    if (!online) return;
    api.get("session").then(function (res) { applyUser(res.user); });
    api.get("leaderboard").then(function (lb) { renderLeaderboardCard(lb); renderLeaderboardView(lb); });
  }

  var toastTimer = null;
  function toast(msg, ms) {
    var el = $("wordle-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, ms || 1800);
  }

  /** Opens a lesson in the editor. Offline, every open lesson shows the sample quest. */
  /** Quizzes and exams open in quiz.html, everything else in the editor. */
  function lessonPage(kind) { return kind === "quiz" || kind === "exam" ? "quiz.html" : "editor.html"; }

  function openLesson(ms) {
    if (!online) { window.location.href = lessonPage(ms.dataset.kind); return; } // static demo: sample quest / sample quiz
    if (!ms.dataset.playable) {
      if (mascot) mascot.say("This lesson isn't ready yet. Keep going on the current one and I'll let you know.", { mood: "sad" });
      else toast("This lesson isn't ready yet");
      return;
    }
    window.location.href = lessonPage(ms.dataset.kind) + "?lesson=" + encodeURIComponent(ms.dataset.lesson);
  }

  /* ===============================================================
     1a. MASCOT — greets, explains each view, and answers clicks
  ================================================================*/

  var mascot = window.CodleMascot || null;
  var VIEW_TIPS = {
    "view-learn": "This is your path. The big highlighted lesson is the one to do next.",
    "view-practice": "Practice games earn XP too. Wordle changes every day, so come back tomorrow for a new word.",
    "view-leaderboard": "The leaderboard ranks everyone by XP. Finish lessons and games to climb.",
    "view-profile": "Your profile: level, streak and badges. Keep the streak alive by learning every day."
  };

  function currentLessonTitle() {
    var ms = activeCourseView().querySelector(".milestone.current");
    if (!ms) return "";
    var label = ms.querySelector(".milestone-label");
    return label ? label.textContent.trim() : "";
  }

  function mascotHelp() {
    var view = document.querySelector(".page-view.active");
    var id = view ? view.id : "view-learn";
    if (id === "view-learn") {
      var title = currentLessonTitle();
      var user = window.CodleData && window.CodleData.user;
      var days = user ? (user.streak || user.streakCount || 0) : 0;
      var streak = days ? "You're on a " + days + "-day streak, keep it going. " : "";
      return {
        text: streak + (title ? "Your next lesson is <b>" + esc(title) + "</b>. Click the big highlighted circle on the path to open it." : "Pick the highlighted lesson on the path to continue."),
        html: true,
        mood: "happy"
      };
    }
    if (id === "view-practice") {
      return { text: "Pick a game. In <b>Wordle</b> you guess a five-letter coding word in six tries. Green means right spot, gold means right letter, wrong spot.", html: true };
    }
    return { text: VIEW_TIPS[id] || "Click a tab above to continue learning." };
  }

  function mascotGreet() {
    if (!mascot) return;
    mascot.help(mascotHelp);
    var user = window.CodleData && window.CodleData.user;
    var name = user && (user.displayName || user.username || user.name);
    var hour = new Date().getHours();
    var when = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    var title = currentLessonTitle();
    mascot.tip(when + (name ? ", " + name : "") + ". " + (title ? "Ready for " + title + "? It's the highlighted lesson on your path." : "Click me any time you need a hand."), { key: "greet", mood: "happy", ms: 6000 });
  }

  window.CodleApp = {
    refreshUser: refreshUser,
    applyUser: applyUser,
    toast: toast,
    isOnline: function () { return online; },
    showView: function (viewId) { activateView(viewId); }
  };

  /* ===============================================================
     1b. STREAK FLAMES — only animate while someone can see them
         The flames morph SVG paths every frame (SMIL), which keeps the
         CPU busy even when nothing else moves. Pause them when they are
         off screen, hidden by the layout, in a background tab, or when
         lite mode is on.
  ================================================================*/

  var FLAME_FPS = 24; // a flame reads as alive at film rate; 60 fps cost ~2.5x more CPU

  function setupFlames() {
    var flames = [$("ui-fire-mobile"), document.querySelector("#ui-fire-desktop svg")].filter(function (el) {
      return el && el.pauseAnimations && el.setCurrentTime;
    });
    if (!flames.length) return;
    var onScreen = new Map();
    var timer = null;
    var startedAt = 0;

    // The SMIL timeline stays paused; a timer seeks it FLAME_FPS times a second.
    // Each seek is one style/paint pass instead of one per display frame.
    function step() {
      var t = (performance.now() - startedAt) / 1000;
      flames.forEach(function (svg) { if (onScreen.get(svg)) svg.setCurrentTime(t); });
    }

    function update() {
      var anyVisible = flames.some(function (svg) { return onScreen.get(svg); });
      var run = anyVisible && !document.hidden && !isLite() && !reduceMotion;
      if (run && !timer) {
        if (!startedAt) startedAt = performance.now();
        timer = setInterval(step, 1000 / FLAME_FPS);
      } else if (!run && timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    flames.forEach(function (svg) { onScreen.set(svg, false); svg.pauseAnimations(); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { onScreen.set(en.target, en.isIntersecting); });
        update();
      });
      flames.forEach(function (svg) { io.observe(svg); });
    } else {
      flames.forEach(function (svg) { onScreen.set(svg, true); });
    }
    document.addEventListener("visibilitychange", update);
    if (window.CodlePerf) window.CodlePerf.onChange(update);
    update();
  }

  /* ===============================================================
     2. LEARNING PATH — DRAW TRAIL + ANIMATE
  ================================================================*/

  function buildSingleSegment(p0, p1) {
    var pull = Math.max(Math.abs(p1.y - p0.y) * 0.45, 20);
    return "M " + p0.x + " " + p0.y +
      " C " + p0.x + " " + (p0.y + pull) +
      ", " + p1.x + " " + (p1.y - pull) +
      ", " + p1.x + " " + p1.y;
  }

  function buildSegmentedPath(pts) {
    var d = "";
    for (var i = 0; i < pts.length - 1; i++) d += " " + buildSingleSegment(pts[i], pts[i + 1]);
    return d;
  }

  var autoScroll = null; // handle for the running auto-scroll loop, if any

  function stopAutoScroll() {
    if (autoScroll) autoScroll.stopped = true;
  }

  function drawAndAnimate() {
    var container = $("path-container");
    var svg = $("path-svg");
    if (!container || !svg) return;
    var allWaypoints = activeCourseView().querySelectorAll("[data-is-waypoint]");
    if (allWaypoints.length < 2) return;

    var containerRect = container.getBoundingClientRect();
    svg.setAttribute("width", containerRect.width);
    svg.setAttribute("height", containerRect.height);
    svg.setAttribute("viewBox", "0 0 " + containerRect.width + " " + containerRect.height);

    var points = [];
    var waypointEls = [];
    var firstLockedIdx = -1;
    var unitColors = [];

    // On phones the unit headers stick to the top while scrolling; measure them where they live.
    container.classList.add("measuring");
    allWaypoints.forEach(function (node) {
      var target = node.querySelector(".milestone-circle") || node.querySelector(".path-section-header");
      if (!target) return;
      var r = target.getBoundingClientRect();
      points.push({
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top
      });
      waypointEls.push(target);
      var chap = node.closest(".chapter-group");
      unitColors.push(chap ? getComputedStyle(chap).getPropertyValue("--chapter-accent").trim() : "");

      if (firstLockedIdx === -1) {
        var ms = node.querySelector(".milestone");
        if (ms && (ms.classList.contains("current") || ms.classList.contains("locked"))) {
          firstLockedIdx = points.length - 1;
        }
      }
    });
    container.classList.remove("measuring");

    if (points.length < 2) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var ns = "http://www.w3.org/2000/svg";

    // Background trail
    var bgPath = document.createElementNS(ns, "path");
    bgPath.setAttribute("class", "trail-bg");
    bgPath.setAttribute("d", buildSegmentedPath(points));
    svg.appendChild(bgPath);

    // Completed trail, one path per segment so each can animate in turn
    var completedEnd = firstLockedIdx >= 0 ? firstLockedIdx + 1 : points.length;
    var segmentPaths = [];
    var segmentLengths = [];
    var animate = !calmMotion() && !container.dataset.animated;
    var speedFactor = 1.5; // ms per px

    for (var i = 0; i < completedEnd - 1; i++) {
      var segPath = document.createElementNS(ns, "path");
      segPath.setAttribute("class", "trail-completed");
      segPath.setAttribute("d", buildSingleSegment(points[i], points[i + 1]));
      segPath.style.stroke = unitColors[i + 1] || unitColors[i] || "var(--accent)";
      svg.appendChild(segPath);
      segmentPaths.push(segPath);
      segmentLengths.push(segPath.getTotalLength());
    }

    if (!animate) {
      waypointEls.forEach(function (el) {
        (el.closest(".milestone") || el).classList.add("revealed");
      });
      return;
    }
    container.dataset.animated = "1";

    // Timeline: segment k finishes at segCumTime[k + 1]
    var segCumTime = [100];
    segmentPaths.forEach(function (sp, idx) {
      var len = segmentLengths[idx];
      var duration = len * speedFactor;
      var delay = segCumTime[idx];
      sp.style.strokeDasharray = len;
      sp.style.strokeDashoffset = len;
      setTimeout(function () {
        sp.style.transition = "stroke-dashoffset " + duration + "ms linear";
        sp.style.strokeDashoffset = "0";
      }, delay);
      segCumTime.push(delay + duration);
    });
    var totalCompletedTime = segCumTime[segCumTime.length - 1];

    // Auto-scroll follows the trail until it reaches the current lesson
    var currentMilestone = activeCourseView().querySelector(".milestone.current");
    var stopScrollAtIdx = -1;
    var waypointYs = waypointEls.map(function (el, idx) {
      var wrapper = el.closest(".milestone") || el;
      if (wrapper === currentMilestone) stopScrollAtIdx = idx;
      var rect = wrapper.getBoundingClientRect();
      return window.scrollY + rect.top + rect.height / 2;
    });

    stopAutoScroll();
    var loop = { stopped: false, targetY: window.scrollY, currentY: window.scrollY };
    autoScroll = loop;
    var lerpFactor = 0.045;

    function cancel() {
      loop.stopped = true;
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("keydown", cancel);
    }
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("pointerdown", cancel);
    window.addEventListener("keydown", cancel);

    (function tick() {
      if (loop.stopped) { cancel(); return; }
      var target = Math.max(0, loop.targetY - window.innerHeight / 2);
      loop.currentY += (target - loop.currentY) * lerpFactor;
      if (Math.abs(target - loop.currentY) < 0.5) loop.currentY = target;
      window.scrollTo(0, loop.currentY);
      requestAnimationFrame(tick);
    })();

    waypointEls.forEach(function (el, idx) {
      var wrapper = el.closest(".milestone") || el;
      var delay = idx < segCumTime.length
        ? segCumTime[idx]
        : totalCompletedTime + (idx - (segCumTime.length - 1)) * 200;
      setTimeout(function () {
        wrapper.classList.add("revealed");
        if (stopScrollAtIdx === -1 || idx <= stopScrollAtIdx) loop.targetY = waypointYs[idx];
        if (idx === waypointEls.length - 1) setTimeout(function () { loop.stopped = true; }, 800);
      }, delay);
    });
  }

  /* ===============================================================
     3. UNIT COLOUR FOLLOWS THE SCREEN
        --unit-accent = colour of the unit crossing the middle of the
        viewport, ignoring locked units. Sidebar accents (level ring,
        your XP, next badge) use it.
  ================================================================*/

  var currentUnitColor = "";

  function updateUnitAccent() {
    var chapters = activeCourseView().querySelectorAll(".chapter-group");
    if (!chapters.length) return;
    var mid = window.innerHeight / 2;
    var pick = null;
    for (var i = 0; i < chapters.length; i++) {
      var r = chapters[i].getBoundingClientRect();
      if (!r.height) return; // Learn view is hidden: keep the last colour
      // Last unlocked unit that starts above the middle. Locked units never take over the
      // colour, so scrolling into them keeps the colour of the last unit the player has.
      if (r.top <= mid && !chapters[i].classList.contains("chapter-locked")) pick = chapters[i];
    }
    if (!pick) pick = chapters[0];
    var color = getComputedStyle(pick).getPropertyValue("--chapter-accent").trim();
    if (color && color !== currentUnitColor) {
      currentUnitColor = color;
      document.documentElement.style.setProperty("--unit-accent", color);
    }
  }

  // Scroll events already arrive at most once per frame, and the check is a few rect reads.
  // One update per frame at most, however many scroll events arrive.
  var accentQueued = false;
  window.addEventListener("scroll", function () {
    if (accentQueued) return;
    accentQueued = true;
    requestAnimationFrame(function () {
      accentQueued = false;
      updateUnitAccent();
    });
  }, { passive: true });

  /* ===============================================================
     4. COURSE SWITCHER
  ================================================================*/

  var courseSelector = $("course-selector");
  if (courseSelector) {
    courseSelector.addEventListener("change", function (e) {
      var courseId = e.target.value;
      e.target.blur();
      if (online) {
        // Enrolls if needed and makes it the course shown next time too.
        api.post("me/course", { course: courseId }).then(function (data) {
          data.leaderboard = window.CodleData.leaderboard;
          applyAppData(data);
        }, function (err) {
          toast(err.message);
          e.target.value = window.CodleData.activeCourse;
        });
        return;
      }
      if (window.CodleData) window.CodleData.activeCourse = courseId;
      renderPath(demoPath(courseId));

      var container = $("path-container");
      if (container) delete container.dataset.animated;
      stopAutoScroll();
      hydrateApp();
      drawAndAnimate();
      updateUnitAccent();
    });
  }

  /* Phones: the chip in the top bar opens a sheet with the same courses as the dropdown.
     Picking one just changes the dropdown, so both paths above stay the only switch logic. */
  var COURSE_ABBR = { html: "HTML", css: "CSS", javascript: "JS", php: "PHP" };
  var courseSheet = $("course-sheet");
  var courseChip = $("course-chip");

  function courseRows() {
    var data = window.CodleData || {};
    var activeLabel = ($("ui-course-label") || {}).textContent || "";
    if (online && data.courses) {
      return data.courses.map(function (c) {
        return { slug: c.slug, name: c.name, sub: c.slug === data.activeCourse ? activeLabel : c.enrolled ? "Enrolled" : "Not started yet" };
      });
    }
    var cur = window.CodleCurriculum || {};
    return Object.keys(cur).map(function (slug) {
      var p = data.progress && data.progress[slug];
      var unit = p && cur[slug].units[p.currentUnit - 1];
      return { slug: slug, name: cur[slug].name, sub: unit ? "Unit " + p.currentUnit + " — " + unit.title : "Not started yet" };
    });
  }

  function openCourseSheet() {
    var list = $("course-sheet-list");
    if (!courseSheet || !list) return;
    var active = (window.CodleData && window.CodleData.activeCourse) || (courseSelector && courseSelector.value);
    list.innerHTML = courseRows().map(function (c) {
      return '<button type="button" class="sheet-row' + (c.slug === active ? " is-active" : "") + '" data-course="' + esc(c.slug) + '"' +
        (c.slug === active ? ' aria-current="true"' : "") + ">" +
        '<span class="sheet-row-mark" aria-hidden="true">' + esc(COURSE_ABBR[c.slug] || c.name.slice(0, 2).toUpperCase()) + "</span>" +
        '<span class="sheet-row-body"><b>' + esc(c.name) + "</b><small>" + esc(c.sub) + "</small></span>" +
        '<svg class="sheet-row-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' +
        "</button>";
    }).join("");
    courseSheet.classList.remove("closing");
    courseSheet.hidden = false;
    var card = courseSheet.querySelector(".sheet-card");
    if (card) card.focus({ preventScroll: true });
  }

  function closeCourseSheet() {
    if (!courseSheet || courseSheet.hidden) return;
    if (calmMotion()) { courseSheet.hidden = true; }
    else {
      courseSheet.classList.add("closing");
      setTimeout(function () { courseSheet.hidden = true; courseSheet.classList.remove("closing"); }, 260);
    }
    if (courseChip) courseChip.focus();
  }

  if (courseChip && courseSheet) {
    courseChip.addEventListener("click", openCourseSheet);
    courseSheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-sheet-close]")) { closeCourseSheet(); return; }
      var row = e.target.closest(".sheet-row");
      if (!row || !courseSelector) return;
      if (courseSelector.value !== row.getAttribute("data-course")) {
        courseSelector.value = row.getAttribute("data-course");
        courseSelector.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeCourseSheet();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !courseSheet.hidden) closeCourseSheet();
    });
  }

  /* ===============================================================
     5. SPA VIEW SWITCHING + TAB INDICATORS
  ================================================================*/

  var viewToDesktopTab = {
    "view-learn": "tab-learn",
    "view-practice": "tab-practice",
    "view-leaderboard": "tab-leaderboard",
    "view-profile": "tab-profile"
  };
  var viewToMobileTab = {
    "view-learn": "mob-tab-learn",
    "view-practice": "mob-tab-practice",
    "view-leaderboard": "mob-tab-ranks",
    "view-profile": "mob-tab-profile"
  };

  function makeIndicator(stripId, indicatorId, fillId, itemSelector, inset) {
    var strip = $(stripId);
    var ind = $(indicatorId);
    var fill = $(fillId);
    if (!strip || !ind || !fill) return null;
    var items = Array.prototype.slice.call(strip.querySelectorAll(itemSelector));

    function moveTo(btn) {
      var tr = strip.getBoundingClientRect();
      var br = btn.getBoundingClientRect();
      if (tr.width === 0) return; // strip is hidden at this breakpoint
      ind.style.width = br.width + "px";
      ind.style.transform = "translateX(" + (br.left - tr.left - inset) + "px)";
      if (!calmMotion()) {
        fill.classList.remove("squash");
        void fill.offsetWidth;
        fill.classList.add("squash");
      }
    }
    function select(btnId) {
      items.forEach(function (b) { b.setAttribute("aria-selected", b.id === btnId ? "true" : "false"); });
      var btn = $(btnId);
      if (btn) moveTo(btn);
    }
    function refresh() {
      var c = strip.querySelector('[aria-selected="true"]');
      if (c) moveTo(c);
    }
    items.forEach(function (b) {
      b.addEventListener("click", function () { activateView(b.getAttribute("aria-controls")); });
    });
    return { select: select, refresh: refresh };
  }

  var desktopNav = makeIndicator("navbar-tabs", "navbar-tab-indicator", "navbar-tab-indicator-fill", ".navbar-tab", 4);
  var mobileNav = makeIndicator("mobile-tabs", "mobile-tab-indicator", "mobile-tab-indicator-fill", ".bottom-nav-item", 0);

  var isSwitching = false;

  function activateView(viewId) {
    if (!viewId) return;
    if (desktopNav) desktopNav.select(viewToDesktopTab[viewId]);
    if (mobileNav) mobileNav.select(viewToMobileTab[viewId]);
    switchView(viewId);
  }

  function switchView(viewId) {
    var currentView = document.querySelector(".page-view.active");
    var nextView = $(viewId);
    if (!nextView || currentView === nextView || isSwitching) return;
    isSwitching = true;
    stopAutoScroll();
    if (mascot) { mascot.close(); setTimeout(function () { mascot.tip(VIEW_TIPS[viewId], { key: "view:" + viewId, mood: "think" }); }, 700); }

    var veil = $("view-veil");
    if (veil) veil.classList.add("on");
    if (currentView) currentView.classList.add("page-view-leaving");

    setTimeout(function () {
      if (currentView) currentView.classList.remove("active", "page-view-leaving");
      nextView.classList.add("active", "page-view-entering");
      void nextView.offsetWidth;

      if (viewId === "view-learn") {
        var currentMs = activeCourseView().querySelector(".milestone.current");
        if (currentMs) {
          var rect = currentMs.getBoundingClientRect();
          window.scrollTo(0, Math.max(0, window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2));
        }
      } else {
        window.scrollTo(0, 0);
      }

      nextView.classList.remove("page-view-entering");
      if (veil) veil.classList.remove("on");
      updateUnitAccent();
      // Views that load their data lazily (js/profile.js) listen for this.
      document.dispatchEvent(new CustomEvent("codle:view", { detail: viewId }));
      setTimeout(function () { isSwitching = false; }, 380);
    }, 260);
  }

  /* ===============================================================
     6. LIQUID GLASS — GLARE, RIPPLE, BOUNCE (event delegation so
        elements created by hydrateApp get the same treatment)
  ================================================================*/

  // Pointer-tracked specular highlight on the navigation bars
  document.addEventListener("pointermove", function (e) {
    if (isLite()) return;
    var el = e.target.closest ? e.target.closest(".liquid-glass--bar") : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  }, { passive: true });

  var rippleHost = $("lg-ripple-host");
  var RIPPLE_TARGETS = ".milestone:not(.locked) .milestone-circle, .milestone-start-btn, .bottom-nav-item, .navbar-tab, .nav-profile, .game-card, .game-back, .icon-btn, .wordle-btn";

  function ripple(el, cx, cy) {
    var r = el.getBoundingClientRect();
    if (r.width < 1 || !rippleHost) return;
    var clip = document.createElement("div");
    clip.className = "lg-ripple-clip";
    clip.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;border-radius:" + getComputedStyle(el).borderRadius;
    var size = Math.max(r.width, r.height) * 1.7;
    var dot = document.createElement("div");
    dot.className = "lg-ripple-dot";
    dot.style.cssText = "width:" + size + "px;height:" + size + "px;left:" + (cx - r.left - size / 2) + "px;top:" + (cy - r.top - size / 2) + "px";
    clip.appendChild(dot);
    rippleHost.appendChild(clip);
    dot.animate(
      [{ transform: "translateZ(0) scale(0)", opacity: 0.8 }, { transform: "translateZ(0) scale(1)", opacity: 0 }],
      { duration: 480, easing: "cubic-bezier(.22,1,.36,1)" }
    ).onfinish = function () { clip.remove(); };
  }

  if (!reduceMotion) {
    document.addEventListener("pointerdown", function (e) {
      if (isLite()) return;
      var el = e.target.closest ? e.target.closest(RIPPLE_TARGETS) : null;
      if (el && !el.hasAttribute("disabled")) ripple(el, e.clientX, e.clientY);
    });
  }

  function bounce(circle) {
    if (!circle || calmMotion()) return;
    circle.style.transition = "transform .15s ease-out";
    circle.style.transform = "scale(.88)";
    setTimeout(function () {
      circle.style.transition = "transform .5s cubic-bezier(.32,.72,0,1)";
      circle.style.transform = "scale(1.06)";
      setTimeout(function () {
        circle.style.transform = "";
        circle.style.transition = "";
      }, 200);
    }, 140);
  }

  document.addEventListener("click", function (e) {
    var ms = e.target.closest ? e.target.closest(".milestone") : null;
    if (!ms || ms.classList.contains("locked")) return;
    if (e.target.closest(".milestone-start-btn")) { openLesson(ms); return; } // button has its own affordance
    bounce(ms.querySelector(".milestone-circle"));
    setTimeout(function () { openLesson(ms); }, calmMotion() ? 0 : 280); // let the bounce play first
  });

  ["nav-profile-desktop", "nav-profile-mobile", "sidebar-avatar"].forEach(function (id) {
    var btn = $(id);
    if (btn) btn.addEventListener("click", function () { activateView("view-profile"); });
  });

  // Keyboard activation for milestones (they are divs with role="button")
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var ms = e.target.closest ? e.target.closest(".milestone") : null;
    if (!ms || e.target !== ms || ms.classList.contains("locked")) return;
    e.preventDefault();
    ms.click();
  });

  /* ===============================================================
     7. INITIALISATION
  ================================================================*/

  function start() {
    hydrateApp();
    setupFlames();
    drawAndAnimate();
    updateUnitAccent();
    if (desktopNav) desktopNav.refresh();
    if (mobileNav) mobileNav.refresh();
    setTimeout(mascotGreet, 900);
  }

  var pageLoaded = new Promise(function (resolve) { window.addEventListener("load", resolve); });
  var session = api ? api.ready : Promise.resolve({ online: false });

  session.then(function (s) {
    if (!s.online) { // static demo
      pageLoaded.then(function () {
        var demo = window.CodleData;
        if (demo) renderPath(demoPath(demo.activeCourse));
        start();
      });
      return;
    }
    if (!s.user) { window.location.replace("register.html"); return; }
    online = true;
    Promise.all([api.get("app"), pageLoaded]).then(function (res) {
      var data = res[0];
      window.CodleData = data;
      renderCourseSelector(data.courses, data.activeCourse);
      renderPath(data.path);
      renderProfileCard(data.user);
      renderLeaderboardCard(data.leaderboard);
      renderProfileView(data.user);
      start();
    }, function (err) {
      if (err.status === 401) { window.location.replace("register.html"); return; }
      toast("Couldn't load your progress: " + err.message, 4000);
      pageLoaded.then(start);
    });
    api.get("leaderboard").then(renderLeaderboardView);
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var container = $("path-container");
      if (container) container.dataset.animated = "1";
      drawAndAnimate();
      updateUnitAccent();
      if (desktopNav) desktopNav.refresh();
      if (mobileNav) mobileNav.refresh();
    }, 150);
  });
})();
