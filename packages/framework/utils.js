/* eslint-disable @typescript-eslint/no-var-requires */

const { applyPlugin } = require('@ekscss/plugin-apply');
const { importPlugin } = require('@ekscss/plugin-import');
const Color = require('color');
const { merge } = require('dset/merge');
const { ctx, interpolate, xcss } = require('ekscss');
const stylis = require('stylis');

/** @typedef {Color | string | ArrayLike<number> | number | { [key: string]: any }} ColorParam */
/** @typedef {import('ekscss').XCSSGlobals} XCSSGlobals */
/** @typedef {import('ekscss').XCSSExpression} XCSSExpression */

/**
 * @see https://github.com/Qix-/color#readme
 * @param {ColorParam | ((x: XCSSGlobals) => XCSSExpression)} value - A value
 * the `color` package `Color` constructor accepts or an XCSS template
 * expression function which will resolve to such a value.
 * @param {Parameters<typeof Color>[1]} model
 */
function color(value, model) {
  let val = value;

  // Reduce XCSS function expressions to their final value
  while (typeof val === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    val = val(ctx.x);
  }

  return Color(val, model);
}

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

/**
 * @typedef {Omit<import('ekscss').XCSSCompileOptions, 'from' | 'to'>} XCSSConfig
 */

/**
 * Extend an XCSS configuration with your own.
 *
 * @param {XCSSConfig} target
 * @param {XCSSConfig} source
 * @returns {XCSSConfig}
 */
function extend(target, source) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return merge(target, source);
}

exports.preloadApply = preloadApply;
exports.extend = extend;
