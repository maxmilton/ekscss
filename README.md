# ekscss a.k.a XCSS

> Before we hit version `1.0` there may be backwards incompatible changes. You have been warned!

A simple, fast, and powerful CSS preprocessor.

## 'JS in CSS' style preprocessor

### Why

- PostCSS is (still) great but:
  - Fed up with inflexibility of plugin system
  - Too many dependencies/complexity
- Compile speed
- Use case agnostic
- Light weight; leverages the power of JS
  - JS is already fantastic for easily manipulating strings
- Simplicity

#### Features

- Simple JS template literal (template string) syntax
- Global compile-time variables
  - And warnings when referenced vars are missing etc.
- Use plain JS for anything e.g. loops
- Fast — possibly the fastest full-featured CSS preprocessor
- CSS `@import` flattening
- Uses [stylis](https://github.com/thysultan/stylis.js) under the hood and inherits all its features including:
  - Nesting
  - Vendor prefixing
  - Minification

##### Bonus examples

- `calc()` can often be avoided since maths can be used at build-time (but we still need it sometimes for dynamic things calculated at run-time)
  - Worth breaking down the difference between build-time and run-time — like vars, calc, etc.

#### Drawbacks

- Opinionated; not many options; speed comes at a cost
- Best used for build-time processing. Although it can run in the browser, the XCSS compiler uses `new Function()` to eval code, which is fine in a trusted context like local development or a CI pipeline, however on the web it introduces potential for abuse.

### To Do

- Fix source map mapping for XCSS template expressions and cli header option
- Add READMEs to remaining packages
- `@apply` middleware package
- Add `joycon` config loading to `esbuild-plugin-ekscss` and `svelte-ekscss`
- Better typescript support for `g`
- A way to remove unused styles
- Webpack plugin
- PostCSS syntax plugin then (related):
  - Stylelint plugin
  - Prettier plugin
  - VS Code syntax
- Add finer details to compiler warnings; line, column, etc.
- Documentation:
  - Templates in XCSS (`${...}`) are still evaluated when they're in a _CSS comment_; to disable them it's necessary to comment out the code _inside the template_

## Licence

`ekscss` is an MIT licensed open source project. See [LICENCE](https://github.com/MaxMilton/ekscss/blob/master/LICENCE).

---

© 2021 [Max Milton](https://maxmilton.com)
