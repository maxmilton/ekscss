import type { Context, Expression, Middleware, TemplateFn } from "./types.ts";

const toType = (value: unknown): string => Object.prototype.toString.call(value);

/**
 * Compiler context. For internal and advanced use cases only.
 * @private No guarantee API will remain the same between versions!
 */
// @ts-expect-error - values initialised at runtime
export const ctx = {
  rootDir: undefined,
  from: undefined,
  fn: undefined,
  x: undefined,
  dependencies: undefined,
  warnings: undefined,
} as Context;

export function noop(): void {}

// TODO: Add documentation about the security implications of using this
// function. It uses `new Function()` which means it can execute arbitrary
// code. It must only be used with trusted code.
// TODO: Minimal hardening; runtime checks, sandboxing, etc.

/**
 * Interpolative template engine for XCSS.
 *
 * @param template - An XCSS string template literal to compile.
 */
export function interpolate(template: string): TemplateFn {
  // @ts-expect-error - Function constructor is not type aware
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("xcss", "x", "fn", `'use strict'; return xcss\`${template}\``);
}

/**
 * A transparent placeholder token for an object's undefined property.
 *
 * Intended to be used in `accessorsProxy()` as a way to both allow safe deep
 * object lookups and still report back a string value. This results in
 * non-crashing builds and better visibility into what's wrong to users.
 *
 * NOTE: Uses a class so we can use `instanceof` to identify when it's used as
 * an object's property value. `instanceof` tends to be slightly faster than
 * direct property access for mixed object types - <https://jsben.ch/KVoXV>.
 */
class UndefinedProperty {
  UNDEFINED = "UNDEFINED";

  constructor() {
    // These "own functions" must be non-enumerable so when an UndefinedProperty
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
export function accessorsProxy<T extends object>(obj: T, parentPath: string): T {
  // Shallow clone to prevent mutations on the original object
  const baseTarget = (
    Array.isArray(obj) ? [...obj] : toType(obj) === "[object Object]" ? { ...obj } : obj
  ) as T;

  // eslint-disable-next-line guard-for-in
  for (const key in baseTarget) {
    const value = baseTarget[key];

    if (typeof value === "object" && value !== null) {
      baseTarget[key] = accessorsProxy(value, `${parentPath}.${key}`);
    }
  }

  return new Proxy(baseTarget, {
    get(target, prop, receiver) {
      if (!Reflect.has(target, prop) && prop !== Symbol.toStringTag) {
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
      if (Reflect.has(target, prop)) {
        ctx.warnings.push({
          code: "prop-override",
          message: `Overriding existing property "${parentPath}.${String(prop)}"`,
          file: ctx.from,
        });
      }

      return Reflect.set(
        target,
        prop,
        typeof value === "object" && value !== null
          ? accessorsProxy(value, `${parentPath}.${String(prop)}`)
          : value,
        receiver,
      );
    },
  });
}

/**
 * Iterate over an array's items then combine the result.
 */
export function map<T>(arr: T[], callback: (value: T, index: number) => string): string {
  if (!Array.isArray(arr)) {
    ctx.warnings.push({
      code: "map-invalid-array",
      message: `Expected array but got ${toType(arr)}`,
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
  if (toType(obj) !== "[object Object]") {
    ctx.warnings.push({
      code: "each-invalid-object",
      message: `Expected object but got ${toType(obj)}`,
      file: ctx.from,
    });
    return "INVALID";
  }

  let out = "";

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
export function xcss(template: TemplateStringsArray, ...expressions: Expression[]): string {
  const strings = template.raw;
  const len = strings.length;
  let index = 0;
  let out = "";

  for (; index < len; index++) {
    let value = expressions[index - 1];

    // Reduce XCSS function expressions to their final value
    while (typeof value === "function") {
      value = value(ctx.x, ctx.fn);
    }

    if (typeof value === "object" && value !== null) {
      if (typeof value.toString === "function") {
        value = value.toString();
      } else {
        ctx.warnings.push({
          code: "expression-invalid",
          message: `Invalid XCSS template expression. Must be string, object with toString() method, number, or falsely but got ${toType(
            value,
          )}`,
          file: ctx.from,
        });

        value = "INVALID";
      }
    }

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/restrict-plus-operands
    out += (value || (value == null || value === false ? "" : value)) + strings[index];
  }

  return out;
}

/**
 * Resolve XCSS plugins when specified as a stylis Middleware or string.
 *
 * Iterate over plugins and load plugins specified as a string that denotes
 * either the name of a package or a filepath. Useful when loading XCSS
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
      // NOTE: Typically this function is called before compile begins so we
      // cannot use ctx.warnings here.
      // eslint-disable-next-line no-console
      console.error(`Failed to load plugin "${plugin}":`, error);

      return noop;
    }
  });
}
