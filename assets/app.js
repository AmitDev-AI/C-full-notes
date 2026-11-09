/* ============================================================
   C Notes — shared app script
   Builds the top bar, sidebar, on-this-page TOC and pager.
   Everything works from file:// with no network access.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Tutorial navigation (single source of truth) ---------- */
  var NAV = [
    { title: "C Tutorial", items: [
      ["index.html", "C HOME"],
      ["c-intro.html", "C Introduction"],
      ["c-setup.html", "C Get Started"],
      ["c-syntax.html", "C Syntax"],
      ["c-output.html", "C Output"],
      ["c-comments.html", "C Comments"],
      ["c-variables.html", "C Variables"],
      ["c-datatypes.html", "C Data Types"],
      ["c-constants.html", "C Constants"],
      ["c-operators.html", "C Operators"],
      ["c-conditions.html", "C If...Else"],
      ["c-switch.html", "C Switch"],
      ["c-loops.html", "C Loops"],
      ["c-arrays.html", "C Arrays"],
      ["c-strings.html", "C Strings"],
      ["c-input.html", "C User Input"]
    ]},
    { title: "C Advanced", items: [
      ["c-functions.html", "C Functions"],
      ["c-pointers.html", "C Pointers"],
      ["c-structures.html", "C Structures"],
      ["c-unions-enums.html", "C Unions & Enums"],
      ["c-files.html", "C File Handling"],
      ["c-memory.html", "C Memory"],
      ["c-preprocessor.html", "C Preprocessor"]
    ]},
    { title: "Practice", items: [
      ["c-exercises.html", "C Exercises"],
      ["c-quiz.html", "C Quiz"],
      ["c-certificate.html", "C Certificate"]
    ]},
    { title: "Reference", items: [
      ["c-reference.html", "C Reference"],
      ["c-cheatsheet.html", "C Cheat Sheet"],
      ["c-glossary.html", "C Glossary"],
      ["c-examples.html", "C Examples"]
    ]},
    { title: "Tools", items: [
      ["tryit.html", "Try It Editor"],
      ["search.html", "Search"],
      ["bookmarks.html", "Bookmarks"]
    ]}
  ];

  var FLAT = [];
  NAV.forEach(function (g) { g.items.forEach(function (it) { FLAT.push(it); }); });
  var TUTORIAL_FILES = [];
  NAV.slice(0, 2).forEach(function (g) {
    g.items.forEach(function (it) {
      if (it[0] !== "index.html") TUTORIAL_FILES.push(it[0]);
    });
  });
  var TUTORIAL_COUNT = TUTORIAL_FILES.length;

  var PAGE = document.body.getAttribute("data-page") || "index.html";
  var pageFile = PAGE;

  /* ---------- Safe storage (file:// friendly) ---------- */
  var mem = {};
  function get(key) {
    try { return window.localStorage.getItem(key); }
    catch (e) { return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null; }
  }
  function set(key, val) {
    try { window.localStorage.setItem(key, val); }
    catch (e) { mem[key] = val; }
  }
  var COMPLETE_KEY = "cnotes.complete.v1";

  function getComplete() {
    try { return JSON.parse(get(COMPLETE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function isComplete(file) { return getComplete().indexOf(file) !== -1; }
  function setComplete(file, done) {
    var list = getComplete();
    var i = list.indexOf(file);
    if (done && i === -1) list.push(file);
    if (!done && i !== -1) list.splice(i, 1);
    set(COMPLETE_KEY, JSON.stringify(list));
    paintComplete();
    updateProgress();
  }

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.textContent = t === "dark" ? "☀️" : "🌙";
      btn.title = t === "dark" ? "Switch to light mode" : "Switch to dark mode";
    }
  }
  var theme = get("cnotes.theme") || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);

  /* ---------- Top bar ---------- */
  var topbar = document.getElementById("topbar");
  if (topbar) {
    topbar.className = "topbar";
    topbar.innerHTML =
      '<button class="icon-btn menu-btn" id="menuBtn" aria-label="Open tutorial menu" aria-expanded="false">☰</button>' +
      '<div class="topbar-left">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark">C</span>' +
          '<span>C Notes<small>Learn C offline</small></span>' +
        '</a>' +
      '</div>' +
      '<div class="topbar-spacer"></div>' +
      '<nav class="topbar-links" aria-label="Site">' +
        '<a href="index.html" class="keep">Tutorial</a>' +
        '<a href="c-reference.html">Reference</a>' +
        '<a href="c-examples.html">Examples</a>' +
        '<a href="c-exercises.html">Practice</a>' +
        '<a href="search.html" title="Search all content (Ctrl+K)">Search</a>' +
        '<div class="bookmark-wrap">' +
          '<button class="icon-btn" id="bookmarkBtn" aria-label="Bookmark this page" aria-expanded="false" title="Bookmark this page (B)">☆</button>' +
          '<div class="bookmark-pop" id="bookmarkPop" hidden></div>' +
        '</div>' +
        '<button class="icon-btn" id="themeToggle" aria-label="Toggle dark mode">🌙</button>' +
      '</nav>';
    applyTheme(document.documentElement.getAttribute("data-theme") || "light");
    document.getElementById("themeToggle").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      set("cnotes.theme", next);
    });
    var menuBtn = document.getElementById("menuBtn");
    menuBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    backdrop.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
    document.body.appendChild(backdrop);
  }

  /* ---------- Sidebar ---------- */
  var sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.className = "sidebar";
    var html =
      '<div class="sidebar-search">' +
        '<span class="search-icon">⌕</span>' +
        '<input id="navSearch" type="search" placeholder="Filter chapters…" aria-label="Filter tutorial chapters" autocomplete="off">' +
      '</div>' +
      '<a class="sidebar-search-all" href="search.html">Search all content →</a>';

    NAV.forEach(function (g, gi) {
      html += '<div class="nav-group" data-group="' + gi + '"><div class="nav-title">' + g.title + "</div>";
      g.items.forEach(function (it) {
        var active = it[0] === pageFile;
        html += '<a class="nav-item' + (active ? " active" : "") + '" href="' + it[0] + '" data-file="' + it[0] + '">' +
                  "<span>" + it[1] + '</span><span class="check" aria-hidden="true">✓</span></a>';
      });
      html += "</div>";
    });
    html += '<div class="nav-empty" id="navEmpty">No chapter matches your search.</div>';
    html += '<div class="sidebar-progress"><div><b id="progressCount">0</b> of ' + TUTORIAL_COUNT + ' chapters complete</div>' +
            '<div class="progress-track"><div class="progress-fill" id="progressFill"></div></div></div>';
    sidebar.innerHTML = html;

    var search = document.getElementById("navSearch");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var any = false;
      NAV.forEach(function (g, gi) {
        var groupEl = sidebar.querySelector('[data-group="' + gi + '"]');
        var groupHit = false;
        groupEl.querySelectorAll(".nav-item").forEach(function (a) {
          var hit = !q || a.textContent.toLowerCase().indexOf(q) !== -1;
          a.classList.toggle("hide", !hit);
          if (hit) { groupHit = true; any = true; }
        });
        groupEl.classList.toggle("hide", !groupHit);
      });
      document.getElementById("navEmpty").style.display = any ? "none" : "block";
    });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { search.value = ""; search.dispatchEvent(new Event("input")); search.blur(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        search.focus();
      }
    });

    sidebar.addEventListener("click", function (e) {
      if (e.target.closest(".nav-item") && window.innerWidth <= 860) {
        document.body.classList.remove("nav-open");
      }
    });
  }

  function paintComplete() {
    var list = getComplete();
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.classList.toggle("done", list.indexOf(a.getAttribute("data-file")) !== -1);
    });
  }
  function updateProgress() {
    var list = getComplete().filter(function (f) {
      return TUTORIAL_FILES.indexOf(f) !== -1;
    });
    var pct = Math.round((list.length / TUTORIAL_COUNT) * 100);
    var count = document.getElementById("progressCount");
    var fill = document.getElementById("progressFill");
    if (count) count.textContent = list.length;
    if (fill) fill.style.width = pct + "%";
    var homeBar = document.getElementById("homeProgressFill");
    var homeNum = document.getElementById("homeProgressNum");
    var homePct = document.getElementById("homeProgressPct");
    if (homeBar) homeBar.style.width = pct + "%";
    if (homeNum) homeNum.textContent = list.length;
    if (homePct) homePct.textContent = pct + "% complete";
  }
  paintComplete();
  updateProgress();

  /* ---------- On this page TOC ---------- */
  var toc = document.getElementById("toc");
  var article = document.querySelector("main.content");
  if (toc && article) {
    var heads = article.querySelectorAll("h2");
    if (heads.length >= 2) {
      var links = [];
      heads.forEach(function (h, i) {
        if (!h.id) {
          h.id = (h.textContent || "section").toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section-" + i;
        }
        links.push('<a href="#' + h.id + '" class="' + (h.tagName === "H3" ? "sub" : "") + '" data-target="' + h.id + '">' + h.textContent + "</a>");
      });
      toc.innerHTML = "<h4>On this page</h4>" + links.join("");
      if (window.location.hash) {
        var hashTarget = document.getElementById(window.location.hash.slice(1));
        if (hashTarget) setTimeout(function () { hashTarget.scrollIntoView(); }, 0);
      }
      if ("IntersectionObserver" in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              toc.querySelectorAll("a").forEach(function (a) { a.classList.toggle("active", a.dataset.target === en.target.id); });
            }
          });
        }, { rootMargin: "-80px 0px -70% 0px" });
        heads.forEach(function (h) { obs.observe(h); });
      }
    }
  }

  /* ---------- Code boxes: copy + try it ---------- */
  function codeText(box) {
    var code = box.querySelector("pre code") || box.querySelector("pre");
    return code ? code.textContent : "";
  }
  function expectedOutput(box) {
    var next = box.nextElementSibling;
    while (next && !next.classList.contains("output") && !next.classList.contains("codebox")) {
      next = next.nextElementSibling;
    }
    if (next && next.classList.contains("output")) {
      var pre = next.querySelector("pre");
      return pre ? pre.textContent : "";
    }
    return "";
  }
  document.addEventListener("click", function (e) {
    var tryBtn = e.target.closest("[data-action='try']");
    if (tryBtn) {
      var box = tryBtn.closest(".codebox");
      var payload = { code: codeText(box), output: expectedOutput(box), title: tryBtn.getAttribute("data-title") || "main.c" };
      try {
        window.sessionStorage.setItem("cnotes.tryit", JSON.stringify(payload));
      } catch (err) {
        var q = "tryit.html?code=" + encodeURIComponent(payload.code);
        window.location.href = q;
        return;
      }
      window.location.href = "tryit.html";
      return;
    }
    var copyBtn = e.target.closest("[data-action='copy']");
    if (copyBtn) {
      var cbox = copyBtn.closest(".codebox");
      var text = codeText(cbox);
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = old; }, 1200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text); done();
      }
    }
  });
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- Build code box headers automatically ---------- */
  document.querySelectorAll(".codebox").forEach(function (box) {
    if (box.querySelector(".codebox-head")) return;
    var name = box.getAttribute("data-file") || "main.c";
    var head = document.createElement("div");
    head.className = "codebox-head";
    head.innerHTML =
      '<span class="dots"><span class="dot"></span><span class="dot y"></span><span class="dot g"></span></span>' +
      '<span class="filename">' + name + "</span><span class=\"spacer\"></span>" +
      '<span class="codebox-actions">' +
        '<button type="button" data-action="copy">Copy</button>' +
        '<button type="button" class="trybtn" data-action="try">Try it »</button>' +
      "</span>";
    box.insertBefore(head, box.firstChild);
  });

  /* ---------- Simple syntax colouring (display only) ---------- */
  var KEYWORDS = ["auto","break","case","const","continue","default","do","else","enum","extern","for","goto","if","register","return","sizeof","static","struct","switch","typedef","union","volatile","while","inline","restrict","_Bool"];
  var TYPES = ["char","double","float","int","long","short","signed","unsigned","void","size_t","FILE","bool","int8_t","int16_t","int32_t","int64_t","uint8_t","uint16_t","uint32_t","uint64_t"];
  try {
    document.querySelectorAll(".codebox pre code").forEach(function (codeEl) {
      if (codeEl.querySelector(".tok-key")) return;
      var src = codeEl.textContent;
      var esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
      var out = "";
      var i = 0;
      while (i < src.length) {
        var ch = src[i], next = src[i + 1];
        if (ch === "/" && next === "/") {
          var end = src.indexOf("\n", i);
          if (end === -1) end = src.length;
          out += '<span class="tok-com">' + esc(src.slice(i, end)) + "</span>";
          i = end;
        } else if (ch === "/" && next === "*") {
          var e2 = src.indexOf("*/", i + 2);
          e2 = e2 === -1 ? src.length : e2 + 2;
          out += '<span class="tok-com">' + esc(src.slice(i, e2)) + "</span>";
          i = e2;
        } else if (ch === '"' || ch === "'") {
          var quote = ch, j = i + 1;
          while (j < src.length) {
            if (src[j] === "\\") j += 2;
            else if (src[j] === quote) { j++; break; }
            else j++;
          }
          out += '<span class="tok-str">' + esc(src.slice(i, j)) + "</span>";
          i = j;
        } else if (ch === "#" && (i === 0 || /\n\s*$/.test(src.slice(Math.max(0, i - 30), i)))) {
          var le = src.indexOf("\n", i);
          if (le === -1) le = src.length;
          out += '<span class="tok-pre">' + esc(src.slice(i, le)) + "</span>";
          i = le;
        } else if (/[A-Za-z_]/.test(ch)) {
          var k = i + 1;
          while (k < src.length && /[A-Za-z0-9_]/.test(src[k])) k++;
          var word = src.slice(i, k);
          if (KEYWORDS.indexOf(word) !== -1) out += '<span class="tok-key">' + word + "</span>";
          else if (TYPES.indexOf(word) !== -1) out += '<span class="tok-type">' + word + "</span>";
          else out += esc(word);
          i = k;
        } else if (/[0-9]/.test(ch)) {
          var n = i + 1;
          while (n < src.length && /[0-9a-fA-FxX.]/.test(src[n])) n++;
          out += '<span class="tok-num">' + src.slice(i, n) + "</span>";
          i = n;
        } else {
          out += esc(ch);
          i++;
        }
      }
      codeEl.innerHTML = out;
    });
  } catch (e) { /* colouring is optional */ }

  /* ---------- Complete button ---------- */
  if (article && TUTORIAL_FILES.indexOf(pageFile) !== -1) {
    var pager = document.getElementById("pager");
    if (!pager) {
      pager = document.createElement("div");
      pager.id = "pager";
      pager.className = "pager";
      article.appendChild(pager);
    }
    var box = document.createElement("div");
    box.className = "complete-box";
    var done = isComplete(pageFile);
    box.innerHTML =
      '<p>Finished this chapter? Mark it complete to track your progress. Your progress stays in this browser.</p>' +
      '<button class="btn complete' + (done ? " is-done" : "") + '" id="completeBtn">' +
        (done ? "✓ Completed" : "Mark as complete") + "</button>";
    if (pager && pager.parentNode) pager.parentNode.insertBefore(box, pager);
    else article.appendChild(box);
    box.querySelector("#completeBtn").addEventListener("click", function () {
      var now = !isComplete(pageFile);
      setComplete(pageFile, now);
      this.classList.toggle("is-done", now);
      this.textContent = now ? "✓ Completed" : "Mark as complete";
    });
  }

  /* ---------- Previous / next pager ---------- */
  if (pagerEl()) {
    var idx = FLAT.findIndex(function (it) { return it[0] === pageFile; });
    if (idx !== -1) {
      var prev = FLAT[idx - 1], next = FLAT[idx + 1];
      var phtml = "";
      if (prev) phtml += '<a class="prev" href="' + prev[0] + '"><span class="dir">← Previous</span><span class="ttl">' + prev[1] + "</span></a>";
      else phtml += "<span></span>";
      if (next) phtml += '<a class="next" href="' + next[0] + '"><span class="dir">Next →</span><span class="ttl">' + next[1] + "</span></a>";
      pagerEl().innerHTML = phtml;
    }
  }
  function pagerEl() { return document.getElementById("pager"); }

  /* ---------- Footer ---------- */
  var foot = document.getElementById("footer");
  if (foot) {
    foot.className = "site-footer";
    foot.innerHTML =
      '<div><b>C Notes</b> — a free, offline C tutorial.</div>' +
      '<div style="margin-top:6px">Works without an internet connection. No account, no tracking, no ads.</div>' +
      '<div style="margin-top:10px"><a href="index.html">Home</a> · <a href="c-cheatsheet.html">Cheat Sheet</a> · <a href="c-reference.html">Reference</a> · <a href="c-examples.html">Examples</a> · <a href="c-exercises.html">Exercises</a> · <a href="c-quiz.html">Quiz</a> · <a href="c-glossary.html">Glossary</a> · <a href="c-certificate.html">Certificate</a> · <a href="tryit.html">Editor</a> · <a href="search.html">Search</a> · <a href="bookmarks.html">Bookmarks</a></div>' +
      '<div style="margin-top:10px"><button type="button" class="linklike" data-shortcuts>Keyboard shortcuts</button></div>' +
      '<div style="margin-top:12px" class="small">C is a general-purpose programming language created by Dennis Ritchie at Bell Labs in 1972.</div>';
  }

  /* ============================================================
     Extra site features: bookmarks, shortcuts, reading time,
     back-to-top, exercise tracking, print and PWA registration.
     ============================================================ */

  function titleFor(file) {
    for (var i = 0; i < FLAT.length; i++) {
      if (FLAT[i][0] === file) return FLAT[i][1];
    }
    return (document.title || "C Notes").split("—")[0].trim();
  }

  /* ---------- Bookmarks ---------- */
  var BM_KEY = "cnotes.bookmarks.v1";
  function getBookmarks() {
    try {
      var list = JSON.parse(get(BM_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveBookmarks(list) { set(BM_KEY, JSON.stringify(list)); }
  function isBookmarked(file) {
    return getBookmarks().some(function (b) { return b.file === file; });
  }
  function notifyBookmarks() {
    document.dispatchEvent(new CustomEvent("cnotes:bookmarks"));
  }
  document.addEventListener("cnotes:bookmarks", function () {
    paintBookmark();
    renderBookmarkPop();
  });
  function removeBookmark(file) {
    saveBookmarks(getBookmarks().filter(function (b) { return b.file !== file; }));
    paintBookmark();
    renderBookmarkPop();
    notifyBookmarks();
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function renderBookmarkPop() {
    var pop = document.getElementById("bookmarkPop");
    if (!pop) return;
    var list = getBookmarks();
    if (!list.length) {
      pop.innerHTML = '<p class="bm-empty">No bookmarks yet.<br>Press <kbd>B</kbd> on any page.</p>';
      return;
    }
    pop.innerHTML = '<div class="bm-head">Bookmarks</div>' + list.map(function (b) {
      return '<div class="bm-row"><a href="' + b.file + '">' + escapeHtml(b.title) + '</a>' +
             '<button type="button" class="bm-remove" data-remove="' + escapeHtml(b.file) + '" aria-label="Remove bookmark">×</button></div>';
    }).join("") + '<a class="bm-all" href="bookmarks.html">Manage bookmarks →</a>';
  }
  function paintBookmark() {
    var btn = document.getElementById("bookmarkBtn");
    if (!btn) return;
    var on = isBookmarked(pageFile);
    btn.textContent = on ? "★" : "☆";
    btn.classList.toggle("is-on", on);
    btn.title = on ? "Remove bookmark (B)" : "Bookmark this page (B)";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function toggleBookmark() {
    var list = getBookmarks();
    var i = -1;
    for (var k = 0; k < list.length; k++) { if (list[k].file === pageFile) { i = k; break; } }
    if (i === -1) list.push({ file: pageFile, title: titleFor(pageFile) });
    else list.splice(i, 1);
    saveBookmarks(list);
    paintBookmark();
    renderBookmarkPop();
    notifyBookmarks();
  }
  var bookmarkBtn = document.getElementById("bookmarkBtn");
  var bookmarkPop = document.getElementById("bookmarkPop");
  if (bookmarkBtn) {
    paintBookmark();
    renderBookmarkPop();
    bookmarkBtn.addEventListener("click", toggleBookmark);
    var bmWrap = bookmarkBtn.closest(".bookmark-wrap");
    if (bmWrap && bookmarkPop) {
      bmWrap.addEventListener("mouseenter", function () {
        renderBookmarkPop();
        bookmarkPop.hidden = false;
        bookmarkBtn.setAttribute("aria-expanded", "true");
      });
      bmWrap.addEventListener("mouseleave", function () {
        bookmarkPop.hidden = true;
        bookmarkBtn.setAttribute("aria-expanded", "false");
      });
      bookmarkPop.addEventListener("click", function (e) {
        var rm = e.target.closest("[data-remove]");
        if (rm) { e.preventDefault(); removeBookmark(rm.getAttribute("data-remove")); }
      });
    }
    document.addEventListener("click", function (e) {
      if (bookmarkPop && !bookmarkPop.hidden && !e.target.closest(".bookmark-wrap")) {
        bookmarkPop.hidden = true;
        bookmarkBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Keyboard shortcuts ---------- */
  var scModal = document.createElement("div");
  scModal.className = "modal-backdrop";
  scModal.id = "shortcutModal";
  scModal.hidden = true;
  scModal.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="scTitle">' +
      '<button type="button" class="modal-close" data-close-modal aria-label="Close">×</button>' +
      '<h2 id="scTitle">Keyboard shortcuts</h2>' +
      '<table class="shortcut-table">' +
        '<tr><td><kbd>/</kbd></td><td>Filter the chapter list</td></tr>' +
        '<tr><td><kbd>Ctrl</kbd> + <kbd>K</kbd></td><td>Search all content</td></tr>' +
        '<tr><td><kbd>B</kbd></td><td>Bookmark this page</td></tr>' +
        '<tr><td><kbd>T</kbd></td><td>Toggle dark / light theme</td></tr>' +
        '<tr><td><kbd>?</kbd></td><td>Open this help</td></tr>' +
        '<tr><td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td><td>Run code in the editor</td></tr>' +
        '<tr><td><kbd>Esc</kbd></td><td>Close a dialog or menu</td></tr>' +
      '</table>' +
    '</div>';
  document.body.appendChild(scModal);
  function openShortcuts() { scModal.hidden = false; }
  function closeShortcuts() { scModal.hidden = true; }
  scModal.addEventListener("click", function (e) {
    if (e.target === scModal || e.target.closest("[data-close-modal]")) closeShortcuts();
  });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-shortcuts]")) { e.preventDefault(); openShortcuts(); }
  });

  document.addEventListener("keydown", function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || document.activeElement.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      window.location.href = "search.html";
      return;
    }
    if (e.key === "Escape") { closeShortcuts(); if (bookmarkPop) bookmarkPop.hidden = true; return; }
    if (typing) return;
    if (e.key === "?") { e.preventDefault(); openShortcuts(); }
    else if (e.key === "b" || e.key === "B") { e.preventDefault(); toggleBookmark(); }
    else if (e.key === "t" || e.key === "T") {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      set("cnotes.theme", next);
    } else if (e.key === "/" && !sidebar) {
      e.preventDefault();
      window.location.href = "search.html";
    }
  });

  /* ---------- Reading time ---------- */
  if (article && TUTORIAL_FILES.indexOf(pageFile) !== -1 && !article.querySelector(".page-meta")) {
    var h1 = article.querySelector("h1");
    if (h1) {
      var words = (article.textContent || "").trim().split(/\s+/).length;
      var minutes = Math.max(1, Math.round(words / 200));
      var level = NAV[1].items.some(function (it) { return it[0] === pageFile; }) ? "Advanced" : "Tutorial";
      var meta = document.createElement("p");
      meta.className = "page-meta";
      meta.innerHTML = "<span>≈ " + minutes + " min read</span><span>·</span><span>" + level + "</span>";
      h1.insertAdjacentElement("afterend", meta);
    }
  }

  /* ---------- Back to top ---------- */
  var backTop = document.createElement("button");
  backTop.type = "button";
  backTop.className = "back-top";
  backTop.setAttribute("aria-label", "Back to top");
  backTop.textContent = "↑";
  document.body.appendChild(backTop);
  backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  window.addEventListener("scroll", function () {
    backTop.classList.toggle("show", window.scrollY > 450);
  }, { passive: true });

  /* ---------- Exercise progress ---------- */
  var EX_KEY = "cnotes.exercises.v1";
  function getExercises() {
    try { return JSON.parse(get(EX_KEY) || "[]"); } catch (e) { return []; }
  }
  function paintExercises() {
    var boxes = document.querySelectorAll("[data-exercise-id]");
    if (!boxes.length) return;
    var done = getExercises();
    var count = 0;
    boxes.forEach(function (box) {
      var on = done.indexOf(box.getAttribute("data-exercise-id")) !== -1;
      box.checked = on;
      if (on) count++;
    });
    var label = document.getElementById("exProgress");
    if (label) label.textContent = count + " of " + boxes.length + " solved";
    var fill = document.getElementById("exProgressFill");
    if (fill) fill.style.width = Math.round((count / boxes.length) * 100) + "%";
  }
  document.querySelectorAll("[data-exercise-id]").forEach(function (box) {
    box.addEventListener("change", function () {
      var id = box.getAttribute("data-exercise-id");
      var list = getExercises();
      var i = list.indexOf(id);
      if (box.checked && i === -1) list.push(id);
      if (!box.checked && i !== -1) list.splice(i, 1);
      set(EX_KEY, JSON.stringify(list));
      paintExercises();
    });
  });
  paintExercises();

  /* ---------- Print buttons ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-print]")) { e.preventDefault(); window.print(); }
  });

  /* ---------- Reset progress ---------- */
  function resetProgress() {
    if (!window.confirm("Reset all saved progress?\n\nThis clears completed chapters, your best quiz score, solved exercises and the certificate. Bookmarks are kept.")) return;
    try {
      window.localStorage.removeItem(COMPLETE_KEY);
      window.localStorage.removeItem("cnotes.quiz.best");
      window.localStorage.removeItem(EX_KEY);
    } catch (e) {
      mem[COMPLETE_KEY] = "[]";
      mem["cnotes.quiz.best"] = null;
      mem[EX_KEY] = "[]";
    }
    paintComplete();
    updateProgress();
    paintExercises();
    document.dispatchEvent(new CustomEvent("cnotes:progress"));
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-reset-progress]")) { e.preventDefault(); resetProgress(); }
  });

  /* ---------- Service worker (works over http/https only) ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) {
        /* Ask for an update on every visit so a CACHE_VERSION bump is picked up. */
        if (reg && reg.update) reg.update().catch(function () {});
      }).catch(function () { /* service workers need http(s); file:// still works */ });
    });
  }

  /* ---------- Public helpers for page-specific scripts ---------- */
  window.CNotes = {
    getComplete: getComplete,
    tutorialFiles: TUTORIAL_FILES,
    tutorialCount: TUTORIAL_COUNT,
    getBookmarks: getBookmarks,
    removeBookmark: removeBookmark,
    getExercises: getExercises,
    resetProgress: resetProgress,
    titleFor: titleFor
  };
})();
