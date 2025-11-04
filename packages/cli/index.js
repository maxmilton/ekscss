"use strict";

const { ConfigLoader } = require("@ekscss/config-loader");
const xcss = require("ekscss");
const colors = require("kleur/colors");
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");

const cl = new ConfigLoader({
  files: [
    "xcss.config.js",
    "xcss.config.mjs",
    "xcss.config.cjs",
    "xcss.config.json",
    "package.json",
  ],
  packageKey: "xcss",
});

/**
 * @param {string?} src
 * @param {string?} dest
 * @param {object} opts
 * @param {string} [opts.config]
 * @param {boolean} [opts.map]
 * @param {boolean} [opts.quiet]
 */
module.exports = async (src, dest, opts) => {
  // Load user defined config or fall back to default file locations
  const result = await cl.load(opts.config);

  if ((!result || !result.path) && !opts.quiet) {
    console.warn(colors.yellow("Warning:"), "Unable to locate XCSS config");
  }

  /** @type {import("./types").Config} */
  const config = (result && result.data) || {};
  const rootDir = config.rootDir || process.cwd();
  const srcFiles = src ? [src] : ["index.xcss", "src/index.xcss"];
  let srcFileName;
  let srcFile;

  if (config.plugins) {
    config.plugins = xcss.resolvePlugins(config.plugins);
  }

  for (const filename of srcFiles) {
    try {
      srcFileName = path.resolve(rootDir, filename);
      srcFile = await fs.promises.open(srcFileName, "r", 0o600);
    } catch {
      // no op
    }
  }

  if (!srcFileName || !srcFile) {
    console.error(colors.red("Critical:"), "Unable to resolve src file");
    process.exit(2);
  }

  const destFile = dest || srcFileName.replace(/\.xcss$/, ".css");
  const code = await fs.promises.readFile(srcFile, "utf8");
  await srcFile.close();

  const t0 = performance.now();
  const compiled = xcss.compile(code, {
    rootDir,
    from: srcFileName,
    to: destFile,
    plugins: config.plugins,
    functions: config.functions,
    globals: config.globals,
    map: opts.map == null ? config.map : opts.map,
  });
  const t1 = performance.now();

  const css = `${config.banner ? `${config.banner}\n` : ""}${compiled.css}`;
  const sourcemap = compiled.map;

  for (const warning of compiled.warnings) {
    process.exitCode = 1;
    console.error(colors.red("Error:"), warning.message || warning);

    if (warning.file) {
      console.log(
        "  at",
        colors.dim([warning.file, warning.line, warning.column].filter(Boolean).join(":")),
      );
    }
  }

  await fs.promises.mkdir(path.dirname(destFile), { recursive: true });

  if (sourcemap) {
    if (config.banner) {
      const bannerLineCount = config.banner.split("\n").length;
      for (let i = 0; i < bannerLineCount; i++) {
        // @ts-expect-error - internal property
        // eslint-disable-next-line
        sourcemap._map._mappings.unshift([]);
      }
    }

    await Promise.all([
      fs.promises.writeFile(
        destFile,
        `${css}\n/*# sourceMappingURL=${path.basename(destFile)}.map */`,
        "utf8",
      ),
      fs.promises.writeFile(`${destFile}.map`, sourcemap.toString(), "utf8"),
    ]);
  } else {
    await fs.promises.writeFile(destFile, css, "utf8");
  }

  if (/UNDEFINED|INVALID|#apply:|null|undefined|NaN|\[object \w+]/.test(css)) {
    process.exitCode = 1;
    console.error(colors.red("Error:"), "Output may contain unwanted value");
  }

  if (!opts.quiet) {
    const memMB = process.memoryUsage().heapUsed / 1024 / 1024;
    // Highlight potential code issues
    const cssHighlighted = css.replace(
      /UNDEFINED|INVALID|#apply:|null|undefined|NaN|\[object \w+]/g,
      colors.bold(colors.red("$&")),
    );
    const bytes = Buffer.byteLength(css, "utf8");
    const gzBytes = require("node:zlib").gzipSync(css).byteLength;
    const timeCompile = `${(t1 - t0).toFixed(2)}ms`;
    const timeTotal = `${Math.ceil(performance.now())}ms total`;

    console.log(`@@
@@ ${destFile}
@@

${cssHighlighted}

time:  ${timeCompile} (${timeTotal})
mem:   ${memMB.toFixed(2)} MB
chars: ${compiled.css.length}
bytes: ${bytes} B, ${(bytes / 1000).toFixed(2)} kB
gz:    ${gzBytes} B, ${(gzBytes / 1000).toFixed(2)} kB
`);
  }
};
