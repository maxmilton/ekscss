// TODO: Documentation:
// - Explain our template engine and link to supporting docs:
//  ↳ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
//  ↳ https://tc39.es/ecma262/#sec-tagged-templates
// - State of source map support
// - How to comment expressions in templates (it's actually not really possible
//   depending on the context)
// - Source map build performance impact (include benchmarks).
// - That @import'd files will have their source map applied if they end with a
//   source map URL ref comment:
//   ↳ /*# sourceMappingURL=... */
//   ↳ //# sourceMappingURL=...
//   ↳ Spec: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.lmz475t4mvbx

// FIXME: Template interpolation needs to be handled in source maps... and can
// it be done in a way that has zero or near-zero performance impact when
// sourcemaps are off?

/* eslint-disable @typescript-eslint/prefer-for-of, no-underscore-dangle, unicorn/no-for-loop */

import path from "node:path";
import {
  addMapping,
  GenMapping,
  maybeAddMapping,
  setSourceContent,
  toEncodedMap,
} from "@jridgewell/gen-mapping";
import * as stylis from "stylis";
import type { Element, RawSourceMap, Warning } from "./types.ts";

function extractSourceMapRef(ast: Element[]): string | null {
  let currentNode: Element;
  let index = 0;

  // Look through the last 3 AST nodes to try find a source map ref comment
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-cond-assign
  while (++index < 4 && (currentNode = ast[ast.length - index])) {
    // NOTE: In stylis, comment nodes always have a string children value.
    if (
      currentNode.type === stylis.COMMENT
      && (currentNode.children as string).startsWith("# sourceMappingURL=")
    ) {
      return (currentNode.children as string).slice("# sourceMappingURL=".length).trim();
    }
  }

  return null;
}

export function compileSourceMap(
  code: string,
  ast: Element[],
  rootDir: string,
  from: string | undefined,
  to: string | undefined,
  warnings: Warning[],
): RawSourceMap | undefined {
  if (process.env.BROWSER) {
    warnings.push({
      code: "browser-no-sourcemap",
      message: "Browser runtime does not support sourcemap",
    });
    return undefined;
  }

  const sourcePath = to ?? from;
  const sourceRoot = sourcePath ? path.dirname(sourcePath) : rootDir;

  const map = new GenMapping({
    file: to ? path.relative(sourceRoot, to) : null,
    sourceRoot: path.relative(sourceRoot, rootDir),
  });

  setSourceContent(map, from ? path.relative(rootDir, from) : "<unknown>", code);

  // NOTE: Stylis stringify transforms the AST into a single line string, so we
  // only need to track the generated output column position.
  let position = 0;

  function walk(children: Element[], parent: Element | null) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];

      if (node.return) {
        if ("__ast" in node) {
          // FIXME: Use `@jridgewell/remapping` to combine source maps.
          const sourceMapRef = extractSourceMapRef(node.__ast);
          if (sourceMapRef) {
            // eslint-disable-next-line no-console
            console.warn("Skipping input source map (not yet supported):", sourceMapRef);
          }

          setSourceContent(map, path.relative(rootDir, node.__from!), node.__code!);

          walk(node.__ast, node);
        } else {
          const srcFrom = parent?.__from ?? from;
          const srcPath = srcFrom ? path.relative(rootDir, srcFrom) : "<unknown>";

          maybeAddMapping(map, {
            generated: {
              line: 1,
              column: position,
            },
            source: srcPath,
            original: {
              line: node.line,
              column: node.column,
            },
          });

          position += node.return.length;
        }
      }
    }
  }

  walk(ast, null);

  return {
    _map: map,
    addMapping(mapping) {
      addMapping(map, mapping);
    },
    toString() {
      return JSON.stringify(toEncodedMap(map));
    },
    toJSON() {
      return toEncodedMap(map);
    },
  };
}
