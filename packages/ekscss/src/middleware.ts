/* eslint-disable id-length, no-param-reassign, no-nested-ternary, no-restricted-syntax */

import fs from 'fs';
import path from 'path';
import { SourceNode } from 'source-map';
import * as stylis from 'stylis';
import { internals } from './compiler';
import { interpolate, xcssTag } from './helpers';
import type { Element, InternalData, Middleware } from './types';

const reStartQuote = /^['"]/;
const reEndQuote = /['"]$/;

function isRelative(filename: string): boolean {
  // 46 = .
  return stylis.charat(filename, 0) === 46;
}

// /**
//  * Custom stylis middleware runner.
//  *
//  * Same as stylis default but also passes `internals` argument to middleware.
//  *
//  * @see https://github.com/thysultan/stylis.js/blob/master/src/Middleware.js
//  */
// export function middleware(collection: Middleware[]): Middleware {
//   const length = stylis.sizeof(collection);

//   return (element, index, children, callback, internals) => {
//     let output = '';

//     for (let i = 0; i < length; i += 1) {
//       output
//         += collection[i](element, index, children, callback, internals) || '';
//     }

//     return output;
//   };
// }

// /**
//  * Custom stylis serializer.
//  *
//  * Same as stylis default but also passes `internals` argument to middleware.
//  *
//  * @see https://github.com/thysultan/stylis.js/blob/master/src/Serializer.js
//  */
// export function serialize(
//   children: (Element | string)[],
//   callback: Middleware,
//   internal: InternalData,
// ): string {
//   const length = stylis.sizeof(children);
//   let output = '';
//
//   for (let i = 0; i < length; i += 1) {
//     // @ts-expect-error
//     output += callback(children[i], i, children, callback, internal) || '';
//   }
//
//   return output;
// }

/**
 * Stylis middleware to inline the contents of `@import` statements.
 */
export const inlineImport: Middleware = (
  element,
  _index,
  _children,
  callback,
  // internals,
): void => {
  if (element.type !== stylis.IMPORT || element.return) return;

  const importPath = stylis
    .tokenize(element.value)[3]
    .replace(reStartQuote, '')
    .replace(reEndQuote, '');

  const searchPaths = [internals.ctx.rootDir];

  if (internals.ctx.from) {
    searchPaths.unshift(path.dirname(internals.ctx.from));
  } else if (isRelative(importPath)) {
    internals.warnings.push({
      code: 'import-relative-no-from',
      filename: internals.ctx.from,
      message:
        'Unable to resolve relative import because "from" option invalid',
    });
  }

  const from = require.resolve(importPath, {
    paths: searchPaths,
  });

  // TODO: Document this behaviour
  // Avoid importing files more than once
  if (internals.dependencies.includes(from)) {
    // Clear value so at-rule is removed
    element.value = '';
    return;
  }

  let code = '';

  // FIXME: Although this works, it decreases performance significantly due to more fs access...
  //  ↳ Do we need JS file support?
  //  ↳ It's a little awkward to do string templates (since they get eval'd later)

  // try {
  //   // attempt to require the file incase it's a JS module
  //   const mod = require(from);
  //   code = mod.default || mod;
  // } catch (error) {
  //   // otherwise assume the file content itself is the XCSS code
  //   code = fs.readFileSync(from, 'utf-8');
  // }
  code = fs.readFileSync(from, 'utf-8');

  // TODO: Document this behaviour
  if (!from.endsWith('.xcss')) {
    // Escape backticks to prevent unexpected errors when importing non-XCSS
    // aware code (e.g. 3rd party frameworks)
    code = code.replace(/`/g, '\\`');
  }

  // const subCtx = { ...internals.ctx, from };
  // const subInternals = { ...internals, ctx: subCtx };

  const oldCtxFrom = internals.ctx.from;
  internals.ctx.from = from;

  // const interpolated = interpolate(code)(xcssTag(subInternals), internals.g);
  const interpolated = interpolate(code)(xcssTag(), internals.g);
  const ast = stylis.compile(interpolated);
  // element.return = serialize(ast, callback, subInternals);
  element.return = stylis.serialize(ast, callback);

  // expose data for constructing source maps
  element.__ast = ast;
  // element.__from = from;

  if (element.return === '') {
    // Clear value so at-rule is removed (even if return result is empty)
    element.value = '';

    internals.warnings.push({
      code: 'import-empty',
      filename: from,
      message: `Imported file result was empty: ${from}`,
    });
  }

  internals.dependencies.push(from);
  internals.ctx.from = oldCtxFrom;
};

// /**
//  * Custom stylis stringify.
//  *
//  * Same as stylis default but also passes `internals` argument to middleware.
//  *
//  * @see https://github.com/thysultan/stylis.js/blob/master/src/Serializer.js#L26
//  */
// export const stringify: Middleware = (
//   element,
//   _index,
//   children,
//   callback,
//   internals,
// ) => {
//   // eslint-disable-next-line default-case
//   switch (element.type) {
//     case stylis.IMPORT:
//     case stylis.DECLARATION:
//       // eslint-disable-next-line no-return-assign
//       return (element.return = element.return || element.value);
//     case stylis.COMMENT:
//       return '';
//     case stylis.RULESET:
//       // @ts-expect-error
//       element.value = element.props.join(',');
//   }
//
//   // eslint-disable-next-line no-return-assign
//   return stylis.strlen(
//     // @ts-expect-error
//     // eslint-disable-next-line no-cond-assign
//     (children = serialize(element.children, callback, internals)),
//   )
//     ? (element.return = `${element.value}{${children}}`)
//     : '';
// };

export const sourcemap: Middleware = (
  element,
  _index,
  _children,
  _callback,
  internals,
) => {
  // console.log('@@ ELEMENT');
  // console.dir(element, { depth: null });
  //
  // // FIXME: Shouldn't need this
  // //  ↳ It's because stylis.serialize is used when we need the custom serialize;
  // //    in https://github.com/thysultan/stylis.js/blob/master/src/Middleware.js#L42
  // if (!internals) return;
  //
  // if (!element.return) return;
  //
  // if (!internals.rawSourceMaps) {
  //   internals.rawSourceMaps = [];
  // }
  //
  // const relPath = path.relative(internals.ctx.rootDir, internals.ctx.from);
  //
  // internals.rawSourceMaps.push(
  //   new SourceNode(element.line, element.column, relPath, element.return),
  // );
};
