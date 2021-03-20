'use strict'; // eslint-disable-line

// FIXME: This is a temp file for development only, remove before publishing!

/* eslint-disable import/no-extraneous-dependencies, no-console, no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-var-requires */

const childProc = require('child_process');
const colors = require('colorette');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { compile } = require('ekscss');
const { globals } = require('./config');

/**
 * @param {string} entryFile
 */
function buildCSS(entryFile, header = '') {
  const filename = path.join(__dirname, entryFile);
  const code = fs.readFileSync(filename, 'utf-8');

  const t0 = performance.now();
  const result = compile(code, {
    from: filename,
    globals,
    to: filename.replace(/\.xcss$/, '.css'), // TODO: Remove prop if unused
    // map: false,
  });
  const t1 = performance.now();

  for (const warning of result.warnings) {
    console.warn(
      colors.bold(colors.yellow('WARNING:')),
      warning.message || warning,
    );
  }

  const css = header
    + result.css.replace(
      /UNDEFINED|INVALID|NaN|XX/g,
      colors.bold(colors.red('$&')),
    );

  console.log(`\n@@\n@@ CSS ${entryFile}\n@@\n`);
  console.log(css);
  // console.log('@@ RESULT', result);
  console.log('\nOK OK OK OK OK', colors.blue(`${(t1 - t0).toFixed(2)}ms`));

  const mb = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Script MEM use ~ ${colors.cyan(`${mb.toFixed(2)} MB`)}`);

  const bytes = Buffer.byteLength(result.css, 'utf8');
  console.log(
    `${result.css.length} chars\n${bytes} bytes | ${colors.blue(
      `${(bytes / 1024).toFixed(2)} kB`,
    )}`,
  );

  // XXX: This is async so when run multiple times the results are grouped at the end
  childProc.exec(
    `echo "${result.css}" | gzip --stdout - | wc --bytes`,
    (error, stdout, stderr) => {
      if (error) console.error(error);
      if (stderr) console.error(stderr);
      console.log(`Gz: ${+stdout} B | ${(+stdout / 1024).toFixed(2)} kB`);
    },
  );

  // OUTPUT
  const fileName = `${path.basename(entryFile, '.xcss')}.css`;

  if (result.map) {
    fs.writeFileSync(
      path.join(__dirname, `./dist/${fileName}`),
      `${result.css}\n/*# sourceMappingURL=${fileName}.map */`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(__dirname, `./dist/${fileName}.map`),
      JSON.stringify(result.map),
      'utf8',
    );
  } else {
    fs.writeFileSync(
      path.join(__dirname, `./dist/${fileName}`),
      result.css,
      'utf8',
    );
  }
}

// buildCSS(
//   'base.xcss',
//   `/*! FRAMEWORK BASE - https://github.com/WeAreGenki/minna-ui
// * (c) 2021 Human Code
// * MIT Licensed - https://github.com/WeAreGenki/minna-ui/blob/main/LICENSE */
// `,
// );
// buildCSS(
//   'index.xcss',
//   `@charset 'UTF-8';/*!
// * FRAMEWORK - https://github.com/WeAreGenki/minna-ui
// * (c) 2021 Human Code
// * MIT Licensed - https://github.com/WeAreGenki/minna-ui/blob/main/LICENSE */
// `,
// );

// buildCSS('test.xcss');

buildCSS('index.xcss');

// FIXME: REMOVE THIS AND debug.xcss ONCE FINISHED DEBUGGING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// buildCSS('debug.xcss');
