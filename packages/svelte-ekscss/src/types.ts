// FIXME: Use `svelte` package types once they include undefined and null

export interface Processed {
  code: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  map?: string | object;
  dependencies?: string[];
  toString?: () => string;
}

export declare type MarkupPreprocessor = (options: {
  content: string;
  filename: string;
}) => Processed | null | undefined | Promise<Processed | null | undefined>;

export declare type Preprocessor = (options: {
  content: string;
  attributes: Record<string, string | boolean>;
  filename?: string;
}) => Processed | null | undefined | Promise<Processed | null | undefined>;

export interface PreprocessorGroup {
  markup?: MarkupPreprocessor;
  style?: Preprocessor;
  script?: Preprocessor;
}
