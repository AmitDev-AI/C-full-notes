/* ============================================================
   C Notes — offline C execution engine
   Uses PicoC (a small C interpreter compiled to WebAssembly).
   The interpreter runs in a Web Worker where possible so that
   runaway programs can be stopped after a timeout.
   ============================================================ */
(function () {
  "use strict";

  var WORKER_URL = "assets/picoc/picoc-worker.js";
  var SCRIPT_URL = "assets/picoc/picoc.js";
  var TIMEOUT_MS = 10000;

  var pageEnginePromise = null;

  function run(code, input, timeoutMs) {
    timeoutMs = timeoutMs || TIMEOUT_MS;
    if (window.Worker) {
      return runInWorker(code, input || "", timeoutMs).catch(function (err) {
        if (err && err.fallback) return runInPage(code, input || "");
        throw err;
      });
    }
    return runInPage(code, input || "");
  }

  function runInWorker(code, input, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var worker;
      try {
        worker = new Worker(WORKER_URL);
      } catch (e) {
        reject({ fallback: true, message: String(e && e.message) });
        return;
      }

      var finished = false;
      var timer = setTimeout(function () {
        if (finished) return;
        finished = true;
        try { worker.terminate(); } catch (e) {}
        resolve({
          stdout: "",
          stderr: "Execution stopped: the program ran for more than " + Math.round(timeoutMs / 1000) +
                  " seconds. Check for an infinite loop.\n",
          timedOut: true,
          engine: "picoc"
        });
      }, timeoutMs);

      worker.onmessage = function (ev) {
        var data = ev.data || {};
        if (finished) return;
        if (data.type === "result") {
          finished = true;
          clearTimeout(timer);
          try { worker.terminate(); } catch (e) {}
          resolve({ stdout: data.stdout || "", stderr: data.stderr || "", engine: "picoc" });
        } else if (data.type === "error") {
          finished = true;
          clearTimeout(timer);
          try { worker.terminate(); } catch (e) {}
          resolve({ stdout: "", stderr: data.message || "Unknown interpreter error.", engine: "picoc" });
        } else if (data.type === "load-error") {
          finished = true;
          clearTimeout(timer);
          try { worker.terminate(); } catch (e) {}
          reject({ fallback: true, message: data.message });
        }
      };

      worker.onerror = function (ev) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { worker.terminate(); } catch (e) {}
        reject({ fallback: true, message: (ev && ev.message) || "Worker failed." });
      };

      worker.postMessage({ type: "run", code: code, input: input });
    });
  }

  function loadPageEngine() {
    if (window.picocjs && window.picocjs.RunWithInput) return Promise.resolve(window.picocjs);
    if (pageEnginePromise) return pageEnginePromise;
    pageEnginePromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = function () {
        if (window.picocjs && window.picocjs.RunWithInput) resolve(window.picocjs);
        else reject(new Error("The PicoC engine did not initialise."));
      };
      script.onerror = function () {
        reject(new Error("Could not load " + SCRIPT_URL + ". Make sure the assets folder is complete."));
      };
      document.head.appendChild(script);
    });
    return pageEnginePromise;
  }

  function runInPage(code, input) {
    return loadPageEngine().then(function (engine) {
      return engine.RunWithInput(code, input).then(function (result) {
        return { stdout: result.stdout || "", stderr: result.stderr || "", engine: "picoc" };
      });
    }).catch(function (err) {
      return {
        stdout: "",
        stderr: "The C engine could not start: " + String(err && (err.message || err)) +
                "\nIf you opened this page directly from disk, try running a local web server instead.\n",
        engine: "picoc"
      };
    });
  }

  window.CNotesCompiler = { run: run };
})();
