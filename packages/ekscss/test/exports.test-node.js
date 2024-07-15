'use strict';

const { test } = require('uvu');
const assert = require('uvu/assert');
const bundle = require('ekscss');

test('has no default export', () => {
  assert.type(bundle, 'object');
  // @ts-expect-error - intentionally access undefined property
  assert.is(bundle.default, undefined);
});

test.run();
