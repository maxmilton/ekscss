import type { XCSSCompileOptions } from "ekscss";

export type { RawSourceMap } from "ekscss";

export interface XCSSConfig extends Omit<XCSSCompileOptions, "from" | "to"> {
  /** Optional header to prepend to resulting CSS code. */
  banner?: string;
}
