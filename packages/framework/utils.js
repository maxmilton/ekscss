/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

const { applyPlugin } = require('@ekscss/plugin-apply');
const { importPlugin } = require('@ekscss/plugin-import');
const { ctx, interpolate, xcssTag } = require('ekscss');
const stylis = require('stylis');

/**
 * Preload #apply references without including the actual content in your final
 * build result. By default it will include everything in level2.
 *
 * Note: If other plugins modify or depend upon ctx values they may break when
 * used together with this function.
 *
 * Use by calling this function in `onBeforeBuild`:
 *
 * @example
 * const { onBeforeBuild } = require('ekscss');
 * const { preloadApply } = require('@ekscss/framework/utils');
 * onBeforeBuild(preloadApply);
 */
function preloadApply(code = "@import '@ekscss/framework/level2.xcss';") {
  const interpolated = interpolate(code)(xcssTag(), ctx.x);
  const ast = stylis.compile(interpolated);
  stylis.serialize(ast, stylis.middleware([importPlugin, applyPlugin]));
  // reset ctx values which may have changed in importPlugin or applyPlugin
  ctx.dependencies.length = 0;
  ctx.warnings.length = 0;
  if (ctx.from) ctx.dependencies.push(ctx.from);
}

exports.preloadApply = preloadApply;
