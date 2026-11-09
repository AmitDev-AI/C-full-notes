/* C Notes — glossary filter */
(function () {
  "use strict";
  var input = document.getElementById("glossarySearch");
  if (!input) return;
  var groups = Array.prototype.slice.call(document.querySelectorAll(".glossary"));
  var countEl = document.getElementById("glossaryCount");
  var emptyEl = document.getElementById("glossaryEmpty");

  function apply() {
    var q = input.value.trim().toLowerCase();
    var visible = 0;
    groups.forEach(function (group) {
      var terms = group.querySelectorAll(".term");
      var groupCount = 0;
      terms.forEach(function (term) {
        var hit = !q || term.textContent.toLowerCase().indexOf(q) !== -1;
        term.hidden = !hit;
        if (hit) { groupCount++; visible++; }
      });
      var heading = group.querySelector("h2");
      if (heading) heading.hidden = groupCount === 0;
    });
    if (countEl) countEl.textContent = q ? visible + " matching term" + (visible === 1 ? "" : "s") : visible + " terms in the glossary";
    if (emptyEl) emptyEl.hidden = visible !== 0;
  }

  input.addEventListener("input", apply);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      apply();
      input.blur();
    }
  });
  apply();
})();
