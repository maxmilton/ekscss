// TODO: Write more tests
// - Add new file `sourcemap.test.ts` + write tests for source map support
// - Validate "warnings" are generated in expected scenarios and file, line, column are correct
// - Validate "dependencies" are added correctly

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
  assert.is(compiled.warnings.length, 0, 'no warnings');
});

test('returns expected object shape', () => {
  const compiled = compile('');
  assert.equal(compiled, {
    css: '',
    dependencies: [],
    map: undefined,
    warnings: [],
  });
});

test('runs with complex code', () => {
  const compiled = compile(complexCodeFixture);
  assert.snapshot(compiled.css, complexCodeResult);
  assert.is(compiled.warnings.length, 0, 'no warnings');
});

test.run();
