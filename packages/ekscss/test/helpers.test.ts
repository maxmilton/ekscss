import { describe, expect, mock, spyOn, test } from 'bun:test';
import { isProxy } from 'util/types';
import { type Context, compile } from '../src';
import {
  accessorsProxy,
  ctx,
  each,
  interpolate,
  isObject,
  map,
  noop,
  resolvePlugins,
  xcss,
} from '../src/helpers';

function Func() {}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Cls {}

const objects: [string, unknown][] = [
  ['{}', {}],
  ['{ a: 1, b: true }', { a: 1, b: true }],
  ['Object.create({})', Object.create({})],
  ['Object.create(Object.prototype)', Object.create(Object.prototype)],
  ['Object.create(null)', Object.create(null)],
  // biome-ignore format: explicit test
  ['new Func', new (Func as any)], // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, new-parens
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
  ['new Func()', new (Func as any)()],
  // biome-ignore format: explicit test
  ['new Cls', new Cls], // eslint-disable-line new-parens
  ['new Cls()', new Cls()],
  // eslint-disable-next-line unicorn/prefer-global-this
  ['global', global],
] as const;

const notObjects: [string, unknown][] = [
  ["'abc'", 'abc'],
  ["''", ''],
  ['1', 1],
  ['0', 0],
  ['-1', -1],
  ['Number.MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER],
  ['BigInt(Number.MAX_SAFE_INTEGER + 1)', BigInt(Number.MAX_SAFE_INTEGER + 1)],
  ['Infinity', Number.POSITIVE_INFINITY],
  ['-Infinity', Number.NEGATIVE_INFINITY],
  ['true', true],
  ['false', false],
  ['[]', []],
  ["['abc', 'def']", ['abc', 'def']],
  ['function named() {}', function named() {}],
  // biome-ignore lint/complexity/useArrowFunction: explicit test
  ['function () {}', function () {}], // eslint-disable-line func-names
  ['() => {}', () => {}],
  ['async () => {}', async () => {}],
  ['/regex/', /regex/],
  ['Object', Object],
  ['Symbol', Symbol],
  ['Symbol.toStringTag', Symbol.toStringTag],
  ['Symbol.prototype', Symbol.prototype],
  ['undefined', undefined],
  ['null', null],
] as const;

describe('noop', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(noop).toBeFunction();
    expect(noop).not.toBeClass();
  });

  test('expects no parameters', () => {
    expect.assertions(1);
    expect(noop).toHaveParameters(0, 0);
  });

  test('returns undefined', () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(noop()).toBeUndefined();
  });

  test('is an empty function', () => {
    expect.assertions(1);
    expect(noop.toString()).toBe('() => {\n}');
  });
});

describe('ctx', () => {
  test('is an object', () => {
    expect.assertions(1);
    expect(ctx).toBePlainObject();
  });

  test('has expected properties before compile', () => {
    expect.assertions(1);
    // TODO: Fix race condition where sometimes a compile hasn't been run yet
    // and all ctx properties have not been set at all yet.
    // expect(ctx).toStrictEqual({
    expect(ctx).toEqual({
      dependencies: undefined,
      from: undefined,
      rootDir: undefined,
      warnings: undefined,
      x: undefined,
    } as unknown as Context);
  });

  test('has expected properties after compile', () => {
    expect.assertions(1);
    compile('');
    expect(ctx).toStrictEqual({
      dependencies: undefined,
      from: undefined,
      rootDir: undefined,
      warnings: undefined,
      x: undefined,
    } as unknown as Context);
  });

  test('has expected properties during compile', () => {
    expect.assertions(1);
    const check = () => {
      expect(ctx).toEqual({
        dependencies: [],
        from: undefined,
        rootDir: process.cwd(),
        warnings: [],
        x: {
          fn: {
            check, // this custom function
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            each: expect.any(Function),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            map: expect.any(Function),
          },
        },
      });
    };
    // eslint-disable-next-line no-template-curly-in-string
    compile('${(x) => x.fn.check()}', {
      globals: {
        fn: {
          check,
        },
      },
    });
  });
});

