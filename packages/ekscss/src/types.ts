import type { SourceMapGenerator } from 'source-map';
import type { Element as _Element, Middleware } from 'stylis';
import type { xcssTag } from './helpers';

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
  root: Element;
}

export interface Warning {
  /** Warning reference code name. Must be kebab case. */
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
  from?: string;
  /** Output file path. Only used in source maps. */
  to?: string;
  /**
   * Generate source map.
   *
   * @default false
   */
  map?: boolean;
  globals?: Partial<XCSSGlobals>;
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

export type BuildHookFn = () => void;

export type XCSSTemplateFn = (
  xcss: ReturnType<typeof xcssTag>,
  x: XCSSGlobals,
) => string;

export interface XCSSCompileResult {
  css: string;
  dependencies: string[];
  map?: SourceMapGenerator;
  warnings: Warning[];
}
