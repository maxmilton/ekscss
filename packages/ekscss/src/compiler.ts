import * as stylis from "stylis";
import { map as _map, accessorsProxy, ctx, each, interpolate, xcss } from "./helpers.ts";
import { compileSourceMap } from "./sourcemap.ts";
import type { BuildHook, CompileOptions, CompileResult, Warning } from "./types.ts";

const beforeBuild: BuildHook[] = [];
const afterBuild: BuildHook[] = [];

export function onBeforeBuild(callback: BuildHook): void {
  beforeBuild.push(callback);
}

export function onAfterBuild(callback: BuildHook): void {
  afterBuild.push(callback);
}

export function compile(
  code: string,
  {
    rootDir = process.cwd(),
    from,
    to,
    plugins = [],
    functions = {},
    globals = {},
    map,
  }: CompileOptions = {},
): CompileResult {
  const middlewares = [...plugins, stylis.stringify];
  const fn = { each, map: _map, ...functions };
  const x = accessorsProxy(globals, "x");
  const dependencies: string[] = [];
  const warnings: Warning[] = [];

  if (from) dependencies.push(from);

  ctx.rootDir = rootDir;
  ctx.from = from;
  ctx.fn = fn;
  ctx.x = x;
  ctx.dependencies = dependencies;
  ctx.warnings = warnings;

  for (const run of beforeBuild) run();

  const interpolated = interpolate(code)(xcss, x, fn);
  const ast = stylis.compile(interpolated);
  const css = stylis.serialize(ast, stylis.middleware(middlewares));

  for (const run of afterBuild) run();

  // @ts-expect-error - reset ctx to initial state
  // dprint-ignore
  ctx.rootDir = ctx.from = ctx.fn = ctx.x = ctx.dependencies = ctx.warnings = undefined; // eslint-disable-line no-multi-assign

  return {
    css,
    map: map ? compileSourceMap(code, ast, rootDir, from, to, warnings) : undefined,
    dependencies,
    warnings,
  };
}
