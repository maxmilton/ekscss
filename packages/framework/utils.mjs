/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { applyPlugin } from "@ekscss/plugin-apply";
import { importPlugin } from "@ekscss/plugin-import";
import Color from "color";
import { merge } from "dset/merge";
import { ctx, interpolate, stylis, xcss } from "ekscss";

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
export function color(value, model) {
  return Color(
    value instanceof Color || typeof value !== "function"
      ? value
      // @ts-expect-error - TODO: Correctly type `value`
      : xcss`${value}`,
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
export function preloadApply(
  code = "@import '@ekscss/framework/level2.xcss';",
) {
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
 * Ignore imports of the given files when using `@ekscss/plugin-import` (which
 * is included by default in `@ekscss/framework`).
 *
 * Use by calling this function in `onBeforeBuild`:
 *
 * @example
 * import { resolve } from "node:path";
 * import { onBeforeBuild } from "ekscss";
 * import { ignoreImport } from "@ekscss/framework/utils";
 * onBeforeBuild(ignoreImport(resolve("path/to/file1.xcss"), resolve("path/to/file2.xcss")));

 * @param {...string} files - A list of fully resolved file paths to ignore.
 * @returns {void}
 */
export function ignoreImport(...files) {
  // HACK: Cheeky abuse of ctx to stop unwanted style imports.
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
export function extend(target, source) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return merge(target, source);
}

/** @typedef {Exclude<Expression, function>} ResolvedExpression */
/** @typedef {{ [key: string]: ResolvedExpression | ResolvedExpressionOrNested }} ResolvedExpressionOrNested */
/** @typedef {{ [key: string]: ResolvedExpressionOrNested } & { fn: Globals['fn'] }} ResolvedGlobals */

/**
 * @param {Record<string, ExpressionOrNested>} obj
 * @returns {ResolvedExpressionOrNested}
 */
export function resolveGlobals(obj) {
  /** @type {ResolvedExpressionOrNested} */
  const resolved = {};

  for (const [key, value] of Object.entries(obj)) {
    let val = value;

    // Reduce XCSS function expressions to their final value
    while (typeof val === "function") {
      val = val(ctx.x);
    }

    resolved[key] = val != null && typeof val === "object" && !Array.isArray(val)
      ? resolveGlobals(val)
      : val;
  }

  return resolved;
}

/**
 * Get an XCSS Config's globals with all XCSS function expressions resolved.
 *
 * @param {Config} config - An XCSS configuration object.
 * @returns {ResolvedGlobals}
 */
export function getGlobals(config) {
  if (!config.globals || Object.keys(config.globals).length === 0) {
    return { fn: {} };
  }

  /** @type {Globals} */
  const globals = {
    ...config.globals,
    fn: config.globals.fn ?? {},
  };

  ctx.warnings = [];
  ctx.x = globals;

  const { fn, ...globalVars } = globals;
  /** @type {ResolvedGlobals} */
  // @ts-expect-error - TODO: Fix Resolved* types
  const resolved = resolveGlobals(globalVars);
  resolved.fn = fn;

  // @ts-expect-error - resetting ctx values
  // eslint-disable-next-line no-multi-assign
  ctx.warnings = ctx.x = undefined;

  return resolved;
}
