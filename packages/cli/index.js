'use strict';

const xcss = require('ekscss');
const fs = require('fs');
const JoyCon = require('joycon').default;
const colors = require('kleur/colors');
const path = require('path');
const { performance } = require('perf_hooks');

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
  // Load user defined config or fall back to default file locations
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
  const code = await fs.promises.readFile(srcFile, 'utf8');

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
  /** @type {typeof compiled.map | string} */
  let sourcemap = compiled.map;

  await fs.promises.mkdir(path.dirname(destFile), { recursive: true });

  if (sourcemap) {
    if (config.banner) {
      const bannerLineCount = config.banner.split('\n').length;
      const map = sourcemap.toJSON();
      map.mappings = `${';'.repeat(bannerLineCount)}${map.mappings}`;
      sourcemap = JSON.stringify(map);
    }

    await Promise.all([
      fs.promises.writeFile(
        destFile,
        `${css}\n/*# sourceMappingURL=${path.basename(destFile)}.map */`,
        'utf8',
      ),
      fs.promises.writeFile(`${destFile}.map`, sourcemap.toString(), 'utf8'),
    ]);
  } else {
    await fs.promises.writeFile(destFile, css, 'utf8');
  }

  if (/UNDEFINED|INVALID|#apply:|null|undefined|NaN|\[object \w+]/.test(css)) {
    process.exitCode = 1;
    console.error(colors.red('Error:'), 'Output may contain unwanted value');
  }

  if (!opts.quiet) {
    const memMB = process.memoryUsage().heapUsed / 1024 / 1024;
    // Highlight potential code issues
    const cssHighlighted = css.replace(
      /UNDEFINED|INVALID|#apply:|null|undefined|NaN|\[object \w+]/g,
      colors.bold(colors.red('$&')),
    );
    const bytes = Buffer.byteLength(css, 'utf8');
    // eslint-disable-next-line global-require
    const gzBytes = require('zlib').gzipSync(css).byteLength;
    const timeCompile = `${(t1 - t0).toFixed(2)}ms`;
    const timeTotal = `${Math.ceil(performance.now())}ms total`;

    console.log(`
@@
@@ ${destFile}
@@

${cssHighlighted}

time:  ${timeCompile} (${timeTotal})
mem:   ${memMB.toFixed(2)} MB
chars: ${compiled.css.length}
bytes: ${bytes} B, ${(bytes / 1000).toFixed(2)} kB
gz:    ${gzBytes} B, ${(gzBytes / 1000).toFixed(2)} kB
`);
  }
};
