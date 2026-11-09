/* PicoC WASM runner.
   Runs in a Web Worker so a runaway program can be terminated. */
var engineLoaded = false;
try {
  importScripts("picoc.js");
  engineLoaded = !!(self.picocjs && self.picocjs.RunWithInput);
} catch (e) {
  engineLoaded = false;
}

self.onmessage = function (e) {
  var data = e.data || {};
  if (data.type !== "run") return;
  if (!engineLoaded) {
    self.postMessage({ type: "load-error", message: "The PicoC engine could not be loaded." });
    return;
  }
  self.picocjs.RunWithInput(data.code, data.input || "").then(function (result) {
    self.postMessage({
      type: "result",
      stdout: result.stdout || "",
      stderr: result.stderr || ""
    });
  }).catch(function (err) {
    self.postMessage({
      type: "error",
      message: String(err && (err.message || err))
    });
  });
};
