import { describe, expect, mock, spyOn, test } from "bun:test";
import { isProxy } from "node:util/types";
import { compile } from "../src/compiler.ts";
import { accessorsProxy, ctx, each, interpolate, map, noop, resolvePlugins, xcss } from "../src/helpers.ts";
import type { Context } from "../src/types.ts";

describe("noop", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(noop).toBeFunction();
    expect(noop).not.toBeClass();
  });

  test("expects no parameters", () => {
    expect.assertions(1);
    expect(noop).toHaveParameters(0, 0);
  });

  test("returns undefined", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(noop()).toBeUndefined();
  });

  test("is an empty function", () => {
    expect.assertions(1);
    expect(noop.toString()).toBe("function noop() {}");
  });
});

describe("ctx", () => {
  test("is an object", () => {
    expect.assertions(1);
    expect(ctx).toBePlainObject();
  });

  test("has expected properties before compile", () => {
    expect.assertions(1);
    // XXX: Before a compile has run all ctx properties are present on the ctx
    // object but set as undefined.
    expect(ctx).toStrictEqual({
      rootDir: undefined,
      from: undefined,
      fn: undefined,
      x: undefined,
      dependencies: undefined,
      warnings: undefined,
    } as unknown as Context);
  });

  test("has expected properties after compile", () => {
    expect.assertions(1);
    compile("");
    expect(ctx).toStrictEqual({
      rootDir: undefined,
      from: undefined,
      fn: undefined,
      x: undefined,
      dependencies: undefined,
      warnings: undefined,
    } as unknown as Context);
  });

  test("has expected properties during compile", () => {
    expect.assertions(1);
    const check = () => {
      expect(ctx).toEqual({
        rootDir: process.cwd(),
        from: undefined,
        fn: {
          check, // this custom function
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          each: expect.any(Function),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          map: expect.any(Function),
        },
        x: {},
        dependencies: [],
        warnings: [],
      });
    };
    // eslint-disable-next-line no-template-curly-in-string
    compile("${(x, fn) => fn.check()}", {
      functions: {
        check,
      },
      globals: {},
    });
  });
});

describe("resolvePlugins", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(resolvePlugins).toBeFunction();
    expect(resolvePlugins).not.toBeClass();
  });

  test("expects 1 parameter", () => {
    expect.assertions(1);
    expect(resolvePlugins).toHaveParameters(1, 0);
  });

  test("returns empty array when no plugins", () => {
    expect.assertions(1);
    expect(resolvePlugins([])).toStrictEqual([]);
  });

  test("throws when plugins is not an array", () => {
    expect.assertions(3);
    // @ts-expect-error - testing invalid input
    expect(() => resolvePlugins()).toThrow(/^undefined is not an object/);
    // @ts-expect-error - testing invalid input
    expect(() => resolvePlugins(null)).toThrow(/^null is not an object/);
    // @ts-expect-error - testing invalid input
    expect(() => resolvePlugins({})).toThrow(/is not a function/);
  });

  test("logs error and does not throw when unable to resolve plugin string", () => {
    expect.assertions(2);
    const spy = spyOn(console, "error").mockImplementation(() => {});
    resolvePlugins(["@ekscss/plugin-not-real"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'Failed to load plugin "@ekscss/plugin-not-real":',
      expect.objectContaining({
        name: "ResolveMessage",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: expect.stringMatching(/^Cannot find module '@ekscss\/plugin-not-real'/),
      }),
    );
    spy.mockRestore();
  });

  test("replaces plugin with noop function when unable to resolve plugin string", () => {
    expect.assertions(2);
    const spy = spyOn(console, "error").mockImplementation(() => {});
    const plugins = resolvePlugins([
      "@ekscss/plugin-not-real1",
      "@ekscss/plugin-not-real2",
      "@ekscss/plugin-not-real3",
    ]);
    expect(plugins).toStrictEqual([noop, noop, noop]);
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });

  test("passes through non-string plugins as-is", () => {
    expect.assertions(1);
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function plugin1() {}
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function plugin2() {}
    expect(resolvePlugins([plugin1, plugin2])).toStrictEqual([
      plugin1,
      plugin2,
    ]);
  });

  test("resolves plugins when strings", async () => {
    expect.assertions(7);
    const plugin = await import("@ekscss/plugin-null");
    const plugins = resolvePlugins([
      "@ekscss/plugin-null",
      "@ekscss/plugin-null",
      "@ekscss/plugin-null",
    ]);
    expect(plugins[0]).toBeFunction();
    expect(plugins[0]).toBe(plugin.default);
    expect(plugins[1]).toBeFunction();
    expect(plugins[1]).toBe(plugin.default);
    expect(plugins[2]).toBeFunction();
    expect(plugins[2]).toBe(plugin.default);
    expect(plugins).toHaveLength(3);
  });

  test("resolves plugins when functions", async () => {
    expect.assertions(7);
    const plugin = await import("@ekscss/plugin-null");
    const plugins = resolvePlugins([
      plugin.default,
      plugin.default,
      plugin.default,
    ]);
    expect(plugins[0]).toBeFunction();
    expect(plugins[0]).toBe(plugin.default);
    expect(plugins[1]).toBeFunction();
    expect(plugins[1]).toBe(plugin.default);
    expect(plugins[2]).toBeFunction();
    expect(plugins[2]).toBe(plugin.default);
    expect(plugins).toHaveLength(3);
  });

  test("resolves plugins when mixed", async () => {
    expect.assertions(7);
    const plugin = await import("@ekscss/plugin-null");
    const plugins = resolvePlugins([
      "@ekscss/plugin-null",
      plugin.default,
      "@ekscss/plugin-null",
    ]);
    expect(plugins[0]).toBeFunction();
    expect(plugins[0]).toBe(plugin.default);
    expect(plugins[1]).toBeFunction();
    expect(plugins[1]).toBe(plugin.default);
    expect(plugins[2]).toBeFunction();
    expect(plugins[2]).toBe(plugin.default);
    expect(plugins).toHaveLength(3);
  });
});

