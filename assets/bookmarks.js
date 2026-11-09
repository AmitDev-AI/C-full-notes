/* C Notes — bookmarks page */
(function () {
  "use strict";
  if (!window.CNotes) return;
  var listEl = document.getElementById("bookmarkList");
  var emptyEl = document.getElementById("bookmarkEmpty");
  var clearBtn = document.getElementById("clearBookmarks");
  if (!listEl) return;

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function render() {
    var list = window.CNotes.getBookmarks();
    listEl.innerHTML = list.map(function (b) {
      return '<div class="bookmark-item">' +
        '<div style="flex:1"><a href="' + escapeHtml(b.file) + '">' + escapeHtml(b.title) + '</a>' +
        '<div class="small">' + escapeHtml(b.file) + '</div></div>' +
        '<button type="button" class="btn ghost" data-remove="' + escapeHtml(b.file) + '">Remove</button>' +
        '</div>';
    }).join("");
    emptyEl.hidden = list.length !== 0;
    if (clearBtn) clearBtn.hidden = list.length === 0;
  }

  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (!btn) return;
    window.CNotes.removeBookmark(btn.getAttribute("data-remove"));
    render();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (!window.confirm("Remove all bookmarks?")) return;
      try { window.localStorage.removeItem("cnotes.bookmarks.v1"); } catch (e) {}
      document.dispatchEvent(new CustomEvent("cnotes:bookmarks"));
    });
  }

  document.addEventListener("cnotes:bookmarks", render);
  render();
})();
