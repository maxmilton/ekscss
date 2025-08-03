/* eslint-disable no-param-reassign */

// TODO: Documentation: #apply as decl with value of rule selectors to inline
//  ↳ Selectors can be separated by comma and/or whitespace (including new
//    lines), both OK
//  ↳ Add note about why we use decl with "#"; the way stylis (+ brief note
//    about what stylis is) parser creates AST nodes and how stringify works
//  ↳ Selectors with a ":" must be wrapped in commas
//  ↳ Selector refs are minified, the same as what the output CSS would be; so
//    for '.a > .b {}' the ref would be '.a>.b' + show examples

// TODO: Documentation: plugin only applies the rules from selectors you give
// it. It will not create or modify other rule sets, i.e., it does not
// automagically also apply pseudo-classes, pseudo-elements, at-rules,
// attributes, etc. It's an intentional design choice to keep the code simple
// and have better performance. Although the consumer maintenance overhead can
// be higher it also has the bonus of better visibility into what's going on
// and no unexpected results (which often leads to logically incorrect or hugely
// bloated code in SASS for example.)
//  ↳ Give examples how to use in common scenarios + link to addon/native.xcss

// TODO: Document build performance impact (about 10% extra time, but do
// benchmarks to verify)
//  ↳ Impact of including this plugin and impact of actual #apply use

import { ctx, type Element, type Middleware, onAfterBuild, onBeforeBuild, stylis } from "ekscss";

type ApplyRefs = Record<string, Element[] | undefined>;

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
      ((ctx.applyRefs as ApplyRefs)[selector] ??= []).push(element);
    }

    return;
  }

  if (element.type === stylis.DECLARATION && element.props === "#apply") {
    // TODO: Remove type cast; stylis types don't differentiate by element.type
    const targets = (element.children as string)
      .split(",")
      .map((x) => x.trim().replace(/^["']/, "").replace(/["']$/, ""));
    const decls: Element[] = [];

    for (const target of targets) {
      const refs = (ctx.applyRefs as ApplyRefs)[target];

      if (refs) {
        for (const ref of refs) {
          // TODO: Remove type cast; stylis types don't differentiate by element.type
          decls.push(...(ref.children as Element[]));
        }
      } else {
        ctx.warnings.push({
          code: "apply-no-match",
          message: `Unable to #apply "${target}", no matching rule`,
          file: ctx.from,
          line: element.line,
          column: element.column,
        });
      }
    }

    element.return = stylis.serialize(decls, callback);

    if (element.return === "") {
      // Set empty value so declaration is removed in stringify
      element.value = "";

      ctx.warnings.push({
        code: "apply-empty",
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
