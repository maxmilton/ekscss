import {
  ctx, interpolate, Middleware, xcssTag,
} from 'ekscss';
// TODO: Listing this as a dep kind of sucks, we want to leverage the same stylis as in ekscss
import * as stylis from 'stylis';

// TODO: How reinitialize this on every compile run?
ctx.applyCache = new Map();

/**
 * Stylis middleware to inline the contents of `@import` statements.
 */
export const apply: Middleware = (
  element,
  _index,
  _children,
  _callback,
): void => {
  // if (element.type !== stylis.IMPORT || element.return) return;
};
