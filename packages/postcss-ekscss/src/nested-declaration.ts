// Based on https://github.com/postcss/postcss-scss/blob/f540beae6530b7c9632f954e4d6915359a54f25f/lib/nested-declaration.js

import { Container } from 'postcss';

export class NestedDeclaration extends Container {
  declare isNested: boolean;

  constructor(defaults?: Record<string, unknown>) {
    super(defaults);
    this.type = 'decl';
    this.isNested = true;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.nodes) this.nodes = [];
  }
}
