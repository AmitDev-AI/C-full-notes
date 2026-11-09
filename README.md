# C Notes — offline C tutorial

[![Open the live site](https://img.shields.io/badge/%E2%96%B6%20Open%20the%20live%20site-amitdev--ai.github.io%2FC--full--notes-1f6feb?style=for-the-badge)](https://amitdev-ai.github.io/C-full-notes/)

A free, W3Schools-style C programming tutorial built from plain HTML, CSS, JavaScript and
WebAssembly. It works entirely offline: no CDNs, no web fonts, no analytics, no account, and
nothing is sent to a server.

## Open the site

### 🌐 Open online — one click

**https://amitdev-ai.github.io/C-full-notes/**

No download, install or account is needed. The site is hosted on GitHub Pages and runs
entirely in the browser, including the real C editor.

### 📲 Install it as an app (works offline)

Open the live link in Chrome, Edge, Brave or another Chromium browser, then use the install
button in the address bar (or **⋮ → Install app** / **Apps → Install this site as an app**).
The site is cached by a service worker after the first visit, so the app keeps working with
no internet connection.

On Android, use **Chrome → ⋮ → Add to Home screen**. On iPhone/iPad, use **Safari →
Share → Add to Home Screen** (offline caching support varies by iOS version).

### 💾 Open the local copy

Double-click **`index.html`**. That is all you need — no installation. Everything except
service-worker installation works directly from the filesystem.

Optionally, serve the folder over HTTP. This is recommended if you want the service worker
(offline app install) to register, because browsers only allow service workers on
`http://`, `https://` or `localhost`:

```sh
# from this folder, any static server works
npx serve .
# or
python -m http.server 8000
```

## What is included

| Section | Pages |
|---|---|
| C Tutorial | Home, Introduction, Get Started, Syntax, Output, Comments, Variables, Data Types, Constants, Operators, If...Else, Switch, Loops, Arrays, Strings, User Input |
| C Advanced | Functions, Pointers, Structures, Unions & Enums, File Handling, Memory, Preprocessor |
| Practice | Exercises, Quiz, Certificate |
| Reference | Reference, Cheat Sheet, Glossary, Examples |
| Tools | Try It Editor, Search, Bookmarks |

There are 34 HTML pages in total. The progress counter tracks **22 tutorial chapters**
(`index.html` is the landing page and is not counted).

### Features

- **Real C execution.** The Try It editor runs C in the browser with
  [PicoC](https://github.com/jpoirier/picoc) compiled to WebAssembly. It supports
  `printf`, `scanf` with a stdin box, arrays, strings, pointers, structs, unions, enums,
  recursion, `malloc`/`free`, `switch`, maths and most of the standard library.
- **Runaway protection.** Programs run in a Web Worker and are stopped after 10 seconds;
  a main-thread fallback is used where workers are unavailable.
- **Editor extras.** Line numbers, draft autosave, open a local `.c` file, copy, download,
  reset, sample output, and `Ctrl`/`⌘` + `Enter` to run.
- **Navigation.** Sidebar chapter filter, auto-generated “On this page” contents, previous
  and next pager, and breadcrumbs.
- **Full-text search.** A generated static index covers every page and section. Press
  `Ctrl`/`⌘` + `K` anywhere to open it. No server needed.
- **Practice.** 18 graded exercises with solutions and saved ticks, plus a 15-question quiz
  that remembers your best score.
- **Certificate.** Unlocks when every chapter is complete and the quiz score is at least
  70%; printable and works fully in the browser.
- **Bookmarks.** Star any page with the top-bar button or `B`; manage them on
  `bookmarks.html`.
- **Progress tracking.** Completed chapters, exercise ticks, quiz best score and certificate
  name are stored in `localStorage`.
- **Comfort features.** Light/dark theme, keyboard shortcuts (`?`), reading-time estimate,
  back-to-top button, print styles, and responsive/mobile layout.
- **Installable app.** `manifest.webmanifest`, PNG/SVG icons and `sw.js` make the site
  installable and cacheable when served over HTTP(S).

## Important limitation: PicoC is an interpreter, not a full compiler

PicoC implements a practical subset of C89/C99. It does **not** support every valid C
construct. Known gaps include:

- aggregate initialisers for structs (`struct Point p = {3, 4};`), although assigning fields
  individually works;
- some complex macros and preprocessor tricks;
- variable-length arrays (VLAs);
- some compiler-specific extensions.

For full standard C, compile with GCC, Clang or MSVC:

```sh
gcc main.c -o main
./main        # Linux / macOS
main.exe      # Windows
```

The tutorial notes the difference where it matters. The interpreter is good enough for
learning: all core tutorial examples are expected to run, and the editor will report a
PicoC error rather than silently pretending.

### PicoC attribution

`assets/picoc/picoc.js` is the browser bundle of **picoc-web 1.1.0**, which packages PicoC
as WebAssembly. See `assets/picoc/NOTICE.md`; the BSD 3-Clause licence is in
`assets/picoc/LICENSE` with additional notices in `assets/picoc/LICENSE.h`.

## File map

```text
W3/
├─ index.html                 Home / landing page
├─ c-*.html                   Tutorial, advanced, practice and reference pages
├─ tryit.html                 Try It editor
├─ search.html                Full-text search
├─ bookmarks.html             Saved pages
├─ 404.html                   Not-found page
├─ manifest.webmanifest       PWA metadata
├─ sw.js                      Service worker (offline cache)
├─ assets/
│  ├─ style.css               All styling, themes, responsive and print rules
│  ├─ app.js                  Navigation, TOC, bookmarks, shortcuts, progress, PWA
│  ├─ tryit.js                Editor behaviour
│  ├─ compiler.js             PicoC worker/timeout/fallback runner
│  ├─ quiz.js                 Quiz scoring and best-score storage
│  ├─ glossary.js             Glossary filter
│  ├─ certificate.js          Certificate and progress logic
│  ├─ bookmarks.js            Bookmarks page
│  ├─ search.js               Search UI
│  ├─ search-index.js         Generated search index (do not edit by hand)
│  ├─ icon.svg / icon-*.png   Icons
│  └─ picoc/                  Vendored PicoC WASM bundle + licences
├─ tools/
│  └─ build-search-index.js   Regenerates assets/search-index.js
└─ README.md
```

## Regenerating the search index

The search index is a generated file. After adding or editing page content, run:

```sh
node tools/build-search-index.js
```

The script has no dependencies. It reads the `<main>` of each page, extracts every `<h2>`
section and rewrites `assets/search-index.js`. It currently indexes 34 pages and around 320
sections.

## Service worker and cache version

`sw.js` caches the whole site after the first visit when served over HTTP(S):

- pages, scripts and styles use **network-first**, so edits appear immediately and the cache
  is the offline fallback;
- the PicoC WASM bundle and icons use **cache-first** for speed.

After changing any cached file, bump `CACHE_VERSION` in `sw.js` (for example `cnotes-v2` to
`cnotes-v3`) so returning visitors receive the new files. During development you can also
unregister the service worker and clear site data in DevTools.

## Adding your own notes

Each chapter is a standalone HTML file. To add a topic:

1. Copy an existing chapter (for example `c-strings.html`) to a new file.
2. Change the `<title>`, the `<h1>` and `data-page` on `<body>` to the new file name.
3. Edit the article content inside `<main class="content">`.
4. Add the page to the `NAV` array at the top of `assets/app.js`:

```js
["c-newtopic.html", "C New Topic"],
```

The sidebar, previous/next pager, progress count and search index follow automatically
once you re-run the index builder and update the service worker file list/version.

Keep the `.codebox` / `.output` structure so the **Try it** buttons keep working. Mark the
chapter as a tutorial entry (first two `NAV` groups) if it should count toward progress and
the certificate.

## Content basis

The workspace contained no original C notes file, so the pages cover a standard,
comprehensive C curriculum: language basics, control flow, arrays, strings, input, functions,
pointers, structures, unions, enums, files, dynamic memory, the preprocessor, a reference
section, a cheat sheet, a glossary and practice material. Replace any page's content with your
own notes — the layout and tooling do not depend on the wording.
