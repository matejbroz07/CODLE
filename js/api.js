/**
 * Codle — API client
 *
 * Talks to the PHP API in api/ (XAMPP / a PHP host). On a static host such as
 * GitHub Pages there is no API: CodleApi.ready resolves with online = false and
 * every page keeps working as the offline demo (data in localStorage).
 *
 *   CodleApi.ready.then(function (s) { s.online; s.user; });
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
        if (!res.ok) throw new ApiError(res.status, data.error || "error", data.message, data);
        return data;
      });
    }, function () {
      throw new ApiError(0, "offline", "No connection to the server.");
    });
  }

  // Pages on the file system (file://) cannot reach an API either.
  var ready = location.protocol === "file:"
    ? Promise.resolve({ online: false, user: null })
    : request("GET", "session").then(
        function (data) { return { online: true, user: data.user }; },
        function (err) {
          // not_configured / db_unavailable: the API exists but is broken; say so in the console.
          if (err.status) console.warn("Codle API:", err.message);
          return { online: false, user: null, error: err };
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
