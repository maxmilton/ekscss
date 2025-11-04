"use strict";

const { applyPlugin } = require("@ekscss/plugin-apply");
const { importPlugin } = require("@ekscss/plugin-import");
const { default: Color } = require("color");
const { merge } = require("dset/merge");
const { ctx, interpolate, stylis, xcss } = require("ekscss");

/** @typedef {import("color").ColorInstance} ColorInstance */
/** @typedef {ColorInstance | string | ArrayLike<number> | number | { [key: string]: any }} ColorParam */
/** @typedef {import("ekscss").Globals} Globals */
/** @typedef {import("ekscss").Expression} Expression */
/** @typedef {import("ekscss").ExpressionOrNested} ExpressionOrNested */

/**
 * @see https://github.com/Qix-/color#readme
 * @param {ColorParam | ((x: Globals) => Expression)} value - A value
 * the `color` package `Color` constructor accepts or an XCSS template
 * expression function which will resolve to such a value.
 * @param {Parameters<typeof Color>[1]} [model]
 * @returns {ColorInstance}
 */
function color(value, model) {
  return Color(
    value instanceof Color || typeof value !== "function"
      ? value
      : // @ts-expect-error - TODO: Correctly type `value`
        xcss`${value}`,
    model,
  );
}

/**
 * Preload #apply references without including the actual content in your final
 * build result. This allows you to use #apply in any file even when a reference
 * doesn't exist in the file. By default it will include everything in level2.
 *
 * Use by calling this function in `onBeforeBuild`:
 *
 * @example
 * import { onBeforeBuild } from "ekscss";
 * import { preloadApply } from "@ekscss/framework/utils";
 * onBeforeBuild(preloadApply);
 *
 * @param code - The XCSS code to preload, default is `"@import '@ekscss/framework/level2.xcss';"`.
 * @returns {void}
 */
function preloadApply(code = "@import '@ekscss/framework/level2.xcss';") {
  const oldDependencies = [...ctx.dependencies];
  const oldWarnings = [...ctx.warnings];

  const interpolated = interpolate(code)(xcss, ctx.x, ctx.fn);
  const ast = stylis.compile(interpolated);
  stylis.serialize(ast, stylis.middleware([importPlugin, applyPlugin]));

  // Reset ctx values which may have changed in importPlugin or applyPlugin
  ctx.dependencies.length = 0;
  ctx.dependencies.push(...oldDependencies);
  ctx.warnings.length = 0;
  ctx.warnings.push(...oldWarnings);
}

/**
 * Ignore imports of the given files when using `@ekscss/plugin-import` (which
 * is included by default in `@ekscss/framework`).
 *
 * Use by calling this function in `onBeforeBuild`:
 *
 * @example
 * import { resolve } from "node:path";
 * import { onBeforeBuild } from "ekscss";
 * import { ignoreImport } from "@ekscss/framework/utils";
 * onBeforeBuild(ignoreImport(resolve("@ekscss/framework/level2/a11y.xcss"), resolve("path/to/file.xcss")));

 * @param {...string} files - A list of fully resolved file paths to ignore.
 * @returns {void}
 */
function ignoreImport(...files) {
  // HACK: Cheeky abuse of ctx to stop unwanted style imports. Assumes import
  // logic prevents loading files which are already listed in dependencies.
  ctx.dependencies.push(...files);
}

/** @typedef {Omit<import("ekscss").CompileOptions, 'from' | 'to'>} Config */

/**
 * Extend an XCSS configuration with your own.
 *
 * @param {Config} target
 * @param {Config} source
 * @returns {Config}
 */
function extend(target, source) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return merge(target, source);
}

/** @typedef {Exclude<Expression, function>} ResolvedExpression */
/** @typedef {Dict<ResolvedExpression | ResolvedOrNested>} ResolvedOrNested */

/**
 * @param {Dict<ExpressionOrNested>} globals
 * @returns {ResolvedOrNested}
 */
function resolveGlobals(globals) {
  /** @type {ResolvedOrNested} */
  const resolved = {};

  for (const [key, value] of Object.entries(globals)) {
    let val = value;

    // Reduce XCSS function expressions to their final value
    while (typeof val === "function") {
      val = val(ctx.x, ctx.fn);
    }

    resolved[key] =
      typeof val === "object" && val !== null && !Array.isArray(val) ? resolveGlobals(val) : val;
  }

  return resolved;
}

/**
 * Get an XCSS Config's globals with all XCSS function expressions resolved.
 *
 * @param {Config} config - An XCSS configuration object.
 * @returns {ResolvedOrNested}
 */
function getGlobals(config) {
  if (!config.globals || Object.keys(config.globals).length === 0) {
    return {};
  }

  ctx.fn = { ...config.functions };
  ctx.x = { ...config.globals };
  ctx.warnings = [];

  const resolved = resolveGlobals(ctx.x);

  // @ts-expect-error - reset ctx values
  // eslint-disable-next-line no-multi-assign
  ctx.fn = ctx.x = ctx.warnings = undefined;

  return resolved;
}

exports.color = color;
exports.preloadApply = preloadApply;
exports.ignoreImport = ignoreImport;
exports.extend = extend;
exports.getGlobals = getGlobals;
