// Based on https://github.com/postcss/postcss-scss/blob/e57f9bdfdfaf49ae72f379f968d43c441fd77d18/lib/nested-declaration.js

import { Container } from "postcss";

export class NestedDeclaration extends Container {
  declare isNested: boolean;

  constructor(defaults?: Record<string, unknown>) {
    super(defaults);
    this.type = "decl";
    this.isNested = true;
    if (!this.nodes) this.nodes = [];
  }
}
