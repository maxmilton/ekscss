/* eslint-disable import/no-extraneous-dependencies */

import esbuild from 'esbuild';
import { xcss } from 'esbuild-plugin-ekscss';
import fs from 'fs';
import path from 'path';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

/** @param {Error?} err */
function handleErr(err) {
  if (err) throw err;
}

/** @param {esbuild.BuildResult} buildResult */
function compressTemplateStrings(buildResult) {
  if (!buildResult.outputFiles) return;

  buildResult.outputFiles.forEach((file) => {
    switch (path.extname(file.path)) {
      case '.map':
      case '.css':
        fs.writeFile(file.path, file.text, 'utf8', handleErr);
        break;

      case '.js':
        // FIXME: Direct mangling breaks source maps
        // TODO: Would be nice to have an AST and only mangle template literal strings
        const code = file.text
          // reduce whitespace to a single space
          .replace(/\s+/gm, ' ')
          // remove space after and before tags
          .replace(/> /g, '>')
          .replace(/ </g, '<')
          // remove space at start and end of template string
          .replace(/` </g, '`<')
          .replace(/> `/g, '>`');

        fs.writeFile(file.path, code, 'utf8', handleErr);
        break;

      default:
        throw new TypeError(`Unsupported file extension: ${file.path}`);
    }
  });
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
