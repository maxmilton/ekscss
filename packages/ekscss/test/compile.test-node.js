'use strict';

const { test } = require('uvu');
const assert = require('uvu/assert');
const { compile } = require('ekscss');

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
const complexCodeResult =
  'body{font-size:20px;color:coral;}.red{color:coral;}.green{color:seagreen;}.blue{color:deepskyblue;}';

test('bundled compiler runs with empty code', () => {
  const compiled = compile('');
  assert.is(compiled.css, '');
});

test('bundled compiler runs with complex code', () => {
  const compiled = compile(complexCodeFixture);
  assert.snapshot(compiled.css, complexCodeResult);
});

test.run();
