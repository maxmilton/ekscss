/* eslint-disable unicorn/prefer-top-level-await, unicorn/no-process-exit */
/* eslint-disable import/no-extraneous-dependencies, no-console */

import esbuild from 'esbuild';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

(async () => {
  // Standard node CJS bundle
  const out1 = await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    platform: 'node',
    target: ['node10'],
    define: {
      'process.env.BROWSER': 'false',
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    external: ['source-map', 'stylis'],
    bundle: true,
    sourcemap: true,
    minify: !dev,
    watch: dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  });

  if (out1.metafile) {
    console.log(await esbuild.analyzeMetafile(out1.metafile));
  }

  // Browser compatible ESM bundle (without sourcemap support)
  const out2 = await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/browser.mjs',
    platform: 'browser',
    format: 'esm',
    define: {
      __filename: JSON.stringify(''),
      'process.env.BROWSER': 'true',
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    external: ['stylis'],
    bundle: true,
    sourcemap: true,
    minifySyntax: !dev,
    watch: dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
    plugins: [
      {
        name: 'mock-sourcemap',
        setup(build) {
          build.onResolve({ filter: /^\.\/sourcemap$/ }, () => ({
            namespace: 'mock-sourcemap',
            path: 'null',
          }));
          build.onLoad({ filter: /.*/, namespace: 'mock-sourcemap' }, () => ({
            contents: 'export const compileSourceMap = () => {};',
          }));
        },
      },
    ],
  });

  if (out2.metafile) {
    console.log(await esbuild.analyzeMetafile(out2.metafile));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
