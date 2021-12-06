// Based on https://github.com/postcss/postcss-scss/blob/ea0a76007c0d16b4eab946b1e3faa31a7dd9041b/lib/scss-stringifier.js

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - TODO: Too many broken types

import type { AnyNode, Comment, Declaration } from 'postcss';
import Stringifier from 'postcss/lib/stringifier';

export class EkscssStringifier extends Stringifier {
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
    if (!node.isNested) {
      super.decl(node, semicolon);
    } else {
      const between = this.raw(node, 'between', 'colon');
      let string = node.prop + between + this.rawValue(node, 'value');
      if (node.important) {
        string += node.raws.important || ' !important';
      }

      this.builder(`${string}{`, node, 'start');

      let after;
      if (node.nodes && node.nodes.length > 0) {
        this.body(node);
        after = this.raw(node, 'after');
      } else {
        after = this.raw(node, 'after', 'emptyBody');
      }
      if (after) this.builder(after);
      this.builder('}', node, 'end');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  override rawValue(node: AnyNode, prop: string): string {
    const value = node[prop];
    const raw = node.raws[prop];
    if (raw && raw.value === value) {
      return raw.xcss ? raw.xcss : raw.raw;
    }
    return value;
  }
}
