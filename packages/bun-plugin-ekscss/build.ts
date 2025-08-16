console.time("prebuild");
await Bun.$`rm -rf dist`;
console.timeEnd("prebuild");

console.time("build");
await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  external: ["@ekscss/config-loader", "ekscss"],
  target: "bun",
  minify: true,
  sourcemap: "linked",
});
console.timeEnd("build");
