import { createTypes } from "@ekscss/build-tools";
import { analyzeMetafile, build } from "esbuild";

const mode = process.env.NODE_ENV;
const dev = mode === "development";

console.time("prebuild");
await Bun.$`rm -rf dist`;
console.timeEnd("prebuild");

console.time("build");
const out = await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  platform: "node",
  target: ["node12"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  external: ["@ekscss/config-loader", "@rollup/pluginutils", "ekscss", "rollup"],
  bundle: true,
  sourcemap: true,
  minify: !dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: "debug",
});
console.timeEnd("build");

console.time("dts");
createTypes(["src/index.ts"], "dist");
console.timeEnd("dts");

if (out.metafile) console.log(await analyzeMetafile(out.metafile));
