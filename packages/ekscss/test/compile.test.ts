/* eslint-disable import/no-extraneous-dependencies */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { compile } from '../src/compiler';

const complexCodeFixture = `
  /**
   * block comm
   */

  \${x.color = {
    red: 'coral',
    green: 'seagreen',
    blue: 'deepskyblue',
  }, null}

  body {
    font-size: 20px;
    color: \${x.color.red};
  }

  // inline comm
  \${x.fn.each(x.color, (name, value) => xcss\`
    .\${name} { color: \${value}; }
  \`)}
`;
const complexCodeResult = 'body{font-size:20px;color:coral;}.red{color:coral;}.green{color:seagreen;}.blue{color:deepskyblue;}';

test('returns expected result with empty code', () => {
  const compiled = compile('');
  assert.is(compiled.css, '');
});

// TODO:

test('runs with complex code', () => {
  const compiled = compile(complexCodeFixture);
  assert.snapshot(compiled.css, complexCodeResult);
});

// FIXME: Run these tests without esbuild-register so it doesn't transpile the
// imported code since we need to verify it runs as-is on each node version

test('bundled compiler runs with empty code', () => {
  // eslint-disable-next-line
  const compiled = require('../dist/index').compile('');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  assert.is(compiled.css, '');
});

test('bundled compiler runs with complex code', () => {
  // eslint-disable-next-line
  const compiled = require('../dist/index').compile(complexCodeFixture);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  assert.snapshot(compiled.css, complexCodeResult);
});

test.run();
