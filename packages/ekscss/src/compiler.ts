/* eslint-disable no-restricted-syntax, prefer-object-spread */

import * as stylis from 'stylis';
import {
  map as _map,
  accessorsProxy,
  ctx,
  each,
  interpolate,
  xcss,
} from './helpers';
import { compileSourceMap } from './sourcemap';
import type {
  BuildHookFn,
  Warning,
  XCSSCompileOptions,
  XCSSCompileResult,
  XCSSGlobals,
} from './types';

const beforeBuildFns: BuildHookFn[] = [];
const afterBuildFns: BuildHookFn[] = [];

export function onBeforeBuild(callback: BuildHookFn): void {
  beforeBuildFns.push(callback);
}

export function onAfterBuild(callback: BuildHookFn): void {
  afterBuildFns.push(callback);
}

// TODO: Write tests that prove this doesn't mutate the original object.
// TODO: This is only a shallow clone, should we do a deep clone? Use structuredClone or klona
function mergeDefaultGlobals(globals: Partial<XCSSGlobals>): XCSSGlobals {
  const newGlobals = Object.assign({}, globals, {
    fn: Object.assign({}, globals.fn),
  });
  newGlobals.fn.each ??= each;
  newGlobals.fn.map ??= _map;
  return newGlobals as XCSSGlobals;
}

export function compile(
  code: string,
  {
    from,
    to,
    globals = {},
    plugins = [],
    rootDir = process.cwd(),
    map,
  }: XCSSCompileOptions = {},
): XCSSCompileResult {
  const middlewares = [...plugins, stylis.stringify];
  const dependencies: string[] = [];
  const warnings: Warning[] = [];
  const x = accessorsProxy(mergeDefaultGlobals(globals), 'x');

  if (from) dependencies.push(from);

  ctx.dependencies = dependencies;
  ctx.from = from;
  ctx.rootDir = rootDir;
  ctx.warnings = warnings;
  ctx.x = x;

  for (const fn of beforeBuildFns) fn();

  const interpolated = interpolate(code)(xcss, x);
  const ast = stylis.compile(interpolated);
  const css = stylis.serialize(ast, stylis.middleware(middlewares));

  for (const fn of afterBuildFns) fn();

  // @ts-expect-error - reset for next compile
  // eslint-disable-next-line no-multi-assign
  ctx.dependencies = ctx.from = ctx.rootDir = ctx.warnings = ctx.x = undefined;

  let sourceMap;

  if (map) {
    if (process.env.BROWSER) {
      warnings.push({
        code: 'browser-no-sourcemap',
        message: 'Browser runtime does not support sourcemap',
      });
    } else {
      sourceMap = compileSourceMap(ast, rootDir, from, to);
    }
  }

  return {
    css,
    dependencies,
    map: sourceMap,
    warnings,
  };
}
