'use strict'; // eslint-disable-line

/** @type {import('@ekscss/cli').XCSSConfig} */
module.exports = {
  globals: {
    media: {
      ns: '(min-width: 30.01em)',
      m: '(min-width: 30.01em) and (max-width: 60em)',
      l: '(min-width: 60.01em)',
    },
  },
};
