/* eslint-disable no-param-reassign, no-restricted-syntax */

import * as stylis from 'stylis';
import {
  accessorsProxy,
  ctx,
  each,
  interpolate,
  map as _map,
  noop,
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
      each,
      map: _map,
      ...globals.fn,
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
  const warnings: Warning[] = [];
  const x = accessorsProxy(mergeDefaultGlobals(globals), 'x');

  if (from) dependencies.push(from);

  ctx.dependencies = dependencies;
  ctx.from = from;
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
      } catch (error) {
        warnings.push({
          code: 'plugin-load-error',
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Failed to load plugin "${plugin}"; ${error}`,
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
  const css = stylis.serialize(ast, stylis.middleware(middlewares));

  for (const fn of afterBuildFns) fn();

  // @ts-expect-error - reset for next compile
  // eslint-disable-next-line no-multi-assign
  ctx.dependencies = ctx.from = ctx.rootDir = ctx.warnings = ctx.x = undefined;

  let sourceMap;

  if (map) {
    if (!process.env.BROWSER) {
      sourceMap = compileSourceMap(ast, rootDir, from, to);
    } else {
      warnings.push({
        code: 'browser-no-sourcemap',
        message: 'Browser ekscss does not support sourcemaps',
      });
    }
  }

  return {
    css,
    dependencies,
    map: sourceMap,
    warnings,
  };
}
