import type { addMapping, EncodedSourceMap, GenMapping } from "@jridgewell/gen-mapping";
import type { Element as _Element, Middleware } from "stylis";
import type { xcss as _xcss } from "./helpers.ts";

// eslint-disable-next-line unicorn/prefer-export-from
export type { Middleware };

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
  readonly _map: GenMapping;
  addMapping(mapping: Parameters<typeof addMapping>[1]): void;
  toString(): string;
  toJSON(): EncodedSourceMap;
}

export interface CompileResult {
  css: string;
  map: RawSourceMap | undefined;
  dependencies: string[];
  warnings: Warning[];
}
