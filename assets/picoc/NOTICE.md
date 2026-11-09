# PicoC / picoc-web attribution

`assets/picoc/picoc.js` is the browser bundle of **picoc-web** 1.1.0:

- https://github.com/MouhamedBourouba/picoc-web
- PicoC: https://github.com/jpoirier/picoc (originally by Zik Saleeba)

PicoC is distributed under the BSD 3-Clause licence. The full licence text is in
`assets/picoc/LICENSE`, with additional notices in `assets/picoc/LICENSE.h`.

The bundle contains a WebAssembly build of the PicoC interpreter. It runs fully
inside the browser: no source code or output is sent anywhere.

PicoC is an interpreter for a practical subset of C89/C99, not a complete
ISO C compiler. Some valid C constructs (for example aggregate initialisers for
structs, complex macros and VLAs) are not supported. Use GCC or Clang locally
for full standard C.
