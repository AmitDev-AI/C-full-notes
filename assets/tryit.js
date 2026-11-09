/* ============================================================
   C Notes — Try It editor
   Real offline C execution through PicoC (WebAssembly),
   with line numbers, stdin, file open/save and sample output.
   ============================================================ */
(function () {
  "use strict";

  var DEFAULT_CODE =
    '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n';
  var DEFAULT_OUT = "Hello, World!\n";

  var editor = document.getElementById("editor");
  if (!editor) return;

  var statusEl = document.getElementById("editorStatus");
  var outputEl = document.getElementById("editorOutput");
  var badgeEl = document.getElementById("outputBadge");
  var fileEl = document.getElementById("editorFile");
  var lineEl = document.getElementById("lineNumbers");
  var stdinEl = document.getElementById("stdin");
  var runBtn = document.getElementById("runBtn");
  var runBtn2 = document.getElementById("runBtn2");
  var sampleBtn = document.getElementById("sampleBtn");

  var sampleCode = DEFAULT_CODE;
  var sampleOut = DEFAULT_OUT;
  var sampleTitle = "main.c";
  var running = false;

  /* ---------- Load a sample handed over by a "Try it" button ---------- */
  var loaded = false;
  try {
    var raw = window.sessionStorage.getItem("cnotes.tryit");
    if (raw) {
      var payload = JSON.parse(raw);
      if (payload && typeof payload.code === "string") {
        sampleCode = payload.code;
        sampleOut = typeof payload.output === "string" ? payload.output : "";
        sampleTitle = payload.title || "main.c";
        loaded = true;
      }
    }
  } catch (e) {}

  if (!loaded) {
    var params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      sampleCode = params.get("code");
      sampleOut = "";
    }
  }

  /* Restore an unfinished draft only when there is no explicit sample. */
  var draft = null;
  if (!loaded) {
    try { draft = window.localStorage.getItem("cnotes.tryit.draft"); } catch (e) {}
  }

  editor.value = draft || sampleCode;
  if (fileEl) fileEl.textContent = loaded ? sampleTitle : "main.c";
  renderLineNumbers();

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function setBadge(text) {
    if (badgeEl) badgeEl.textContent = text;
  }

  function setBusy(busy) {
    running = busy;
    [runBtn, runBtn2].forEach(function (btn) {
      if (!btn) return;
      btn.disabled = busy;
      btn.textContent = busy ? "Running…" : "▶ Run";
    });
  }

  function renderLineNumbers() {
    if (!lineEl) return;
    var count = editor.value.split("\n").length;
    var out = "";
    for (var i = 1; i <= count; i++) out += i + (i === count ? "" : "\n");
    lineEl.textContent = out;
    lineEl.scrollTop = editor.scrollTop;
  }

  function showSample() {
    var text = sampleOut;
    if (!text) {
      text = "/* No documented output was included with this sample.\n" +
             "   Press Run to execute the code with the built-in C engine. */";
    }
    outputEl.textContent = text;
    setBadge("sample output");
    setStatus("Showing the documented output. Press Run for real output.");
  }

  function combineOutput(result) {
    var out = result.stdout || "";
    var err = result.stderr || "";
    if (out && err) return out + (/\n$/.test(out) ? "" : "\n") + err;
    return out || err;
  }

  function run() {
    if (running) return;
    if (!editor.value.trim()) {
      setStatus("Write some C code first.");
      editor.focus();
      return;
    }
    if (!window.CNotesCompiler) {
      outputEl.textContent = "The C engine script did not load. Check that assets/compiler.js exists.";
      setBadge("error");
      return;
    }

    var started = Date.now();
    setBusy(true);
    setBadge("running…");
    outputEl.textContent = "Starting the PicoC engine…\n\nThe first run loads about 1.2 MB of WebAssembly from the local assets folder.";
    setStatus("Compiling and running…");

    window.CNotesCompiler.run(editor.value, stdinEl ? stdinEl.value : "", 10000)
      .then(function (result) {
        var text = combineOutput(result);
        if (!text) text = "(The program produced no output.)";
        outputEl.textContent = text;
        if (result.timedOut) {
          setBadge("stopped");
          setStatus("Stopped after 10 seconds — check for an infinite loop.");
        } else {
          setBadge("real output · PicoC");
          setStatus("Finished in " + ((Date.now() - started) / 1000).toFixed(2) + " s.");
        }
      })
      .catch(function (err) {
        outputEl.textContent = "Engine error: " + String(err && (err.message || err));
        setBadge("error");
        setStatus("The engine could not run this program.");
      })
      .then(function () { setBusy(false); });
  }

  if (runBtn) runBtn.addEventListener("click", run);
  if (runBtn2) runBtn2.addEventListener("click", run);
  if (sampleBtn) sampleBtn.addEventListener("click", showSample);

  editor.addEventListener("input", function () {
    renderLineNumbers();
    setStatus("Editing… press Run to execute.");
    try { window.localStorage.setItem("cnotes.tryit.draft", editor.value); } catch (e) {}
  });

  editor.addEventListener("scroll", function () {
    if (lineEl) lineEl.scrollTop = editor.scrollTop;
  });

  editor.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      var start = this.selectionStart, end = this.selectionEnd;
      this.value = this.value.slice(0, start) + "    " + this.value.slice(end);
      this.selectionStart = this.selectionEnd = start + 4;
      renderLineNumbers();
      try { window.localStorage.setItem("cnotes.tryit.draft", this.value); } catch (err) {}
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });

  /* ---------- Open a local .c file ---------- */
  var openBtn = document.getElementById("openBtn");
  var openFile = document.getElementById("openFile");
  if (openBtn && openFile) {
    openBtn.addEventListener("click", function () { openFile.click(); });
    openFile.addEventListener("change", function () {
      var file = openFile.files && openFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        editor.value = String(reader.result || "");
        sampleCode = editor.value;
        sampleOut = "";
        if (fileEl) fileEl.textContent = file.name;
        renderLineNumbers();
        showSample();
        setStatus('Opened "' + file.name + '". Press Run to execute.');
        try { window.localStorage.setItem("cnotes.tryit.draft", editor.value); } catch (e) {}
      };
      reader.onerror = function () { setStatus("Could not read that file."); };
      reader.readAsText(file);
      openFile.value = "";
    });
  }

  /* ---------- Copy ---------- */
  var copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var done = function () {
      copyBtn.textContent = "Copied!";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(editor.value).then(done, function () { fallback(); done(); });
    } else { fallback(); done(); }
    function fallback() {
      editor.select();
      try { document.execCommand("copy"); } catch (e) {}
      editor.setSelectionRange(editor.value.length, editor.value.length);
    }
  });

  /* ---------- Reset ---------- */
  var resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    editor.value = sampleCode;
    try { window.localStorage.removeItem("cnotes.tryit.draft"); } catch (e) {}
    renderLineNumbers();
    showSample();
    setStatus("Sample restored.");
    editor.focus();
  });

  /* ---------- Download ---------- */
  var downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) downloadBtn.addEventListener("click", function () {
    var blob = new Blob([editor.value], { type: "text/x-csrc" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (fileEl && fileEl.textContent) || "main.c";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  showSample();
  if (draft) setStatus("Restored your last draft. Press Reset to return to the sample.");
})();
