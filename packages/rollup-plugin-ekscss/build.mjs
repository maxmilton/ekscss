/* eslint-disable unicorn/prefer-top-level-await, unicorn/no-process-exit */
/* eslint-disable import/no-extraneous-dependencies, no-console */

import esbuild from 'esbuild';

const mode = process.env.NODE_ENV ?? 'production';
const dev = mode === 'development';

(async () => {
  // Node CJS bundle
  /** @type {esbuild.BuildOptions} */
  const esbuildConfig1 = {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    platform: 'node',
    target: ['node12'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    external: ['ekscss', 'stylis'],
    bundle: true,
    sourcemap: true,
    minify: !dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  };

  // Node ESM bundle
  /** @type {esbuild.BuildOptions} */
  const esbuildConfig2 = {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.mjs',
    platform: 'node',
    format: 'esm',
    target: ['node16'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    external: ['ekscss', 'stylis'],
    bundle: true,
    sourcemap: true,
    minify: !dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  };

  if (dev) {
    const context1 = await esbuild.context(esbuildConfig1);
    const context2 = await esbuild.context(esbuildConfig2);
    await Promise.all([context1.watch(), context2.watch()]);
  } else {
    const out1 = await esbuild.build(esbuildConfig1);
    const out2 = await esbuild.build(esbuildConfig2);

    if (out1.metafile)
      console.log(await esbuild.analyzeMetafile(out1.metafile));
    if (out2.metafile)
      console.log(await esbuild.analyzeMetafile(out2.metafile));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
