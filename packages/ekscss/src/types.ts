import type { RawSourceMap } from 'source-map';
import type { Element as _Element, Middleware } from 'stylis';
import type { xcssTag } from './helpers';

export type { Middleware };

export interface Element extends _Element {
  /** AST for constructing source maps. Only on `@import` nodes. */
  __ast?: Element[];
  /** From path for constructing source maps. Only on `@import` nodes. */
  __from?: string;
}

export interface Warning {
  // TODO: Keep?
  code: string;
  // TODO: Keep?
  start?: { line: number; column: number; pos?: number };
  // TODO: Keep?
  end?: { line: number; column: number };
  // TODO: Keep?
  pos?: number;
  message: string;
  filename?: string;
  // TODO: Keep?
  frame?: string;
  // TODO: Keep?
  toString?: () => string;
}

export interface Context {
  dependencies: string[];
  from?: string;
  g: XCSSGlobals;
  rootDir: string;
  warnings: Warning[];
}

export interface XCSSGlobals {
  [key: string]: any;

  fn?: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [name: string]: Function;
  };
}

export interface XCSSCompileOptions {
  /** Input file path. Without this top level relative `@import`s may fail. */
  from?: string;
  /** Output file path. Only used in source maps. */
  to?: string;
  /** Generate source map. */
  map?: boolean;
  globals?: XCSSGlobals;
  /**
   * Stylis compatible middleware to use as XCSS plugins.
   *
   * Note: If you want to disable vendor prefixing, pass an empty array. If you
   * do want to vendor prefixing, include it if you change the default.
   *
   * @default
   * [require('stylis').prefixer]
   */
  plugins?: Middleware[];
  /**
   * Root directory path to use when resolving `@import` file paths.
   *
   * @default process.cwd()
   */
  rootDir?: string;
}

export type XCSSFn = ReturnType<typeof xcssTag>;

export type XCSSTemplateFn = (xcss: XCSSFn, g: XCSSGlobals) => string;

export type XCSSExpressionFn = (
  g: XCSSGlobals,
  ctx: { from?: string; rootDir: string },
) => XCSSValidType;

export type XCSSValidType =
  | XCSSExpressionFn
  | string
  | { toString(): string }
  | number
  | false
  | null
  | undefined;

export interface XCSSCompileResult {
  css: string;
  dependencies: string[];
  warnings: Warning[];
  map?: RawSourceMap;
}