describe('resolvePlugins', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(resolvePlugins).toBeFunction();
    expect(resolvePlugins).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(resolvePlugins).toHaveParameters(1, 0);
  });

  test('returns empty array when no plugins', () => {
    expect.assertions(1);
    expect(resolvePlugins([])).toStrictEqual([]);
  });

  test('throws when plugins is not an array', () => {
    expect.assertions(3);
    // @ts-expect-error - testing invalid input
    expect(() => resolvePlugins()).toThrow(/^undefined is not an object/);
    // @ts-expect-error - testing invalid input
    expect(() => resolvePlugins(null)).toThrow(/^null is not an object/);
    // @ts-expect-error - testing invalid input
    expect(() => resolvePlugins({})).toThrow(/is not a function/);
  });

  test('logs error and does not throw when unable to resolve plugin string', () => {
    expect.assertions(2);
    const spy = spyOn(console, 'error').mockImplementation(() => {});
    resolvePlugins(['@ekscss/plugin-not-real']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/^Failed to load plugin "@ekscss\/plugin-not-real":\n/),
    );
    spy.mockRestore();
  });

  test('replaces plugin with noop function when unable to resolve plugin string', () => {
    expect.assertions(2);
    const spy = spyOn(console, 'error').mockImplementation(() => {});
    const plugins = resolvePlugins([
      '@ekscss/plugin-not-real1',
      '@ekscss/plugin-not-real2',
      '@ekscss/plugin-not-real3',
    ]);
    expect(plugins).toStrictEqual([noop, noop, noop]);
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });

  test('passes through non-string plugins as-is', () => {
    expect.assertions(1);
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function plugin1() {}
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function plugin2() {}
    expect(resolvePlugins([plugin1, plugin2])).toStrictEqual([plugin1, plugin2]);
  });

  test('resolves plugins when strings', async () => {
    expect.assertions(7);
    const plugin1 = await import('@ekscss/plugin-apply');
    const plugin2 = await import('@ekscss/plugin-import');
    const plugin3 = await import('@ekscss/plugin-prefix');
    const plugins = resolvePlugins([
      '@ekscss/plugin-apply',
      '@ekscss/plugin-import',
      '@ekscss/plugin-prefix',
    ]);
    expect(plugins[0]).toBeFunction();
    expect(plugins[0]).toBe(plugin1.default);
    expect(plugins[1]).toBeFunction();
    expect(plugins[1]).toBe(plugin2.default);
    expect(plugins[2]).toBeFunction();
    expect(plugins[2]).toBe(plugin3.default);
    expect(plugins).toHaveLength(3);
  });

  test('resolves plugins when functions', async () => {
    expect.assertions(7);
    const plugin1 = await import('@ekscss/plugin-apply');
    const plugin2 = await import('@ekscss/plugin-import');
    const plugin3 = await import('@ekscss/plugin-prefix');
    const plugins = resolvePlugins([plugin1.default, plugin2.default, plugin3.default]);
    expect(plugins[0]).toBeFunction();
    expect(plugins[0]).toBe(plugin1.default);
    expect(plugins[1]).toBeFunction();
    expect(plugins[1]).toBe(plugin2.default);
    expect(plugins[2]).toBeFunction();
    expect(plugins[2]).toBe(plugin3.default);
    expect(plugins).toHaveLength(3);
  });

  test('resolves plugins when mixed', async () => {
    expect.assertions(7);
    const plugin1 = await import('@ekscss/plugin-apply');
    const plugin2 = await import('@ekscss/plugin-import');
    const plugin3 = await import('@ekscss/plugin-prefix');
    const plugins = resolvePlugins([
      '@ekscss/plugin-apply',
      plugin2.default,
      '@ekscss/plugin-prefix',
    ]);
    expect(plugins[0]).toBeFunction();
    expect(plugins[0]).toBe(plugin1.default);
    expect(plugins[1]).toBeFunction();
    expect(plugins[1]).toBe(plugin2.default);
    expect(plugins[2]).toBeFunction();
    expect(plugins[2]).toBe(plugin3.default);
    expect(plugins).toHaveLength(3);
  });
});

