/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

const { test } = require('uvu');
const assert = require('uvu/assert');
const ekscssBundle = require('../dist/index');

test('has no default export', () => {
  assert.type(ekscssBundle, 'object');
  // @ts-expect-error - intentionally access undefined prop
  assert.is(ekscssBundle.default, undefined);
});

test.run();
