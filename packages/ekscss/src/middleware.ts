/* eslint-disable id-length, no-param-reassign, no-nested-ternary, no-restricted-syntax */

import fs from 'fs';
import path from 'path';
import * as stylis from 'stylis';
import { ctx, interpolate, xcssTag } from './helpers';
import type { Middleware } from './types';

const reStartQuote = /^['"]/;
const reEndQuote = /['"]$/;

function isRelative(filename: string): boolean {
  // 46 = .
  return stylis.charat(filename, 0) === 46;
}

// TODO: Document @import tries to resolve and inline the given path, unless
// it's a url() import, so if developers want to @import a local file and not
// have it inlined they can use `@import url('file:...')` e.g., for dev/testing

/**
 * Stylis middleware to inline the contents of `@import` statements.
 */
export const inlineImport: Middleware = (
  element,
  _index,
  _children,
  callback,
): void => {
  if (element.type !== stylis.IMPORT || element.return) return;

  const importPath = stylis
    .tokenize(element.value)[3]
    .replace(reStartQuote, '')
    .replace(reEndQuote, '');

  if (importPath === 'url') return;

  const searchPaths = [ctx.rootDir];

  if (ctx.from) {
    searchPaths.unshift(path.dirname(ctx.from));
  } else if (isRelative(importPath)) {
    ctx.warnings.push({
      code: 'import-relative-no-from',
      filename: ctx.from,
      message:
        'Unable to resolve relative import because "from" option invalid',
    });
  }

  const from = require.resolve(importPath, {
    paths: searchPaths,
  });

  // TODO: Document this behaviour
  // Avoid importing files more than once
  if (ctx.dependencies.includes(from)) {
    // Clear value so at-rule is removed in stringify
    element.value = '';
    return;
  }

  const oldCtxFrom = ctx.from;
  ctx.from = from;

  let code = fs.readFileSync(from, 'utf-8');

  // TODO: Document this behaviour
  if (!from.endsWith('.xcss')) {
    // Escape backticks to prevent unexpected errors when importing non-XCSS
    // aware code (e.g. 3rd party frameworks)
    code = code.replace(/`/g, '\\`');
  }

  const interpolated = interpolate(code)(xcssTag(), ctx.g);
  const ast = stylis.compile(interpolated);
  element.return = stylis.serialize(ast, callback);

  // expose data for constructing source maps
  element.__ast = ast;
  element.__from = from;

  if (element.return === '') {
    // clear value so at-rule is removed in stringify
    element.value = '';

    ctx.warnings.push({
      code: 'import-empty',
      filename: from,
      message: `Imported file compile result was empty: ${from}`,
    });
  }

  ctx.dependencies.push(from);
  ctx.from = oldCtxFrom;
};
