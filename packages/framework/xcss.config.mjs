/**
 * Internal XCSS configuration to build the framework. When importing a base
 * config into your own project, you should use `config.js`, not this file.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ctx, onBeforeBuild } from "ekscss";
import baseConfig from "./config.js";
import { preloadApply } from "./utils.js";

/** @type {import("./package.json")} */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("package.json", import.meta.url)), "utf8"),
);

/** @type {string} */
let bundleName;

onBeforeBuild(() => {
  if (ctx.from) {
    bundleName = (ctx.from.includes("/addon/") ? "addon/" : "") + path.basename(ctx.from, ".xcss");

    if (ctx.from.endsWith("framework/addon/native.xcss")) {
      preloadApply("@import './level2.xcss';");
    }
  }
});

/**
 * XCSS config specifically for building the `@ekscss/framework` dist files.
 *
 * Note: This config **should not be reused** in other projects. What you likely
 * want is `@ekscss/framework/config`.
 *
 * @type {import("@ekscss/cli").Config}
 */
export default {
  ...baseConfig,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  get banner() {
    return `/*!
* XCSS Framework [${bundleName}] v${pkg.version} - https://github.com/maxmilton/ekscss
* (c) 2025 Max Milton
* MIT Licensed - https://github.com/maxmilton/ekscss/blob/main/LICENSE
*/`;
  },
};
