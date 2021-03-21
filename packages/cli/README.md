# XCSS CLI

Compile XCSS into CSS using [ekscss](https://github.com/MaxMilton/ekscss) on the command line.

## Install

```sh
yarn add @ekscss/cli
```

## Usage

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
    -m, --map        Generate a source map  (default true)
    -q, --quiet      Don't print errors or stats
    -v, --version    Displays current version
    -h, --help       Displays this message

  Examples
    $ xcss styles.xcss dist/styles.css
    $ xcss --map=false styles.xcss
    $ xcss -q
```

### Input and output paths

When `src` is not provided then automatically try `index.xcss`, `src/index.xcss`, or else throw an error.

When `dest` is not provided output CSS will be put into a file with the same file path as `src` but with a `.css` file extension.

### Config files

XCSS configuration files may be in either JSON or JavaScript format. Config files will be discovered and used automatically if named appropriately and placed in your project directory:

- `.xcssrc.js`
- `.xcssrc.json`
- `xcss.config.js`
- `xcss.config.json`
- an `"xcss"` field in your `package.json`
- or any file name when you use the `--config` option

## Notes

This package registers the CLI executable binaries `xcss` and `ekscss` which are both equivalent.

## Licence

`ekscss` is an MIT licensed open source project. See [LICENCE](https://github.com/MaxMilton/ekscss/blob/master/LICENCE).

---

© 2021 [Max Milton](https://maxmilton.com)
