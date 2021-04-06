import type { RawSourceMap } from 'source-map';
import type { Element as _Element, Middleware } from 'stylis';
import type { xcssTag } from './helpers';

export type { Middleware };

// TODO: Remove?
export interface Element extends _Element {
  /** AST for constructing source maps. Only on `@import` nodes. */
  __ast?: Element[];
  /** From path for constructing source maps. Only on `@import` nodes. */
  __from?: string;
  root: Element;
}

export interface Warning {
  /** A kebab cased reference code/name of the warning. */
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface Context {
  // index signature for XCSS plugins to add properties
  [key: string]: unknown;

  dependencies: string[];
  from?: string;
  /**
   * Raw globals which are not proxied and will not generate warnings when
   * looking up undefined props.
   */
  rawX: XCSSGlobals;
  rootDir: string;
  warnings: Warning[];
  x: XCSSGlobals;
}

export type XCSSExpression =
  | ((x: XCSSGlobals) => XCSSExpression)
  | string
  | number
  | Array<string | number>
  | { toString(): string }
  | false
  | null
  | undefined;

export interface XCSSGlobals {
  [key: string]: XCSSExpression | { [key: string]: XCSSExpression };

  fn?: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [name: string]: Function;
  };
}

export type BuildHookFn = () => void;

export interface XCSSCompileOptions {
  /** Input file path. Without this top level relative `@import`s may fail. */
  from?: string;
  /** Output file path. Only used in source maps. */
  to?: string;
  /**
   * Generate source map.
   *
   * @default false
   */
  map?: boolean;
  globals?: XCSSGlobals;
  /**
   * XCSS plugins or package names of XCSS plugins.
   *
   * XCSS plugins are stylis Middleware which may also use the ekscss compiler
   * API. Any valid stylis middleware is also a valid XCSS plugin.
   *
   * @default []
   */
  plugins?: Array<Middleware | string>;
  /**
   * Root directory path to use when resolving file paths e.g., in `@import`.
   *
   * @default process.cwd()
   */
  rootDir?: string;
}

export type XCSSTemplateFn = (
  xcss: ReturnType<typeof xcssTag>,
  x: XCSSGlobals,
) => string;

export interface XCSSCompileResult {
  css: string;
  dependencies: string[];
  map?: RawSourceMap;
  warnings: Warning[];
}
