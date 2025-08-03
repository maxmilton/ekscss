import type { Context, Middleware, XCSSExpression, XCSSTemplateFn } from "./types.ts";

/**
 * Compiler context. For internal and advanced use cases only.
 * @private No guarantee API will remain the same between versions!
 */
// @ts-expect-error - initialised at runtime
export const ctx: Context = {
  // dependencies: undefined,
  // from: undefined,
  // x: undefined,
  // rootDir: undefined,
  // warnings: undefined,
};

// eslint-disable-next-line @typescript-eslint/unbound-method
const has = Object.prototype.hasOwnProperty;
// eslint-disable-next-line @typescript-eslint/unbound-method
const toStr = Object.prototype.toString;

export function noop(): void {}

/**
 * Interpolative template engine for XCSS.
 *
 * @param template - An XCSS string template literal to compile.
 */
export function interpolate(template: string): XCSSTemplateFn {
  // @ts-expect-error - Function constructor is not type aware
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("xcss", "x", `'use strict'; return xcss\`${template}\``);
}

// TODO: Does this need additional checks anywhere it's used? Ref: https://github.com/jonschlinkert/is-plain-object/blob/master/is-plain-object.js
export function isObject(val: unknown): val is Record<string, unknown> {
  return toStr.call(val) === "[object Object]";
}

/**
 * A transparent placeholder token for an object's undefined property.
 *
 * Intended to be used in `accessorsProxy()` as a way to both allow safe deep
 * object lookups and still report back a string value. This results in
 * non-crashing builds and better visibility into what's wrong to users.
 *
 * XXX: Uses a class so we can use `instanceof` to identify when it's used as
 * an object's property value. `instanceof` tends to be slightly faster than
 * direct property access for mixed object types - <https://jsben.ch/KVoXV>.
 */
class UndefinedProperty {
  UNDEFINED = "UNDEFINED";

  constructor() {
    // These "own functions" must be non-enumerable so when an UndefinedProxy
    // instance's properties are enumerated these functions are not included
    // e.g., `Object.keys(...)`
    Object.defineProperty(this, "toString", {
      enumerable: false,
      value: () => this.UNDEFINED,
    });

    Object.defineProperty(this, Symbol.toPrimitive, {
      enumerable: false,
      value: noop,
    });
  }
}

/**
 * Proxy an object to deeply inject accessor helpers.
 *
 * Generates warnings when an object property is accessed but doesn't exist
 * or when overriding an existing property value (which is often a mistake
 * which leads to undesirable results). Also prevents errors from crashing the
 * build and will instead leave behind tokens to provide hints to users at what
 * went wrong.
 *
 * @param obj - The object to inject accessor helpers into.
 * @param parentPath - Key path to the current location in the object.
 */
export function accessorsProxy<
  T extends Record<string, unknown> | UndefinedProperty,
>(obj: T, parentPath: string): T {
  for (const key in obj) {
    if (has.call(obj, key)) {
      const val = obj[key];

      if (isObject(val)) {
        // eslint-disable-next-line no-param-reassign
        obj[key] = accessorsProxy(val, `${parentPath}.${key}`);
      }
    }
  }

  return new Proxy(obj, {
    get(target, prop, receiver) {
      // bypass Symbol.toStringTag because it's used in isObject
      if (!has.call(target, prop) && prop !== Symbol.toStringTag) {
        const propPath = `${parentPath}.${String(prop)}`;

        ctx.warnings.push({
          code: "prop-undefined",
          message: `Unable to resolve property "${propPath}"`,
          file: ctx.from,
        });

        return accessorsProxy(new UndefinedProperty(), propPath);
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      if (has.call(target, prop)) {
        ctx.warnings.push({
          code: "prop-override",
          message: `Overriding existing property "${parentPath}.${
            String(
              prop,
            )
          }"`,
          file: ctx.from,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const proxiedValue = isObject(value)
        ? accessorsProxy(value, `${parentPath}.${String(prop)}`)
        : value;

      return Reflect.set(target, prop, proxiedValue, receiver);
    },
  });
}

/**
 * Iterate over an array's items then combine the result.
 */
export function map<T>(
  arr: T[],
  callback: (value: T, index: number) => string,
): string {
  if (!Array.isArray(arr)) {
    // TODO: Populate "line" and "column"
    ctx.warnings.push({
      code: "map-invalid-array",
      message: `Expected array but got ${toStr.call(arr)}`,
      file: ctx.from,
    });
    return "INVALID";
  }

  const len = arr.length;
  let index = 0;
  let out = "";

  for (; index < len; index++) {
    out += callback(arr[index], index) || "";
  }

  return out;
}

/**
 * Iterate over each of an object's properties then combine the result.
 */
export function each<T>(
  obj: Record<string, T>,
  callback: (key: string, value: T) => string,
): string {
  if (!isObject(obj)) {
    // TODO: Populate "line" and "column"
    ctx.warnings.push({
      code: "each-invalid-object",
      message: `Expected object but got ${toStr.call(obj)}`,
      file: ctx.from,
    });
    return "INVALID";
  }

  let out = "";

  for (const key in obj) {
    if (has.call(obj, key)) {
      out += callback(key, obj[key]) || "";
    }
  }

  return out;
}

/**
 * XCSS template literal tag function.
 *
 * XCSS template expressions which return `null`, `undefined`, or `false` will
 * return an empty string to make clean templates simpler.
 */
export function xcss(
  template: TemplateStringsArray,
  ...expressions: XCSSExpression[]
): string {
  const strings = template.raw;
  const len = strings.length;
  let index = 0;
  let out = "";

  for (; index < len; index++) {
    let val = expressions[index - 1];

    // Reduce XCSS function expressions to their final value
    while (typeof val === "function") {
      val = val(ctx.x);
    }

    if (typeof val === "object" && val !== null) {
      if (typeof val.toString === "function") {
        val = val.toString();
      } else {
        // TODO: Populate  "line" and "column"
        ctx.warnings.push({
          code: "expression-invalid",
          message:
            `Invalid XCSS template expression. Must be string, object with toString() method, number, or falsely but got ${
              toStr.call(
                val,
              )
            }`,
          file: ctx.from,
        });

        val = "INVALID";
      }
    }

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/restrict-plus-operands
    out += (val || (val == null || val === false ? "" : val)) + strings[index];
  }

  return out;
}

/**
 * Resolve XCSS plugins when specified as a stylis Middleware or string.
 *
 * Iterate over plugins and load plugins specified as a string that denotes
 * either the name of a package or a file path. Useful when loading XCSS
 * configuration from a JSON file.
 */
export function resolvePlugins(plugins: (Middleware | string)[]): Middleware[] {
  if (process.env.BROWSER) {
    throw new Error("Browser runtime does not support resolving plugins");
  }

  return plugins.map((plugin) => {
    if (typeof plugin !== "string") return plugin;

    try {
      // eslint-disable-next-line
      const mod = require(plugin);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return (mod.default ?? mod) as Middleware;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load plugin "${plugin}":\n  ${String(error)}`);
      return noop;
    }
  });
}