describe('interpolate', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(interpolate).toBeFunction();
    expect(interpolate).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(interpolate).toHaveParameters(1, 0);
  });

  test('returns a function', () => {
    expect.assertions(1);
    expect(interpolate('')).toBeFunction();
  });

  // TODO: Write tests for interpolate
});

describe('accessorsProxy', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(accessorsProxy).toBeFunction();
    expect(accessorsProxy).not.toBeClass();
  });

  test('expects 2 parameters', () => {
    expect.assertions(1);
    expect(accessorsProxy).toHaveParameters(2, 0);
  });

  test('returns a Proxy wrapping the passed object', () => {
    expect.assertions(3);
    const obj = { a: 1, b: 2, c: 3 };
    const proxy = accessorsProxy(obj, 'x');
    expect(isProxy(proxy)).toBeTrue();
    expect(proxy).toEqual(obj);
    expect(proxy).not.toStrictEqual(obj); // resulting hidden class is different
  });

  // TODO: Write tests for accessorsProxy
});

describe('isObject', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(isObject).toBeFunction();
    expect(isObject).not.toBeClass();
  });

  test('expects 1 parameter', () => {
    expect.assertions(1);
    expect(isObject).toHaveParameters(1, 0);
  });

  test.each(objects)('returns true for object: %s', (_, value) => {
    expect.assertions(1);
    expect(isObject(value)).toBeTrue();
  });

  test.each(notObjects)('returns false for non-object: %s', (_, value) => {
    expect.assertions(1);
    expect(isObject(value)).toBeFalse();
  });
});

describe('xcss', () => {
  test('is a function', () => {
    expect.assertions(2);
    expect(xcss).toBeFunction();
    expect(xcss).not.toBeClass();
  });

  test('expects 2 parameters (1 optional)', () => {
    expect.assertions(1);
    expect(xcss).toHaveParameters(1, 1);
  });

  test('returns a string', () => {
    expect.assertions(1);
    expect(xcss``).toBe('');
  });

  // TODO: Write tests for xcss
});

describe('xcss fn built-ins', () => {
  describe('each', () => {
    test('is a function', () => {
      expect.assertions(2);
      expect(each).toBeFunction();
      expect(each).not.toBeClass();
    });

    test('expects no parameters', () => {
      expect.assertions(1);
      expect(each).toHaveParameters(2, 0);
    });

    test('returns empty string when no object properties', () => {
      expect.assertions(1);
      expect(each({}, () => 'x')).toBe('');
    });

    test('calls callback for every object property', () => {
      expect.assertions(4);
      const spy = mock(() => '');
      each({ a: 1, b: 2, c: 3 }, spy);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'a', 1);
      expect(spy).toHaveBeenNthCalledWith(2, 'b', 2);
      expect(spy).toHaveBeenNthCalledWith(3, 'c', 3);
    });

    test('returns expected string for every object property', () => {
      expect.assertions(1);
      const str = 'abc';
      expect(each({ a: 1, b: 2, c: 3 }, () => str)).toBe(str.repeat(3));
    });
  });

  describe('map', () => {
    test('is a function', () => {
      expect.assertions(2);
      expect(map).toBeFunction();
      expect(map).not.toBeClass();
    });

    test('expects no parameters', () => {
      expect.assertions(1);
      expect(map).toHaveParameters(2, 0);
    });

    test('returns empty string when no array items', () => {
      expect.assertions(1);
      expect(map([], () => 'x')).toBe('');
    });

    test('calls callback for every array item', () => {
      expect.assertions(4);
      const spy = mock(() => '');
      map([1, 2, 3], spy);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 1, 0);
      expect(spy).toHaveBeenNthCalledWith(2, 2, 1);
      expect(spy).toHaveBeenNthCalledWith(3, 3, 2);
    });

    test('returns expected string for every array item', () => {
      expect.assertions(1);
      const str = 'abc';
      expect(map([1, 2, 3], () => str)).toBe(str.repeat(3));
    });
  });
});
