/* eslint-disable import/no-extraneous-dependencies, no-console */

import esbuild from 'esbuild';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

(async () => {
  const out = await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    platform: 'node',
    target: ['node12'],
    external: ['postcss'],
    banner: { js: '"use strict";' },
    bundle: true,
    sourcemap: true,
    minifySyntax: !dev,
    watch: dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  });

  if (out.metafile) {
    console.log(await esbuild.analyzeMetafile(out.metafile));
  }
})().catch(console.error);