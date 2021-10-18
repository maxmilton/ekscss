/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

const { test } = require('uvu');
const assert = require('uvu/assert');
const bundle = require('../dist/index');

test('has no default export', () => {
  assert.type(bundle, 'object');
  // @ts-expect-error - intentionally access undefined prop
  assert.is(bundle.default, undefined);
});

test.run();
