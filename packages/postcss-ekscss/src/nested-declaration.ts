// Based on https://github.com/postcss/postcss-scss/blob/ea0a76007c0d16b4eab946b1e3faa31a7dd9041b/lib/nested-declaration.js

import { Container } from 'postcss';

export class NestedDeclaration extends Container {
  declare isNested: boolean;

  constructor(defaults?: Record<string, any>) {
    super(defaults);
    this.type = 'decl';
    this.isNested = true;
    if (!this.nodes) this.nodes = [];
  }
}
