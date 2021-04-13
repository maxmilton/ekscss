/* eslint-disable no-param-reassign, no-restricted-syntax */

import * as stylis from 'stylis';
import {
  applyDefault,
  combineEntries,
  combineMap,
  ctx,
  globalsProxy,
  interpolate,
  xcssTag,
} from './helpers';
import { compileSourceMap } from './sourcemap';
import type {
  BuildHookFn,
  Middleware,
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

function mergeDefaultGlobals(globals: Partial<XCSSGlobals>) {
  return {
    ...globals,
    fn: {
      default: applyDefault,
      entries: combineEntries,
      map: combineMap,
      ...(globals.fn || {}),
    },
  };
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
  const dependencies: string[] = [];
  if (from) dependencies.push(from);
  const warnings: Warning[] = [];
  const rawX = mergeDefaultGlobals(globals);
  const x = globalsProxy(rawX, 'x');

  ctx.dependencies = dependencies;
  ctx.from = from;
  ctx.rawX = rawX;
  ctx.rootDir = rootDir;
  ctx.warnings = warnings;
  ctx.x = x;

  const middlewares = plugins.map((plugin) => {
    // load plugins which are package name strings (e.g., from JSON configs)
    if (typeof plugin === 'string') {
      // eslint-disable-next-line
      const mod = require(plugin);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      plugin = (mod.default || mod) as Middleware;
    }
    return plugin;
  });
  middlewares.push(stylis.stringify);

  for (const fn of beforeBuildFns) fn();

  const interpolated = interpolate(code)(xcssTag(), x);
  const ast = stylis.compile(interpolated);
  const output = stylis.serialize(ast, stylis.middleware(middlewares));

  // @ts-expect-error - reset for next compile
  ctx.dependencies = undefined;
  ctx.from = undefined;
  // @ts-expect-error - reset for next compile
  ctx.rawX = undefined;
  // @ts-expect-error - reset for next compile
  ctx.rootDir = undefined;
  // @ts-expect-error - reset for next compile
  ctx.warnings = undefined;
  // @ts-expect-error - reset for next compile
  ctx.x = undefined;

  for (const fn of afterBuildFns) fn();

  let sourceMap;

  if (map) {
    sourceMap = compileSourceMap(ast, rootDir, from, to);
  }

  return {
    css: output,
    dependencies,
    map: sourceMap,
    warnings,
  };
}
