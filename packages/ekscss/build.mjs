/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import esbuild from 'esbuild';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    platform: 'node',
    target: ['node14'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    external: ['source-map', 'stylis'],
    banner: { js: '"use strict";' },
    bundle: true,
    sourcemap: true,
    minifySyntax: !dev,
    watch: dev,
    logLevel: 'info',
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
