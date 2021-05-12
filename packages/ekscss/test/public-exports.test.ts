/* eslint-disable import/no-extraneous-dependencies */

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

compilerPublicExports.forEach(([name, type]) => {
  test(`exports public "${name}" compiler ${type}`, () => {
    assert.is(name in allExports, true, 'is exported');
    assert.type(allExports[name], type);
  });
});

helperPublicExports.forEach(([name, type]) => {
  test(`exports public "${name}" helper ${type}`, () => {
    assert.is(name in allExports, true, 'is exported');
    assert.type(allExports[name], type);
  });
});

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
  allPublicExportNames.forEach((name) => {
    remainingExports.splice(remainingExports.indexOf(name), 1);
  });
  assert.is(remainingExports.length, 0);
});

test('has no default export', () => {
  // XXX: `allExports.default` is a synthetic default created by esbuild at test runtime

  // @ts-expect-error - created by esbuild at runtime
  assert.is(allExports.default.default, undefined); // eslint-disable-line
  assert.type(require('../dist/index'), 'object'); // eslint-disable-line
  assert.is(require('../dist/index').default, undefined); // eslint-disable-line
});

test.run();
