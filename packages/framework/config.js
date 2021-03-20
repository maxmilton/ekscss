'use strict'; // eslint-disable-line

// REF: https://refactoringui.com/previews/building-your-color-palette/

// TODO: Should some of the unique parts of the config be moved into the respective addons?
// TODO: Should addons @import their required addons?

/* eslint-disable id-length, sort-keys */

const colorFn = require('color');
// const { triangle } = require('./mixins/triangle');
// const { xcssTag } = require('ekscss');

// const xcss = xcssTag({ ctx: {}, g: globals, warnings: [] });

/** @type {import('ekscss').XCSSGlobals} */
const globals = {
  fn: {
    // XXX: Experiment... so meta...
    // xcss: (g, ctx) => xcssTag({ ctx, g, warnings: [] }),

    // /** @see https://github.com/Qix-/color#readme */
    // /** @type {import('color')} */
    // color: colorFn,
    // color(colorValue) {
    //   return (g, ctx) => {
    //     const value = xcssExpression(colorValue, { g, ctx });
    //     return colorFn(value);
    //   };
    // },
    // color: (value) => () => colorFn(xcss`${value}`),
    color: (value) => colorFn(xcss`${value}`),
    // alpha(color, value) {
    //   return (g, ctx) => {
    //     const _color = xcssExpression(color, { g, ctx });
    //     return colorFn(_color).alpha(value);
    //   };
    // },
    // // modifiers
    // lighten
    // darken
    // lightness
    // saturate
    // desaturate
    // whiten
    // blacken
    // fade
    // opaquer
    // rotate

    // // utils
    // negate
    // grayscale
    // mix

    // // color channels
    // alpha
    // red
    // green
    // blue
    // hue
    // saturationl
    // saturationv
    // lightness
    // whiteness
    // blackness
    // cyan
    // magenta
    // yellow
    // black

    // // convert
    // rgb
    // hsl
    // hex
    // cmyk
    // hsl
    // hsv

    // // utils
    // isLight
    // isDark
    // luminosity

    // Mixins
    // FIXME: Remove if unused + remove packages/framework/mixins/triangle.js
    // triangle,
  },

  // colorTest1: (g) => g.fn.color(g.color.dark4).alpha(0.1),
  // colorTest1: (g) => g.fn.color(g.color.dark4),
  // colorTest2: (g) => g.fn.color(g.color.text),
  // colorTest3: (g) => g.fn.alpha(g.color.text, 0.1),
  // colorTest4: (g, ctx) =>
  //   g.fn.color(g.fn.expr(g.color.text, { ctx, g })).alpha(0.1),

  // colorTestOut1: (g) => g.colorTest1,
  // colorTestOut2: (g) => g.colorTest2,
  // colorTestOut3: (g) => g.colorTest3,
  // colorTestOut4: (g) => g.colorTest4,

  // test1: (g) => {
  //   console.log('@@@@@@@ G', g.fn.xcss.toString());
  // },

  /** Responsive media queries. */
  media: {
    /** "Not-small" media query. */
    ns: '(min-width: 30.01em)',
    /** "Medium" media query. */
    m: '(min-width: 30.01em) and (max-width: 60em)',
    /** "Large" media query. */
    l: '(min-width: 60.01em)',
  },
  breakpoints: (g) => Object.keys(g.media),

  spacingValues: ['0', '0.25em', '0.5em', '1em', '2em', '4em', '8em', '16em'],

  // containerMaxWidth: '50rem',

  fontStack: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Helvetica',
    'Arial',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
  ].join(),
  fontStackMonospace: [
    'SFMono-Regular',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'monospace',
  ].join(),

  textSize: '1.25em', // 20px
  // textSize: '1.0625em', // 17px
  // textSizeL: '1.25em', // 20px

  /**
   * Colour palette based on the excellent GNOME HIG colours.
   *
   * @see https://developer.gnome.org/hig/stable/icon-design.html.en#palette
   * @see https://gitlab.gnome.org/Teams/Design/HIG-app-icons/-/blob/master/GNOME%20HIG.scss
   */
  color: {
    // red1: 'rgb(246,97,81)',
    // red2: 'rgb(237,51,59)',
    // red3: 'rgb(224,27,36)',
    // red4: 'rgb(192,28,40)',
    // red5: 'rgb(165,29,45)',
    // orange1: 'rgb(255,190,111)',
    // orange2: 'rgb(255,163,72)',
    // orange3: 'rgb(255,120,0)',
    // orange4: 'rgb(230,97,0)',
    // orange5: 'rgb(198,70,0)',
    // yellow1: 'rgb(249,240,107)',
    // yellow2: 'rgb(248,228,92)',
    // yellow3: 'rgb(246,211,45)',
    // yellow4: 'rgb(245,194,17)',
    // yellow5: 'rgb(229,165,10)',
    // green1: 'rgb(143,240,164)',
    // green2: 'rgb(87,227,137)',
    // green3: 'rgb(51,209,122)',
    // green4: 'rgb(46,194,126)',
    // green5: 'rgb(38,162,105)',
    // blue1: 'rgb(153,193,241)',
    // blue2: 'rgb(98,160,234)',
    // blue3: 'rgb(53,132,228)',
    // blue4: 'rgb(28,113,216)',
    // blue5: 'rgb(26,95,180)',
    // purple1: 'rgb(220,138,221)',
    // purple2: 'rgb(192,97,203)',
    // purple3: 'rgb(145,65,172)',
    // purple4: 'rgb(129,61,156)',
    // purple5: 'rgb(97,53,131)',
    // brown1: 'rgb(205,171,143)',
    // brown2: 'rgb(181,131,90)',
    // brown3: 'rgb(152,106,68)',
    // brown4: 'rgb(134,94,60)',
    // brown5: 'rgb(99,69,44)',
    // light1: 'rgb(255,255,255)',
    // light2: 'rgb(246,245,244)',
    // light3: 'rgb(222,221,218)',
    // light4: 'rgb(192,191,188)',
    // light5: 'rgb(154,153,150)',
    // dark1: 'rgb(119,118,123)',
    // dark2: 'rgb(94,92,100)',
    // dark3: 'rgb(61,56,70)',
    // dark4: 'rgb(36,31,49)',
    // dark5: 'rgb(0,0,0)',

    // ////////////////////////////////////////////////////////////////////////

    // https://github.com/palantir/blueprint/blob/develop/packages/core/src/common/_colors.scss

    // Copyright 2015 Palantir Technologies, Inc. All rights reserved.
    // Licensed under the Apache License, Version 2.0.

    // Gray scale

    black: '#10161a',

    dark1: '#182026',
    dark2: '#202b33',
    dark3: '#293742',
    dark4: '#30404d',
    dark5: '#394b59',

    gray1: '#5c7080',
    gray2: '#738694',
    gray3: '#8a9ba8',
    gray4: '#a7b6c2',
    gray5: '#bfccd6',

    light1: '#ced9e0',
    light2: '#d8e1e8',
    light3: '#e1e8ed',
    light4: '#ebf1f5',
    light5: '#f5f8fa',

    white: '#ffffff',

    // Core colors

    blue1: '#0e5a8a',
    blue2: '#106ba3',
    blue3: '#137cbd',
    blue4: '#2b95d6',
    blue5: '#48aff0',

    green1: '#0a6640',
    green2: '#0d8050',
    green3: '#0f9960',
    green4: '#15b371',
    green5: '#3dcc91',

    orange1: '#a66321',
    orange2: '#bf7326',
    orange3: '#d9822b',
    orange4: '#f29d49',
    orange5: '#ffb366',

    red1: '#a82a2a',
    red2: '#c23030',
    red3: '#db3737',
    red4: '#f55656',
    red5: '#ff7373',

    // Extended colors

    vermilion1: '#9e2b0e',
    vermilion2: '#b83211',
    vermilion3: '#d13913',
    vermilion4: '#eb532d',
    vermilion5: '#ff6e4a',

    rose1: '#a82255',
    rose2: '#c22762',
    rose3: '#db2c6f',
    rose4: '#f5498b',
    rose5: '#ff66a1',

    violet1: '#5c255c',
    violet2: '#752f75',
    violet3: '#8f398f',
    violet4: '#a854a8',
    violet5: '#c274c2',

    indigo1: '#5642a6',
    indigo2: '#634dbf',
    indigo3: '#7157d9',
    indigo4: '#9179f2',
    indigo5: '#ad99ff',

    cobalt1: '#1f4b99',
    cobalt2: '#2458b3',
    cobalt3: '#2965cc',
    cobalt4: '#4580e6',
    cobalt5: '#669eff',

    turquoise1: '#008075',
    turquoise2: '#00998c',
    turquoise3: '#00b3a4',
    turquoise4: '#14ccbd',
    turquoise5: '#2ee6d6',

    forest1: '#1d7324',
    forest2: '#238c2c',
    forest3: '#29a634',
    forest4: '#43bf4d',
    forest5: '#62d96b',

    lime1: '#728c23',
    lime2: '#87a629',
    lime3: '#9bbf30',
    lime4: '#b6d94c',
    lime5: '#d1f26d',

    gold1: '#a67908',
    gold2: '#bf8c0a',
    gold3: '#d99e0b',
    gold4: '#f2b824',
    gold5: '#ffc940',

    sepia1: '#63411e',
    sepia2: '#7d5125',
    sepia3: '#96622d',
    sepia4: '#b07b46',
    sepia5: '#c99765',

    // ////////////////////////////////////////////////////////////////////////

    background: (g) => g.color.light5,
    shadow: (g) => g.fn.color(g.color.dark4).alpha(0.1),

    primary: (g) => g.color.blue2,
    success: (g) => g.color.green2,
    warning: (g) => g.color.orange2,
    danger: (g) => g.color.red2,

    // background: (g) => g.color.dark4,
    // text: '#212529',
    // text: (g) => g.color.dark4,
    text: (g) => g.color.dark2,
    // link: '#2d3436',
    link: (g) => g.color.primary,
    // link: 'inherit',
    // muted: (g) => g.color.dark1,
    muted: (g) => g.color.gray1,

    // linkHover: '#0f96ff',
    // linkHover: (g) => g.color.primary,
    linkHover: 'inherit',

    // FIXME: Nested XCSSExpression
    disabled: (g) => g.fn.color(g.color.muted).alpha(0.5),
    // disabled: (g) => g.fn.color(g.color.dark1).alpha(0.5),
  },

  /* Grid */
  containerWidthMax: '50em' /* 1000px @ 20px fontSize */,
  containerNarrowWidthMax: '30em',
  itemSize: '1fr',
  autoRows: 'auto',
  autoCols: (g) => g.itemSize,
  rowSteps: [1, 2, 3, 4, 5, 6],
  colSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  // gutterRow: '2em',
  // gutterCol: '1em',
  // gutterRowLarge: '2em',
  // gutterColLarge: '2em',
  gutterRow: '1em',
  gutterCol: '0.5em',
  gutterRowLarge: '1em',
  gutterColLarge: '1em',
  gutterCompact: (g) => `${g.gutterRow / 4} 0`,

  radius: '4px',
  radiusLarge: '5px',

  hrMargin: '1.2rem 0',
  hrColor: (g) => g.fn.color(g.color.dark5).alpha(0.15),

  linkClickArea: '0.4em', // XXX: Reduce if links overlap

  // use font weight keywords so it's relative to parent and simplifies to one
  // of four weights; see https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#meaning_of_relative_weights
  // TODO: lighter turns into 100 which is awkwardly thin in most fonts
  textWeightLight: 'lighter',
  textWeight: 'normal',
  textWeightHeavy: 'bolder',

  // paragraphLineHeight: 1.7,
  paragraphLeadTextSize: '1.3em',
  paragraphLeadTextWeight: (g) => g.textWeightLight,

  form: {
    // groupMargin: '0.5em',
    groupMargin: '1em',
    helpMargin: (g) => g.input.paddingY,
    helpTextColor: (g) => g.color.dark3,
  },

  input: {
    paddingX: '1em',
    paddingY: '0.4em',
    textColor: 'inherit',
    // backgroundColor: (g) => g.color.light1,
    backgroundColor: (g) => g.color.white,
    activeBorderColor: (g) => g.color.primary,
    // hoverBorderColor: (g) => g.color.dark4,
    hoverBorderColor: (g) => g.fn.color(g.color.dark4).alpha(0.5),
    invalidColor: (g) => g.color.red2,
    invalidBorder: (g) => g.color.red3,
    errorTextColor: (g) => g.color.red4,
    placeholderColor: (g) => g.color.muted,
    // border: (g) => `2px solid ${g.color.light5}`,
    // border: (g) => `1px solid ${g.color.gray3}`,
    border: (g) => `1px solid ${g.color.gray4}`,
    radius: (g) => g.radius,
  },

  button: {
    paddingX: (g) => g.input.paddingX,
    paddingY: (g) => g.input.paddingY,
    // textColor: 'inherit',
    // FIXME: Nested XCSSExpression
    // textColor: (g) => (g.fn.color(g.button.backgroundColor).isDark ? g.color.light1 : 'inherit'),
    // textColor: (g) => g.color.light1,
    textColor: 'inherit',
    textWeight: 'inherit',
    // backgroundColor: (g) => g.color.light1,
    backgroundColor: (g) => g.color.dark2,
    border: (g) => g.input.border,
    // border: (g) => '2px solid transparent',
    radius: (g) => g.radius,
    hoverBackgroundColor: (g) => g.color.light3,
    activeBackgroundColor: (g) => g.color.light3,
    disabledTextColor: (g) => g.color.disabled,
    disabledbackgroundColor: (g) => g.color.muted,
    disabledBorderColor: (g) => g.color.disabled,
    // FIXME: Nested XCSSExpression
    // miniPadding: (g) => `calc(${g.button.paddingY} / 2) calc(${g.button.paddingX} / 2)`,
    miniPadding: (g) => `calc(${g.input.paddingY} / 2) calc(${g.input.paddingX} / 2)`,
  },

  card: {
    // backgroundColor: (g) => g.color.light1,
    backgroundColor: (g) => g.color.white,
    // shadow: (g)=>`0 0.125em 0.5em 1px colorMod($shadowColor alpha(0.18))`,
    // shadow: (g) => `0 0.125em 0.5em 1px ${g.color.shadow}`,
    // shadow: (g, ctx) => `0 0.125em 0.5em 1px ${g.fn.expr(g.color.shadow, { ctx, g })}`,
    // shadow: (g, ctx) => `0 0.125em 0.5em 1px ${g.fn.color(g.color.dark4).alpha(0.1)}`,
    // FIXME: XCSS nested g expression values in derived strings like this (do we need to explicitly xcss tag it?)
    // shadow: (g) => `0 0.125em 0.5em 1px ${g.color.shadow}`,
    // shadow: (g, ctx) => g.fn.xcss(g, ctx)`0 0.125em 0.5em 1px ${g.color.shadow}`,
    shadow: (g) => xcss`0 0.125em 0.5em 1px ${g.color.shadow}`,
    hoverZindex: 1,
    hoverTextColor: (g) => g.color.text,
    hoverShadow: (g) => g.color.shadow,
    hoverAnimateSpeedIn: (g) => g.animateSpeedIn,
    hoverAnimateSpeedOut: (g) => g.animateSpeedOut,
    hoverHoverShadow: (g) => g.shadowHover,
    bodyMargin: '1.2rem 2rem',
    buttonTextColor: 'inherit',
    buttonBorder: (g) => `1px solid ${g.fn.color(g.color.light3).alpha(0.5)}`,
  },

  alert: {
    padding: '1em',
    marginY: '2em',
    backgroundColor: (g) => g.color.light3,
    borderSize: '0.4rem',
    // tipTextColor: (g) => g.color.green4,
    // tipBorderColor: (g) => g.color.green4,
    // infoTextColor: (g) => g.color.blue4,
    // infoBorderColor: (g) => g.color.blue4,
    // warningTextColor: (g) => g.color.orange4,
    // warningBorderColor: (g) => g.color.orange4,
    // errorTextColor: (g) => g.color.red4,
    // errorBorderColor: (g) => g.color.red4,
    tipTextColor: (g) => g.color.green1,
    tipBorderColor: (g) => g.color.green4,
    infoTextColor: (g) => g.color.blue1,
    infoBorderColor: (g) => g.color.blue4,
    warningTextColor: (g) => g.color.orange1,
    warningBorderColor: (g) => g.color.orange4,
    errorTextColor: (g) => g.color.red1,
    errorBorderColor: (g) => g.color.red4,
  },

  tag: {
    // padding: '0.04em 0.44em 0.185em',
    padding: '0.2em 0.4em',
    textSize: '0.9em',
    // textColor: (g) => g.color.dark3,
    textColor: (g) => g.color.dark2,
    // backgroundColor: (g) => g.color.light2,
    backgroundColor: (g) => g.color.light3,
    borderRadius: (g) => g.radius,
    marginBetween: '1em',
  },

  footer: {
    marginY: '5rem',
    textColor: (g) => g.color.muted,
  },

  // ////////////////////////////////////////////////////////////////

  // FIXME: Remove
  animateSpeedIn: '224ms',
  animateSpeedOut: '192ms',
};

module.exports = { globals };
