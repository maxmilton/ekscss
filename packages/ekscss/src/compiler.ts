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
  ctx.raw = map ? code : undefined;
  ctx.pos = map ? new Map<string | undefined, number[]>() : undefined;
  ctx.fn = fn;
  ctx.x = x;
  ctx.dependencies = dependencies;
  ctx.warnings = warnings;

  try {
    for (const run of beforeBuild) run();

    const interpolated = interpolate(code)(xcss, x, fn);
    const ast = stylis.compile(interpolated);
    const css = stylis.serialize(ast, stylis.middleware(middlewares));

    for (const run of afterBuild) run();

    return {
      css,
      map: map ? compileSourceMap(interpolated, ast, to) : undefined,
      dependencies,
      warnings,
    };
  } finally {
    // @ts-expect-error - reset ctx for next compile
    // biome-ignore format: Reset ctx
    ctx.rootDir = ctx.from = ctx.raw = ctx.pos = ctx.fn = ctx.x = ctx.dependencies = ctx.warnings = undefined; // eslint-disable-line no-multi-assign
  }
}
