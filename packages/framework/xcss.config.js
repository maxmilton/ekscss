// https://refactoringui.com/previews/building-your-color-palette/

'use strict'; // eslint-disable-line

const { apply } = require('@ekscss/apply');
const { prefixer } = require('stylis');

const color = require('color');
const { xcssTag } = require('ekscss');
// const { triangle } = require('./mixins/triangle');

const xcss = xcssTag();

/** @type {import('@ekscss/cli').XCSSConfig} */
module.exports = {
  plugins: [apply, prefixer],
  // header: `@charset 'UTF-8';/*!
  header: `/*!
* XCSS Framework - https://github.com/MaxMilton/ekscss
* (c) 2021 Max Milton
* MIT Licensed - https://github.com/MaxMilton/ekscss/blob/main/LICENSE
*/
`,
  globals: {
    fn: {
      /**
       * @see https://github.com/Qix-/color#readme
       * @param {any} value - A XCSS template expression or any value the
       * `color` package `Color` constructor accepts.
       */
      color: (value) => color(xcss`${value}`),
      // Mixins
      // FIXME: Remove if unused + remove framework/mixins/*
      // triangle,
    },
    media: {
      ns: '(min-width: 30.01em)',
      m: '(min-width: 30.01em) and (max-width: 60em)',
      l: '(min-width: 60.01em)',
    },
    spacingValues: ['0', '0.25em', '0.5em', '1em', '2em', '4em', '8em', '16em'],
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
    color: {
      /**
       * Based on palantir/blueprint colors
       * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
       * Licensed under the Apache License, Version 2.0.
       * @see https://github.com/palantir/blueprint/blob/develop/packages/core/src/common/_colors.scss
       */
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
      // App
      primary: (g) => g.color.blue2,
      success: (g) => g.color.green2,
      warning: (g) => g.color.orange2,
      danger: (g) => g.color.red2,
      muted: (g) => g.color.gray1,
      disabled: (g) => g.fn.color(g.color.muted).alpha(0.5),
      background: (g) => g.color.light5,
      shadow: (g) => g.fn.color(g.color.dark4).alpha(0.1),
      // text: '#212529',
      text: (g) => g.color.dark2,
      // link: '#2d3436',
      // link: 'inherit',
      link: (g) => g.color.primary,
      // linkHover: '#0f96ff',
      // linkHover: (g) => g.color.primary,
      linkHover: 'inherit',
    },

    /* Grid */
    containerWidthMax: '50rem' /* 1000px @ 20px fontSize */,
    containerNarrowWidthMax: '30rem',
    itemSize: '1fr',
    autoRows: 'auto',
    autoCols: (g) => g.itemSize,
    rowSteps: [1, 2, 3, 4, 5, 6],
    colSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    gutterRow: '1em',
    gutterCol: '0.5em',
    gutterRowLarge: '1em',
    gutterColLarge: '1em',
    gutterCompact: (g) => `${g.gutterRow / 4} 0`,

    radius: '4px',
    radiusLarge: '5px',

    animateSpeedIn: '224ms',
    animateSpeedOut: '192ms',

    hrMargin: '1.2rem 0',
    hrColor: (g) => g.fn.color(g.color.dark5).alpha(0.15),

    linkClickArea: '0.4em', // XXX: Reduce if links overlap

    // use font weight keywords so it's relative to parent and simplifies to one
    // of four weights; see https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#meaning_of_relative_weights
    // TODO: lighter turns into 100 which is awkwardly thin in most fonts
    textWeightLight: 'lighter',
    textWeight: 'normal',
    textWeightHeavy: 'bolder',

    paragraphLeadTextSize: '1.3em',
    paragraphLeadTextWeight: (g) => g.textWeightLight,

    form: {
      groupMargin: '1em',
      helpMargin: (g) => g.input.paddingY,
      helpTextColor: (g) => g.color.dark3,
    },

    input: {
      paddingX: '1em',
      paddingY: '0.4em',
      textColor: 'inherit',
      backgroundColor: (g) => g.color.white,
      activeBorderColor: (g) => g.color.primary,
      hoverBorderColor: (g) => g.fn.color(g.color.dark4).alpha(0.5),
      invalidColor: (g) => g.color.red2,
      invalidBorder: (g) => g.color.red3,
      errorTextColor: (g) => g.color.red4,
      placeholderColor: (g) => g.color.muted,
      border: (g) => `1px solid ${g.color.gray4}`,
      radius: (g) => g.radius,
    },

    button: {
      paddingX: (g) => g.input.paddingX,
      paddingY: (g) => g.input.paddingY,
      textColor: 'inherit',
      textWeight: 'inherit',
      backgroundColor: (g) => g.input.backgroundColor,
      border: (g) => g.input.border,
      radius: (g) => g.radius,
      hoverBackgroundColor: (g) => g.color.light3,
      activeBackgroundColor: (g) => g.color.light3,
      disabledTextColor: (g) => g.color.disabled,
      disabledbackgroundColor: (g) => g.color.muted,
      disabledBorderColor: (g) => g.color.disabled,
    },

    card: {
      backgroundColor: (g) => g.color.white,
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
      padding: '0.2em 0.4em',
      textSize: '0.9em',
      textColor: (g) => g.color.dark2,
      backgroundColor: (g) => g.color.light3,
      borderRadius: (g) => g.radius,
      marginBetween: '1em',
    },

    footer: {
      marginY: '5rem',
      textColor: (g) => g.color.muted,
    },
  },
};
