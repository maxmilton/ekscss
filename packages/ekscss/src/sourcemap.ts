// TODO: Documentation:
// - Explain our template engine and link to supporting docs:
//  ↳ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
//  ↳ https://tc39.es/ecma262/#sec-tagged-templates
// - How to comment expressions in templates (not possible depending on the context)
// - Source map build performance impact (include benchmarks).
// - That @import'd files will have their source map applied if they end with a
//   source map URL ref comment:
//   ↳ /*# sourceMappingURL=... */
//   ↳ //# sourceMappingURL=...
//   ↳ Spec: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.lmz475t4mvbx

/* eslint-disable @typescript-eslint/prefer-for-of, no-param-reassign, no-underscore-dangle, prefer-destructuring, unicorn/no-for-loop */

import fs from "node:fs";
import path from "node:path";
import {
  addMapping,
  type EncodedSourceMap,
  GenMapping,
  maybeAddMapping,
  setSourceContent,
  toEncodedMap,
} from "@jridgewell/gen-mapping";
import remapping, { type SourceMapInput } from "@jridgewell/remapping";
import * as stylis from "stylis";
import { ctx } from "./helpers.ts";
import type { Element, RawSourceMap } from "./types.ts";

function extractSourceMapRef(ast: Element[]): string | null {
  const prefix = "# sourceMappingURL=";

  // Look through the last 3 AST nodes to try find a source map ref comment
  for (let i = 1; i <= 3 && i <= ast.length; i++) {
    const node = ast[ast.length - i];

    // NOTE: In stylis, comment nodes always have a string children value.
    if (node.type === stylis.COMMENT && (node.children as string).startsWith(prefix)) {
      return (node.children as string).slice(prefix.length).trim();
    }
  }

  return null;
}

function loadSourceMap(ref: string, importerFile: string): EncodedSourceMap | undefined {
  try {
    const dataUriMatch = /^data:application\/json(?:;charset=[^;]+)?;base64,(.+)$/.exec(ref);

    if (dataUriMatch) {
      return JSON.parse(
        Buffer.from(dataUriMatch[1], "base64").toString("utf8"),
      ) as EncodedSourceMap;
    }

    const mapPath = path.resolve(path.dirname(importerFile), ref);
    return JSON.parse(fs.readFileSync(mapPath, "utf8")) as EncodedSourceMap;
  } catch (error) {
    ctx.warnings.push({
      code: "sourcemap-ref-invalid",
      message: `Unable to load referenced source map "${ref}": ${(error as Error).message}`,
      file: importerFile,
    });
    return undefined;
  }
}

/** Character offset of the start of each line (0-based) in `text`. */
function buildLineStarts(text: string): number[] {
  const starts = [0];
  let i = text.indexOf("\n");

  while (i !== -1) {
    starts.push(i + 1);
    i = text.indexOf("\n", i + 1);
  }

  return starts;
}

/** Convert a stylis (1-based line, 1-based column) position to a character offset. */
function offsetAt(lineStarts: number[], line: number, column: number): number {
  const lineIndex = Math.min(line - 1, lineStarts.length - 1);
  return lineStarts[lineIndex] + (column - 1);
}

/**
 * Convert a character offset back to a (1-based line, 0-based column)
 * position, as `addMapping` expects. Writes into `target` directly.
 */
function lineColAt(
  lineStarts: number[],
  offset: number,
  target: { line: number; column: number },
): void {
  let lo = 0;
  let hi = lineStarts.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }

  target.line = lo + 1;
  target.column = offset - lineStarts[lo];
}

/**
 * Binary search over flat `[genStart, origStart, ...]` pairs (sorted,
 * contiguous by construction) for the pair index whose `genStart` is the
 * largest one not exceeding `genOffset`, or `-1` if even the first exceeds it.
 */
function findSegmentIndex(segments: number[], genOffset: number): number {
  if (segments[0] > genOffset) return -1;

  let lo = 0;
  let hi = segments.length / 2 - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (segments[mid * 2] <= genOffset) lo = mid;
    else hi = mid - 1;
  }

  return lo;
}

