/* eslint-disable id-length, no-param-reassign */

import path from 'path';
import { SourceNode } from 'source-map';
import * as stylis from 'stylis';
import {
  assignNullish,
  ctx,
  entries,
  globalsProxy,
  interpolate,
  map as _map,
  xcssTag,
} from './helpers';
import { inlineImport } from './middleware';
import type {
  Element,
  Warning,
  XCSSCompileOptions,
  XCSSCompileResult,
} from './types';

const defaultGlobals = {
  fn: {
    default: assignNullish,
    entries,
    map: _map,
  },
};

function mergeDefaultGlobals<T extends XCSSCompileOptions['globals']>(
  globals: T,
): typeof defaultGlobals & T {
  return {
    // ...defaultGlobals, // TODO: Remove? No top level props
    ...globals,

    fn: {
      ...defaultGlobals.fn,
      ...(globals?.fn || {}),
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
      // @import nodes have .__ast after the import'd contents are compiled
      if (node.__ast) {
        const importAst = node.__ast
          .map((importedNode) => {
            importedNode.root ??= node;
            return importedNode;
          })
          .reduce(nodeReducer, []);

        // eslint-disable-next-line no-restricted-syntax
        for (const importedNode of importAst) {
          nodes.push(importedNode);
        }
      } else {
        const relPath = path.relative(
          rootDir,
          (node.root && node.root.__from) || from,
        );
        nodes.push(
          new SourceNode(node.line, node.column, relPath, node.return),
        );
      }
    }

    return nodes;
  }

  // TODO: Handle @import'd files with existing source maps
  const nodes = ast.reduce(nodeReducer, []);

  const rootNode = new SourceNode(null, null, null, nodes);
  const sourceMap = rootNode.toStringWithSourceMap({
    file: to || from,
    sourceRoot: rootDir,
    skipValidation: true, // better performance
  });

  return sourceMap;
}

export function compile(
  code: string,
  {
    from,
    to,
    globals = {},
    plugins = [stylis.prefixer],
    rootDir = process.cwd(),
    map = true,
  }: XCSSCompileOptions = {},
): XCSSCompileResult {
  const dependencies: string[] = [];
  if (from) dependencies.push(from);
  const warnings: Warning[] = [];
  const g = globalsProxy(mergeDefaultGlobals(globals), 'g', warnings);

  ctx.dependencies = dependencies;
  ctx.from = from;
  ctx.g = g;
  ctx.rootDir = rootDir;
  ctx.warnings = warnings;

  const allPlugins = [inlineImport, ...plugins, stylis.stringify];

  const interpolated = interpolate(code)(xcssTag(), g);
  const ast = stylis.compile(interpolated);
  const output = stylis.serialize(ast, stylis.middleware(allPlugins));

  // FIXME: The template interpolation needs to be handled in source maps

  // FIXME: Nodes can be serialize(copy())'d in middleware causing `ast` to
  // be incorrect leading to incorrect source maps -- we need to capture the
  // true final AST after all the plugins have run
  //  ↳ https://github.com/thysultan/stylis.js/blob/master/src/Middleware.js#L42

  // TODO: Souce map `file` and `sourceRoot` include the build system's full
  // path but that's not useful when deployed (but is for development?)

  let sourceMap;

  if (map) {
    const rawSourceMap = compileSourceMap(ast, rootDir, from, to);
    sourceMap = rawSourceMap.map.toJSON();
  }

  ctx.dependencies = null;
  ctx.from = null;
  ctx.g = null;
  ctx.rootDir = null;
  ctx.warnings = null;

  // for (const key in ctx) {
  //   ctx[key] = null;
  // }

  return {
    css: output,
    dependencies,
    map: sourceMap,
    warnings,
  };
}
