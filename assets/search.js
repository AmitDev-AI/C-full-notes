/* C Notes — full-text search over the generated index */
(function () {
  "use strict";

  var input = document.getElementById("searchInput");
  var resultsEl = document.getElementById("searchResults");
  var summaryEl = document.getElementById("searchSummary");
  var emptyEl = document.getElementById("searchEmpty");
  if (!input || !resultsEl) return;

  var INDEX = window.CNOTES_INDEX || [];
  var filter = "All";
  var lastResults = [];

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    var lower = text.toLowerCase();
    var q = query.toLowerCase();
    var out = "";
    var pos = 0;
    var i = lower.indexOf(q);
    while (i !== -1) {
      out += escapeHtml(text.slice(pos, i)) + "<mark>" + escapeHtml(text.slice(i, i + q.length)) + "</mark>";
      pos = i + q.length;
      i = lower.indexOf(q, pos);
    }
    out += escapeHtml(text.slice(pos));
    return out;
  }

  function snippet(text, query) {
    if (!query) return text.slice(0, 220) + (text.length > 220 ? "…" : "");
    var i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text.slice(0, 220) + (text.length > 220 ? "…" : "");
    var start = Math.max(0, i - 90);
    var end = Math.min(text.length, i + query.length + 170);
    return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  }

  function flatten() {
    var rows = [];
    INDEX.forEach(function (page) {
      if (filter !== "All" && page.group !== filter) return;
      page.sections.forEach(function (section) {
        rows.push({
          page: page.page,
          title: page.title,
          group: page.group,
          h: section.h,
          id: section.id,
          text: section.text,
          url: page.url + (section.id ? "#" + section.id : "")
        });
      });
    });
    return rows;
  }

  function score(row, q) {
    var s = 0;
    var h = row.h.toLowerCase();
    var t = row.text.toLowerCase();
    var title = row.title.toLowerCase();
    if (h === q) s += 30;
    else if (h.indexOf(q) === 0) s += 18;
    else if (h.indexOf(q) !== -1) s += 12;
    if (title.indexOf(q) !== -1) s += 8;
    var count = t.split(q).length - 1;
    s += Math.min(count, 8) * 2;
    if (t.indexOf(q) === 0) s += 3;
    return s;
  }

  function render() {
    var q = input.value.trim();
    var lower = q.toLowerCase();
    lastResults = [];

    if (!q) {
      var pages = INDEX.filter(function (p) { return filter === "All" || p.group === filter; });
      summaryEl.textContent = pages.length + " page" + (pages.length === 1 ? "" : "s") + " in " + (filter === "All" ? "the whole site" : filter) + ". Type to search.";
      resultsEl.innerHTML = pages.map(function (p) {
        var lead = p.sections[0] ? p.sections[0].text : "";
        return '<a class="result" href="' + p.url + '">' +
          '<h3>' + escapeHtml(p.title) + '</h3>' +
          '<div class="path">' + escapeHtml(p.group) + ' · ' + p.sections.length + ' sections</div>' +
          '<p>' + escapeHtml(lead.slice(0, 200)) + (lead.length > 200 ? '…' : '') + '</p></a>';
      }).join("");
      emptyEl.hidden = pages.length !== 0;
      return;
    }

    var rows = flatten().map(function (row) {
      return { row: row, s: score(row, lower) };
    }).filter(function (x) { return x.s > 0; });
    rows.sort(function (a, b) { return b.s - a.s || a.row.title.localeCompare(b.row.title); });

    var seen = {};
    var picked = [];
    rows.forEach(function (x) {
      var key = x.row.url;
      if (seen[key]) return;
      seen[key] = true;
      picked.push(x.row);
    });
    lastResults = picked.slice(0, 60);

    summaryEl.textContent = lastResults.length + " result" + (lastResults.length === 1 ? "" : "s") +
      ' for “' + q + '”' + (filter === "All" ? "" : " in " + filter) + ".";
    emptyEl.hidden = lastResults.length !== 0;
    resultsEl.innerHTML = lastResults.map(function (row) {
      return '<a class="result" href="' + row.url + '">' +
        '<h3>' + highlight(row.h || row.title, q) + '</h3>' +
        '<div class="path">' + escapeHtml(row.group) + ' · ' + escapeHtml(row.title) + '</div>' +
        '<p>' + highlight(snippet(row.text, q), q) + '</p></a>';
    }).join("");
  }

  function syncUrl() {
    var q = input.value.trim();
    try {
      var url = q ? "search.html?q=" + encodeURIComponent(q) : "search.html";
      window.history.replaceState(null, "", url);
    } catch (e) { /* file:// may disallow history changes */ }
  }

  var timer = null;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { render(); syncUrl(); }, 90);
  });

  document.querySelectorAll("[data-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.toggle("active", b === btn); });
      render();
    });
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      render();
      syncUrl();
    } else if (e.key === "Enter" && lastResults.length) {
      e.preventDefault();
      window.location.href = lastResults[0].url;
    }
  });

  var params = new URLSearchParams(window.location.search);
  if (params.get("q")) input.value = params.get("q");
  render();
  input.focus();
  input.select();
})();