describe("interpolate", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(interpolate).toBeFunction();
    expect(interpolate).not.toBeClass();
  });

  test("expects 1 parameter", () => {
    expect.assertions(1);
    expect(interpolate).toHaveParameters(1, 0);
  });

  test("returns a function", () => {
    expect.assertions(1);
    expect(interpolate("")).toBeFunction();
  });

  // TODO: Write tests for interpolate
});

describe("accessorsProxy", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(accessorsProxy).toBeFunction();
    expect(accessorsProxy).not.toBeClass();
  });

  test("expects 2 parameters", () => {
    expect.assertions(1);
    expect(accessorsProxy).toHaveParameters(2, 0);
  });

  test("returns a Proxy wrapping the passed object", () => {
    expect.assertions(3);
    const obj = { a: 1, b: 2, c: 3 };
    const proxy = accessorsProxy(obj, "x");
    expect(isProxy(proxy)).toBeTrue();
    expect(proxy).toEqual(obj);
    expect(proxy).not.toStrictEqual(obj); // resulting hidden class is different
  });

  // TODO: Write tests for accessorsProxy
});

describe("xcss", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(xcss).toBeFunction();
    expect(xcss).not.toBeClass();
  });

  test("expects 2 parameters (1 optional)", () => {
    expect.assertions(1);
    expect(xcss).toHaveParameters(1, 1);
  });

  test("returns a string", () => {
    expect.assertions(1);
    expect(xcss``).toBe("");
  });

  // TODO: Write tests for xcss
});

describe("xcss fn built-ins", () => {
  describe("each", () => {
    test("is a function", () => {
      expect.assertions(2);
      expect(each).toBeFunction();
      expect(each).not.toBeClass();
    });

    test("expects no parameters", () => {
      expect.assertions(1);
      expect(each).toHaveParameters(2, 0);
    });

    test("returns empty string when no object properties", () => {
      expect.assertions(1);
      expect(each({}, () => "x")).toBe("");
    });

    test("calls callback for every object property", () => {
      expect.assertions(4);
      const spy = mock(() => "");
      each({ a: 1, b: 2, c: 3 }, spy);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, "a", 1);
      expect(spy).toHaveBeenNthCalledWith(2, "b", 2);
      expect(spy).toHaveBeenNthCalledWith(3, "c", 3);
    });

    test("returns expected string for every object property", () => {
      expect.assertions(1);
      const str = "abc";
      expect(each({ a: 1, b: 2, c: 3 }, () => str)).toBe(str.repeat(3));
    });
  });

  describe("map", () => {
    test("is a function", () => {
      expect.assertions(2);
      expect(map).toBeFunction();
      expect(map).not.toBeClass();
    });

    test("expects no parameters", () => {
      expect.assertions(1);
      expect(map).toHaveParameters(2, 0);
    });

    test("returns empty string when no array items", () => {
      expect.assertions(1);
      expect(map([], () => "x")).toBe("");
    });

    test("calls callback for every array item", () => {
      expect.assertions(4);
      const spy = mock(() => "");
      map([1, 2, 3], spy);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 1, 0);
      expect(spy).toHaveBeenNthCalledWith(2, 2, 1);
      expect(spy).toHaveBeenNthCalledWith(3, 3, 2);
    });

    test("returns expected string for every array item", () => {
      expect.assertions(1);
      const str = "abc";
      expect(map([1, 2, 3], () => str)).toBe(str.repeat(3));
    });
  });
});
