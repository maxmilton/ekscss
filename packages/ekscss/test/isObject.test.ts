/* eslint-disable import/no-extraneous-dependencies, no-restricted-syntax */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { isObject } from '../src/helpers';

function Func() {}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Cls {}

const objects = [
  [{}, '{}'],
  [{ a: 1, b: true }, '{ a: 1, b: true }'],
  [Object.create({}), 'Object.create({})'],
  [Object.create(Object.prototype), 'Object.create(Object.prototype)'],
  [Object.create(null), 'Object.create(null)'],
  // @ts-expect-error - implicit any is ok
  [new Func(), 'new Func'],
  // @ts-expect-error - implicit any is ok
  [new Func(), 'new Func()'],
  [new Cls(), 'new Cls'],
  [new Cls(), 'new Cls()'],
] as const;

const notObjects = [
  ['abc', "'abc'"],
  ['', "''"],
  [1, '1'],
  [0, '0'],
  [-1, '-1'],
  // eslint-disable-next-line unicorn/prefer-number-properties
  [Infinity, 'Infinity'],
  // eslint-disable-next-line unicorn/prefer-number-properties
  [-Infinity, '-Infinity'],
  [Number.POSITIVE_INFINITY, 'Infinity'],
  [Number.NEGATIVE_INFINITY, '-Infinity'],
  [BigInt(Number.MAX_SAFE_INTEGER), 'BigInt(Number.MAX_SAFE_INTEGER)'],
  [true, 'true'],
  [false, 'false'],
  [[], '[]'],
  [['abc', 'def'], "['abc', 'def']"],
  [function named() {}, 'function named() {}'],
  // eslint-disable-next-line func-names
  [function () {}, 'function () {}'],
  [() => {}, '() => {}'],
  [async () => {}, 'async () => {}'],
  [/regex/, '/regex/'],
  [Object, 'Object'],
  [Symbol, 'Symbol'],
  [Symbol.toStringTag, 'Symbol.toStringTag'],
  [Symbol.prototype, 'Symbol.prototype'],
  [undefined, 'undefined'],
  [null, 'null'],
  // eslint-disable-next-line no-sparse-arrays
  [, '<no value>'],
  [global, 'global'],
] as const;

for (const [value, name] of objects) {
  test(`returns true for "${name}" object`, () => {
    assert.is(isObject(value), true);
  });
}

for (const [value, name] of notObjects) {
  test(`returns false for "${name}" non-object`, () => {
    assert.is(isObject(value), false);
  });
}

test.run();
