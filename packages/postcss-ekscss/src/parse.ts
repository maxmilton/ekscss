import { Input } from 'postcss';
// @ts-expect-error
import Parser from 'postcss/lib/parser';

class XCSSParser extends Parser {
  // constructor(input) {
  //   super(input);
  // }
}

export function parse(xcss: string, opts: any) {
  const input = new Input(xcss, opts);
  // @ts-expect-error
  const parser = new XCSSParser(input);
  // @ts-expect-error
  parser.parse();

  // @ts-expect-error
  return parser.root;
}
