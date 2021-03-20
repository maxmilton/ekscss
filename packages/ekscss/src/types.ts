import type { Element as _Element, Middleware as _Middleware } from 'stylis';
import type { xcssTag } from './helpers';

export interface Element extends _Element {
  /** Extra data for constructing source maps. Only found on IMPORT nodes. */
  __ast?: Element[];
  /** Extra data for constructing source maps. Only found on IMPORT nodes. */
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

export interface XCSSContext {
  from?: string;
  rootDir: string;
}

export interface XCSSFunctions {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [name: string]: Function;
}

export interface XCSSGlobals {
  [key: string]: any;

  fn?: XCSSFunctions;
}

export interface InternalData {
  ctx: XCSSContext;
  dependencies: string[];
  g: XCSSGlobals;
  warnings: Warning[];
}

// Extends stylis Middleware with  extra `internal` argument
export type Middleware = (
  element: Element,
  index: number,
  children: (Element | string)[],
  callback: _Middleware,
  internals: InternalData,
) => string | void;

export interface XCSSCompileOptions {
  /** Input file path. */
  from?: string;
  globals?: {
    [key: string]: any;

    fn?: XCSSFunctions;
  };
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
  ctx: XCSSContext,
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
}
