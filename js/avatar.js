/**
 * Codle — avatars
 *
 * A learner without a profile picture gets a gradient made from their username:
 * the same name always gives the same colours (letter case does not matter, so
 * "codemaster" → "CodeMaster" keeps them), different names look different.
 *
 *   CodleAvatar.paint(el, { username: "ada", avatarUrl: null })  // fills an element
 *   CodleAvatar.html({ username, avatarUrl }, "pf-avatar")       // markup string
 *   CodleAvatar.gradient("ada")                                  // CSS background
 */

(function () {
  "use strict";

  /** FNV-1a: a small, stable 32-bit hash of a string. */
  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function hsl(h, s, l, a) {
    return "hsla(" + (h % 360) + "," + s + "%," + l + "%," + (a == null ? 1 : a) + ")";
  }

  function gradient(name) {
    var key = String(name || "?").toLowerCase();
    var a = hash(key);
    var b = hash(key + "•codle");
    var hue1 = a % 360;
    var hue2 = hue1 + 40 + ((a >>> 9) % 100);          // 40–140° away: a clear blend, never muddy
    var hue3 = hue1 + 150 + ((b >>> 3) % 60);           // highlight from the other side of the wheel
    var angle = (b >>> 11) % 360;
    var x = 15 + ((b >>> 5) % 70);
    var y = 15 + ((a >>> 21) % 70);
    return "radial-gradient(circle at " + x + "% " + y + "%, " + hsl(hue3, 90, 68, 0.75) + ", transparent 58%), " +
      "linear-gradient(" + angle + "deg, " + hsl(hue1, 78, 56) + ", " + hsl(hue2, 80, 44) + ")";
  }

  function initial(name) {
    var s = String(name || "").trim();
    return s ? s.charAt(0).toUpperCase() : "?";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Fills an existing element (nav button, sidebar circle, leaderboard dot). */
  function paint(el, user) {
    if (!el || !user) return;
    el.classList.add("cx-avatar");
    el.style.background = gradient(user.username);
    el.textContent = "";
    var letter = document.createElement("span");
    letter.className = "cx-avatar-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = initial(user.username);
    el.appendChild(letter);
    if (user.avatarUrl) {
      var img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.src = user.avatarUrl;
      // A missing file falls back to the gradient instead of a broken image.
      img.addEventListener("error", function () { img.remove(); });
      el.appendChild(img);
    }
  }

  /** Markup for an avatar inside a template string. */
  function html(user, cls, label) {
    var u = user || {};
    return '<span class="cx-avatar ' + (cls || "") + '" style="background:' + esc(gradient(u.username)) + '"' +
      (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + ">" +
      '<span class="cx-avatar-letter" aria-hidden="true">' + esc(initial(u.username)) + "</span>" +
      (u.avatarUrl ? '<img src="' + esc(u.avatarUrl) + '" alt="" decoding="async" loading="lazy" onerror="this.remove()">' : "") +
      "</span>";
  }

  window.CodleAvatar = { gradient: gradient, paint: paint, html: html, initial: initial };
})();
