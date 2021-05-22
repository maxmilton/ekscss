/* eslint-disable no-param-reassign, no-underscore-dangle */

import {
  ctx, Element, interpolate, Middleware, xcssTag,
} from 'ekscss';
import fs from 'fs';
import path from 'path';
import * as stylis from 'stylis';

// TODO: Document this plugin should come first

// TODO: Document @import tries to resolve and inline the given path, unless
// it's a url() import, so if developers want to @import a local file and not
// have it inlined they can use `@import url('file:...')` e.g., for dev/testing

function isRelative(filename: string): boolean {
  // 46 = .
  return stylis.charat(filename, 0) === 46;
}

/**
 * XCSS plugin to inline the contents of `@import` statements.
 */
export const importPlugin: Middleware = (
  element: Element,
  _index,
  _children,
  callback,
): void => {
  if (element.type !== stylis.IMPORT || element.return) return;

  const importPath = stylis
    .tokenize(element.value)[3]
    .replace(/^['"]/, '')
    .replace(/['"]$/, '');

  if (importPath === 'url') return;

  const searchPaths = [ctx.rootDir];

  if (ctx.from) {
    searchPaths.unshift(path.dirname(ctx.from));
  } else if (isRelative(importPath)) {
    ctx.warnings.push({
      code: 'import-relative-no-from',
      message:
        'Unable to resolve relative import because "from" option invalid',
      file: ctx.from,
      line: element.line,
      column: element.column,
    });
  }

  const from = require.resolve(importPath, {
    paths: searchPaths,
  });

  // TODO: Document this behaviour
  // Avoid importing files more than once
  if (ctx.dependencies.includes(from)) {
    // empty value so at-rule is removed in stringify
    element.value = '';
    return;
  }

  const oldCtxFrom = ctx.from;
  ctx.from = from;

  let code = fs.readFileSync(from, 'utf-8');

  // TODO: Document this behaviour
  if (!from.endsWith('.xcss')) {
    // Escape backtick "`" and template expression placeholder "${" to prevent
    // unexpected errors when importing non-XCSS aware or 3rd party code
    code = code.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }

  const interpolated = interpolate(code)(xcssTag(), ctx.x);
  const ast = stylis.compile(interpolated);
  element.return = stylis.serialize(ast, callback);

  // expose data for constructing source maps
  element.__ast = ast;
  element.__from = from;

  if (element.return === '') {
    // empty value so at-rule is removed in stringify
    element.value = '';

    ctx.warnings.push({
      code: 'import-empty',
      message: `Imported file compile result empty: ${from}`,
      file: oldCtxFrom,
      line: element.line,
      column: element.column,
    });
  }

  ctx.dependencies.push(from);
  ctx.from = oldCtxFrom;
};

export default importPlugin;
