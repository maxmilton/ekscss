/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import esbuild from 'esbuild';
import { xcss } from 'esbuild-plugin-ekscss';
import { minifyTemplates, writeFiles } from 'esbuild-minify-templates';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

const target = ['chrome78', 'firefox77', 'safari11', 'edge44'];

// Main web app
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    target,
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
  .then(minifyTemplates)
  .then(writeFiles)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Plugins
const plugins = ['search'];

plugins.forEach((pluginName) => {
  esbuild
    .build({
      entryPoints: [`src/plugins/${pluginName}.ts`],
      outfile: `dist/plugins/${pluginName}.js`,
      target,
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
    .then(minifyTemplates)
    .then(writeFiles)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
});
