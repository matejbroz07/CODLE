/**
 * Codle — Learn to Code
 * Main Application Script
 * 
 * Handles: learning path trail animation, navbar indicators,
 * scroll-based background tinting, liquid glass interactions,
 * ripple effects and milestone click bounces.
 */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===============================================================
     1. LEARNING PATH — DRAW TRAIL + ANIMATE
  ================================================================*/

  /**
   * Builds a single Bézier segment path string (M...C) between two
   * adjacent waypoint coordinates.
   */
  function buildSingleSegment(p0, p1) {
    var sx = p0.x;
    var sy = p0.y;
    var ex = p1.x;
    var ey = p1.y;
    var gap = Math.abs(ey - sy);
    var pull = Math.max(gap * 0.45, 20);
    return (
      "M " + sx + " " + sy +
      " C " + sx + " " + (sy + pull) +
      ", " + ex + " " + (ey - pull) +
      ", " + ex + " " + ey
    );
  }

  /**
   * Builds a full multi-segment path (disconnected M…C for each pair).
   * Used for the background trail.
   */
  function buildSegmentedPath(pts) {
    if (pts.length < 2) return "";
    var d = "";
    for (var i = 0; i < pts.length - 1; i++) {
      d += " " + buildSingleSegment(pts[i], pts[i + 1]);
    }
    return d;
  }

  /**
   * Main draw-and-animate function.
   * Renders the gray background trail + colored completed segments
   * and reveals milestone nodes in sync with trail animation.
   */
  function drawAndAnimate() {
    var container = document.getElementById("path-container");
    var svg = document.getElementById("path-svg");
    var activeView = document.querySelector(".course-view.active") || document;
    var allWaypoints = activeView.querySelectorAll("[data-is-waypoint]");
    if (allWaypoints.length < 2) return;

    var containerRect = container.getBoundingClientRect();
    svg.setAttribute("width", containerRect.width);
    svg.setAttribute("height", containerRect.height);
    svg.setAttribute("viewBox", "0 0 " + containerRect.width + " " + containerRect.height);

    var points = [];
    var waypointEls = [];
    var firstLockedIdx = -1;
    var chapterColorMap = [];

    allWaypoints.forEach(function (node) {
      var target = node.querySelector(".milestone-circle") || node.querySelector(".path-section-header");
      if (!target) return;
      var r = target.getBoundingClientRect();
      points.push({
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
        h: target.offsetHeight / 2,
      });
      waypointEls.push(target);

      // Track chapter color
      var chap = node.closest(".chapter-group");
      chapterColorMap.push(chap && chap.dataset.chapterColor ? chap.dataset.chapterColor : "#7dd8ff");

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

    // --- Background trail (gray, static, segmented) ---
    var fullD = buildSegmentedPath(points);
    var bgPath = document.createElementNS(ns, "path");
    bgPath.setAttribute("class", "trail-bg");
    bgPath.setAttribute("d", fullD);
    svg.appendChild(bgPath);

    // --- Completed trail: animate each segment individually, sequentially ---
    var completedEnd = firstLockedIdx >= 0 ? firstLockedIdx + 1 : points.length;
    if (completedEnd > points.length) completedEnd = points.length;

    var segmentPaths = [];
    var segmentLengths = [];
    var totalAnimLen = 0;

    if (completedEnd >= 2) {
      for (var i = 0; i < completedEnd - 1; i++) {
        var segD = buildSingleSegment(points[i], points[i + 1]);
        var segPath = document.createElementNS(ns, "path");
        segPath.setAttribute("class", "trail-completed");
        segPath.setAttribute("d", segD);
        segPath.setAttribute("stroke", chapterColorMap[i + 1] || chapterColorMap[i]);
        svg.appendChild(segPath);

        var segLen = segPath.getTotalLength();
        segmentPaths.push(segPath);
        segmentLengths.push(segLen);
        totalAnimLen += segLen;
      }

      var speedFactor = 1.5; // ms per px

      if (!reduceMotion && !container.dataset.animated) {
        // Hide all segments initially
        segmentPaths.forEach(function (sp, idx) {
          var len = segmentLengths[idx];
          sp.style.strokeDasharray = len;
          sp.style.strokeDashoffset = len;
        });

        // Animate sequentially
        var cumulativeDelay = 100;
        segmentPaths.forEach(function (sp, idx) {
          var len = segmentLengths[idx];
          var segDuration = len * speedFactor;
          (function (path, duration, delay) {
            setTimeout(function () {
              path.style.transition = "stroke-dashoffset " + duration + "ms linear";
              path.style.strokeDashoffset = "0";
            }, delay);
          })(sp, segDuration, cumulativeDelay);
          cumulativeDelay += segDuration;
        });
      }
    }

    // --- Reveal nodes + smooth auto-scroll ---
    if (!reduceMotion && !container.dataset.animated) {
      var segCumTime = [100];
      var runTime = 100;
      for (var j = 0; j < segmentLengths.length; j++) {
        runTime += segmentLengths[j] * 1.5;
        segCumTime.push(runTime);
      }
      var totalCompletedTime = segCumTime[segCumTime.length - 1] || 100;

      // Find the index of the "current" milestone — scroll stops here
      var currentMilestone = document.querySelector(".milestone.current");
      var stopScrollAtIdx = -1;
      waypointEls.forEach(function (el, idx) {
        var wrapper = el.closest(".milestone") || el;
        if (wrapper === currentMilestone) stopScrollAtIdx = idx;
      });

      // Pre-calculate document Y position (center) for each waypoint
      var waypointYs = waypointEls.map(function (el) {
        var wrapper = el.closest(".milestone") || el;
        var rect = wrapper.getBoundingClientRect();
        return window.scrollY + rect.top + rect.height / 2;
      });

      // Scroll target — tracks which Y we want to scroll to
      var scrollTargetY = window.scrollY;
      var currentScrollY = window.scrollY;
      var animStartTime = performance.now();
      var scrollStopped = false;
      var lerpFactor = 0.045; // lower = smoother/slower (0.03–0.08 sweet spot)

      // Cancel auto-scroll when user interacts
      function cancelAutoScroll() {
        scrollStopped = true;
        window.removeEventListener("wheel", cancelAutoScroll);
        window.removeEventListener("touchstart", cancelAutoScroll);
        window.removeEventListener("pointerdown", cancelAutoScroll);
      }
      window.addEventListener("wheel", cancelAutoScroll, { passive: true });
      window.addEventListener("touchstart", cancelAutoScroll, { passive: true });
      window.addEventListener("pointerdown", cancelAutoScroll);

      // Smooth scroll loop using requestAnimationFrame + lerp
      function smoothScrollTick() {
        if (scrollStopped) return;
        var viewH = window.innerHeight;
        var targetCenter = scrollTargetY - viewH / 2;
        // Don't scroll above the top
        targetCenter = Math.max(0, targetCenter);

        currentScrollY += (targetCenter - currentScrollY) * lerpFactor;

        // Snap when close enough
        if (Math.abs(targetCenter - currentScrollY) < 0.5) {
          currentScrollY = targetCenter;
        }

        window.scrollTo(0, currentScrollY);
        requestAnimationFrame(smoothScrollTick);
      }
      requestAnimationFrame(smoothScrollTick);

      // Reveal nodes on schedule and update scroll target
      waypointEls.forEach(function (el, idx) {
        if (!el) return;
        var wrapper = el.closest(".milestone") || el;
        var delay;
        if (idx < segCumTime.length) {
          delay = segCumTime[idx];
        } else {
          var extraIdx = idx - (segCumTime.length - 1);
          delay = totalCompletedTime + extraIdx * 200;
        }
        setTimeout(function () {
          wrapper.classList.add("revealed");

          // Update scroll target only up to and including the "current" milestone
          var shouldScroll = (stopScrollAtIdx === -1) || (idx <= stopScrollAtIdx);
          if (shouldScroll) {
            scrollTargetY = waypointYs[idx];
          }

          // Stop the scroll loop a bit after the last relevant node
          if (idx === waypointEls.length - 1) {
            setTimeout(function () { scrollStopped = true; }, 800);
          }
        }, delay);
      });

      container.dataset.animated = "1";
    } else {
      waypointEls.forEach(function (el) {
        var w = el.closest(".milestone") || el;
        if (w) w.classList.add("revealed");
      });
    }
  }

  /** Position chapter glow overlays to match their parent group height. */
  function positionGlows() {
    var activeView = document.querySelector(".course-view.active") || document;
    activeView.querySelectorAll(".chapter-group").forEach(function (group) {
      var glow = group.querySelector(".chapter-glow");
      if (!glow) return;
      glow.style.top = "0";
      glow.style.height = group.offsetHeight + "px";
    });
  }

  /* ===============================================================
     2. SCROLL OBSERVER — BACKGROUND COLOR
  ================================================================*/

  function setupScrollBg() {
    var bgTint = document.getElementById("bg-tint");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var color = entry.target.dataset.chapterColor;
            if (bgTint && color) bgTint.style.backgroundColor = color;
            var bg = document.querySelector(".bg");
            if (bg && color) bg.style.setProperty('--chapter-color', color);
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll(".chapter-group").forEach(function (g) {
      observer.observe(g);
    });
  }

  /* ===============================================================
     1.5 HYDRATE APP FROM CONFIG
  ================================================================*/
  function hydrateApp() {
    var data = window.CodleData;
    if (!data) return;

    var setText = function(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    
    setText("ui-streak-mobile", data.user.streakCount);
    setText("ui-streak-desktop", data.user.streakCount);
    setText("ui-gems-mobile", data.user.gems.toLocaleString());
    if (document.getElementById("ui-gems-desktop")) {
      document.getElementById("ui-gems-desktop").textContent = data.user.gems.toLocaleString() + " XP";
    }
    setText("ui-badge-name", data.user.nextBadge.name);
    setText("ui-badge-label", data.user.nextBadge.label);

    var badgeProgress = document.getElementById("ui-badge-progress");
    if (badgeProgress) badgeProgress.style.width = data.user.nextBadge.progressPercent + "%";

    if (!data.user.streakActive) {
      var fireMob = document.getElementById("ui-fire-mobile");
      var fireDesk = document.getElementById("ui-fire-desktop");
      
      var freezeAnims = function(targetEl) {
        if (!targetEl) return;
        targetEl.style.filter = "grayscale(1) opacity(0.4)";
        var svgEl = targetEl.tagName.toLowerCase() === "svg" ? targetEl : targetEl.querySelector("svg");
        if (!svgEl) return;
        
        if (svgEl.pauseAnimations) {
          svgEl.pauseAnimations();
          if (svgEl.setCurrentTime) svgEl.setCurrentTime(0);
        }
        var anims = svgEl.querySelectorAll("animate");
        anims.forEach(function(a) {
          var attr = a.getAttribute("attributeName");
          var vals = a.getAttribute("values");
          if (attr && vals && a.parentNode) {
            a.parentNode.setAttribute(attr, vals.split(";")[0]);
          }
          a.remove();
        });
      };
      
      freezeAnims(fireMob);
      freezeAnims(fireDesk);
      
      var numMob = document.getElementById("ui-streak-mobile");
      var numDesk = document.getElementById("ui-streak-desktop");
      if (numMob) numMob.style.color = "var(--ink-dim)";
      if (numDesk) {
        numDesk.style.background = "none";
        numDesk.style.webkitTextFillColor = "var(--ink-dim)";
        numDesk.style.color = "var(--ink-dim)";
      }
    }

    var courseId = data.activeCourse || "python";
    var progressData = data.progress[courseId] || { currentUnit: 1, currentMilestone: 1 };
    
    var activeView = document.querySelector(".course-view.active") || document;
    var chapters = activeView.querySelectorAll(".chapter-group");
    chapters.forEach(function (chapter, i) {
      var unitIndex = i + 1;
      var milestones = chapter.querySelectorAll(".milestone-circle");

      if (unitIndex > progressData.currentUnit) {
        chapter.classList.add("chapter-locked");
      } else {
        chapter.classList.remove("chapter-locked");
        
        milestones.forEach(function (circle, j) {
          var msIndex = j + 1;
          var milestoneWrapper = circle.parentElement; // .milestone
          
          if (unitIndex < progressData.currentUnit || (unitIndex === progressData.currentUnit && msIndex < progressData.currentMilestone)) {
            // Completed milestone
            milestoneWrapper.classList.remove("current", "locked");
            milestoneWrapper.classList.add("completed");
            if (!circle.querySelector(".milestone-check")) {
              circle.insertAdjacentHTML('beforeend', '<div class="milestone-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>');
            }
            // Remove progress ring if it was hardcoded here
            var pr = circle.querySelector(".progress-ring");
            if (pr) pr.remove();
            var btn = milestoneWrapper.querySelector(".milestone-start-btn");
            if (btn) btn.remove();

          } else if (unitIndex === progressData.currentUnit && msIndex === progressData.currentMilestone) {
            // Current milestone (active)
            milestoneWrapper.classList.remove("completed", "locked");
            milestoneWrapper.classList.add("current");
            var chk = circle.querySelector(".milestone-check");
            if (chk) chk.remove();
            
            // Add progress ring
            if (!circle.querySelector(".progress-ring")) {
              circle.insertAdjacentHTML('afterbegin', '<div class="progress-ring"><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="45"/><circle class="fill" cx="50" cy="50" r="45" style="stroke-dashoffset: 160;"/></svg></div>');
            }
            // Add Continue button
            if (!milestoneWrapper.querySelector(".milestone-start-btn")) {
              milestoneWrapper.insertAdjacentHTML('beforeend', '<button class="milestone-start-btn" id="btn-continue">Continue</button>');
            }

          } else {
            // Locked / future milestone
            milestoneWrapper.classList.remove("completed", "current");
            milestoneWrapper.classList.add("locked");
            var chk2 = circle.querySelector(".milestone-check");
            if (chk2) chk2.remove();
            var pr2 = circle.querySelector(".progress-ring");
            if (pr2) pr2.remove();
            var btn2 = milestoneWrapper.querySelector(".milestone-start-btn");
            if (btn2) btn2.remove();
          }
        });
      }
    });
  }

  /* ===============================================================
     3.5 COURSE SWITCHER
  ================================================================*/
  var courseSelector = document.getElementById("course-selector");
  if (courseSelector) {
    courseSelector.addEventListener("change", function(e) {
      var courseId = e.target.value;
      e.target.blur(); // Remove focus to reset the arrow direction
      
      if (window.CodleData) window.CodleData.activeCourse = courseId;
      
      var labelEl = document.getElementById("ui-course-label");
      if (labelEl) {
        if (courseId === "javascript") labelEl.textContent = "Unit 1 — JS Basics";
        else labelEl.textContent = "Unit 2 — Functions";
      }

      document.querySelectorAll(".course-view").forEach(function(el) {
        el.classList.remove("active");
        el.style.display = "none";
      });
      var activeEl = document.getElementById("course-view-" + courseId);
      if (activeEl) {
        activeEl.classList.add("active");
        activeEl.style.display = "block";
      }

      var container = document.getElementById("path-container");
      if (container) container.dataset.animated = "";
      
      hydrateApp();
      drawAndAnimate();
      positionGlows();
    });
  }

  /* ===============================================================
     3. INITIALISATION
  ================================================================*/

  window.addEventListener("load", function () {
    hydrateApp();
    drawAndAnimate();
    positionGlows();
    setupScrollBg();
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var container = document.getElementById("path-container");
      container.dataset.animated = "1";
      drawAndAnimate();
      positionGlows();
    }, 150);
  });

  /* ===============================================================
     3.6 SPA VIEW SWITCHING
  ================================================================*/

  var tabViewMap = {
    "tab-learn": "view-learn",
    "tab-practice": "view-practice",
    "tab-leaderboard": "view-leaderboard",
    "tab-profile": "view-profile",
    "mob-tab-learn": "view-learn",
    "mob-tab-practice": "view-practice",
    "mob-tab-ranks": "view-leaderboard",
    "mob-tab-profile": "view-profile"
  };

  // Map view IDs back to desktop/mobile tab IDs for syncing
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

  var isSwitching = false;

  function switchView(viewId) {
    var currentView = document.querySelector(".page-view.active");
    var nextView = document.getElementById(viewId);
    if (!nextView || currentView === nextView || isSwitching) return;

    isSwitching = true;

    // Phase 1: Fade out current view
    if (currentView) {
      currentView.classList.add("page-view-leaving");
    }

    // Phase 2: After fade-out, swap views
    setTimeout(function () {
      if (currentView) {
        currentView.classList.remove("active", "page-view-leaving");
      }

      // Prep new view: display it but invisible
      nextView.classList.add("active", "page-view-entering");
      // Force reflow so the browser registers the entering state
      void nextView.offsetWidth;

      // Set scroll position BEFORE fade-in so it's already there when view appears
      if (viewId === "view-learn") {
        var currentMs = document.querySelector(".milestone.current");
        if (currentMs) {
          var rect = currentMs.getBoundingClientRect();
          var scrollTarget = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
          window.scrollTo(0, Math.max(0, scrollTarget));
        }
      } else {
        window.scrollTo(0, 0);
      }

      // Phase 3: Fade in new view
      nextView.classList.remove("page-view-entering");

      // Cleanup after transition finishes
      setTimeout(function () {
        isSwitching = false;
      }, 380);
    }, 260);
  }

  function syncTabs(viewId) {
    // Sync desktop tabs
    var deskId = viewToDesktopTab[viewId];
    var deskBtns = document.querySelectorAll("#navbar-tabs .navbar-tab");
    deskBtns.forEach(function (b) {
      b.setAttribute("aria-selected", b.id === deskId ? "true" : "false");
    });
    // Move desktop indicator
    var deskActive = document.getElementById(deskId);
    if (deskActive && typeof moveNav === "function") moveNav(deskActive);

    // Sync mobile tabs
    var mobId = viewToMobileTab[viewId];
    var mobBtns = document.querySelectorAll("#mobile-tabs .bottom-nav-item");
    mobBtns.forEach(function (b) {
      b.setAttribute("aria-selected", b.id === mobId ? "true" : "false");
    });
    // Move mobile indicator
    var mobActive = document.getElementById(mobId);
    if (mobActive && typeof moveMob === "function") moveMob(mobActive);
  }

  /* ===============================================================
     4. DESKTOP NAVBAR — SLIDING INDICATOR
  ================================================================*/

  var navTabs = document.getElementById("navbar-tabs");
  if (navTabs) {
    var ind = document.getElementById("navbar-tab-indicator");
    var indFill = document.getElementById("navbar-tab-indicator-fill");
    var btns = Array.prototype.slice.call(navTabs.querySelectorAll(".navbar-tab"));

    function moveNav(b) {
      var tr = navTabs.getBoundingClientRect(),
        br = b.getBoundingClientRect();
      ind.style.width = br.width + "px";
      ind.style.transform = "translateX(" + (br.left - tr.left - 4) + "px)";
      if (!reduceMotion) {
        indFill.classList.remove("squash");
        void indFill.offsetWidth;
        indFill.classList.add("squash");
      }
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) {
          x.setAttribute("aria-selected", x === b ? "true" : "false");
        });
        moveNav(b);
        var viewId = tabViewMap[b.id];
        if (viewId) {
          switchView(viewId);
          // Sync mobile tabs
          var mobId = viewToMobileTab[viewId];
          var mobBtns = document.querySelectorAll("#mobile-tabs .bottom-nav-item");
          mobBtns.forEach(function (mb) {
            mb.setAttribute("aria-selected", mb.id === mobId ? "true" : "false");
          });
          var mobActive = document.getElementById(mobId);
          try { if (mobActive) moveMob(mobActive); } catch(e) {}
        }
      });
    });

    window.addEventListener("load", function () { moveNav(btns[0]); });
    window.addEventListener("resize", function () {
      var c = navTabs.querySelector('[aria-selected="true"]');
      if (c) moveNav(c);
    });
  }

  /* ===============================================================
     5. MOBILE NAVBAR — SLIDING INDICATOR
  ================================================================*/

  var mt = document.getElementById("mobile-tabs");
  if (mt) {
    var mi = document.getElementById("mobile-tab-indicator"),
      mf = document.getElementById("mobile-tab-indicator-fill");
    var mbs = Array.prototype.slice.call(mt.querySelectorAll(".bottom-nav-item"));

    function moveMob(b) {
      var tr = mt.getBoundingClientRect(),
        br = b.getBoundingClientRect();
      mi.style.width = br.width + "px";
      mi.style.transform = "translateX(" + (br.left - tr.left) + "px)";
      if (!reduceMotion) {
        mf.classList.remove("squash");
        void mf.offsetWidth;
        mf.classList.add("squash");
      }
    }

    mbs.forEach(function (b) {
      b.addEventListener("click", function () {
        mbs.forEach(function (x) {
          x.setAttribute("aria-selected", x === b ? "true" : "false");
        });
        moveMob(b);
        var viewId = tabViewMap[b.id];
        if (viewId) {
          switchView(viewId);
          // Sync desktop tabs
          var deskId = viewToDesktopTab[viewId];
          var deskBtns = document.querySelectorAll("#navbar-tabs .navbar-tab");
          deskBtns.forEach(function (db) {
            db.setAttribute("aria-selected", db.id === deskId ? "true" : "false");
          });
          var deskActive = document.getElementById(deskId);
          try { if (deskActive) moveNav(deskActive); } catch(e) {}
        }
      });
    });

    window.addEventListener("load", function () { moveMob(mbs[0]); });
    window.addEventListener("resize", function () {
      var c = mt.querySelector('[aria-selected="true"]');
      if (c) moveMob(c);
    });
  }

  /* ===============================================================
     6. GLARE + RIPPLE + BOUNCE
  ================================================================*/

  // Glare tracking
  document.querySelectorAll(".liquid-glass--interactive,.milestone:not(.locked)").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var t = el.querySelector(".milestone-circle") || el,
        r = t.getBoundingClientRect();
      t.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      t.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  // Ripple effect
  var rh = document.getElementById("lg-ripple-host");

  function ripple(el, cx, cy) {
    var r = el.getBoundingClientRect();
    if (r.width < 1) return;
    var cl = document.createElement("div");
    cl.className = "lg-ripple-clip";
    cl.style.cssText =
      "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;border-radius:" + getComputedStyle(el).borderRadius;
    var s = Math.max(r.width, r.height) * 1.7,
      d = document.createElement("div");
    d.className = "lg-ripple-dot";
    d.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (cx - r.left - s / 2) + "px;top:" + (cy - r.top - s / 2) + "px";
    cl.appendChild(d);
    rh.appendChild(cl);
    d.animate(
      [
        { transform: "translateZ(0) scale(0)", opacity: 0.8 },
        { transform: "translateZ(0) scale(1)", opacity: 0 },
      ],
      { duration: 480, easing: "cubic-bezier(.22,1,.36,1)" }
    ).onfinish = function () {
      cl.remove();
    };
  }

  if (!reduceMotion) {
    document
      .querySelectorAll(
        ".liquid-glass--interactive,.milestone:not(.locked) .milestone-circle,.milestone-start-btn,.bottom-nav-item,.navbar-tab"
      )
      .forEach(function (el) {
        el.addEventListener("pointerdown", function (e) {
          if (!el.hasAttribute("disabled")) ripple(el, e.clientX, e.clientY);
        });
      });
  }

  // Milestone click bounce
  document.querySelectorAll(".milestone:not(.locked)").forEach(function (ms) {
    ms.addEventListener("click", function () {
      var c = ms.querySelector(".milestone-circle");
      if (!c || reduceMotion) return;
      c.style.transition = "transform .15s ease-out";
      c.style.transform = "scale(.88)";
      setTimeout(function () {
        c.style.transition = "transform .5s cubic-bezier(.32,.72,0,1)";
        c.style.transform = "scale(1.06)";
        setTimeout(function () {
          c.style.transform = "";
        }, 200);
      }, 140);
    });
  });

  /* ===============================================================
     8. STICKY MOBILE HEADER — frosted glass on scroll
  ================================================================*/
  (function () {
    var mobileHeader = document.querySelector(".mobile-header");
    if (!mobileHeader) return;
    var scrolled = false;
    window.addEventListener("scroll", function () {
      var y = window.scrollY || window.pageYOffset;
      if (y > 10 && !scrolled) {
        mobileHeader.classList.add("scrolled");
        scrolled = true;
      } else if (y <= 10 && scrolled) {
        mobileHeader.classList.remove("scrolled");
        scrolled = false;
      }
    }, { passive: true });
  })();
})();
