/* C Notes service worker — offline cache for http/https.
   Bump CACHE_VERSION after changing any cached file. */
"use strict";

const CACHE_VERSION = "cnotes-v4";

const CORE = [
  "./",
  "./index.html",
  "./c-intro.html",
  "./c-setup.html",
  "./c-syntax.html",
  "./c-output.html",
  "./c-comments.html",
  "./c-variables.html",
  "./c-datatypes.html",
  "./c-constants.html",
  "./c-operators.html",
  "./c-conditions.html",
  "./c-switch.html",
  "./c-loops.html",
  "./c-arrays.html",
  "./c-strings.html",
  "./c-input.html",
  "./c-functions.html",
  "./c-pointers.html",
  "./c-structures.html",
  "./c-unions-enums.html",
  "./c-files.html",
  "./c-memory.html",
  "./c-preprocessor.html",
  "./c-reference.html",
  "./c-examples.html",
  "./c-quiz.html",
  "./c-exercises.html",
  "./c-cheatsheet.html",
  "./c-glossary.html",
  "./c-certificate.html",
  "./tryit.html",
  "./search.html",
  "./bookmarks.html",
  "./404.html",
  "./manifest.webmanifest",
  "./assets/style.css",
  "./assets/app.js",
  "./assets/tryit.js",
  "./assets/compiler.js",
  "./assets/quiz.js",
  "./assets/glossary.js",
  "./assets/certificate.js",
  "./assets/bookmarks.js",
  "./assets/search.js",
  "./assets/search-index.js",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/picoc/picoc.js",
  "./assets/picoc/picoc-worker.js",
  "./assets/picoc/NOTICE.md",
  "./assets/picoc/LICENSE"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE)).catch(err => {
      console.warn("C Notes: precache incomplete", err);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const cacheFirst = /\/assets\/picoc\/|\/assets\/icon-|\.(png|jpg|jpeg|svg|webp|woff2?)$/i.test(url.pathname);

  if (cacheFirst) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetchAndCache(request))
    );
    return;
  }

  /* Pages, scripts and styles: network first so edits appear immediately;
     fall back to the cache when offline. */
  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => {
      return caches.match(request).then(cached => {
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("./404.html");
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});

function fetchAndCache(request) {
  return fetch(request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => new Response("Offline", { status: 503, statusText: "Offline" }));
}
