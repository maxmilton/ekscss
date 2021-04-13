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
const noop = () => {};

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
      try {
        // eslint-disable-next-line
        const mod = require(plugin);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        plugin = (mod.default || mod) as Middleware;
      } catch (err) {
        warnings.push({
          code: 'plugin-load-error',
          message: `Failed to load plugin "${plugin.toString()}"; ${(err as Error).toString()}`,
          file: __filename,
        });
        plugin = noop;
      }
    }
    return plugin;
  });
  middlewares.push(stylis.stringify);

  for (const fn of beforeBuildFns) fn();

  const interpolated = interpolate(code)(xcssTag(), x);
  const ast = stylis.compile(interpolated);
  const output = stylis.serialize(ast, stylis.middleware(middlewares));

  // @ts-expect-error - reset for next compile
  // eslint-disable-next-line no-multi-assign
  ctx.dependencies = ctx.from = ctx.rawX = ctx.rootDir = ctx.warnings = ctx.x = undefined;

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
