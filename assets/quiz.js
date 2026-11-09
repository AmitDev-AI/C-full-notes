/* C Notes — quiz logic (offline) */
(function () {
  "use strict";
  var form = document.getElementById("quizForm");
  if (!form) return;
  var result = document.getElementById("quizResult");
  var checkBtn = document.getElementById("checkQuiz");
  var resetBtn = document.getElementById("resetQuiz");

  function check() {
    var qs = form.querySelectorAll(".quiz-q");
    var score = 0;
    qs.forEach(function (q) {
      var answer = q.getAttribute("data-answer");
      var picked = q.querySelector("input[type=radio]:checked");
      q.classList.add("answered");
      q.querySelectorAll("label").forEach(function (label) {
        var opt = label.getAttribute("data-opt");
        label.classList.remove("correct", "wrong");
        if (opt === answer) label.classList.add("correct");
      });
      if (picked) {
        var pickedLabel = picked.closest("label");
        if (picked.value === answer) score++;
        else pickedLabel.classList.add("wrong");
      }
    });
    var pct = Math.round((score / qs.length) * 100);
    var msg = score === qs.length ? "Perfect score! You know your C." :
              pct >= 70 ? "Nicely done. Review the explanations for anything you missed." :
              "Keep going — read the linked chapters and try again.";
    var best = null;
    try { best = JSON.parse(window.localStorage.getItem("cnotes.quiz.best") || "null"); } catch (e) {}
    if (!best || pct > best.pct || (pct === best.pct && score > best.score)) {
      best = { score: score, total: qs.length, pct: pct, date: new Date().toISOString() };
      try { window.localStorage.setItem("cnotes.quiz.best", JSON.stringify(best)); } catch (e) {}
    }
    var bestLine = best ? '<div class="small" style="margin-top:6px;font-weight:400">Best saved score: <b>' +
      best.score + " / " + best.total + "</b> (" + best.pct + "%).</div>" : "";
    result.innerHTML = "You scored <b>" + score + " / " + qs.length + "</b> (" + pct + "%). " + msg + bestLine;
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (checkBtn) checkBtn.addEventListener("click", function (e) { e.preventDefault(); check(); });

  if (resetBtn) resetBtn.addEventListener("click", function (e) {
    e.preventDefault();
    form.reset();
    form.querySelectorAll(".quiz-q").forEach(function (q) {
      q.classList.remove("answered");
      q.querySelectorAll("label").forEach(function (l) { l.classList.remove("correct", "wrong"); });
    });
    result.textContent = "";
    var first = form.querySelector("input[type=radio]");
    if (first) first.focus();
  });
})();
