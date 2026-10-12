/**
 * Codle — Learn to Code
 * Main application script
 *
 * Handles: hydrating the UI from CodleData, learning-path trail drawing
 * and reveal animation, background tinting on scroll, SPA view switching,
 * navbar indicators and the liquid-glass pointer effects.
 */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    setText("ui-badge-name", user.nextBadge.name);
    setText("ui-badge-label", user.nextBadge.label);

    var badgeProgress = $("ui-badge-progress");
    if (badgeProgress) badgeProgress.style.width = user.nextBadge.progressPercent + "%";

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

    if (!user.streakActive) {
      freezeFlame($("ui-fire-mobile"));
      freezeFlame($("ui-fire-desktop"));
      var streakCard = $("card-streak");
      if (streakCard) streakCard.classList.add("inactive");
      var streakStat = $("ui-streak-stat-mobile");
      if (streakStat) streakStat.classList.add("inactive");
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
    var courseId = data.activeCourse || "python";
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
    var animate = !reduceMotion && !container.dataset.animated;
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
  window.addEventListener("scroll", updateUnitAccent, { passive: true });

  /* ===============================================================
     4. COURSE SWITCHER
  ================================================================*/

  var courseSelector = $("course-selector");
  if (courseSelector) {
    courseSelector.addEventListener("change", function (e) {
      var courseId = e.target.value;
      e.target.blur();
      if (window.CodleData) window.CodleData.activeCourse = courseId;

      document.querySelectorAll(".course-view").forEach(function (el) {
        var isActive = el.id === "course-view-" + courseId;
        el.classList.toggle("active", isActive);
        el.style.display = isActive ? "" : "none";
      });

      var container = $("path-container");
      if (container) delete container.dataset.animated;
      stopAutoScroll();
      hydrateApp();
      drawAndAnimate();
      updateUnitAccent();
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
      if (!reduceMotion) {
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
      setTimeout(function () { isSwitching = false; }, 380);
    }, 260);
  }

  /* ===============================================================
     6. LIQUID GLASS — GLARE, RIPPLE, BOUNCE (event delegation so
        elements created by hydrateApp get the same treatment)
  ================================================================*/

  // Pointer-tracked specular highlight on the navigation bars
  document.addEventListener("pointermove", function (e) {
    var el = e.target.closest ? e.target.closest(".liquid-glass--bar") : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  }, { passive: true });

  var rippleHost = $("lg-ripple-host");
  var RIPPLE_TARGETS = ".milestone:not(.locked) .milestone-circle, .milestone-start-btn, .bottom-nav-item, .navbar-tab, .nav-profile";

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
      var el = e.target.closest ? e.target.closest(RIPPLE_TARGETS) : null;
      if (el && !el.hasAttribute("disabled")) ripple(el, e.clientX, e.clientY);
    });
  }

  function bounce(circle) {
    if (!circle || reduceMotion) return;
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
    if (e.target.closest(".milestone-start-btn")) return; // button has its own affordance
    bounce(ms.querySelector(".milestone-circle"));
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

  window.addEventListener("load", function () {
    hydrateApp();
    drawAndAnimate();
    updateUnitAccent();
    if (desktopNav) desktopNav.refresh();
    if (mobileNav) mobileNav.refresh();
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
