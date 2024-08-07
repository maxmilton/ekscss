import esbuild, { type BuildOptions } from 'esbuild';

const mode = process.env.NODE_ENV ?? 'production';
const dev = mode === 'development';

console.time('prebuild');
await Bun.$`rm -rf dist`;
console.timeEnd('prebuild');

const esbuildConfig: BuildOptions = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  platform: 'node',
  target: ['node12'],
  external: ['postcss'],
  bundle: true,
  sourcemap: true,
  minifySyntax: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
};

if (dev) {
  const context = await esbuild.context(esbuildConfig);
  await context.watch();
} else {
  const out = await esbuild.build(esbuildConfig);

  if (out.metafile) console.log(await esbuild.analyzeMetafile(out.metafile));
}
