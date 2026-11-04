/**
 * Codle — Registration & Login
 * Application script
 *
 * Features:
 * - Login / Registration toggle, password reset with an e-mailed code
 * - Multi-step registration wizard
 * - Adaptive placement quiz (10 questions, difficulty follows each answer)
 * - Email verification with a 6-digit code
 * - Username availability checking
 * - Password strength meter with rule validation
 *
 * - "Continue with Google / GitHub": a first sign-in comes back here with
 *   ?oauth=<token>; the wizard then skips the e-mail step (the provider already
 *   verified the address) and asks only for the language, the quiz, a username
 *   and a password
 * - Invisible bot check: a small proof of work (js, well under a second) on a
 *   signed server challenge, plus a honeypot field
 *
 * Everything goes to the API (js/api.js): questions come from the database,
 * the server grades the quiz again and creates the account.
 */

(function () {
  "use strict";

  var QUIZ_LENGTH = 10;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
  var PROVIDER_NAMES = { google: "Google", github: "GitHub" };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }

  var api = window.CodleApi;
  var params = new URLSearchParams(location.search);

  /* A logged-in visitor goes straight to the app. */
  api.ready.then(function (s) {
    if (s.user) { window.location.replace("index.html"); return; }
    loadCourses();
    loadChallenge();
    initOAuth();
  });

  /* ===============================================================
     0. BOT CHECK — proof of work on a signed challenge + honeypot.
     Nothing to click: the browser finds a number n such that
     sha256(challenge|subject|n) starts with `bits` zero bits.
  ================================================================*/

  var challenge = null; // { token, bits, at }
  var CHALLENGE_MIN_AGE = 3500; // ms; the server refuses challenges younger than 3 s

  function loadChallenge() {
    return api.get("auth/challenge").then(function (res) {
      challenge = { token: res.challenge, bits: res.bits, at: Date.now() };
      return challenge;
    });
  }

  /* SHA-256, small and synchronous. The fixed start of the message is hashed once
     (midstate); each try then only hashes the last block or two. */
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  var IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var W = new Int32Array(64);

  /** Runs the compression function over the 64-byte block of m at off, updating st in place. */
  function compress(st, m, off) {
    for (var i = 0; i < 16; i++) W[i] = (m[off + i * 4] << 24) | (m[off + i * 4 + 1] << 16) | (m[off + i * 4 + 2] << 8) | m[off + i * 4 + 3];
    for (i = 16; i < 64; i++) {
      var a15 = W[i - 15], a2 = W[i - 2];
      var s0 = ((a15 >>> 7) | (a15 << 25)) ^ ((a15 >>> 18) | (a15 << 14)) ^ (a15 >>> 3);
      var s1 = ((a2 >>> 17) | (a2 << 15)) ^ ((a2 >>> 19) | (a2 << 13)) ^ (a2 >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    var a = st[0], b = st[1], c = st[2], d = st[3], e = st[4], f = st[5], g = st[6], h = st[7];
    for (i = 0; i < 64; i++) {
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    st[0] = (st[0] + a) | 0; st[1] = (st[1] + b) | 0; st[2] = (st[2] + c) | 0; st[3] = (st[3] + d) | 0;
    st[4] = (st[4] + e) | 0; st[5] = (st[5] + f) | 0; st[6] = (st[6] + g) | 0; st[7] = (st[7] + h) | 0;
  }

  /** A hasher for prefix + decimal n: firstWord(n) is the first 32 bits of sha256(prefix + n). */
  function prefixHasher(prefix) {
    var bytes = new TextEncoder().encode(prefix);
    var full = bytes.length - (bytes.length % 64);
    var mid = IV.slice();
    for (var off = 0; off < full; off += 64) compress(mid, bytes, off);
    var tail = bytes.subarray(full);
    var buf = new Uint8Array(128);
    var st = new Int32Array(8);
    return function firstWord(n) {
      var digits = String(n);
      var len = tail.length + digits.length;
      var blocks = len + 9 > 64 ? 2 : 1;
      buf.fill(0, 0, blocks * 64);
      buf.set(tail);
      for (var i = 0; i < digits.length; i++) buf[tail.length + i] = digits.charCodeAt(i);
      buf[len] = 0x80;
      var bitLen = (bytes.length + digits.length) * 8;
      var end = blocks * 64;
      buf[end - 4] = bitLen >>> 24; buf[end - 3] = bitLen >>> 16; buf[end - 2] = bitLen >>> 8; buf[end - 1] = bitLen;
      for (i = 0; i < 8; i++) st[i] = mid[i];
      compress(st, buf, 0);
      if (blocks === 2) compress(st, buf, 64);
      return st[0];
    };
  }

  /** Resolves with the fields the API wants next to a protected request ({challenge, nonce, website}). */
  function proveHuman(subject) {
    var ready = challenge && Date.now() - challenge.at < 90 * 60 * 1000 ? Promise.resolve(challenge) : loadChallenge();
    return ready.then(function (ch) {
      var wait = Math.max(0, CHALLENGE_MIN_AGE - (Date.now() - ch.at));
      return new Promise(function (resolve) {
        var firstWord = prefixHasher(ch.token + "|" + subject + "|");
        var shift = 32 - ch.bits;
        var n = 0;
        // Work in ~30 ms slices and yield through a MessageChannel (not throttled like
        // setTimeout in background tabs), so the page stays responsive.
        var channel = new MessageChannel();
        channel.port1.onmessage = slice;
        function slice() {
          var until = Date.now() + 30;
          while (Date.now() < until) {
            for (var end = n + 500; n < end; n++) {
              if ((firstWord(n) >>> shift) === 0) {
                channel.port1.onmessage = null;
                setTimeout(function () { resolve({ challenge: ch.token, nonce: n, website: honeypot() }); }, wait);
                return;
              }
            }
          }
          channel.port2.postMessage(0);
        }
        slice();
      });
    });
  }

  function honeypot() {
    var el = $("reg-website");
    return el ? el.value : "";
  }

  /** POST with the bot check; on an expired or refused challenge it fetches a new one and tries once more. */
  function postHuman(path, body, subject) {
    function attempt(retry) {
      return proveHuman(subject).then(function (proof) {
        return api.post(path, Object.assign({}, body, proof));
      }).catch(function (err) {
        if (retry && err && (err.code === "challenge_expired" || err.code === "bad_challenge" || err.code === "bot_suspected")) {
          challenge = null;
          return attempt(false);
        }
        throw err;
      });
    }
    return attempt(true);
  }

  /** Shows an API error under a field; falls back to a generic message. */
  function apiMessage(err, fallback) {
    if (err && err.code === "offline") return "No connection to the server. Try again.";
    if (err && err.code === "too_many_attempts") return err.message;
    return (err && err.message) || fallback || "Something went wrong. Try again.";
  }

  function setLoading(btn, on) {
    btn.classList.toggle("loading", on);
    btn.disabled = on;
  }

  function setGroupState(groupId, errorId, state, message) {
    var group = $(groupId);
    var error = $(errorId);
    if (!group) return;
    group.classList.remove("valid", "invalid");
    if (state) group.classList.add(state);
    if (error) error.textContent = message || "";
    if (state === "invalid" && message && window.CodleMascot) window.CodleMascot.mood("sad", 1800);
  }

  /* The mascot explains the page and answers clicks */
  if (window.CodleMascot) {
    window.CodleMascot.help(function () {
      var loginOpen = $("login-view") && $("login-view").style.display !== "none";
      return loginOpen
        ? { text: "Log in with your e-mail or username. Forgot the password? Use the reset link under the form." }
        : { text: "Pick a username, add your e-mail and a password, and you're in. Your progress, XP and streak are saved to your account." };
    });
    setTimeout(function () {
      window.CodleMascot.tip("Hi, I'm " + window.CodleMascot.name + ". Create an account and I'll walk you through Codle.", { key: "reg-greet", mood: "happy", ms: 6000 });
    }, 1200);
  }

  /* ===============================================================
     1. AUTH TOGGLE (Login / Register)
  ================================================================*/

  var toggleRegister = $("toggle-register");
  var toggleLogin = $("toggle-login");
  var slider = $("auth-toggle-slider");
  var loginView = $("login-view");
  var registerView = $("register-view");

  function updateToggle() {
    var activeBtn = document.querySelector(".auth-toggle-btn.active");
    if (!activeBtn || !slider) return;
    slider.style.width = activeBtn.offsetWidth + "px";
    slider.style.transform = "translateX(" + activeBtn.offsetLeft + "px)";
  }

  function showAuthView(showLogin) {
    toggleLogin.classList.toggle("active", showLogin);
    toggleRegister.classList.toggle("active", !showLogin);
    toggleLogin.setAttribute("aria-selected", showLogin ? "true" : "false");
    toggleRegister.setAttribute("aria-selected", showLogin ? "false" : "true");
    var show = showLogin ? loginView : registerView;
    var hide = showLogin ? registerView : loginView;
    hide.style.display = "none";
    show.style.display = "";
    show.style.animation = "none";
    void show.offsetWidth; // restart the entrance animation
    show.style.animation = "fadeSlideUp .5s var(--lg-spring) both";
    updateToggle();
  }

  if (toggleRegister && toggleLogin) {
    toggleRegister.addEventListener("click", function () { showAuthView(false); });
    toggleLogin.addEventListener("click", function () { showAuthView(true); });
  }
  window.addEventListener("load", updateToggle);
  window.addEventListener("resize", updateToggle);

  /* ===============================================================
     2. LOGIN FORM
  ================================================================*/

  var loginForm = $("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("login-email").value.trim();
      var pass = $("login-password").value;
      var valid = true;

      if (email.indexOf("@") >= 0 ? !EMAIL_RE.test(email) : !USERNAME_RE.test(email)) {
        setGroupState("login-email-group", "login-email-error", "invalid", "Enter your e-mail or username");
        valid = false;
      } else {
        setGroupState("login-email-group", "login-email-error", "valid");
      }

      if (!pass) {
        setGroupState("login-password-group", "login-password-error", "invalid", "Please enter your password");
        valid = false;
      } else {
        setGroupState("login-password-group", "login-password-error", "valid");
      }

      if (!valid) return;
      var btn = $("login-submit");
      setLoading(btn, true);
      api.post("auth/login", { login: email, password: pass }).then(function () {
        window.location.href = "index.html";
      }, function (err) {
        setLoading(btn, false);
        setGroupState("login-password-group", "login-password-error", "invalid", apiMessage(err));
      });
    });
  }

  function bindVisibilityToggle(buttonId, inputId) {
    var btn = $(buttonId);
    var inp = $(inputId);
    if (!btn || !inp) return;
    btn.addEventListener("click", function () {
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  }
  bindVisibilityToggle("login-toggle-vis", "login-password");
  bindVisibilityToggle("reg-toggle-vis", "reg-password");

  /* Password reset: e-mail → code → new password, then logged in */

  var forgotLink = $("forgot-link");
  var resetForm = $("reset-form");

  function showReset(show) {
    loginForm.hidden = show;
    resetForm.hidden = !show;
    $("login-divider").hidden = show;
    $("login-social").hidden = show;
    $("login-title").textContent = show ? "Reset password" : "Welcome back";
    $("login-subtitle").textContent = show ? "We'll e-mail you a code to set a new password" : "Log into your account";
    if (show) {
      var typed = $("login-email").value.trim();
      $("reset-email").value = typed.indexOf("@") >= 0 ? typed : "";
      $("reset-email").focus();
    }
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", function () {
      showReset(true);
    });
  }

  if (resetForm) {
    $("reset-back").addEventListener("click", function () { showReset(false); });

    $("reset-send").addEventListener("click", function () {
      var email = $("reset-email").value.trim();
      if (!EMAIL_RE.test(email)) {
        setGroupState("reset-email-group", "reset-email-error", "invalid", "Please enter a valid e-mail");
        return;
      }
      var btn = $("reset-send");
      btn.disabled = true;
      btn.textContent = "Sending…";
      postHuman("auth/password/code", { email: email }, email.toLowerCase()).then(function () {
        setGroupState("reset-email-group", "reset-email-error", "valid");
        btn.textContent = "Sent ✓";
        var status = $("reset-status");
        status.className = "verify-status success";
        status.textContent = "If an account uses this e-mail, a code is on its way. Check your spam folder too.";
        $("reset-code").focus();
        setTimeout(function () { btn.disabled = false; btn.textContent = "Resend"; }, 60000);
      }, function (err) {
        btn.disabled = false;
        btn.textContent = "Send code";
        setGroupState("reset-email-group", "reset-email-error", "invalid", apiMessage(err));
      });
    });

    resetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("reset-email").value.trim();
      var code = $("reset-code").value.replace(/\D/g, "");
      var pass = $("reset-password").value;
      setGroupState("reset-code-group", "reset-code-error", code.length === 6 ? null : "invalid", code.length === 6 ? "" : "The code has 6 digits");
      setGroupState("reset-password-group", "reset-password-error", pass ? null : "invalid", pass ? "" : "Enter a new password");
      if (code.length !== 6 || !pass) return;

      var btn = $("reset-submit");
      setLoading(btn, true);
      api.post("auth/password/reset", { email: email, code: code, password: pass }).then(function () {
        window.location.href = "index.html";
      }, function (err) {
        setLoading(btn, false);
        var field = err.code === "weak_password" ? "password" : "code";
        setGroupState("reset-" + field + "-group", "reset-" + field + "-error", "invalid", apiMessage(err));
      });
    });
  }

  /* ===============================================================
     3. REGISTRATION WIZARD
  ================================================================*/

  var currentStep = 1;
  var currentPanel = "step-1";
  var STEP_NAMES = { 1: "Language", 2: "Quiz", 3: "Email", 4: "Account" };
  // Where the header back button goes from each panel
  var BACK_TARGET = { "step-2": 1, "step-2-results": 1, "step-3": "2-results", "step-4": 3 };
  // Set after a first sign-in with Google / GitHub: { token, provider, providerName, email, username }
  var oauth = null;
  var selectedLang = null;
  var quizState = {};
  var emailVerified = false;
  var usernameValid = false;
  var passwordValid = false;
  var confirmValid = false;

  /**
   * Show a wizard panel. `step` is 1–4, "2-results" or "success".
   * The header shows the step, fills the progress segments and offers Back.
   */
  function goToStep(step) {
    var targetId = "step-" + step;
    var numericStep = parseInt(step, 10) || currentStep;
    var goingBack = numericStep < currentStep;
    var resultsShown = step === "2-results";

    document.querySelectorAll(".wizard-panel").forEach(function (p) { p.classList.remove("active", "back"); });
    var target = $(targetId);
    if (target) {
      target.classList.add("active");
      if (goingBack && !reduceMotion) target.classList.add("back");
    }

    var header = $("wizard-progress");
    if (header) {
      // With Google / GitHub there is no e-mail step: Account is step 3 of 3.
      var shown = oauth && numericStep === 4 ? 3 : numericStep;
      var total = oauth ? 3 : 4;
      header.dataset.progress = shown;
      header.classList.toggle("done", step === "success");
      header.classList.toggle("no-email", !!oauth);
      var bar = header.querySelector(".reg-progress");
      bar.setAttribute("aria-valuenow", shown);
      bar.setAttribute("aria-valuemax", total);
      $("reg-step-label").textContent = "Step " + shown + " of " + total + " · " + (resultsShown ? "Results" : STEP_NAMES[numericStep]);
      $("reg-back").hidden = !BACK_TARGET[targetId];
    }

    currentStep = numericStep;
    currentPanel = targetId;
    if (target) target.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  var regBack = $("reg-back");
  if (regBack) regBack.addEventListener("click", function () {
    var target = BACK_TARGET[currentPanel];
    if (target) goToStep(target);
  });

  /* ===== STEP 1: Language selection ===== */

  var langCards = document.querySelectorAll(".lang-card");
  var btnStartQuiz = $("btn-start-quiz");

  // Brand colours per language + a text colour that stays readable on top of them
  var brandColors = {
    html:       { accent: "#e34f26", ink: "#ffffff" },
    css:        { accent: "#1572b6", ink: "#ffffff" },
    javascript: { accent: "#f7df1e", ink: "#08090c" },
    php:        { accent: "#777bb4", ink: "#ffffff" }
  };

  function applyBrand(lang) {
    var colors = brandColors[lang];
    if (!colors) return;
    var root = document.documentElement.style;
    root.setProperty("--accent", colors.accent);
    root.setProperty("--accent-ink", colors.ink);
  }

  langCards.forEach(function (card) {
    card.addEventListener("click", function () { selectLang(card); });
  });

  function selectLang(card) {
    langCards.forEach(function (c) {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });
    card.classList.add("selected");
    card.setAttribute("aria-checked", "true");
    selectedLang = card.dataset.lang;
    btnStartQuiz.disabled = false;
    applyBrand(selectedLang);
  }

  /** Hides languages that have no published course yet. */
  function loadCourses() {
    api.get("auth/courses").then(function (res) {
      var open = (res.courses || []).map(function (c) { return c.slug; });
      langCards.forEach(function (card) {
        card.hidden = open.indexOf(card.dataset.lang) < 0;
        if (card.hidden && card.classList.contains("selected")) {
          card.classList.remove("selected");
          selectedLang = null;
          btnStartQuiz.disabled = true;
        }
      });
    }, function () { /* keep every card; the server refuses an unpublished one */ });
  }

  if (btnStartQuiz) {
    btnStartQuiz.addEventListener("click", function () {
      if (!selectedLang) return;
      // The questions come from the database; their ids go back with the answers.
      var lang = selectedLang;
      var err = $("start-quiz-error");
      err.textContent = "";
      setLoading(btnStartQuiz, true);
      api.get("placement/questions?course=" + encodeURIComponent(lang)).then(function (res) {
        setLoading(btnStartQuiz, false);
        if (!res.questions.length) { skipQuiz(lang); return; }
        initQuiz(lang, res.questions);
        goToStep(2);
      }, function (e) {
        setLoading(btnStartQuiz, false);
        err.textContent = apiMessage(e, "Couldn't load the quiz. Try again.");
      });
    });
  }

  /** A course without placement questions: everyone starts at the first lesson. */
  function skipQuiz(lang) {
    quizState = { lang: lang, questions: [], answers: [], correct: 0, wrong: 0, seconds: 0 };
    goToStep(oauth ? 4 : 3);
  }

  /* ===== STEP 2: Adaptive quiz engine =====
     Questions are chosen one at a time: a correct answer raises the
     difficulty for the next question, a wrong one lowers it. */

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function langDisplayName(lang) {
    var names = { html: "HTML", css: "CSS", javascript: "JavaScript", php: "PHP" };
    return names[lang] || lang;
  }

  function initQuiz(lang, bank) {
    var byLevel = {};
    (bank || []).forEach(function (q) {
      (byLevel[q.level] = byLevel[q.level] || []).push(q);
    });
    Object.keys(byLevel).forEach(function (lvl) { byLevel[lvl] = shuffleArray(byLevel[lvl]); });

    quizState = {
      lang: lang,
      byLevel: byLevel,
      questions: [],        // questions asked so far, in order
      answers: [],          // chosen answer index per question
      difficulty: 1,
      correct: 0,
      wrong: 0,
      currentAnswer: null,
      startTime: Date.now()
    };

    $("quiz-lang-name").textContent = langDisplayName(lang);
    $("quiz-total").textContent = QUIZ_LENGTH;
    askNextQuestion();
  }

  /** Pop an unused question at the wanted difficulty, or the nearest level that still has one. */
  function takeQuestion(difficulty) {
    for (var delta = 0; delta <= 4; delta++) {
      var up = quizState.byLevel[difficulty + delta];
      if (up && up.length) return up.shift();
      var down = quizState.byLevel[difficulty - delta];
      if (delta && down && down.length) return down.shift();
    }
    return null;
  }

  function askNextQuestion() {
    var q = takeQuestion(quizState.difficulty);
    if (!q) { showQuizResults(); return; }
    quizState.questions.push(q);
    showQuestion(q, quizState.questions.length - 1);
  }

  function showQuestion(q, idx) {
    quizState.currentAnswer = null;
    $("quiz-current").textContent = idx + 1;
    $("quiz-progress-fill").style.width = ((idx + 1) / QUIZ_LENGTH * 100) + "%";
    updateDifficultyIndicator(q.level);
    $("quiz-question").textContent = q.q;

    var codeBlock = $("quiz-code-block");
    if (q.code) {
      $("quiz-code").textContent = q.code;
      codeBlock.style.display = "block";
    } else {
      codeBlock.style.display = "none";
    }

    var answersContainer = $("quiz-answers");
    answersContainer.innerHTML = "";
    var letters = ["A", "B", "C", "D"];

    q.answers.forEach(function (ans, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "reg-row quiz-answer";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.dataset.idx = i;

      var letter = document.createElement("span");
      letter.className = "answer-letter";
      letter.textContent = letters[i];
      var text = document.createElement("span");
      text.className = "reg-row-text";
      text.textContent = ans;

      btn.appendChild(letter);
      btn.appendChild(text);
      btn.addEventListener("click", function () { selectAnswer(i); });
      answersContainer.appendChild(btn);
    });

    // "I don't know" lives outside the list; it selects the index after the last answer.
    quizSkip.dataset.idx = q.answers.length;
    quizSkip.setAttribute("aria-pressed", "false");

    var btnNext = $("btn-quiz-next");
    btnNext.disabled = true;
    btnNext.querySelector(".btn-text").textContent = idx + 1 < QUIZ_LENGTH ? "Next" : "See results";
  }

  function updateDifficultyIndicator(level) {
    var labels = { 1: "Beginner", 2: "Basics", 3: "Intermediate", 4: "Advanced", 5: "Master" };
    $("difficulty-label").textContent = labels[level] || "";
  }

  var quizSkip = $("quiz-skip");
  if (quizSkip) quizSkip.addEventListener("click", function () { selectAnswer(parseInt(quizSkip.dataset.idx, 10)); });

  function selectAnswer(answerIdx) {
    quizState.currentAnswer = answerIdx;
    document.querySelectorAll(".quiz-answer").forEach(function (btn) {
      btn.setAttribute("aria-checked", parseInt(btn.dataset.idx, 10) === answerIdx ? "true" : "false");
    });
    quizSkip.setAttribute("aria-pressed", parseInt(quizSkip.dataset.idx, 10) === answerIdx ? "true" : "false");
    $("btn-quiz-next").disabled = false;
  }

  // Keyboard: A–E picks an answer, Enter confirms (unless focus is on a control that handles Enter itself)
  window.addEventListener("keydown", function (e) {
    if (!$("step-2").classList.contains("active")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || "").toLowerCase();
    var onControl = tag === "button" || tag === "input" || tag === "textarea" || tag === "select" || tag === "a";

    if (e.key === "Enter") {
      if (onControl) return; // the focused button fires its own click
      var btnNext = $("btn-quiz-next");
      if (btnNext && !btnNext.disabled) btnNext.click();
      return;
    }
    if (tag === "input" || tag === "textarea") return;
    var keyMap = { a: 0, b: 1, c: 2, d: 3, e: 4 };
    var pos = keyMap[e.key.toLowerCase()];
    if (pos === undefined) return;
    var buttons = document.querySelectorAll(".quiz-answer");
    if (buttons[pos]) buttons[pos].click();
    else if (pos === buttons.length) quizSkip.click(); // E = "I don't know"
  });

  var btnQuizNext = $("btn-quiz-next");
  if (btnQuizNext) {
    btnQuizNext.addEventListener("click", function () {
      if (quizState.currentAnswer === null || quizState.currentAnswer === undefined) return;
      var q = quizState.questions[quizState.questions.length - 1];
      var isCorrect = quizState.currentAnswer === q.correct;
      quizState.answers.push(quizState.currentAnswer);

      if (isCorrect) {
        quizState.correct++;
        quizState.difficulty = Math.min(5, quizState.difficulty + 1);
      } else {
        quizState.wrong++;
        quizState.difficulty = Math.max(1, quizState.difficulty - 1);
      }

      if (quizState.questions.length < QUIZ_LENGTH) askNextQuestion();
      else showQuizResults();
    });
  }

  function showQuizResults() {
    var total = quizState.questions.length;
    var pct = total ? Math.round((quizState.correct / total) * 100) : 0;
    var elapsed = Math.round((Date.now() - quizState.startTime) / 1000);
    quizState.seconds = elapsed;

    // Placement = the hardest level the learner answered correctly.
    var highest = 0;
    quizState.questions.forEach(function (q, i) {
      if (quizState.answers[i] === q.correct && q.level > highest) highest = q.level;
    });
    var levelNames = { 0: "Beginner", 1: "Beginner", 2: "Basics", 3: "Intermediate", 4: "Advanced", 5: "Master" };

    goToStep("2-results");

    $("results-score").textContent = pct + "%";
    $("results-correct").textContent = quizState.correct;
    $("results-wrong").textContent = quizState.wrong;
    $("results-time").textContent = elapsed >= 60 ? Math.floor(elapsed / 60) + "m " + (elapsed % 60) + "s" : elapsed + "s";
    $("results-level-name").textContent = levelNames[highest];
    $("results-title").textContent = (pct >= 80 ? "Great job!" : pct >= 50 ? "Well done!" : "Good start!") +
      " You answered " + quizState.correct + " of " + total + " correctly.";

    // What the result does: a level L start skips the first L − 1 units.
    var level = Math.max(1, highest);
    $("results-effect").innerHTML = level > 1
      ? "You'll start at <strong>Unit " + level + "</strong>. Units 1–" + (level - 1) + " are marked as skipped. They stay open, so you can go back for their XP any time."
      : "You'll start with the very first lesson. Every lesson you finish earns XP.";

    // Fill the level meter after the panel is visible so the change animates.
    var meter = $("level-meter");
    meter.dataset.level = 0;
    setTimeout(function () { meter.dataset.level = Math.max(1, highest); }, 150);
  }

  var btnToEmail = $("btn-to-email");
  // With Google / GitHub the e-mail is already verified: straight to the account.
  if (btnToEmail) btnToEmail.addEventListener("click", function () { goToStep(oauth ? 4 : 3); });

  /* ===== STEP 3: Email verification ===== */

  var regEmail = $("reg-email");
  var btnSendCode = $("btn-send-code");
  var verifySection = $("verify-code-section");
  var codeDigits = document.querySelectorAll(".code-digit");
  var btnResend = $("btn-resend");
  var btnToAccount = $("btn-to-account");
  var resendInterval = null;

  function resetCodeDigits() {
    codeDigits.forEach(function (d) {
      d.value = "";
      d.disabled = false;
      d.classList.remove("filled", "correct", "wrong");
    });
    var status = $("verify-status");
    status.className = "verify-status";
    status.textContent = "";
  }

  /** Forget everything about a previously sent code (used when the address changes). */
  function resetVerification() {
    clearInterval(resendInterval);
    emailVerified = false;
    verifiedToken = null;
    verifySection.style.display = "none";
    btnSendCode.textContent = "Send code";
    btnSendCode.classList.remove("sent");
    btnToAccount.disabled = true;
    resetCodeDigits();
  }

  if (regEmail) {
    regEmail.addEventListener("input", function () {
      var val = regEmail.value.trim();
      var isValid = EMAIL_RE.test(val);

      if (verifySection.style.display !== "none") resetVerification();
      btnSendCode.disabled = !isValid;

      if (val && !isValid) setGroupState("reg-email-group", "reg-email-error", "invalid", "Please enter a valid e-mail");
      else if (isValid) setGroupState("reg-email-group", "reg-email-error", "valid");
      else setGroupState("reg-email-group", "reg-email-error", null);
    });
  }

  var verifiedToken = null;  // from the API once the code is right; proves the e-mail at step 4

  function markSent() {
    btnSendCode.textContent = "Sent ✓";
    btnSendCode.classList.add("sent");
    btnSendCode.disabled = true;
    startResendTimer();
  }

  /** Sends a code and resolves true when it went out. */
  function sendCode() {
    var email = regEmail.value.trim();
    btnSendCode.disabled = true;
    btnSendCode.textContent = "Sending…";
    return postHuman("auth/register/code", { email: email }, email.toLowerCase()).then(function () {
      markSent();
      $("verify-email-display").textContent = email;
      return true;
    }, function (err) {
      btnSendCode.disabled = false;
      btnSendCode.textContent = "Send code";
      if (err.code === "email_taken") {
        setGroupState("reg-email-group", "reg-email-error", "invalid", "");
        $("reg-email-error").innerHTML = 'An account with this e-mail already exists. <button type="button" class="link-inline" id="email-taken-login">Log in instead</button>';
        $("email-taken-login").addEventListener("click", function () {
          $("login-email").value = email;
          showAuthView(true);
        });
        return false;
      }
      setGroupState("reg-email-group", "reg-email-error", "invalid", apiMessage(err));
      return false;
    });
  }

  if (btnSendCode) {
    btnSendCode.addEventListener("click", function () {
      var email = regEmail.value.trim();
      if (!EMAIL_RE.test(email)) return;
      sendCode().then(function (sent) {
        if (!sent) return;
        verifySection.style.display = "block";
        setTimeout(function () { codeDigits[0].focus(); }, 300);
      });
    });
  }

  function fillDigitsFrom(startIdx, digits) {
    for (var i = 0; i < digits.length && startIdx + i < codeDigits.length; i++) {
      codeDigits[startIdx + i].value = digits[i];
      codeDigits[startIdx + i].classList.add("filled");
    }
    var next = Math.min(startIdx + digits.length, codeDigits.length - 1);
    codeDigits[next].focus();
    checkVerificationCode();
  }

  codeDigits.forEach(function (digit, idx) {
    digit.addEventListener("input", function (e) {
      var val = e.target.value.replace(/\D/g, "");
      if (val.length > 1) { // mobile keyboards can insert several characters at once
        e.target.value = "";
        fillDigitsFrom(idx, val.slice(0, codeDigits.length - idx));
        return;
      }
      e.target.value = val;
      e.target.classList.toggle("filled", !!val);
      if (val) {
        if (idx < codeDigits.length - 1) codeDigits[idx + 1].focus();
        checkVerificationCode();
      }
    });

    digit.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        codeDigits[idx - 1].value = "";
        codeDigits[idx - 1].classList.remove("filled");
        codeDigits[idx - 1].focus();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        codeDigits[idx - 1].focus();
      } else if (e.key === "ArrowRight" && idx < codeDigits.length - 1) {
        codeDigits[idx + 1].focus();
      }
    });

    digit.addEventListener("paste", function (e) {
      e.preventDefault();
      var paste = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
      if (paste) fillDigitsFrom(idx, paste.slice(0, codeDigits.length - idx));
    });
  });

  function checkVerificationCode() {
    var code = "";
    codeDigits.forEach(function (d) { code += d.value; });
    if (code.length < codeDigits.length) return;

    var status = $("verify-status");
    function accept() {
      status.className = "verify-status success";
      status.textContent = "✓ E-mail verified successfully!";
      emailVerified = true;
      btnToAccount.disabled = false;
      codeDigits.forEach(function (d) { d.classList.add("correct"); d.disabled = true; });
      clearInterval(resendInterval);
      btnResend.disabled = true;
      btnResend.textContent = "Verified";
    }
    function reject(message) {
      status.className = "verify-status error";
      status.textContent = "✗ " + (message || "Incorrect code. Try again.");
      codeDigits.forEach(function (d) { d.classList.add("wrong"); });
      setTimeout(function () {
        resetCodeDigits();
        status.className = "verify-status error";
        status.textContent = "✗ " + (message || "Incorrect code. Try again.");
        codeDigits[0].focus();
      }, 1200);
    }

    codeDigits.forEach(function (d) { d.disabled = true; });
    api.post("auth/register/verify", { email: regEmail.value.trim(), code: code }).then(function (res) {
      verifiedToken = res.verifiedToken;
      accept();
    }, function (err) {
      codeDigits.forEach(function (d) { d.disabled = false; });
      var msg = err.code === "wrong_code"
        ? "Incorrect code. " + err.data.attemptsLeft + (err.data.attemptsLeft === 1 ? " try" : " tries") + " left."
        : apiMessage(err);
      reject(msg);
    });
  }

  function startResendTimer() {
    var timer = 60;
    clearInterval(resendInterval);
    btnResend.disabled = true;
    btnResend.innerHTML = 'Resend in <span id="resend-timer">60</span>s';
    var timerEl = $("resend-timer");
    resendInterval = setInterval(function () {
      timer--;
      timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(resendInterval);
        btnResend.disabled = false;
        btnResend.textContent = "Resend code";
      }
    }, 1000);
  }

  if (btnResend) {
    btnResend.addEventListener("click", function () {
      resetCodeDigits();
      sendCode();
      codeDigits[0].focus();
    });
  }

  if (btnToAccount) {
    btnToAccount.addEventListener("click", function () {
      if (!emailVerified) return;
      goToStep(4);
    });
  }

  /* ===== STEP 4: Username & password ===== */

  var regUsername = $("reg-username");
  var regPassword = $("reg-password");
  var regConfirm = $("reg-confirm");
  var usernameTimer = null;

  function setUsernameStatus(html) {
    var status = $("username-status");
    status.style.display = html ? "flex" : "none";
    status.innerHTML = html || "";
  }

  if (regUsername) {
    regUsername.addEventListener("input", function () {
      var val = regUsername.value.trim();
      usernameValid = false;
      updateCreateButton();
      clearTimeout(usernameTimer);

      var formatError = null;
      if (!val) formatError = "";
      else if (val.length < 3) formatError = "Minimum 3 characters";
      else if (val.length > 20) formatError = "Maximum 20 characters";
      else if (!/^[a-zA-Z0-9_]+$/.test(val)) formatError = "Only letters, numbers, and underscores allowed";

      if (formatError !== null) {
        setGroupState("reg-username-group", "reg-username-error", formatError ? "invalid" : null, formatError);
        setUsernameStatus("");
        return;
      }

      // Availability check, debounced
      setGroupState("reg-username-group", "reg-username-error", null);
      setUsernameStatus('<div class="spinner-sm"></div>');

      function show(reason) {
        if (regUsername.value.trim() !== val) return; // the field changed meanwhile
        if (reason === "not_allowed") {
          setGroupState("reg-username-group", "reg-username-error", "invalid", "This username isn't allowed");
          setUsernameStatus('<span class="bad">✗</span>');
        } else if (reason) {
          setGroupState("reg-username-group", "reg-username-error", "invalid", "This username is already taken");
          setUsernameStatus('<span class="bad">✗</span>');
        } else {
          setGroupState("reg-username-group", "reg-username-error", "valid");
          setUsernameStatus('<span class="ok">✓</span>');
          usernameValid = true;
        }
        updateCreateButton();
      }

      usernameTimer = setTimeout(function () {
        api.get("auth/username?u=" + encodeURIComponent(val)).then(function (res) {
          show(res.available ? null : res.reason);
        }, function () {
          setUsernameStatus("");
          setGroupState("reg-username-group", "reg-username-error", "invalid", "Couldn't check the username. Try again.");
        });
      }, 400);
    });
  }

  if (regPassword) {
    regPassword.addEventListener("input", function () {
      var val = regPassword.value;
      var rules = {
        length: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        number: /[0-9]/.test(val),
        special: /[^A-Za-z0-9]/.test(val)
      };

      var metCount = 0;
      Object.keys(rules).forEach(function (key) {
        var el = $("rule-" + key);
        el.classList.toggle("met", rules[key]);
        el.querySelector(".rule-icon").textContent = rules[key] ? "✓" : "○";
        if (rules[key]) metCount++;
      });

      var labels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
      var colors = ["", "var(--error)", "var(--coral)", "var(--warning)", "#a7e9c5", "var(--success)"];
      $("strength-fill").dataset.level = metCount;
      $("strength-label").textContent = val ? labels[metCount] : "Enter password";
      $("strength-label").style.color = val ? colors[metCount] : "";

      passwordValid = metCount === 5;
      checkPasswordMatch();
      updateCreateButton();
    });
  }

  if (regConfirm) {
    regConfirm.addEventListener("input", function () {
      checkPasswordMatch();
      updateCreateButton();
    });
  }

  function checkPasswordMatch() {
    var pass = regPassword.value;
    var conf = regConfirm.value;
    if (!conf) {
      setGroupState("reg-confirm-group", "reg-confirm-error", null);
      confirmValid = false;
    } else if (pass === conf) {
      setGroupState("reg-confirm-group", "reg-confirm-error", "valid");
      confirmValid = true;
    } else {
      setGroupState("reg-confirm-group", "reg-confirm-error", "invalid", "Passwords do not match");
      confirmValid = false;
    }
  }

  function updateCreateButton() {
    $("btn-create-account").disabled = !(usernameValid && passwordValid && confirmValid);
  }

  var accountForm = $("account-form");
  if (accountForm) {
    accountForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!(usernameValid && passwordValid && confirmValid)) return;

      var btn = $("btn-create-account");
      setLoading(btn, true);
      var username = regUsername.value.trim();

      function done(res) {
        $("success-username").textContent = username;
        var start = res && res.placement && res.placement.startUnit;
        $("success-start").textContent = start && res.placement.skippedUnits
          ? "You start at Unit " + start.position + " · " + start.title + "."
          : "You start with the first lesson.";
        goToStep("success");
        animateSuccess();
      }
      var body = {
        username: username,
        password: regPassword.value,
        course: selectedLang,
        timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ""),
        placement: { answers: placementAnswers(), seconds: quizState.seconds || 0 }
      };
      var sent;
      if (oauth) {
        body.oauthToken = oauth.token;
        sent = postHuman("auth/register", body, oauth.token);
      } else {
        body.verifiedToken = verifiedToken;
        sent = api.post("auth/register", body);
      }
      sent.then(done, function (err) {
        setLoading(btn, false);
        if (err.code === "oauth_expired" || err.code === "already_registered") {
          showAuthView(true);
          setGroupState("login-email-group", "login-email-error", "invalid", apiMessage(err));
          return;
        }
        if (err.code === "email_not_verified" || err.code === "email_taken") {
          resetVerification();
          goToStep(3);
          setGroupState("reg-email-group", "reg-email-error", "invalid", apiMessage(err));
          return;
        }
        var field = err.code === "weak_password" ? ["reg-password-group", null] : ["reg-username-group", "reg-username-error"];
        if (err.code.indexOf("username_") === 0) usernameValid = false;
        setGroupState(field[0], field[1], "invalid", apiMessage(err));
        if (!field[1]) $("strength-label").textContent = apiMessage(err);
        updateCreateButton();
      });
    });
  }

  /** The quiz answers as question / answer ids, so the server can grade them itself. */
  function placementAnswers() {
    return (quizState.questions || []).map(function (q, i) {
      var a = quizState.answers[i];
      return { questionId: q.id, answerId: q.answerIds && a < q.answerIds.length ? q.answerIds[a] : null };
    }).filter(function (x) { return x.questionId; });
  }

  /* ===============================================================
     4. GOOGLE / GITHUB
     The buttons go to the API, which sends the browser to the provider
     and back. A known account is logged in right away; a first sign-in
     lands here with ?oauth=<token> to finish the wizard without the
     e-mail step.
  ================================================================*/

  function oauthStart(provider) {
    var url = "api/auth/oauth/" + provider + "/start";
    if (selectedLang) url += "?course=" + encodeURIComponent(selectedLang);
    window.location.href = url;
  }
  document.querySelectorAll("[data-oauth]").forEach(function (btn) {
    btn.addEventListener("click", function () { oauthStart(btn.dataset.oauth); });
  });

  var OAUTH_ERRORS = {
    cancelled: "Sign-in with {p} was cancelled.",
    state: "The sign-in with {p} took too long or was opened in another tab. Try again.",
    failed: "{p} didn't let us sign you in. Try again.",
    no_email: "Your {p} account has no verified e-mail address. Add one there, or register with your e-mail here.",
    linked_elsewhere: "That {p} account already belongs to another Codle account.",
    not_configured: "Signing in with {p} isn't available yet. Register with your e-mail instead."
  };

  function initOAuth() {
    // Links such as register.html#login (home page) open the login form.
    if (location.hash === "#login" && !params.get("oauth")) showAuthView(true);
    var error = params.get("oauth_error");
    var provider = PROVIDER_NAMES[params.get("provider")] || "the provider";
    if (error) {
      history.replaceState(null, "", location.pathname);
      showAuthView(true);
      setGroupState("login-email-group", "login-email-error", "invalid", (OAUTH_ERRORS[error] || OAUTH_ERRORS.failed).replace("{p}", provider));
      return;
    }
    var token = params.get("oauth");
    if (!token) return;
    api.get("auth/oauth/pending?token=" + encodeURIComponent(token)).then(function (res) {
      oauth = { token: token, provider: res.provider, providerName: res.providerName, email: res.email, username: res.username };
      var banner = $("oauth-banner");
      $("oauth-banner-text").innerHTML = "Signed in with <strong></strong> as <strong></strong>. Pick a language and take the quiz to finish your account.";
      var strong = banner.querySelectorAll("strong");
      strong[0].textContent = res.providerName;
      strong[1].textContent = res.email;
      banner.hidden = false;
      $("register-social").hidden = true;
      $("auth-toggle").hidden = true;
      if (res.username) {
        regUsername.value = res.username;
        regUsername.dispatchEvent(new Event("input"));
      }
      var course = params.get("course");
      var card = course && document.querySelector('.lang-card[data-lang="' + course.replace(/[^a-z0-9_-]/g, "") + '"]');
      if (card && !card.hidden) selectLang(card);
      goToStep(1);
    }, function (err) {
      history.replaceState(null, "", location.pathname);
      showAuthView(true);
      setGroupState("login-email-group", "login-email-error", "invalid", apiMessage(err));
    });
  }

  $("oauth-cancel").addEventListener("click", function () {
    window.location.replace(location.pathname);
  });

  function animateSuccess() {
    setTimeout(function () {
      var circle = $("success-circle");
      circle.style.transition = "stroke-dashoffset 1s var(--lg-spring)";
      circle.style.strokeDashoffset = "0";
      setTimeout(function () {
        var check = $("success-checkmark");
        check.style.transition = "stroke-dashoffset .6s var(--lg-spring)";
        check.style.strokeDashoffset = "0";
      }, 600);
    }, 200);
  }

})();
