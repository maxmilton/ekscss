import { Input, Stringifier, type Parser } from 'postcss';
import { EkscssParser } from './parser';
import { EkscssStringifier } from './stringifier';

export const parse: Parser = (xcss, opts) => {
  const input = new Input(xcss.toString(), opts);
  const parser = new EkscssParser(input);
  parser.parse();

  return parser.root;
};

export const stringify: Stringifier = (node, builder) => {
  const str = new EkscssStringifier(builder);
  str.stringify(node);
};

export default { parse, stringify };
