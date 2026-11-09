/* C Notes — certificate page */
(function () {
  "use strict";
  if (!window.CNotes) return;

  var nameInput = document.getElementById("certName");
  var cert = document.getElementById("certificate");
  if (!nameInput || !cert) return;

  var certNameOut = document.getElementById("certNameOut");
  var certText = document.getElementById("certText");
  var certProgress = document.getElementById("certProgress");
  var certDate = document.getElementById("certDate");
  var certSeal = document.getElementById("certSeal");
  var certDone = document.getElementById("certDone");
  var certTotal = document.getElementById("certTotal");
  var certQuiz = document.getElementById("certQuiz");
  var certNext = document.getElementById("certNext");
  var certFill = document.getElementById("certChaptersFill");
  var reqChapters = document.getElementById("reqChapters");
  var reqQuiz = document.getElementById("reqQuiz");

  var NAME_KEY = "cnotes.certificate.name";
  try { nameInput.value = window.localStorage.getItem(NAME_KEY) || ""; } catch (e) {}

  function savingsGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function bestQuiz() {
    try { return JSON.parse(savingsGet("cnotes.quiz.best") || "null"); } catch (e) { return null; }
  }

  function stats() {
    var done = window.CNotes.getComplete().filter(function (f) {
      return window.CNotes.tutorialFiles.indexOf(f) !== -1;
    });
    var total = window.CNotes.tutorialCount;
    var best = bestQuiz();
    var quizOk = !!(best && best.pct >= 70);
    return {
      done: done.length,
      total: total,
      best: best,
      quizOk: quizOk,
      ready: done.length === total && quizOk,
      missing: window.CNotes.tutorialFiles.filter(function (f) { return done.indexOf(f) === -1; })
    };
  }

  function refresh() {
    var s = stats();
    if (certDone) certDone.textContent = s.done;
    if (certTotal) certTotal.textContent = s.total;
    if (certFill) certFill.style.width = Math.round((s.done / s.total) * 100) + "%";
    if (certQuiz) certQuiz.textContent = s.best ? s.best.pct + "% (" + s.best.score + "/" + s.best.total + ")" : "not taken yet";
    if (reqChapters) reqChapters.classList.toggle("ok", s.done === s.total);
    if (reqQuiz) reqQuiz.classList.toggle("ok", s.quizOk);
    if (certNext) {
      if (s.missing.length) {
        certNext.innerHTML = "Next: <a href=\"" + s.missing[0] + "\">" + window.CNotes.titleFor(s.missing[0]) + "</a>.";
      } else {
        certNext.textContent = "All chapters complete.";
      }
    }
    return s;
  }

  function renderCertificate() {
    var s = refresh();
    var name = nameInput.value.trim() || "C Learner";
    try { window.localStorage.setItem(NAME_KEY, nameInput.value.trim()); } catch (e) {}
    if (certNameOut) certNameOut.textContent = name;
    if (certDate) {
      certDate.textContent = new Date().toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric"
      });
    }
    cert.classList.toggle("cert-incomplete", !s.ready);
    if (s.ready) {
      if (certText) certText.textContent = "has successfully completed the C Notes offline course, covering C syntax, data types, control flow, functions, arrays, strings, pointers, structures, file handling and dynamic memory.";
      if (certProgress) certProgress.textContent = "All " + s.total + " chapters complete · quiz score " + s.best.pct + "%";
      if (certSeal) certSeal.textContent = "Certified";
    } else {
      if (certText) certText.textContent = "is working through the C Notes offline course.";
      if (certProgress) {
        certProgress.textContent = "Preview — " + s.done + " of " + s.total + " chapters complete; best quiz score " +
          (s.best ? s.best.pct + "%" : "not taken") + " (70% required).";
      }
      if (certSeal) certSeal.textContent = "In progress";
    }
    cert.hidden = false;
    cert.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  var generate = document.getElementById("certGenerate");
  if (generate) generate.addEventListener("click", renderCertificate);
  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); renderCertificate(); }
  });

  document.addEventListener("cnotes:progress", refresh);

  refresh();
  if (nameInput.value.trim()) {
    var s = stats();
    if (s.ready || s.done > 0 || s.best) renderCertificate();
  }
})();
