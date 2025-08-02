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

- Add "extends" feature to config
- Fix source map mapping for XCSS template expressions
- Add READMEs to remaining packages
- Add proper typescript support for `x` global
- An official way to remove unused styles
- Webpack plugin
- Also test rollup plugin against vite
  - If there are some particular benefits, make a separate vite plugin, potentially just reexporting the rollup plugin
- PostCSS syntax plugin then (related):
  - Stylelint plugin
  - Prettier plugin
  - VS Code syntax
- Documentation:
  - Currently, templates in XCSS (`${...}`) are still evaluated when they're in a _CSS comment_; ~to disable them it's necessary to comment out the code _inside the template_~ it's tricky to comment out XCSS code, so provide a solution or at least solid examples
  - Compiler browser bundle (browser compatible but no source map support) + reinforce the potential security risk since the compiler uses a kind of eval
  - Architectural designations and goals + an overview of how compile works (especially the steps involved)
- Explain the "ekscss" name
- Add benchmarks:
  - Vs other CSS preprocessors
  - Overhead compared to raw stylis
  - Source map overhead
  - Overhead for each plugin
-->

<!-- TODO: Migrate qlty.sh badge to badgen.net once it's supported -->

[![CI status](https://badgen.net/github/checks/maxmilton/ekscss?label=ci)](https://github.com/maxmilton/ekscss/actions)
[![Coverage %](https://qlty.sh/badges/bfb90576-1d44-4606-9ba0-95b4e7077333/test_coverage.svg)](https://qlty.sh/gh/maxmilton/projects/ekscss)
[![NPM version](https://badgen.net/npm/v/ekscss)](https://www.npmjs.com/package/ekscss)
[![Licence](https://badgen.net/github/license/maxmilton/ekscss)](./LICENSE)

# ekscss

> Warning: This is experimental alpha software. Test thoroughly before using in production. Please report any bugs you find! Before version `1.0.0` minor releases may contain breaking changes.

`ekscss` (pronounced X-C-S-S) is a simple, fast, and powerful CSS preprocessor.

[Try ekscss online in the REPL](https://ekscss-repl.web.app)

## Usage

Check out our docs, visit <https://ekscss.js.org>.

## Bugs

Please report any bugs you encounter on the [GitHub issue tracker](https://github.com/maxmilton/ekscss/issues).

## Changelog

See [releases on GitHub](https://github.com/maxmilton/ekscss/releases).

## License

MIT license. See [LICENSE](https://github.com/maxmilton/ekscss/blob/master/LICENSE).

---

© [Max Milton](https://maxmilton.com)
