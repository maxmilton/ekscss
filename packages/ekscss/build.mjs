/* eslint-disable unicorn/prefer-top-level-await, unicorn/no-process-exit */
/* eslint-disable import/no-extraneous-dependencies, no-console */

import esbuild from 'esbuild';

const mode = process.env.NODE_ENV || 'Production';
const dev = mode === 'development';

(async () => {
  // Standard node CJS bundle
  /** @type {esbuild.BuildOptions} */
  const esbuildConfig1 = {
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
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  };

  // Browser compatible ESM bundle (without sourcemap support)
  /** @type {esbuild.BuildOptions} */
  const esbuildConfig2 = {
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
  };

  if (dev) {
    const context1 = await esbuild.context(esbuildConfig1);
    const context2 = await esbuild.context(esbuildConfig2);
    await Promise.all([context1.watch(), context2.watch()]);
  } else {
    const out1 = await esbuild.build(esbuildConfig1);
    const out2 = await esbuild.build(esbuildConfig2);

    if (out1.metafile) console.log(await esbuild.analyzeMetafile(out1.metafile));
    if (out2.metafile) console.log(await esbuild.analyzeMetafile(out2.metafile));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
