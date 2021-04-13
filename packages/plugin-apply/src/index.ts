/* eslint-disable no-param-reassign, no-restricted-syntax */

// FIXME: Valid but empty serialize result should also remove the #apply decl,
// ideally without clearing the value like we do in importPlugin (would be
// nice to fix there too!)

// TODO: Documentation: #apply as decl with value of rule selectors to inline
//  ↳ Selectors can be separated by comma and/or whitespace (including new
//    lines), both OK
//  ↳ Add note about why we use decl with "#"; the way stylis (+ brief note
//    about what stylis is) parser creates AST nodes and how stringify works

// TODO: Document build performance impact (about 10% extra time, but do
// benchmarks to verify)

// TODO: Document plugin does not currently automagically also apply
// pseudo-classes or pseudo-elements

// TODO: Automagically apply pseudo-classes (and pseudo-elements?)

// TODO: Handle selector refs with multiple parts and/or spaces

import {
  ctx, Element, Middleware, onAfterBuild, onBeforeBuild,
} from 'ekscss';
import * as stylis from 'stylis';

type ApplyRefs = Record<string, Element[]>;

onBeforeBuild(() => {
  ctx.applyRefs = {};
});

onAfterBuild(() => {
  ctx.applyRefs = undefined;
});

/**
 * XCSS plugin to inline the properties of referenced rules.
 */
export const applyPlugin: Middleware = (
  element,
  _index,
  _children,
  callback,
): void => {
  if (element.type === stylis.RULESET) {
    for (const selector of element.props) {
      (ctx.applyRefs as ApplyRefs)[selector] ??= [];
      (ctx.applyRefs as ApplyRefs)[selector].push(element);
    }

    return;
  }

  if (element.type === stylis.DECLARATION && element.props === '#apply') {
    const targets = stylis.tokenize(element.children);
    const decls: Element[] = [];

    for (const target of targets) {
      if (target !== ' ' && target !== ',') {
        const refs = (ctx.applyRefs as ApplyRefs)[target];

        if (refs) {
          for (const ref of refs) {
            decls.push(...ref.children);
          }
        } else {
          ctx.warnings.push({
            code: 'apply-no-match',
            message: `Unable to #apply "${target}", no matching rule`,
            file: ctx.from,
            line: element.line,
            column: element.column,
          });
        }
      }
    }

    element.return = stylis.serialize(decls, callback);
  }
};

export default applyPlugin;
