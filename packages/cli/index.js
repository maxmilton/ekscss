'use strict';

const childProc = require('child_process');
const xcss = require('ekscss');
const fs = require('fs');
const JoyCon = require('joycon').default;
const colors = require('kleur/colors');
const path = require('path');
const { performance } = require('perf_hooks');

/** @param {Error?} err */
function handleErr(err) {
  if (err) throw err;
}

const joycon = new JoyCon({
  files: [
    '.xcssrc.cjs',
    '.xcssrc.js',
    '.xcssrc.json',
    'xcss.config.cjs',
    'xcss.config.js',
    'xcss.config.json',
    'package.json',
  ],
  packageKey: 'xcss',
});

/**
 * @param {string?} src
 * @param {string?} dest
 * @param {object} opts
 * @param {string} [opts.config]
 * @param {boolean} [opts.map]
 * @param {boolean} [opts.quiet]
 */
module.exports = async (src, dest, opts) => {
  // load user defined config or fall back to default file locations
  const result = await joycon.load(opts.config ? [opts.config] : undefined);

  if (!result.path && !opts.quiet) {
    console.warn(colors.yellow('Warning:'), 'Unable to locate XCSS config');
  }

  /** @type {import('./types').XCSSConfig} */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const config = result.data || {};
  const rootDir = config.rootDir || process.cwd();
  const srcFiles = src ? [src] : ['index.xcss', 'src/index.xcss'];
  /** @type {string|undefined} */
  let srcFile;

  for (const filename of srcFiles) {
    const file = path.resolve(rootDir, filename);
    const exists = fs.existsSync(file);

    if (exists) {
      srcFile = file;
      break;
    }
  }

  if (!srcFile) {
    console.error(colors.red('Critical:'), 'Unable to resolve src file');
    process.exit(2);
  }

  const destFile = dest || srcFile.replace(/\.xcss$/, '.css');
  const code = await fs.promises.readFile(srcFile, 'utf-8');

  const t0 = performance.now();
  const compiled = xcss.compile(code, {
    from: srcFile,
    to: destFile,
    globals: config.globals,
    plugins: config.plugins,
    rootDir,
    map: opts.map != null ? opts.map : config.map,
  });
  const t1 = performance.now();

  for (const warning of compiled.warnings) {
    process.exitCode = 1;

    console.error(colors.red('Error:'), warning.message || warning);

    if (warning.file) {
      console.log(
        '  at',
        colors.dim(
          [warning.file, warning.line, warning.column]
            .filter(Boolean)
            .join(':'),
        ),
      );
    }
  }

  const css = `${config.banner ? `${config.banner}\n` : ''}${compiled.css}`;
  /** @type {import('source-map').SourceMapGenerator | undefined | string} */
  let sourcemap = compiled.map;

  if (sourcemap) {
    if (config.banner) {
      const bannerLineCount = config.banner.split('\n').length;
      const map = sourcemap.toJSON();
      map.mappings = `${';'.repeat(bannerLineCount)}${map.mappings}`;
      sourcemap = JSON.stringify(map);
    }

    fs.writeFile(
      destFile,
      `${css}\n/*# sourceMappingURL=${path.basename(destFile)}.map */`,
      'utf8',
      handleErr,
    );
    fs.writeFile(`${destFile}.map`, sourcemap.toString(), 'utf8', handleErr);
  } else {
    fs.writeFile(destFile, css, 'utf8', handleErr);
  }

  if (!opts.quiet) {
    // highlight potential code issues
    const cssHighlighted = css.replace(
      /null|undefined|UNDEFINED|INVALID|NaN|#apply:/g,
      colors.bold(colors.red('$&')),
    );
    const bytes = Buffer.byteLength(css, 'utf8');
    const gzBytes = childProc.execSync(
      `echo "${css}" | gzip --stdout - | wc --bytes`,
    );
    const memMB = process.memoryUsage().heapUsed / 1024 / 1024;
    const time = `${(t1 - t0).toFixed(2)}ms`;
    const timeTotal = `${Math.round(performance.now())}ms total`;

    console.log('');
    console.log(`@@\n@@ ${destFile}\n@@`);
    console.log('');
    console.log(cssHighlighted);
    console.log('');
    console.log(`time:  ${time} (${timeTotal})`);
    console.log(`mem:   ${memMB.toFixed(2)} MB`);
    console.log(`chars: ${compiled.css.length}`);
    console.log(`bytes: ${bytes} B, ${`${(bytes / 1024).toFixed(2)} kB`}`);
    console.log(`gz:    ${+gzBytes} B, ${(+gzBytes / 1024).toFixed(2)} kB`);
    console.log('');
  }
};
