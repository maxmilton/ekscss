[![Build status](https://img.shields.io/github/workflow/status/maxmilton/ekscss/ci)](https://github.com/maxmilton/ekscss/actions)
[![Coverage status](https://img.shields.io/codeclimate/coverage/MaxMilton/ekscss)](https://codeclimate.com/github/MaxMilton/ekscss)
[![NPM version](https://img.shields.io/npm/v/ekscss.svg)](https://www.npmjs.com/package/ekscss)
[![Licence](https://img.shields.io/github/license/maxmilton/ekscss.svg)](https://github.com/maxmilton/ekscss/blob/master/LICENSE)

# ekscss

> This project is still new and experimental. Before version `1.0` there may be backwards incompatible changes. You have been warned!

`ekscss` (pronounced X-C-S-S) is a simple, fast, and powerful CSS preprocessor.

[Try ekscss online in the REPL](https://ekscss-repl.web.app/)

<!--
## 'JS in CSS' style preprocessor

### Why

- PostCSS is (still) great but:
  - Fed up with inflexibility of plugins, especially plugin interoperability
  - Too many dependencies/complexity once you add plugins
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
- Best used for build-time processing. Although it can run in the browser, the XCSS compiler uses `new Function()` to eval code, which may be fine in a trusted context like local development or a CI pipeline, however on the web it may introduce potential for abuse.
  - Link to REPL for example of browser use.

### To Do

- Fix source map mapping for XCSS template expressions
- Add READMEs to remaining packages
- Add proper typescript support for `x` global
- An official way to remove unused styles
- Webpack plugin
- PostCSS syntax plugin then (related):
  - Stylelint plugin
  - Prettier plugin
  - VS Code syntax
- Documentation:
  - Currently, templates in XCSS (`${...}`) are still evaluated when they're in a _CSS comment_; ~to disable them it's necessary to comment out the code _inside the template_~ it's tricky to comment out XCSS code, so provide a solution or at least solid examples
  - Compiler browser bundle (browser compatible but no sourcemap support) + reinforce the potential security risk since the compiler uses a kind of eval
  - Architectural designations and goals + an overview of how compile works (especially the steps involved)
- Explain the "ekscss" name
- Add benchmarks:
  - Vs other CSS preprocessors
  - Overhead compared to raw stylis
  - Source map overhead
  - Overhead for each plugin
-->

## Licence

`ekscss` is an MIT licensed open source project. See [LICENCE](https://github.com/maxmilton/ekscss/blob/master/LICENCE).

---

© 2021 [Max Milton](https://maxmilton.com)
