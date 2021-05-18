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
// pseudo-classes, pseudo-elements, at-rules, etc.

// TODO: Automagically apply related rules e.g., pseudo-classes,
// pseudo-elements, at-rules, and attributes (e.g., .x[disabled])
//  ↳ new RegExp(`${target}(\S)`) ... $1 ??
//    ↳ Looping so much to match keys in ctx.applyRefs will be expensive
//    ↳ Likely to produce unwanted matches like target>x
//  ↳ Might actually be better to stay non-magical and have very simple logic

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
    // stylis types don't differentiate by element.type hence the cast
    const targets = (element.children as string)
      .split(',')
      .map((x) => x.trim().replace(/^['"]/, '').replace(/['"]$/, ''));
    const decls: Element[] = [];

    for (const target of targets) {
      const refs = (ctx.applyRefs as ApplyRefs)[target];

      if (refs) {
        for (const ref of refs) {
          // @ts-expect-error - stylis types don't differentiate by node.type
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

    element.return = stylis.serialize(decls, callback);

    if (element.return === '') {
      // empty value so declaration is removed in stringify
      element.value = '';

      ctx.warnings.push({
        code: 'apply-no-decls',
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `#apply "${targets}" result empty`,
        file: ctx.from,
        line: element.line,
        column: element.column,
      });
    }
  }
};

export default applyPlugin;
