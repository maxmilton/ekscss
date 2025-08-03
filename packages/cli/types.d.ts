import type { CompileOptions } from "ekscss";

export type { RawSourceMap } from "ekscss";

export interface Config extends Omit<CompileOptions, "from" | "to"> {
  /** Optional header to prepend to resulting CSS code. */
  banner?: string;
}
