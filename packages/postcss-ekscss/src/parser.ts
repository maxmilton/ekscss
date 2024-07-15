// Based on https://github.com/postcss/postcss-scss/blob/e57f9bdfdfaf49ae72f379f968d43c441fd77d18/lib/scss-parser.js

/* eslint "@typescript-eslint/restrict-plus-operands": "warn" */
/* eslint "@typescript-eslint/no-unsafe-assignment": "warn" */
/* eslint "@typescript-eslint/no-unsafe-call": "warn" */
/* eslint "@typescript-eslint/no-unsafe-member-access": "warn" */
/* eslint-disable prefer-destructuring */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - TODO: Too many broken types.

import { type AnyNode, Comment } from 'postcss';
import Parser from 'postcss/lib/parser';
import { NestedDeclaration } from './nested-declaration';
import { type Token, tokenize } from './tokenize';

export class XCSSParser extends Parser {
  override atrule(token: Token): void {
    let name = token[1];
    let prev = token;

    while (!this.tokenizer.endOfFile()) {
      const next = this.tokenizer.nextToken();
      if (next[0] === 'word' && next[2] === prev[3]! + 1) {
        name += next[1];
        prev = next;
      } else {
        this.tokenizer.back(next);
        break;
      }
    }

    super.atrule(['at-word', name, token[2], prev[3]]);
  }

  override createTokenizer(): void {
    this.tokenizer = tokenize(this.input);
  }

  override comment(token: Token): void {
    if (token[4] === 'inline') {
      const node = new Comment();
      this.init(node, token[2]);
      // @ts-expect-error - "inline" missing in upstream types
      node.raws.inline = true;
      const pos = this.input.fromOffset(token[3]);
      node.source.end = {
        column: pos.col,
        line: pos.line,
        offset: token[3] + 1,
      };

      const text = token[1].slice(2);
      if (/^\s*$/.test(text)) {
        node.text = '';
        node.raws.left = text;
        node.raws.right = '';
      } else {
        // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: TODO:!
        const match = text.match(/^(\s*)([^]*\S)(\s*)$/);
        const fixed = match[2].replace(/(\*\/|\/\*)/g, '*//*');
        node.text = fixed;
        node.raws.left = match[1];
        node.raws.right = match[3];
        // @ts-expect-error - "text" missing in upstream types
        node.raws.text = match[2];
      }
    } else {
      super.comment(token);
    }
  }

  override raw(
    node: AnyNode,
    prop: string,
    tokens: Token[],
    customProperty: boolean,
  ): string | void {
    super.raw(node, prop, tokens, customProperty);

    if (node.raws[prop]) {
      const xcss = node.raws[prop].raw;
      // eslint-disable-next-line no-param-reassign, unicorn/no-array-reduce
      node.raws[prop].raw = tokens.reduce((all, i) => {
        if (i[0] === 'comment' && i[4] === 'inline') {
          const text = i[1].slice(2).replace(/(\*\/|\/\*)/g, '*//*');
          return `${all}/*${text}*/`;
        }
        return all + i[1];
      }, '');

      if (xcss !== node.raws[prop].raw) {
        // eslint-disable-next-line no-param-reassign
        node.raws[prop].xcss = xcss;
      }
    }
  }

  override rule(tokens: Token[]): void {
    let withColon = false;
    let brackets = 0;
    let value = '';

    for (const i of tokens) {
      if (withColon) {
        if (i[0] !== 'comment' && i[0] !== '{') {
          value += i[1];
        }
      } else if (i[0] === 'space' && i[1].includes('\n')) {
        break;
      } else if (i[0] === '(') {
        brackets += 1;
      } else if (i[0] === ')') {
        brackets -= 1;
      } else if (brackets === 0 && i[0] === ':') {
        withColon = true;
      }
    }

    if (!withColon || value.trim() === '' || /^[#:A-Za-z-]/.test(value)) {
      super.rule(tokens);
    } else {
      tokens.pop();
      const node = new NestedDeclaration();
      this.init(node, tokens[0][2]);

      let last: Token;
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i][0] !== 'space') {
          last = tokens[i];
          break;
        }
      }
      if (last[3]) {
        const pos = this.input.fromOffset(last[3]);
        node.source.end = {
          column: pos.col,
          line: pos.line,
          offset: last[3] + 1,
        };
      } else {
        const pos = this.input.fromOffset(last[2]);
        node.source.end = {
          column: pos.col,
          line: pos.line,
          offset: last[2] + 1,
        };
      }

      while (tokens[0][0] !== 'word') {
        node.raws.before += tokens.shift()[1];
      }

      if (tokens[0][2]) {
        const pos = this.input.fromOffset(tokens[0][2]);
        node.source.start = {
          column: pos.col,
          line: pos.line,
          offset: tokens[0][2],
        };
      }

      node.prop = '';
      while (tokens.length > 0) {
        const type = tokens[0][0];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (type === ':' || type === 'space' || type === 'comment') {
          break;
        }
        node.prop += tokens.shift()[1];
      }

      node.raws.between = '';

      let token: Token;
      while (tokens.length > 0) {
        token = tokens.shift();

        if (token[0] === ':') {
          node.raws.between += token[1];
          break;
        }
        node.raws.between += token[1];
      }

      if (node.prop[0] === '_' || node.prop[0] === '*') {
        node.raws.before += node.prop[0];
        node.prop = node.prop.slice(1);
      }
      node.raws.between += this.spacesAndCommentsFromStart(tokens);
      this.precheckMissedSemicolon(tokens);

      for (let i = tokens.length - 1; i > 0; i--) {
        token = tokens[i];
        if (token[1] === '!important') {
          node.important = true;
          let string = this.stringFrom(tokens, i);
          string = this.spacesFromEnd(tokens) + string;
          if (string !== ' !important') {
            node.raws.important = string;
          }
          break;
        }
        if (token[1] === 'important') {
          const cache = [...tokens];
          let str = '';
          for (let j = i; j > 0; j--) {
            const type = cache[j][0];
            // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
            if (str.trim().indexOf('!') === 0 && type !== 'space') {
              break;
            }
            str = cache.pop()[1] + str;
          }
          // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
          if (str.trim().indexOf('!') === 0) {
            node.important = true;
            node.raws.important = str;
            // biome-ignore lint/style/noParameterAssign: TODO:!
            tokens = cache; // eslint-disable-line no-param-reassign
          }
        }

        if (token[0] !== 'space' && token[0] !== 'comment') {
          break;
        }
      }

      this.raw(node, 'value', tokens);

      if (node.value.includes(':')) {
        this.checkMissedSemicolon(tokens);
      }

      this.current = node;
    }
  }
}
