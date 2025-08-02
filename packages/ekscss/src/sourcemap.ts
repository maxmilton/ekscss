/* eslint-disable no-underscore-dangle, unicorn/no-array-reduce */

// TODO: Documentation:
// - Explain our template engine and link to supporting docs:
//  ↳ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
//  ↳ https://tc39.es/ecma262/#sec-tagged-templates
// - State of source map support
// - How to comment expressions in templates (it's actually not really possible
//   depending on the context)

// FIXME: The template interpolation needs to be handled in source maps... and
// can it be done in a way that has zero or near-zero performance impact when
// sourcemaps are off?

// FIXME: Nodes can be serialize(copy())'d in middleware causing the AST to
// be incorrect leading to incorrect source maps -- we need to capture the
// true final AST after all the plugins have run
//  ↳ https://github.com/thysultan/stylis.js/blob/master/src/Middleware.js#L42

// TODO: Source map `file` and `sourceRoot` include the build system's full
// path but that's not useful when deployed (but is for development?)

// TODO: Document source map build performance impact (about 20% extra time,
// but do benchmarks to verify)

// TODO: Document @import'd files will have their source map applied if they
// end with a source map URL ref comment and block or inline comment is OK:
// - /*# sourceMappingURL=... */
// - //# sourceMappingURL=...
// - Spec: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.lmz475t4mvbx

import path from "path";
import { type SourceMapGenerator, SourceNode } from "source-map-js";
import * as stylis from "stylis";
import type { Element } from "./types.ts";

function extractSourceMapRef(ast: Element[]): string | null {
  let currentNode: Element;
  let index = 0;

  // look through the last 3 AST nodes to try find a source map ref comment
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-cond-assign
  while (++index < 4 && (currentNode = ast[ast.length - index])) {
    if (
      currentNode.type === stylis.COMMENT
      // FIXME: stylis types don't differentiate by Element.type so we must
      // type guard unnecessarily (even though currentNode.type=='comm' will
      // always have currentNode.children as a string)
      && typeof currentNode.children === "string"
      && currentNode.children.startsWith("# sourceMappingURL=")
    ) {
      // 19 = '# sourceMappingURL='.length
      return currentNode.children.slice(19).trim();
    }
  }

  return null;
}

export function compileSourceMap(
  ast: Element[],
  rootDir: string,
  from?: string,
  to?: string,
): SourceMapGenerator {
  function nodeReducer(nodes: SourceNode[], node: Element) {
    if (node.return) {
      // importPlugin adds __ast and __from after the @import'd contents are compiled
      if (node.__ast) {
        // TODO: Is it safe to assume the root source file (the one doing the
        // top level @import) will not have a source map ref comment? Should it
        // always be treated as a pure XCSS source file (only @import'd files
        // checked for source map URL refs, which is what happens now)?
        const sourceMapRef = extractSourceMapRef(node.__ast);

        if (sourceMapRef) {
          // eslint-disable-next-line no-console
          console.debug(
            "ekscss does not currently apply input source maps\n  ref:",
            sourceMapRef,
          );
        }

        const importAst = node.__ast
          .map((importedNode) => {
            // eslint-disable-next-line no-param-reassign
            importedNode.root ??= node;
            return importedNode;
          })
          .reduce(nodeReducer, []);

        for (const importedNode of importAst) {
          nodes.push(importedNode);
        }
      } else {
        const srcFrom = node.root?.__from ?? from;
        const srcPath = srcFrom ? path.relative(rootDir, srcFrom) : "<unknown>";
        nodes.push(
          new SourceNode(node.line, node.column, srcPath, node.return),
        );
      }
    }

    return nodes;
  }

  const nodes = ast.reduce(nodeReducer, []);
  const rootNode = new SourceNode();
  // @ts-expect-error - bad upstream types
  rootNode.add(nodes);

  const pathTo = to ?? from;
  const sourceRoot = pathTo ? path.dirname(pathTo) : rootDir;
  // @ts-expect-error - TODO: file should take undefined
  const result = rootNode.toStringWithSourceMap({
    file: pathTo && path.relative(sourceRoot, pathTo),
    sourceRoot,
  });

  return result.map;
}
