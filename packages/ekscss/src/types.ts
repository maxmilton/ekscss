import type { addMapping, EncodedSourceMap } from "@jridgewell/gen-mapping";
import type { Element as _Element, Middleware } from "stylis";
import type { xcss as _xcss } from "./helpers.ts";

// eslint-disable-next-line unicorn/prefer-export-from
export type { Middleware };

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface Dict<T> {
  [key: string]: T | undefined;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface ReadOnlyDict<T> {
  readonly [key: string]: T | undefined;
}

export interface Element extends _Element {
  /**
   * File path of imported file (for constructing source maps).
   *
   * Only on `@import` nodes when `@ekscss/plugin-import` is used.
   */
  __from?: string;
  /**
   * Original source code of imported file (for constructing source maps).
   *
   * Only on `@import` nodes when `@ekscss/plugin-import` is used.
   */
  __raw?: string;
  /**
   * Source code of imported file used to compile it, post-interpolation (for
   * constructing source maps).
   *
   * Only on `@import` nodes when `@ekscss/plugin-import` is used.
   */
  __code?: string;
  /**
   * Compiled AST of imported file (for constructing source maps).
   *
   * Only on `@import` nodes when `@ekscss/plugin-import` is used.
   */
  __ast?: Element[];
  root: Element | null;
}

export interface Warning {
  /** Warning reference code name. Must be kebab case. */
  code: string;
  message: string;
  file?: string | undefined;
  line?: number | undefined;
  column?: number | undefined;
}

export interface Context {
  // Index signature for XCSS plugins to add properties.
  [key: string]: unknown;

  rootDir: string;
  from: string | undefined;
  /**
   * Original source text of the file currently being compiled, or `undefined`
   * when source maps aren't being generated.
   */
  raw: string | undefined;
  /**
   * Per-file interpolation position maps, keyed by `from`, built by `xcss()`
   * during interpolation for source maps (only when `raw` is set).
   *
   * Each value is a flat list of `[genStart, origStart, genStart, origStart,
   * ...]` pairs describing contiguous spans of the interpolated/generated
   * text and the original-source offset each maps to. Pairs alternate
   * literal-chunk/expression-value by construction, starting with a literal
   * chunk (even pair index = literal, odd = an interpolated expression's
   * value, collapsed to a single original-source point).
   */
  pos: Map<string | undefined, number[]> | undefined;
  fn: Functions;
  x: Globals;
  dependencies: string[];
  warnings: Warning[];
}

export type Expression =
  | ((x: Globals, fn: Functions) => Expression)
  | string
  | number
  | (string | number)[]
  | false
  | null
  | undefined;

export type ExpressionOrNested = Expression | Dict<ExpressionOrNested>;

export type Globals = ReadOnlyDict<ExpressionOrNested>;
// biome-ignore lint/suspicious/noExplicitAny: correctly accepts any type
export type Functions = ReadOnlyDict<(...args: any) => any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface CompileOptions {
  /**
   * Root directory path to use when resolving file paths e.g., in `@import`.
   *
   * @default process.cwd()
   */
  rootDir?: string | undefined;
  /** Input file path. Without this top level relative `@import`s may fail. */
  from?: string | undefined;
  /** Output file path. Only used in source maps. */
  to?: string | undefined;
  /**
   * XCSS plugins.
   *
   * XCSS plugins are stylis Middleware which may also use the ekscss compiler
   * API. Any valid stylis middleware is also a valid XCSS plugin.
   *
   * @default []
   */
  plugins?: Middleware[] | undefined;
  functions?: Functions | undefined;
  globals?: Globals | undefined;
  /**
   * Generate source map.
   *
   * @default false
   */
  map?: boolean | undefined;
}

export type BuildHook = () => void;

export type TemplateFn = (xcss: typeof _xcss, x: Globals, fn: Functions) => string;

export interface RawSourceMap {
  addMapping(mapping: Parameters<typeof addMapping>[1]): void;
  /** Shift every mapping down by `lineCount` generated lines. */
  shift(lineCount: number): void;
  toString(): string;
  toJSON(): EncodedSourceMap;
}

export interface CompileResult {
  css: string;
  map: RawSourceMap | undefined;
  dependencies: string[];
  warnings: Warning[];
}
