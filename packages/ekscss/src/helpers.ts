/* eslint-disable no-restricted-syntax */

import type {
  Context,
  XCSSExpression,
  XCSSGlobals,
  XCSSTemplateFn,
} from './types';

export const ctx: Context = {
  // @ts-expect-error - initialised in compile setup phase
  dependencies: undefined,
  from: undefined,
  // @ts-expect-error - initialised in compile setup phase
  x: undefined,
  // @ts-expect-error - initialised in compile setup phase
  rawX: undefined,
  // @ts-expect-error - initialised in compile setup phase
  rootDir: undefined,
  // @ts-expect-error - initialised in compile setup phase
  warnings: undefined,
};

/**
 * Interpolative template engine for XCSS.
 *
 * @param template - An XCSS string template literal to compile.
 */
export function interpolate(template: string): XCSSTemplateFn {
  // @ts-expect-error - Function constructor is not type aware
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function('xcss', 'x', `'use strict'; return xcss\`${template}\``);
}

/**
 * A transparent placeholder for an object's undefined property.
 *
 * Intended to be used in `globalsProxy()` as a way to both allow safe deep
 * object lookups and still report back a string value. This results in
 * non-crashing builds and better visibility into what's wrong to users.
 *
 * XXX: Uses a class so we can use `instanceof` to identify when it's used as
 * an object's property value. `instanceof` tends to be slightly faster than
 * direct property access for mixed object types - <https://jsben.ch/KVoXV>.
 */
class UndefinedProperty {
  UNDEFINED = 'UNDEFINED';

  constructor() {
    // These own funtions must be non-enumerable so when an UndefinedProxy
    // instance is used with enumerating Object static functions, these own
    // functions are not included (e.g. `Object.keys()`)
    Object.defineProperty(this, 'toString', {
      enumerable: false,
      value: () => this.UNDEFINED,
    });

    Object.defineProperty(this, Symbol.toPrimitive, {
      enumerable: false,
      value: () => undefined,
    });
  }
}

/**
 * Inject accessor helpers into the globals object.
 *
 * Generates warnings when an object property is accessed but doesn't exist
 * or when overriding an existing property value (which often leads to
 * undesirable results).
 *
 * @param obj - The object to inject accessor helpers into.
 * @param parentPath - Key path to the current location in the object.
 */
export function globalsProxy<
  T extends Record<string, unknown> | UndefinedProperty,
>(obj: T, parentPath: string): T {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return obj;
  }

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      // @ts-expect-error - FIXME: Account for `UndefinedProperty`
      // eslint-disable-next-line no-param-reassign
      obj[key] = globalsProxy(obj[key], `${parentPath}.${key}`);
    }
  }

  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        const propPath = `${parentPath}.${String(prop)}`;

        ctx.warnings.push({
          code: 'prop-undefined',
          message: `Unable to resolve property "${propPath}"`,
          file: ctx.from,
        });

        return globalsProxy(new UndefinedProperty(), propPath);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      if (
        Reflect.has(target, prop)
        // TODO: Should we provide a warning when the prop was accessed before
        // it was set (when it's UndefinedProxy here)? Might be annoying if code
        // actually relies on that behaviour
        && !(Reflect.get(target, prop) instanceof UndefinedProperty)
      ) {
        const propPath = `${parentPath}.${String(prop)}`;

        ctx.warnings.push({
          code: 'prop-override',
          message: `Overriding existing value of property "${propPath}"`,
          file: ctx.from,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const proxiedValue = typeof value === 'object'
        ? globalsProxy(value, `${parentPath}.${String(prop)}`)
        : value;

      return Reflect.set(target, prop, proxiedValue, receiver);
    },
  });
}

/**
 * Assign properties from an object to another but only if those properties are
 * nullish. Mutates the `to` object in place.
 */
function assignNullish(
  to: Record<string, unknown>,
  from: Record<string, unknown>,
): void {
  // eslint-disable-next-line guard-for-in, no-param-reassign
  for (const prop in from) to[prop] ??= from[prop];
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

/**
 * Recursively set default values in global properties.
 *
 * Will only set a property value if one does not already exist.
 */
export function applyDefault(globals: Partial<XCSSGlobals>): void;
export function applyDefault(
  globals: Partial<XCSSGlobals>,
  x: Partial<XCSSGlobals>,
): void;
export function applyDefault(
  globals: Partial<XCSSGlobals>,
  x: Partial<XCSSGlobals> = ctx.rawX,
): void {
  assignNullish(x, globals);

  // eslint-disable-next-line guard-for-in
  for (const key in globals) {
    const from = globals[key];
    const to = x[key];

    if (isObject(from) && isObject(to)) {
      applyDefault(from, to);
    }
  }
}

/**
 * Iterate over an array's items then combine the result.
 */
export function combineMap<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => string,
): string {
  if (!Array.isArray(arr)) {
    ctx.warnings.push({
      code: 'map-invalid-arr',
      message: `Expected array but got ${Object.prototype.toString.call(arr)}`,
    });
    return 'INVALID';
  }

  return arr.map(callback).join('');
}

/**
 * Iterate over an object's property keys and values then combine the result.
 */
export function combineEntries<T>(
  obj: { [key: string]: T } | ArrayLike<T>,
  callback: (entries_: [string, T]) => string,
): string {
  return Object.entries(obj).map(callback).join('');
}

/**
 * XCSS template literal tag function.
 *
 * XCSS template expressions which return `null`, `undefined`, or `false` will
 * return an empty string to make clean templates simpler.
 */
export const xcssTag = () => function xcss(
  strings: TemplateStringsArray,
  ...expressions: XCSSExpression[]
): string {
  return strings.raw.reduce((code, current, index) => {
    let val = expressions[index - 1];

    // Reduce XCSS function expressions to their final value
    while (typeof val === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      val = val(ctx.x);
    }

    if (typeof val === 'object' && val !== null) {
      if (typeof val.toString === 'function') {
        val = val.toString();
      } else {
        ctx.warnings.push({
          code: 'expression-invalid',
          message: `Invalid XCSS template expression. Must be string, object with toString() method,
number, or falsely but got ${Object.prototype.toString.call(val)}`,
          file: ctx.from,
        });

        val = 'INVALID';
      }
    }

    return (
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      code + (val || (val == null || val === false ? '' : val)) + current
    );
  });
};
