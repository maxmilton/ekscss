declare module 'postcss/lib/parser' {
  import type { Input, Node, Root } from 'postcss';
  import type { Token, Tokenizer } from 'postcss-ekscss/src/tokenize';

  // https://github.com/postcss/postcss/blob/e0efb168c8a65b42ba10b787857cfa306ba9d48c/lib/parser.js#L23
  class Parser {
    tokenizer: Tokenizer;

    input: Input & { error: (message: string, pos?: number) => void };

    root: Root;

    current: Node;

    spaces: string;

    constructor(input: Input);

    createTokenizer(): void;
    parse(): void;
    comment(token: Token): void;
    rule(tokens: Token[]): void;
    atrule(token: Token): void;

    init(node: Node, offset?: number): void;
    raw(
      node: Node,
      prop: string,
      tokens: Token[],
      customProperty: boolean,
    ): void;
    spacesAndCommentsFromStart(tokens: Token[]): string;
    spacesFromEnd(tokens: Token[]): string;
    stringFrom(tokens: Token[], from: number): string;
    precheckMissedSemicolon(tokens?: Token[]): void;
    checkMissedSemicolon(tokens: Token[]): void;
  }

  export default Parser;
}
