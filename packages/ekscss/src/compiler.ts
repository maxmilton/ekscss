/* eslint-disable id-length, no-param-reassign */

import * as stylis from 'stylis';
import path from 'path';
import { SourceNode } from 'source-map';
import {
  globalsProxy,
  assignNullish,
  entries,
  interpolate,
  map as _map,
  xcssTag,
} from './helpers';
import {
  inlineImport,
  // middleware,
  // serialize,
  // stringify,
  sourcemap,
} from './middleware';
import type {
  Element,
  InternalData,
  Warning,
  XCSSCompileOptions,
  XCSSCompileResult,
} from './types';

const defaultGlobals = {
  fn: {
    setDefault: assignNullish,
    entries,
    map: _map,
  },
};

function mergeDefaultGlobals<T extends XCSSCompileOptions['globals']>(
  globals: T,
): typeof defaultGlobals & T {
  return {
    ...defaultGlobals,
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
  function nodeReducer(nodes: Element[], node: Element) {
    if (node.return) {
      switch (node.type) {
        case stylis.IMPORT: {
          const importedAst = node.__ast.map((importedNode) => {
            importedNode.root = importedNode.root || node;
            return importedNode;
          });
          nodes.push(importedAst.reduce(nodeReducer, []).flat());
          break;
        }
        default: {
          const relPath = path.relative(rootDir, node.root?.__from || from);
          nodes.push(
            new SourceNode(node.line, node.column, relPath, node.return),
          );
          break;
        }
      }
    }

    return nodes;
  }

  // TODO: Handle imported files with existing source maps
  const nodes = ast.reduce(nodeReducer, []).flat();
  // console.log('@@ NODES', nodes);

  const rootNode = new SourceNode(null, null, null, nodes);
  const sourceMap = rootNode.toStringWithSourceMap({
    file: to || from,
    sourceRoot: rootDir,
    // skipValidation: true, // performance improvement
  });
  // console.log('@@ MAP', map);

  return sourceMap;
}

export const internals: InternalData = {};

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
  const ctx = { from, rootDir };
  // const internals = {
  //   ctx,
  //   dependencies,
  //   g,
  //   warnings,
  // };
  internals.ctx = ctx;
  internals.dependencies = dependencies;
  internals.g = g;
  internals.warnings = warnings;

  // const allPlugins = [inlineImport, plugins, stringify].flat().filter(Boolean);
  const allPlugins = [inlineImport, plugins, stylis.stringify]
    .flat()
    .filter(Boolean);
  // const allPlugins = [inlineImport, plugins].flat().filter(Boolean);

  if (map) {
    allPlugins.push(sourcemap);
  }

  // const xcss = xcssTag(internals);
  const xcss = xcssTag();
  // FIXME: This is a very dodgy way to access the `xcss` tag in configs and will definitely break something if there is any async code
  global.xcss = xcss;
  const interpolated = interpolate(code)(xcss, g);
  // const interpolated = interpolate(code)(xcssTag(internals), g);
  const ast = stylis.compile(interpolated);
  // const output = serialize(ast, middleware(allPlugins), internals);
  const output = stylis.serialize(ast, stylis.middleware(allPlugins));

  // FIXME: The template interpolation needs to be handled in source maps

  // FIXME: Nodes can be serialize(copy())'d in middleware causing the AST to
  // be incorrect leading to incorrect source maps -- we need to capture the
  // true final AST after all the plugins have run

  let sourceMap;

  if (map) {
    // console.log('@@ AST');
    // console.dir(ast, { depth: null });
    const rawSourceMap = compileSourceMap(ast, rootDir, from, to);
    sourceMap = rawSourceMap?.map.toJSON();

    console.log('!! XCSS MAP', rawSourceMap);

    if (
      from === '/home/max/Projects/trackx/packages/web-app/src/css/index.xcss'
    ) {
      console.log('!! XCSS FROM', from);
      console.log('!! XCSS MAP', sourceMap);
    }
  }

  // let sourceMap;

  // // TODO: Move this logic into another place
  // if (map && internals.rawSourceMaps && internals.rawSourceMaps.length) {
  //   const rootNode = new SourceNode(null, null, null, internals.rawSourceMaps);
  //   const rawSourceMap = rootNode.toStringWithSourceMap({
  //     file: to || from,
  //     sourceRoot: rootDir,
  //     skipValidation: true, // improved performance
  //   });
  //   sourceMap = rawSourceMap.map.toJSON();
  //   console.log('@@@@@@@ rawSourceMap', rawSourceMap);
  // }

  internals.ctx = null;
  internals.dependencies = null;
  internals.g = null;
  internals.warnings = null;

  return {
    css: output,
    dependencies,
    map: sourceMap,
    warnings,
  };
}
