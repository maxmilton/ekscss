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
  ['ctx', 'object'],
  ['interpolate', 'function'],
  ['globalsProxy', 'function'],
  ['xcssTag', 'function'],
] as const;

for (const [name, type] of compilerPublicExports) {
  test(`exports public "${name}" compiler ${type}`, () => {
    assert.is(name in allExports, true, 'is exported');
    assert.type(allExports[name], type);
  });
}

for (const [name, type] of helperPublicExports) {
  test(`exports public "${name}" helper ${type}`, () => {
    assert.is(name in allExports, true, 'is exported');
    assert.type(allExports[name], type);
  });
}

test('does not export any private internals', () => {
  const allPublicExportNames = [
    ...compilerPublicExports.map((x) => x[0]),
    ...helperPublicExports.map((x) => x[0]),
    'default', // synthetic default created by esbuild at test runtime
  ];
  const remainingExports = Object.keys(allExports);
  assert.is(
    remainingExports.length
      >= compilerPublicExports.length + helperPublicExports.length,
    true,
  );
  for (const name of allPublicExportNames) {
    remainingExports.splice(remainingExports.indexOf(name), 1);
  }
  assert.is(remainingExports.length, 0);
});

test('has no default export', () => {
  // XXX: `allExports.default` is a synthetic default created by esbuild at test runtime

  // @ts-expect-error - created by esbuild at runtime
  assert.is(allExports.default.default, undefined); // eslint-disable-line
  assert.type(require('../dist/index.js'), 'object'); // eslint-disable-line
  assert.is(require('../dist/index.js').default, undefined); // eslint-disable-line
});

test.run();
