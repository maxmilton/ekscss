// Based on https://github.com/postcss/postcss-scss/blob/e57f9bdfdfaf49ae72f379f968d43c441fd77d18/lib/scss-stringifier.js

/* eslint "@typescript-eslint/no-unsafe-assignment": "warn" */
/* eslint "@typescript-eslint/no-unsafe-member-access": "warn" */
/* eslint "@typescript-eslint/no-unsafe-return": "warn" */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - TODO: Too many broken types

import type { AnyNode, Comment, Declaration } from 'postcss';
import Stringifier from 'postcss/lib/stringifier';

export class XCSSStringifier extends Stringifier {
  override comment(node: Comment): void {
    const left = this.raw(node, 'left', 'commentLeft');
    const right = this.raw(node, 'right', 'commentRight');

    if (node.raws.inline) {
      const text: string = node.raws.text || node.text;
      this.builder(`//${left}${text}${right}`, node);
    } else {
      this.builder(`/*${left}${node.text}${right}*/`, node);
    }
  }

  override decl(
    node: Declaration & { isNested?: boolean },
    semicolon?: boolean,
  ): void {
    if (node.isNested) {
      const between = this.raw(node, 'between', 'colon');
      let string = node.prop + between + this.rawValue(node, 'value');
      if (node.important) {
        string += node.raws.important ?? ' !important';
      }

      this.builder(`${string}{`, node, 'start');

      let after: string;
      if (node.nodes && node.nodes.length > 0) {
        this.body(node);
        after = this.raw(node, 'after');
      } else {
        after = this.raw(node, 'after', 'emptyBody');
      }
      if (after) this.builder(after);
      this.builder('}', node, 'end');
    } else {
      super.decl(node, semicolon);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  override rawValue(node: AnyNode, prop: string): string {
    const value = node[prop];
    const raw = node.raws[prop];
    if (raw && raw.value === value) {
      return raw.xcss || raw.raw;
    }
    return value;
  }
}
