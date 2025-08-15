import * as stylis from "stylis";
import { accessorsProxy, ctx, each, interpolate, map as _map, xcss } from "./helpers.ts";
import { compileSourceMap } from "./sourcemap.ts";
import type { BuildHookFn, CompileOptions, CompileResult, Globals, Warning } from "./types.ts";

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
function mergeDefaultGlobals(globals: Partial<Globals>): Globals {
  // eslint-disable-next-line prefer-object-spread
  const newGlobals = Object.assign({}, globals, {
    // eslint-disable-next-line prefer-object-spread
    fn: Object.assign({}, globals.fn),
  });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  newGlobals.fn.each ??= each;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  newGlobals.fn.map ??= _map;
  return newGlobals as Globals;
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
  }: CompileOptions = {},
): CompileResult {
  const middlewares = [...plugins, stylis.stringify];
  const dependencies: string[] = [];
  const warnings: Warning[] = [];
  const x = accessorsProxy(mergeDefaultGlobals(globals), "x");

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

  // @ts-expect-error - resetting ctx to initial state
  // dprint-ignore
  ctx.dependencies = ctx.from = ctx.rootDir = ctx.warnings = ctx.x = undefined; // eslint-disable-line no-multi-assign

  return {
    css,
    map: map ? compileSourceMap(code, ast, rootDir, from, to, warnings) : undefined,
    dependencies,
    warnings,
  };
}
