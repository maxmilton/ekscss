/* eslint-disable @typescript-eslint/no-var-requires */

const { applyPlugin } = require('@ekscss/plugin-apply');
const { importPlugin } = require('@ekscss/plugin-import');
const { ctx, interpolate, xcss } = require('ekscss');
const stylis = require('stylis');

/**
 * Preload #apply references without including the actual content in your final
 * build result. This allows you to use #apply in any file even when a reference
 * doesn't exist in the file. By default it will include everything in level2.
 *
 * Use by calling this function in `onBeforeBuild`:
 *
 * @example
 * const { onBeforeBuild } = require('ekscss');
 * const { preloadApply } = require('@ekscss/framework/utils');
 * onBeforeBuild(preloadApply);
 *
 * @param code - The XCSS code to preload, default is `"@import '@ekscss/framework/level2.xcss';"`.
 */
function preloadApply(code = "@import '@ekscss/framework/level2.xcss';") {
  const oldDependencies = [...ctx.dependencies];
  const oldWarnings = [...ctx.warnings];

  const interpolated = interpolate(code)(xcss, ctx.x);
  const ast = stylis.compile(interpolated);
  stylis.serialize(ast, stylis.middleware([importPlugin, applyPlugin]));

  // reset ctx values which may have changed in importPlugin or applyPlugin
  ctx.dependencies.length = 0;
  ctx.dependencies.push(...oldDependencies);
  ctx.warnings.length = 0;
  ctx.warnings.push(...oldWarnings);
}

exports.preloadApply = preloadApply;
