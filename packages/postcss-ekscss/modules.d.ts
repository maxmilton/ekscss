declare module 'postcss/lib/parser' {
  import type { Input, Node, Root } from 'postcss';
  import type { Token, Tokenizer } from './src/tokenizer';

  // https://github.com/postcss/postcss/blob/main/lib/parser.js#L10
  declare class Parser {
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
    raw(node: Node, prop: string, tokens: Token[]): void;
    spacesAndCommentsFromStart(tokens: Token[]): string;
    spacesFromEnd(tokens: Token[]): string;
    stringFrom(tokens: Token[], from: number): string;
    precheckMissedSemicolon(tokens?: Token[]): void;
    checkMissedSemicolon(tokens: Tokens[]): void;
  }

  export default Parser;
}
