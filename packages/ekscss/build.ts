import { createBundle } from "dts-buddy";
import esbuild, { type BuildOptions } from "esbuild";

const mode = process.env.NODE_ENV;
const dev = mode === "development";

console.time("prebuild");
await Bun.$`rm -rf dist`;
console.timeEnd("prebuild");

// Node CJS bundle
const esbuildConfig1: BuildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  platform: "node",
  target: ["node12"],
  define: {
    "process.env.BROWSER": "false",
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  external: ["source-map", "stylis"],
  bundle: true,
  sourcemap: true,
  minify: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: "debug",
};

// Node ESM bundle
const esbuildConfig2: BuildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.mjs",
  platform: "node",
  format: "esm",
  target: ["node16"],
  define: {
    "process.env.BROWSER": "false",
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  external: ["source-map", "stylis"],
  bundle: true,
  sourcemap: true,
  minify: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: "debug",
};

// Browser compatible ESM bundle (without sourcemap support)
const esbuildConfig3: BuildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/browser.mjs",
  platform: "browser",
  format: "esm",
  define: {
    "process.env.BROWSER": "true",
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  external: ["stylis"],
  bundle: true,
  sourcemap: true,
  minifySyntax: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: "debug",
  plugins: [
    {
      name: "stub-sourcemap",
      setup(build) {
        build.onLoad({ filter: /sourcemap\.ts$/ }, () => ({
          contents: "export const compileSourceMap = () => {};",
        }));
      },
    },
  ],
};

if (dev) {
  const context1 = await esbuild.context(esbuildConfig1);
  const context2 = await esbuild.context(esbuildConfig2);
  const context3 = await esbuild.context(esbuildConfig3);
  await Promise.all([context1.watch(), context2.watch(), context3.watch()]);
} else {
  console.time("build");
  const out1 = await esbuild.build(esbuildConfig1);
  const out2 = await esbuild.build(esbuildConfig2);
  const out3 = await esbuild.build(esbuildConfig3);
  console.timeEnd("build");

  if (out1.metafile) console.log(await esbuild.analyzeMetafile(out1.metafile));
  if (out2.metafile) console.log(await esbuild.analyzeMetafile(out2.metafile));
  if (out3.metafile) console.log(await esbuild.analyzeMetafile(out3.metafile));

  await createBundle({
    project: "tsconfig.json",
    output: "dist/index.d.ts",
    modules: {
      ekscss: "src/index.ts",
    },
  });
}
