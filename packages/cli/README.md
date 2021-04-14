# XCSS CLI

Compile XCSS into CSS using [ekscss](https://github.com/MaxMilton/ekscss) on the command line.

## Usage

### Without local install (yarn >= v2 only)

```sh
yarn dlx -p @ekscss/cli xcss --help
```

### With install

```sh
yarn add @ekscss/cli
```

```sh
yarn xcss --help
```

Output:

```
  Description
    Compile XCSS into CSS using ekscss

  Usage
    $ xcss [src] [dest] [options]

  Options
    -c, --config     Use specified config file
    -m, --map        Generate a source map  (default false)
    -q, --quiet      Don't print errors or stats
    -v, --version    Displays current version
    -h, --help       Displays this message

  Examples
    $ xcss styles.xcss dist/styles.css
    $ xcss --map styles.xcss
    $ xcss -q
```

### Input and output paths

When `src` is not provided then automatically try `index.xcss`, `src/index.xcss`, or else error and exit.

When `dest` is not provided output CSS will be put into a file with the same file path as `src` but with a `.css` file extension.

### Config files

XCSS configuration files may be in either JSON or JavaScript format. Config files will be discovered and used automatically if named appropriately and placed in your project directory:

- `.xcssrc.js`
- `.xcssrc.json`
- `xcss.config.js`
- `xcss.config.json`
- an `"xcss"` field in your `package.json`
- or any file name or path when you use the `--config` option

## Notes

This package is intended to be simple and lightweight. If you need features like watching for file changes use [rollup](https://rollupjs.org) together with [rollup-plugin-ekscss](https://github.com/MaxMilton/ekscss/tree/master/packages/rollup-plugin-ekscss) and [@ekscss/rollup-plugin-css](../rollup-plugin-css). Alternatively, for simple projects or when build speed is important, use [esbuild](https://esbuild.github.io) with [esbuild-plugin-ekscss](https://github.com/MaxMilton/ekscss/tree/master/packages/esbuild-plugin-ekscss).

This package registers the CLI executable binaries `xcss` and `ekscss` which are both equivalent.

## Licence

`ekscss` is an MIT licensed open source project. See [LICENCE](https://github.com/MaxMilton/ekscss/blob/master/LICENCE).

---

© 2021 [Max Milton](https://maxmilton.com)