export function compileSourceMap(
  interpolated: string,
  ast: Element[],
  to: string | undefined,
): RawSourceMap | undefined {
  if (process.env.BROWSER) {
    ctx.warnings.push({
      code: "browser-no-sourcemap",
      message: "Browser runtime does not support sourcemap",
    });
    return undefined;
  }

  const rootDir = ctx.rootDir;
  const from = ctx.from;
  const code = ctx.raw!;
  const sourcePath = to ?? from;
  const sourceRoot = sourcePath ? path.dirname(sourcePath) : ctx.rootDir;

  const map = new GenMapping({
    file: to ? path.relative(sourceRoot, to) : null,
    sourceRoot: path.relative(sourceRoot, ctx.rootDir),
  });

  setSourceContent(map, from ? path.relative(ctx.rootDir, from) : "<unknown>", code);

  const rawTextByFile = new Map<string | undefined, string>([[from, code]]);
  const genTextByFile = new Map<string | undefined, string>([[from, interpolated]]);
  const genLineStartsCache = new Map<string | undefined, number[]>();
  const origLineStartsCache = new Map<string | undefined, number[]>();
  const importMaps = new Map<string, EncodedSourceMap>();

  function getLineStarts(
    cache: Map<string | undefined, number[]>,
    textByFile: Map<string | undefined, string>,
    fileKey: string | undefined,
  ): number[] | undefined {
    let starts = cache.get(fileKey);
    if (starts) return starts;

    const text = textByFile.get(fileKey);
    if (text === undefined) return undefined;

    starts = buildLineStarts(text);
    cache.set(fileKey, starts);
    return starts;
  }

  function resolveOriginal(
    fileKey: string | undefined,
    node: Element,
    target: { line: number; column: number },
  ): void {
    const fallback = () => {
      target.line = node.line;
      target.column = node.column - 1;
    };

    const segments = ctx.pos!.get(fileKey);

    if (!segments || segments.length === 0) {
      fallback();
      return;
    }

    const genLineStarts = getLineStarts(genLineStartsCache, genTextByFile, fileKey);
    if (!genLineStarts) {
      fallback();
      return;
    }

    const genOffset = offsetAt(genLineStarts, node.line, node.column);

    // Segments are flat [genStart, origStart, genStart, origStart, ...]
    // pairs, sorted and contiguous — walk forward keeping the last pair
    // whose genStart doesn't exceed the offset (pairs alternate literal/
    // value by construction, starting with a literal chunk).
    const segIndex = findSegmentIndex(segments, genOffset);
    if (segIndex === -1) {
      fallback();
      return;
    }

    const genStart = segments[segIndex * 2];
    const origStart = segments[segIndex * 2 + 1];
    const isLiteral = segIndex % 2 === 0;

    const origLineStarts = getLineStarts(origLineStartsCache, rawTextByFile, fileKey);
    if (!origLineStarts) {
      fallback();
      return;
    }

    const origOffset = isLiteral ? origStart + (genOffset - genStart) : origStart;

    lineColAt(origLineStarts, origOffset, target);
  }

  // Tracks the current position in the generated (serialized) output.
  // NOTE: Stylis stringify usually produces a single line (whitespace outside
  // parens is collapsed), but a declaration value can contain a literal
  // newline when it's inside parens (e.g. a hand-formatted multi-line
  // `minmax(...)`), so we track line breaks rather than assuming column-only.
  let genLine = 1;
  let genColumn = 0;

  function advance(text: string) {
    const firstNewline = text.indexOf("\n");

    if (firstNewline === -1) {
      genColumn += text.length;
      return;
    }

    let newlineCount = 1;
    let lastNewline = firstNewline;

    for (let i = firstNewline + 1; i < text.length; i++) {
      // eslint-disable-next-line no-continue
      if (text.charCodeAt(i) !== 10) continue;
      newlineCount++;
      lastNewline = i;
    }

    genLine += newlineCount;
    genColumn = text.length - lastNewline - 1;
  }

  const nodeMapping = {
    generated: { line: 0, column: 0 },
    source: "",
    original: { line: 0, column: 0 },
  };

  function walk(children: Element[], parent: Element | null) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];

      if (node.return) {
        if ("__ast" in node) {
          const srcFrom = node.__from;
          const srcPath = srcFrom ? path.relative(rootDir, srcFrom) : "<unknown>";
          const content = node.__raw ?? node.__code ?? "";

          rawTextByFile.set(srcFrom, node.__raw ?? node.__code ?? "");
          genTextByFile.set(srcFrom, node.__code ?? "");

          const sourceMapRef = extractSourceMapRef(node.__ast);
          if (sourceMapRef && srcFrom) {
            const inputMap = loadSourceMap(sourceMapRef, srcFrom);
            if (inputMap) importMaps.set(srcPath, inputMap);
          }

          setSourceContent(map, srcPath, content);

          walk(node.__ast, node);
        } else {
          const srcFrom = parent?.__from ?? from;
          const srcPath = srcFrom ? path.relative(rootDir, srcFrom) : "<unknown>";

          nodeMapping.generated.line = genLine;
          nodeMapping.generated.column = genColumn;
          nodeMapping.source = srcPath;
          resolveOriginal(srcFrom, node, nodeMapping.original);

          maybeAddMapping(map, nodeMapping);

          advance(node.return);
        }
      }
    }
  }

  walk(ast, null);

  let finalMap: EncodedSourceMap | null = null;
  let shiftLines = 0;

  function finalize(): EncodedSourceMap {
    if (finalMap) return finalMap;

    const encoded = toEncodedMap(map);
    let result =
      importMaps.size > 0
        ? (remapping(
            encoded as SourceMapInput,
            (file) => (importMaps.get(file) as SourceMapInput | undefined) ?? null,
          ) as EncodedSourceMap)
        : encoded;

    if (shiftLines > 0) {
      result = { ...result, mappings: ";".repeat(shiftLines) + result.mappings };
    }

    finalMap = result;
    return finalMap;
  }

  return {
    addMapping(mapping) {
      addMapping(map, mapping);
      finalMap = null;
    },
    shift(lineCount) {
      shiftLines += lineCount;
      finalMap = null;
    },
    toString() {
      return JSON.stringify(finalize());
    },
    toJSON() {
      return finalize();
    },
  };
}
