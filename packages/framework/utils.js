/* eslint-disable @typescript-eslint/no-var-requires */

const { applyPlugin } = require('@ekscss/plugin-apply');
const { importPlugin } = require('@ekscss/plugin-import');
const { ctx, interpolate, xcssTag } = require('ekscss');
const stylis = require('stylis'); // eslint-disable-line import/no-extraneous-dependencies

function preloadApply(code = "@import '@ekscss/framework/level2.xcss';") {
  const interpolated = interpolate(code)(xcssTag(), ctx.x);
  const ast = stylis.compile(interpolated);
  stylis.serialize(
    ast,
    stylis.middleware([importPlugin, applyPlugin, () => ' ']),
  );
}

exports.preloadApply = preloadApply;
