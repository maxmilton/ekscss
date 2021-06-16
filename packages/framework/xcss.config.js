/* eslint-disable @typescript-eslint/no-var-requires */

'use strict'; // eslint-disable-line strict, lines-around-directive

const { ctx, onBeforeBuild } = require('ekscss');
const path = require('path');
const pkg = require('./package.json');
const baseConfig = require('./config');
const { preloadApply } = require('./utils');

/** @type {string} */
let bundleName;

onBeforeBuild(() => {
  if (ctx.from) {
    bundleName = (ctx.from.includes('/addon/') ? 'addon/' : '')
      + path.basename(ctx.from, '.xcss');

    // pre-populate ctx.applyRefs in applyPlugin for #apply use in native addon
    if (ctx.from.endsWith('framework/addon/native.xcss')) {
      preloadApply("@import './level2.xcss';");
    }
  }
});

/**
 * XCSS config specifically for building the @ekscss/framework dist files.
 *
 * Note: This config **should not be reused** in other projects. What you probably
 * want is `@ekscss/framework/config`.
 *
 * @type {import('@ekscss/cli').XCSSConfig}
 */
module.exports = {
  ...baseConfig,
  get banner() {
    return `/*!
* XCSS Framework [${bundleName}] v${pkg.version} - https://github.com/maxmilton/ekscss
* (c) 2021 Max Milton
* MIT Licensed - https://github.com/maxmilton/ekscss/blob/main/LICENSE
*/`;
  },
};
