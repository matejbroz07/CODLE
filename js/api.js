/**
 * Codle — API client
 *
 * Talks to the PHP API in api/. When the API cannot be reached or cannot work
 * (no connection, database down, not set up), the page is covered by an error
 * screen with Curly and CodleApi.ready never settles.
 *
 *   CodleApi.ready.then(function (s) { s.user; });   // null when not logged in
 *   CodleApi.get("app").then(...)            // resolves with the JSON body
 *   CodleApi.upload("me/avatar", formData)   // multipart, for files
 *   CodleApi.post("wordle/guess", { guess: "STACK" }).catch(function (err) {
 *     err.status; err.code; err.message;      // API error
 *   });
 */

(function () {
  "use strict";

  var BASE = "api/";

  function ApiError(status, code, message, data) {
    this.status = status;
    this.code = code;
    this.message = message || code;
    this.data = data || {};
  }

  function request(method, path, body, extra) {
    var opts = {
      method: method,
      credentials: "same-origin",
      keepalive: !!(extra && extra.keepalive), // lets a save finish while the page closes
      headers: { "Accept": "application/json" }
    };
    if (method !== "GET") {
      opts.headers["X-Codle"] = "1"; // the API refuses state changes without it (CSRF)
      if (body instanceof FormData) {
        opts.body = body; // file upload: the browser sets the multipart Content-Type itself
      } else {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body || {});
      }
    }
    return fetch(BASE + path, opts).then(function (res) {
      var type = res.headers.get("Content-Type") || "";
      if (type.indexOf("application/json") < 0) {
        // A static host answers with its own 404 page: there is no API here.
        throw new ApiError(0, "offline", "The server is not available.");
      }
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new ApiError(res.status, data.error || "error", data.message, data);
          // the database went away while the page was open
          if (err.code === "db_unavailable" || err.code === "not_configured") showDown(err);
          throw err;
        }
        return data;
      });
    }, function () {
      throw new ApiError(0, "offline", "No connection to the server.");
    });
  }

  /* ----- the API answers but cannot work: cover the page with an error and Curly ----- */
  var DOWN = {
    db_unavailable: {
      title: "Can't reach the database",
      text: "The server is up, but it can't connect to the database, so nothing can be loaded or saved right now. Try again in a moment.",
      hint: "Your progress is safe. We're on it."
    },
    not_configured: {
      title: "Codle is being set up",
      text: "The server isn't ready yet, so nothing can be loaded right now.",
      hint: "Please come back in a few minutes."
    },
    offline: {
      title: "Can't reach Codle",
      text: "Your device couldn't connect to the server. Check your internet connection.",
      hint: "As soon as you're back online, press Try again."
    },
    server_error: {
      title: "Something went wrong",
      text: "The server ran into an error. Try again in a moment.",
      hint: "If it keeps happening, it's on our side and we're on it."
    }
  };
  var downShown = false;
  function showDown(err) {
    if (downShown) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { showDown(err); });
      return;
    }
    downShown = true;
    var m = DOWN[err.code] || DOWN.server_error;
    var el = document.createElement("div");
    el.className = "status-screen";
    el.setAttribute("role", "alertdialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "status-title");
    el.setAttribute("aria-describedby", "status-text");
    el.innerHTML =
      '<div class="status-box">' +
        '<div class="status-stage"></div>' +
        '<section class="status-card liquid-glass">' +
          '<p class="status-code">' + (err.status ? "Error " + err.status : "No connection") + '</p>' +
          '<h1 id="status-title">' + m.title + '</h1>' +
          '<p class="status-text" id="status-text">' + m.text + '</p>' +
          '<p class="status-text">' + m.hint + '</p>' +
          '<div class="status-actions"><button class="status-btn primary" type="button">Try again</button></div>' +
        '</section>' +
      '</div>';
    el.querySelector("button").addEventListener("click", function () { location.reload(); });
    document.body.appendChild(el);
    var curly = window.CodleMascot;
    if (curly) {
      curly.stage(el.querySelector(".status-stage"));
      curly.mood("sad");
      curly.help(function () {
        return { text: "I can't reach the server either. As soon as it's back, press <b>Try again</b>.", html: true, mood: "sad" };
      });
    }
    // the page underneath must not be reachable with the keyboard
    Array.prototype.forEach.call(document.body.children, function (child) { if (child !== el) child.inert = true; });
    el.querySelector("button").focus();
  }

  // Who is logged in. Without a working API there is nothing to show: say so and stay put.
  var ready = request("GET", "session").then(
    function (data) { return { online: true, user: data.user }; },
    function (err) {
      showDown(err.status >= 500 || err.status === 0 ? err : new ApiError(500, "server_error", err.message));
      return new Promise(function () {}); // never settles: the page stays put under the message
    });

  window.CodleApi = {
    ready: ready,
    ApiError: ApiError,
    get: function (path) { return request("GET", path); },
    post: function (path, body) { return request("POST", path, body); },
    put: function (path, body, extra) { return request("PUT", path, body, extra); },
    patch: function (path, body) { return request("PATCH", path, body); },
    del: function (path, body) { return request("DELETE", path, body); },
    /** POST a FormData (files), e.g. upload("me/avatar", form). */
    upload: function (path, formData) { return request("POST", path, formData); }
  };
})();
