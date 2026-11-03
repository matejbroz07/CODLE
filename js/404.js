/**
 * Codle — 404 page
 *
 * Curly stands in for the 0, tells you the page is gone, has a new joke each
 * time you click him and complains when you poke one of the 4s.
 */
(function () {
  "use strict";

  var GONE = "<b>This page doesn't exist.</b> I looked everywhere, even inside the <code>&lt;head&gt;</code>. " +
    "The link may be broken, or the page has moved.";
  var JOKES = [
    "I tried <code>console.log(page)</code>. It printed <code>undefined</code>.",
    "Maybe it's hiding behind <code>display: none</code>? Nope, checked.",
    "I even ran <code>document.querySelector(\".page\")</code>. It came back <code>null</code>.",
    "Somewhere out there is an <code>&lt;a href&gt;</code> with a typo. It wasn't me. Probably.",
    "Let's head back to learning. Those pages actually exist, I promise."
  ];
  var POKES = [
    "Hey! Careful, those 4s are holding me up.",
    "I'm the 0 here. They're just the 4s.",
    "Poking the 4s won't bring the page back. I tried.",
    "Okay, now you're just doing it for fun."
  ];

  var back = document.getElementById("nf-back");
  if (history.length > 1) back.addEventListener("click", function () { history.back(); });
  else back.hidden = true;

  var curly = window.CodleMascot;
  if (!curly) return;

  var joke = 0, poke = 0;
  curly.help(function () {
    return { text: JOKES[joke++ % JOKES.length], html: true, mood: "think" };
  });

  Array.prototype.forEach.call(document.querySelectorAll(".nf-digit"), function (digit) {
    digit.addEventListener("click", function () {
      var four = digit.firstElementChild;
      four.classList.remove("is-poked");
      void four.offsetWidth; // restart the wobble on every poke
      four.classList.add("is-poked");
      curly.say(POKES[poke++ % POKES.length], { mood: "surprised", ms: 3200 });
    });
  });

  // pops in between the 4s looking surprised, then breaks the news
  curly.mood("surprised", 1000);
  setTimeout(function () { curly.say(GONE, { html: true, mood: "sad", ms: 0 }); }, 1000);
})();
