/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies, no-restricted-syntax */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as allExports from '../src/index';

const compilerPublicExports = [
  ['onBeforeBuild', 'function'],
  ['onAfterBuild', 'function'],
  ['compile', 'function'],
] as const;
const helperPublicExports = [
  ['accessorsProxy', 'function'],
  ['ctx', 'object'],
  ['interpolate', 'function'],
  ['xcssTag', 'function'],
] as const;

for (const [name, type] of compilerPublicExports) {
  test(`exports public "${name}" compiler ${type}`, () => {
    assert.ok(name in allExports, 'is exported');
    assert.type(allExports[name], type);
  });
}

for (const [name, type] of helperPublicExports) {
  test(`exports public "${name}" helper ${type}`, () => {
    assert.ok(name in allExports, 'is exported');
    assert.type(allExports[name], type);
  });
}

test('does not export any private internals', () => {
  const allPublicExportNames = [
    ...compilerPublicExports.map((x) => x[0]),
    ...helperPublicExports.map((x) => x[0]),
    'default', // synthetic default created by esbuild at test runtime
  ];
  const scriptExports = new Set(Object.keys(allExports));
  assert.ok(scriptExports.size >= allPublicExportNames.length);
  for (const name of allPublicExportNames) {
    scriptExports.delete(name);
  }
  assert.is(scriptExports.size, 0);
});

test('has no default export', () => {
  // @ts-expect-error - Synthetic default created by esbuild at test runtime
  assert.type(allExports.default, 'object');
  // @ts-expect-error - Synthetic default created by esbuild at test runtime
  assert.is(allExports.default.default, undefined);
  const bundle = require('../dist/index.js'); // eslint-disable-line
  assert.type(bundle, 'object');
  assert.is(bundle.default, undefined);
});

test.run();
