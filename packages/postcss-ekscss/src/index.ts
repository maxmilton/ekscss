import { Input, type Parser, type Stringifier } from 'postcss';
import { XCSSParser } from './parser';
import { XCSSStringifier } from './stringifier';

export const parse: Parser = (xcss, opts) => {
  const input = new Input(xcss.toString(), opts);
  const parser = new XCSSParser(input);
  parser.parse();
  return parser.root;
};

export const stringify: Stringifier = (node, builder) => {
  const stringifier = new XCSSStringifier(builder);
  stringifier.stringify(node);
};

export default { parse, stringify };
