/* eslint-disable no-param-reassign, no-underscore-dangle */

import { ctx, type Element, interpolate, type Middleware, stylis, xcss } from "ekscss";
import fs from "node:fs";
import path from "node:path";

// TODO: Document this plugin should come first

// TODO: Document @import tries to resolve and inline the given path, unless
// it's a url() import, so if developers want to @import a local file and not
// have it inlined they can use `@import url('file:...')` e.g., for dev/testing

// 46 = .
const isRelative = (filePath: string) => stylis.charat(filePath, 0) === 46;

const resolveFile = (filePath: string, dirs: string[]): string | null => {
  try {
    // Default to node require.resolve() behaviour
    return require.resolve(filePath, { paths: dirs });
  } catch {
    // Fall back to manual search
    for (const searchDir of dirs) {
      // TODO: Document that user input to path.resolve could lead to a path
      // traversal vulnerability. Users should only run this on trusted code.
      const resolvedPath = path.resolve(searchDir, filePath);

      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }
    }
  }

  return null;
};

/**
 * XCSS plugin to inline the contents of `@import` statements.
 *
 * Only works with the filesystem; will not inline `url(...)`.
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
    .replace(/^["']/, "")
    .replace(/["']$/, "");

  if (importPath === "url") return;

  const searchPaths = [ctx.rootDir];

  if (ctx.from) {
    searchPaths.unshift(path.dirname(ctx.from));
  } else if (isRelative(importPath)) {
    ctx.warnings.push({
      code: "import-from-invalid",
      message: 'Unable to resolve relative @import because "from" option invalid',
      file: ctx.from,
      line: element.line,
      column: element.column,
    });
  }

  const from = resolveFile(importPath, searchPaths);

  if (!from) {
    ctx.warnings.push({
      code: "import-not-found",
      // TODO: No need to include importPath since we give the file and line/column
      message: `Unable to resolve @import: ${importPath}`,
      file: ctx.from,
      line: element.line,
      column: element.column,
    });
    return;
  }

  // TODO: Document this behaviour
  // Avoid importing files more than once; only first import is inlined (as
  // opposed to CSS @import in which the last import wins)
  if (ctx.dependencies.includes(from)) {
    // Set empty value so at-rule is removed in stringify
    element.value = "";
    return;
  }

  const oldCtxFrom = ctx.from;
  ctx.from = from;

  const ext = path.extname(from);
  let code = fs.readFileSync(from, "utf8");

  // TODO: Document this behaviour
  if (ext === ".xcss" || !ext) {
    code = interpolate(code)(xcss, ctx.x);
  }

  const ast = stylis.compile(code);
  element.return = stylis.serialize(ast, callback);

  // Expose data for constructing source maps
  element.__ast = ast;
  element.__from = from;

  if (element.return === "") {
    // Set empty value so at-rule is removed in stringify
    element.value = "";

    ctx.warnings.push({
      code: "import-empty",
      message: `@import file empty: ${from}`,
      file: oldCtxFrom,
      line: element.line,
      column: element.column,
    });
  }

  ctx.dependencies.push(from);
  ctx.from = oldCtxFrom;
};

export default importPlugin;
