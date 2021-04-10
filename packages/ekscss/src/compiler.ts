/* eslint-disable no-param-reassign, no-restricted-syntax, no-underscore-dangle */

import path from 'path';
import { SourceNode } from 'source-map';
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
import type {
  BuildHookFn,
  Element,
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

function compileSourceMap(
  ast: Element[],
  rootDir: string,
  from?: string,
  to?: string,
) {
  function nodeReducer(nodes: SourceNode[], node: Element) {
    if (node.return) {
      // importPlugin adds __ast and __from after the @import'd contents are compiled
      if (node.__ast) {
        const importAst = node.__ast
          .map((importedNode) => {
            importedNode.root ??= node;
            return importedNode;
          })
          .reduce(nodeReducer, []);

        for (const importedNode of importAst) {
          nodes.push(importedNode);
        }
      } else {
        const srcFrom = node.root?.__from || from;
        const srcPath = srcFrom ? path.relative(rootDir, srcFrom) : '<unknown>';
        nodes.push(
          new SourceNode(node.line!, node.column!, srcPath, node.return),
        );
      }
    }

    return nodes;
  }

  const nodes = ast.reduce(nodeReducer, []);
  const rootNode = new SourceNode(null, null, null, nodes);
  const pathTo = to || from;
  const sourceRoot = pathTo ? path.dirname(pathTo) : rootDir;
  return rootNode.toStringWithSourceMap({
    file: pathTo && path.relative(sourceRoot, pathTo),
    sourceRoot,
    skipValidation: true, // better performance
  });
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

  // TODO: Documentation:
  // - Explain our template engine and link to supporting docs:
  //  ↳ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
  //  ↳ https://tc39.es/ecma262/#sec-tagged-templates
  // - State of source map support
  // - How to comment expressions in templates

  // FIXME: The template interpolation needs to be handled in source maps... and
  // can it be done in a way that has zero or near-zero performance impact when
  // sourcemaps are off?

  // FIXME: Nodes can be serialize(copy())'d in middleware causing `ast` to
  // be incorrect leading to incorrect source maps -- we need to capture the
  // true final AST after all the plugins have run
  //  ↳ https://github.com/thysultan/stylis.js/blob/master/src/Middleware.js#L42

  // TODO: Handle @import'd files with existing source maps

  // TODO: Souce map `file` and `sourceRoot` include the build system's full
  // path but that's not useful when deployed (but is for development?)

  // TODO: Document sourcemaps build performance impact (about 20% extra time,
  // but do benchmarks to verify)

  let sourceMap;

  if (map) {
    const compiledMap = compileSourceMap(ast, rootDir, from, to);
    sourceMap = compiledMap.map.toJSON();
  }

  return {
    css: output,
    dependencies,
    map: sourceMap,
    warnings,
  };
}
