import { createTypes } from "@ekscss/build-tools";
import { analyzeMetafile, build } from "esbuild";

const mode = process.env.NODE_ENV;
const dev = mode === "development";

console.time("prebuild");
await Bun.$`rm -rf dist`;
console.timeEnd("prebuild");

console.time("build");
// Node CJS bundle
const out1 = await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  platform: "node",
  target: ["node12"],
  define: {
    "process.env.BROWSER": "false",
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  external: ["@jridgewell/gen-mapping", "stylis"],
  bundle: true,
  sourcemap: true,
  minify: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: "debug",
});
// Browser compatible ESM bundle (without sourcemap support)
const out2 = await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/browser.mjs",
  platform: "browser",
  format: "esm",
  define: {
    "process.env.BROWSER": "true",
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  external: ["stylis"],
  plugins: [{
    name: "stub-sourcemap",
    setup(plugin) {
      plugin.onLoad({ filter: /sourcemap\.ts$/ }, () => ({
        contents: "export const compileSourceMap = () => {};",
      }));
    },
  }],
  bundle: true,
  sourcemap: true,
  minifySyntax: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: "debug",
});
console.timeEnd("build");

console.time("dts");
createTypes(["src/index.ts"], "dist");
console.timeEnd("dts");

if (out1.metafile) console.debug(await analyzeMetafile(out1.metafile));
if (out2.metafile) console.debug(await analyzeMetafile(out2.metafile));
