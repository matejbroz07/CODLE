/**
 * Codle — Quiz
 *
 * Unit quizzes and final exams: one multiple-choice question at a time with
 * the right answer shown after every pick, then the score.
 *
 * quiz.html?lesson=ID loads the questions of that lesson from the API
 * (js/api.js), sends the answers to the server, which grades them, and
 * completes the lesson (XP) from the pass mark up.
 */

/** Builds the quiz. `data` is the API's GET lessons/{id}/quiz answer. */
function codleQuiz(data, remote) {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }

  var api = window.CodleApi;
  var mascot = window.CodleMascot || null;
  var LETTERS = ["A", "B", "C", "D"];
  var RING = 263.9; // 2 * PI * 42
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var CROSS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var lesson = data.lesson;
  var quiz = data.quiz;
  var isExam = lesson.kind === "exam";
  var questions = [];
  var index = 0;
  var picked = null;      // index of the chosen answer
  var revealed = false;   // the right answer is shown
  var answers = [];       // {questionId, answerId} per question, in order
  var correctCount = 0;

  /* ===============================================================
     1. TOP BAR
  ================================================================*/

  document.title = lesson.title + " — Codle";
  $("qz-crumb").textContent = lesson.crumb;
  $("qz-title").textContent = lesson.title;
  $("qz-xp-value").textContent = "+" + lesson.xp + " XP";

  function setProgress(done, total) {
    $("qz-progress-fill").style.width = (total ? 100 * done / total : 0) + "%";
    $("qz-progress-label").textContent = done + " / " + total;
  }

  var toastTimer = null;
  function toast(msg, ms) {
    var el = $("qz-toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, ms || 2200);
  }

  function show(id) {
    ["qz-intro", "qz-question", "qz-result"].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  /* ===============================================================
     2. INTRO
  ================================================================*/

  function renderIntro() {
    var n = quiz.questions.length;
    $("qz-intro-title").textContent = isExam ? "Final exam" : "Unit quiz";
    $("qz-intro-sub").textContent = (isExam
      ? "Everything from the " + lesson.course.name + " course. "
      : "Everything from " + lesson.unitTitle + ". ") +
      "Pick an answer, check it, and keep going. You pass with " + quiz.passPercent + "% or more.";
    var facts = [n + " questions", "Pass mark " + quiz.passPercent + "%", "+" + lesson.xp + " XP"];
    var html = facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("");
    if (quiz.bestScore !== null && quiz.bestScore !== undefined) html += '<li class="best">Best so far ' + quiz.bestScore + "%</li>";
    $("qz-facts").innerHTML = html;
    $("qz-start").textContent = quiz.attempts ? "Try again" : "Start";
    setProgress(0, n);
    show("qz-intro");
    $("qz-start").focus({ preventScroll: true });
  }

  function start() {
    // Fresh order of answers every run, so remembering "it was B" does not help
    questions = quiz.questions.map(function (q) {
      return { id: q.id, prompt: q.prompt, code: q.code, correct: q.correct, answers: shuffle(q.answers.slice()) };
    });
    index = 0;
    answers = [];
    correctCount = 0;
    renderQuestion();
    if (mascot) mascot.tip(isExam ? "Deep breath. Read every answer before you pick one." : "Press 1 to 4 to pick an answer and Enter to check it.", { key: "quiz-start", mood: "think" });
  }

  /* ===============================================================
     3. QUESTIONS
  ================================================================*/

  function renderQuestion() {
    var q = questions[index];
    picked = null;
    revealed = false;
    $("qz-meta").textContent = "Question " + (index + 1) + " of " + questions.length;
    $("qz-prompt").textContent = q.prompt;
    $("qz-code").hidden = !q.code;
    $("qz-code-text").textContent = q.code || "";
    $("qz-answers").className = "qz-answers";
    $("qz-answers").innerHTML = q.answers.map(function (a, i) {
      return '<button type="button" class="qz-answer" role="radio" aria-checked="false" data-index="' + i + '">' +
        '<span class="qz-letter" aria-hidden="true">' + LETTERS[i] + "</span>" +
        '<span class="qz-answer-text">' + esc(a.text) + "</span></button>";
    }).join("");
    var fb = $("qz-feedback");
    fb.textContent = "";
    fb.className = "qz-feedback";
    var btn = $("qz-next");
    btn.textContent = "Check";
    btn.disabled = true;
    btn.classList.remove("good");
    setProgress(index, questions.length);
    show("qz-question");
  }

  function pick(i) {
    if (revealed) return;
    picked = i;
    $("qz-answers").querySelectorAll(".qz-answer").forEach(function (b, j) { b.setAttribute("aria-checked", j === i ? "true" : "false"); });
    $("qz-next").disabled = false;
  }

  function check() {
    if (picked === null || revealed) return;
    revealed = true;
    var q = questions[index];
    var chosen = q.answers[picked];
    var ok = chosen.id === q.correct;
    if (ok) correctCount++;
    answers.push({ questionId: q.id, answerId: chosen.id });

    var list = $("qz-answers");
    list.classList.add("revealed");
    list.querySelectorAll(".qz-answer").forEach(function (b, j) {
      var a = q.answers[j];
      b.disabled = true;
      if (a.id === q.correct) { b.classList.add("is-correct"); b.querySelector(".qz-letter").innerHTML = CHECK_SVG; }
      else if (j === picked) { b.classList.add("is-wrong"); b.querySelector(".qz-letter").innerHTML = CROSS_SVG; }
    });
    var fb = $("qz-feedback");
    fb.textContent = ok ? "Correct!" : "Not quite. The right answer is " + LETTERS[q.answers.findIndex(function (a) { return a.id === q.correct; })] + ".";
    fb.className = "qz-feedback " + (ok ? "good" : "bad");

    var btn = $("qz-next");
    btn.textContent = index + 1 < questions.length ? "Continue" : "See result";
    btn.classList.toggle("good", ok);
    btn.focus({ preventScroll: true });
    setProgress(index + 1, questions.length);
    if (mascot) mascot.mood(ok ? "happy" : "sad", 1400);
  }

  function next() {
    if (!revealed) { check(); return; }
    index++;
    if (index < questions.length) renderQuestion();
    else finish();
  }

  /* ===============================================================
     4. RESULT
  ================================================================*/

  function finish() {
    var btn = $("qz-next");
    btn.disabled = true;
    btn.classList.add("loading");
    api.post("lessons/" + lesson.id + "/quiz", { answers: answers }).then(renderResult, function (err) {
      btn.disabled = false;
      btn.classList.remove("loading");
      toast("Couldn't send your answers: " + err.message, 4000);
    });
  }

  function renderResult(res) {
    var card = $("qz-result");
    card.classList.toggle("failed", !res.passed);
    $("qz-score").textContent = res.score + "%";
    $("qz-result-title").textContent = res.passed ? (res.score === 100 ? "Perfect!" : "Passed!") : "Not yet";
    var sub = res.correct + " of " + res.total + " correct.";
    if (res.passed) {
      sub += res.firstCompletion ? " The lesson is complete." : " You had already passed this one, so no new XP.";
      if (res.badges && res.badges.length) sub += " New badge: " + res.badges.join(", ") + "!";
    } else {
      sub += " You need " + res.passPercent + "% to pass. Have another go, the answers come in a different order each time.";
    }
    $("qz-result-sub").textContent = sub;
    var gained = res.reward ? res.reward.xpGained : 0;
    $("qz-reward").hidden = !gained;
    $("qz-reward-xp").textContent = "+" + gained + " XP";

    var actions = [];
    if (res.passed) {
      if (res.next && res.next.playable) {
        var page = res.next.kind === "quiz" || res.next.kind === "exam" ? "quiz.html" : "editor.html";
        actions.push('<a class="qz-btn primary" href="' + page + '?lesson=' + res.next.id + '">Next: ' + esc(res.next.title) + "</a>");
        actions.push('<a class="qz-btn" href="index.html">Back to the path</a>');
      } else {
        actions.push('<a class="qz-btn primary" href="index.html">Back to the path</a>');
      }
    } else {
      actions.push('<button class="qz-btn primary" type="button" id="qz-retry">Try again</button>');
      actions.push('<a class="qz-btn" href="index.html">Back to the path</a>');
    }
    $("qz-result-actions").innerHTML = actions.join("");
    var retry = $("qz-retry");
    if (retry) retry.addEventListener("click", function () { quiz.attempts++; quiz.bestScore = Math.max(quiz.bestScore || 0, res.score); start(); });

    show("qz-result");
    setProgress(res.total, res.total);
    requestAnimationFrame(function () { $("qz-ring").style.strokeDashoffset = RING * (1 - res.score / 100); });
    var first = $("qz-result-actions").firstElementChild;
    if (first) first.focus({ preventScroll: true });
    if (mascot) mascot.say(res.passed ? (res.score === 100 ? "Every single one. Show-off!" : "Passed! On to the next lesson.") : "Not this time. Look at the answers that were red and try again.", { mood: res.passed ? "happy" : "sad", ms: 5000 });
  }

  /* ===============================================================
     5. EVENTS
  ================================================================*/

  $("qz-start").addEventListener("click", start);
  $("qz-answers").addEventListener("click", function (e) {
    var b = e.target.closest(".qz-answer");
    if (b && !b.disabled) pick(+b.dataset.index);
  });
  $("qz-next").addEventListener("click", next);
  document.addEventListener("keydown", function (e) {
    if ($("qz-question").hidden) return;
    if (e.key >= "1" && e.key <= "4" && !revealed) { var i = +e.key - 1; if (i < questions[index].answers.length) pick(i); }
    if (e.key === "Enter" && !$("qz-next").disabled && !(e.target && e.target.tagName === "A")) { e.preventDefault(); next(); }
  });
  if (mascot) mascot.help(function () {
    if (!$("qz-question").hidden) {
      return { text: revealed ? "Press Continue (or Enter) for the next question." : "Read the question twice, rule out the answers that are clearly wrong, then pick. Press Check when you're sure.", mood: "think" };
    }
    return { text: "This quiz covers the unit you just finished. Passing it completes the lesson and earns the XP.", mood: "happy" };
  });

  renderIntro();
}

/* Loader: the quiz the URL names, from the API. Without one, back to the path. */
(function () {
  "use strict";
  var match = /[?&]lesson=(\d+)/.exec(location.search);
  var api = window.CodleApi;

  if (!match || !api) { window.location.replace("index.html"); return; }

  function giveUp(message) {
    var el = document.getElementById("qz-toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(function () { window.location.replace("index.html"); }, 2500);
  }

  api.ready.then(function (s) {
    if (!s.user) { window.location.replace("register.html"); return; }
    api.get("lessons/" + match[1] + "/quiz").then(function (data) { codleQuiz(data, true); }, function (err) {
      giveUp(err.code === "lesson_locked" ? "This quiz is still locked." :
        err.code === "no_content" ? "This quiz isn't ready yet." : "Couldn't open the quiz: " + err.message);
    });
  });
})();
