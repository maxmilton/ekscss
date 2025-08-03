/**
 * Internal XCSS configuration to build the framework. When importing a base
 * config into your own project, you should use `config.js` not this file.
 */

"use strict";

const { ctx, onBeforeBuild } = require("ekscss");
const path = require("path");
const pkg = require("./package.json");
const baseConfig = require("./config.js");
const { preloadApply } = require("./utils.js");

/** @type {string} */
let bundleName;

onBeforeBuild(() => {
  if (ctx.from) {
    bundleName =
      (ctx.from.includes("/addon/") ? "addon/" : "") +
      path.basename(ctx.from, ".xcss");

    // pre-populate applyPlugin ctx.applyRefs for #apply in addon/native.xcss
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
 * @type {import('@ekscss/cli').XCSSConfig}
 */
module.exports = {
  ...baseConfig,
  get banner() {
    return `/*!
* XCSS Framework [${bundleName}] v${pkg.version} - https://github.com/maxmilton/ekscss
* (c) 2025 Max Milton
* MIT Licensed - https://github.com/maxmilton/ekscss/blob/main/LICENSE
*/`;
  },
};
