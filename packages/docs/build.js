/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

'use strict'; // eslint-disable-line

const { xcss } = require('esbuild-plugin-ekscss');
const esbuild = require('esbuild');
const fs = require('fs');

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

/** @param {Error?} err */
function handleErr(err) {
  if (err) throw err;
}

/** @param {esbuild.BuildResult} buildResult */
// this approach is flaky and could cause issues later... but it works!
function compressTemplateStrings(buildResult) {
  if (!buildResult.outputFiles) return;

  const outputMap = buildResult.outputFiles[0];
  const outputJs = buildResult.outputFiles[1];

  const filePath = outputJs.path;
  // FIXME: Direct mangling breaks source maps
  const code = outputJs.text
    // reduce multiple whitespace down to a single space
    .replace(/\s{2,}/gm, ' ')
    // convert remaining whitespace characters into a space
    .replace(/\s/gm, ' ')
    // remove whitespace after and before tags
    .replace(/> /g, '>')
    .replace(/ </g, '<')
    // remove whitespace at start and end of template string
    .replace(/` </g, '`<')
    .replace(/> `/g, '>`');

  fs.writeFile(filePath, code, 'utf8', handleErr);
  fs.writeFile(outputMap.path, outputMap.text, 'utf8', handleErr);

  const outputCss = buildResult.outputFiles[2];
  if (outputCss) {
    fs.writeFile(outputCss.path, outputCss.text, 'utf8', handleErr);
  }
}

// Main web app
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    // target: ['chrome88'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins: [xcss()],
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: true,
    watch: dev,
    write: dev,
    logLevel: 'info',
  })
  .then(compressTemplateStrings)
  .catch(() => process.exit(1));

// Plugins
// TODO: Loop through src/plugins dir and build each
esbuild
  .build({
    entryPoints: ['src/plugins/search.ts'],
    outfile: 'dist/plugins/search.js',
    // target: ['chrome88'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    // plugins: [xcss()],
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: true,
    watch: dev,
    write: dev,
    logLevel: 'info',
  })
  .then(compressTemplateStrings)
  .catch(() => process.exit(1));
