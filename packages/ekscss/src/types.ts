import type { SourceMapGenerator } from 'source-map';
import type { Element as _Element, Middleware } from 'stylis';
import type { xcss as _xcss } from './helpers';

export type { Middleware };

export interface Element extends _Element {
  /**
   * AST for constructing source maps.
   *
   * Only on `@import` nodes when the import plugin is used.
   */
  __ast?: Element[];
  /**
   * From path for constructing source maps.
   *
   * Only on `@import` nodes when the import plugin is used.
   */
  __from?: string;
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
  // index signature for XCSS plugins to add properties
  [key: string]: unknown;

  dependencies: string[];
  from: string | undefined;
  rootDir: string;
  warnings: Warning[];
  x: XCSSGlobals;
}

export type XCSSExpression =
  | ((x: XCSSGlobals) => XCSSExpression)
  | string
  | number
  | Array<string | number>
  | false
  | null
  | undefined
  | void
  // FIXME: Remove (too broad; undesirable matches e.g., functions) and fix
  // types throughout the package
  | { toString: () => string };

export type ExpressionOrNested =
  | XCSSExpression
  | { [key: string]: ExpressionOrNested };

export type XCSSGlobals = {
  [key: string]: ExpressionOrNested;
} & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn: Record<string, Function>;
};

export interface XCSSCompileOptions {
  /** Input file path. Without this top level relative `@import`s may fail. */
  from?: string | undefined;
  /** Output file path. Only used in source maps. */
  to?: string | undefined;
  /**
   * Generate source map.
   *
   * @default false
   */
  map?: boolean | undefined;
  globals?: Partial<XCSSGlobals> | undefined;
  /**
   * XCSS plugins or package names of XCSS plugins.
   *
   * XCSS plugins are stylis Middleware which may also use the ekscss compiler
   * API. Any valid stylis middleware is also a valid XCSS plugin.
   *
   * @default []
   */
  plugins?: Array<Middleware | string> | undefined;
  /**
   * Root directory path to use when resolving file paths e.g., in `@import`.
   *
   * @default process.cwd()
   */
  rootDir?: string | undefined;
}

export type BuildHookFn = () => void;

export type XCSSTemplateFn = (xcss: typeof _xcss, x: XCSSGlobals) => string;

export interface XCSSCompileResult {
  css: string;
  dependencies: string[];
  map: SourceMapGenerator | undefined;
  warnings: Warning[];
}
