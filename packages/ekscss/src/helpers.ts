/* eslint-disable id-length */

import type {
  Context, Warning, XCSSTemplateFn, XCSSValidType,
} from './types';

export const ctx: Context = {
  dependencies: null,
  from: null,
  g: null,
  rootDir: null,
  warnings: null,
};

/**
 * Interpolative template engine for XCSS.
 *
 * @param template - An XCSS string template literal to compile.
 */
export function interpolate(template: string): XCSSTemplateFn {
  // @ts-expect-error - Function constructor is not type aware
  // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
  return new Function('xcss', 'g', `'use strict'; return xcss\`${template}\``);
}

/**
 * An undefined object proxy.
 *
 * Intended to be used in `globalsProxy()` as a way to both allow safe deep
 * object lookups and still report back a string value. This results in
 * non-crashing builds and better visibility into what's wrong to users.
 *
 * XXX: Uses a class so we can use `instanceof` to identify when it's used as
 * an object's property value. `instanceof` tends to be slightly faster than
 * direct property access for mixed object types - <https://jsben.ch/KVoXV>.
 */
class UndefinedProxy {
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  T extends Record<string, unknown> | UndefinedProxy,
>(obj: T, parentPath = '', warnings: Warning[]): T {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return obj;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      // @ts-expect-error
      // eslint-disable-next-line no-param-reassign
      obj[key] = globalsProxy(obj[key], `${parentPath}.${key}`, warnings);
    }
  }

  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        const propPath = `${parentPath}.${String(prop)}`;

        warnings.push({
          code: 'prop-undefined',
          // filename: '',
          message: `Unable to resolve key ${propPath}`,
        });

        return globalsProxy(new UndefinedProxy(), propPath, warnings);
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      if (
        Reflect.has(target, prop)
        // TODO: Should we provide a warning when the prop was accessed before
        // it was set (when it's UndefinedProxy here)? Might be annoying if code
        // actually relies on that behaviour
        && !(Reflect.get(target, prop) instanceof UndefinedProxy)
      ) {
        const propPath = `${parentPath}.${String(prop)}`;

        warnings.push({
          code: 'prop-override',
          // filename: '',
          message: `Overriding existing value of ${propPath}`,
        });
      }

      const proxiedValue = typeof value === 'object'
        ? globalsProxy(value, `${parentPath}.${String(prop)}`, warnings)
        : value;

      return Reflect.set(target, prop, proxiedValue, receiver);
    },
  });
}

/**
 * Assign properties from an object to another but only if those properties are
 * nullish, mutating the `to` object in place.
 */
export function assignNullish(
  to: Record<string, unknown>,
  from: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-restricted-syntax
  for (const prop in from) {
    // Workaround for compiler accessorsProxy()
    if (to[prop] instanceof UndefinedProxy) {
      // eslint-disable-next-line no-param-reassign
      to[prop] = from[prop];
    } else {
      // eslint-disable-next-line no-param-reassign
      to[prop] ??= from[prop];
    }
  }
}

/**
 * Iterate over an array's items then combine the result.
 */
export function map<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => string,
): string {
  if (!Array.isArray(arr)) {
    throw new Error(
      `fn.map expected an array but got ${Object.prototype.toString.call(arr)}`,
    );
  }

  return arr.map(callback).join('');
}

/**
 * Iterate over an object's property keys and values then combine the result.
 */
export function entries<T>(
  obj: { [key: string]: T } | ArrayLike<T>,
  callback: (entries_: [string, T]) => string,
): string {
  return Object.entries(obj).map(callback).join('');
}

/**
 * XCSS template literal tag function.
 *
 * @returns Function to serialize an XCSS template literal string.
 *
 * Placeholder expressions which return `null`, `undefined`, or `false` will
 * result in an empty string to assist with writing clean templates. Placeholder
 * expressions which return a function will be passed `g`, and contextual `ctx`
 * agruments at runtime.
 */
export function xcssTag() {
  return (children: TemplateStringsArray, ...values: XCSSValidType[]): string => children.raw.reduce((code, current, index) => {
    let value = values[index - 1];

    // Reduce XCSS function expressions to their final value
    while (typeof value === 'function') {
      value = value(ctx.g, { from: ctx.from, rootDir: ctx.rootDir });
    }

    if (typeof value === 'object' && value !== null) {
      if (typeof value.toString === 'function') {
        value = value.toString();
      } else {
        ctx.warnings.push({
          code: 'expression-invalid',
          filename: ctx.from,
          message: `Invalid XCSS template expression. Must be string, object with toString() method,
number, or falsely but got ${Object.prototype.toString.call(value)}`,
        });

        value = 'INVALID';
      }
    }

    return (
      code
        + (value || (value == null || value === false ? '' : value))
        + current
    );
  });
}
