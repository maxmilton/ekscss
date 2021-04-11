// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck 😢
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */

// FIXME: ekscss compiler issues which need the eslint disable comments above

'use strict'; // eslint-disable-line

const { applyPlugin } = require('@ekscss/plugin-apply');
const { importPlugin } = require('@ekscss/plugin-import');
const { prefixPlugin } = require('@ekscss/plugin-prefix');
const color = require('color');
const { xcssTag } = require('ekscss');

// FIXME: Remove if unused + remove framework/mixins/*
const { triangle } = require('./mixins/triangle');

// TODO: Document use of xcss tagged template literals in special cases in XCSS configs or plugins
const xcss = xcssTag();

/** @type {import('@ekscss/cli').XCSSConfig} */
module.exports = {
  plugins: [importPlugin, applyPlugin, prefixPlugin],
  // header: `@charset 'UTF-8';/*!
  //   header: `/*!
  // * XCSS Framework - https://github.com/MaxMilton/ekscss
  // * (c) 2021 Max Milton
  // * MIT Licensed - https://github.com/MaxMilton/ekscss/blob/main/LICENSE
  // */
  // `,
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
      triangle,
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
      primary: (x) => x.color.blue2,
      success: (x) => x.color.green2,
      warning: (x) => x.color.orange2,
      danger: (x) => x.color.red2,
      muted: (x) => x.color.gray1,
      // disabled: (x) => x.fn.color(x.color.muted).alpha(0.5),
      disabled: (x) => x.color.gray3,
      background: (x) => x.color.light5,
      shadow: (x) => x.fn.color(x.color.dark4).alpha(0.1),
      shadowDeep: (x) => x.color.shadow, // FIXME:
      // text: '#212529',
      text: (x) => x.color.dark2,
      // link: '#2d3436',
      // link: 'inherit',
      link: (x) => x.color.primary,
      // linkHover: '#0f96ff',
      // linkHover: (x) => x.color.primary,
      linkHover: 'inherit',
    },

    /* Grid */
    containerWidthMax: '50rem', // 1000px @ 20px textSize
    containerNarrowWidthMax: '30rem',
    itemSize: '1fr',
    autoRows: 'auto',
    autoCols: (x) => x.itemSize,
    rowSteps: [1, 2, 3, 4, 5, 6],
    colSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    gutterRow: '1em',
    gutterCol: '0.5em',
    gutterRowLarge: '1em',
    gutterColLarge: '1em',

    radius: '4px',
    radiusLarge: '5px',

    animateSpeedIn: '224ms',
    animateSpeedOut: '192ms',

    hrMargin: '1.2rem 0',
    hrColor: (x) => x.fn.color(x.color.dark5).alpha(0.15),

    linkClickArea: '0.4em', // XXX: Reduce if links overlap

    // use font weight keywords so it's relative to parent and simplifies to one
    // of four weights; see https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#meaning_of_relative_weights
    // TODO: lighter turns into 100 which is awkwardly thin in most fonts
    textWeightLight: 'lighter',
    textWeight: 'normal',
    textWeightHeavy: 'bolder',

    paragraphLeadTextSize: '1.3em',
    paragraphLeadTextWeight: (x) => x.textWeightLight,

    form: {
      groupMargin: '1em',
      helpMargin: (x) => x.input.paddingY,
      helpTextColor: (x) => x.color.dark3,
    },

    input: {
      paddingX: '1em',
      paddingY: '0.4em',
      textColor: 'inherit',
      backgroundColor: (x) => x.color.white,
      activeBorderColor: (x) => x.color.primary,
      hoverBorderColor: (x) => x.fn.color(x.color.dark4).alpha(0.5),
      invalidColor: (x) => x.color.red2,
      invalidBorder: (x) => x.color.red3,
      errorTextColor: (x) => x.color.red4,
      placeholderTextColor: (x) => x.color.muted,
      border: (x) => `1px solid ${x.color.gray4}`,
      radius: (x) => x.radius,
      disabledTextColor: (x) => x.color.disabled,
      // disabledBackgroundColor: (x) => x.color.muted,
      disabledBackgroundColor: (x) => x.color.light4,
      // disabledBorder: (x) => x.color.disabled,
      disabledBorder: (x) => x.color.light1,
      disabledPlaceholderTextColor: (x) => x.color.disabled,
    },

    button: {
      paddingX: (x) => x.input.paddingX,
      paddingY: (x) => x.input.paddingY,
      textColor: 'inherit',
      textWeight: 'inherit',
      backgroundColor: (x) => x.input.backgroundColor,
      border: (x) => x.input.border,
      radius: (x) => x.radius,
      hoverBackgroundColor: (x) => x.color.light3,
      activeBackgroundColor: (x) => x.color.light3,
      // disabledTextColor: (x) => x.color.disabled,
      disabledTextColor: (x) => x.input.disabledTextColor,
      // disabledbackgroundColor: (x) => x.color.muted,
      // disabledbackgroundColor: (x) => x.color.light4,
      disabledBackgroundColor: (x) => x.input.disabledBackgroundColor,
      // disabledBorder: (x) => x.color.disabled,
      // disabledBorder: (x) => x.color.gray5,
      disabledBorder: (x) => x.input.disabledBorder,
    },

    code: {
      textColor: (x) => x.color.light3,
      backgroundColor: (x) => x.color.dark3,
      radius: (x) => x.radius,
    },

    card: {
      backgroundColor: (x) => x.color.white,
      shadow: (x) => xcss`0 0.125em 0.5em 1px ${x.color.shadow}`,
      hoverZIndex: 1,
      hoverTextColor: (x) => x.color.text,
      hoverShadow: (x) => x.color.shadow,
      hoverAnimateSpeedIn: (x) => x.animateSpeedIn,
      hoverAnimateSpeedOut: (x) => x.animateSpeedOut,
      hoverHoverShadow: (x) => x.color.shadowDeep,
      bodyMargin: '1.2rem 2rem',
      buttonTextColor: 'inherit',
      buttonBorder: (x) => `1px solid ${x.fn.color(x.color.light3).alpha(0.5)}`,
    },

    alert: {
      padding: '1em',
      marginY: '2em',
      backgroundColor: (x) => x.color.light3,
      borderSize: '0.4rem',
      tipTextColor: (x) => x.color.green1,
      tipBorderColor: (x) => x.color.green4,
      infoTextColor: (x) => x.color.blue1,
      infoBorderColor: (x) => x.color.blue4,
      warningTextColor: (x) => x.color.orange1,
      warningBorderColor: (x) => x.color.orange4,
      errorTextColor: (x) => x.color.red1,
      errorBorderColor: (x) => x.color.red4,
    },

    tag: {
      padding: '0.2em 0.4em',
      textSize: '0.9em',
      textColor: (x) => x.color.dark2,
      backgroundColor: (x) => x.color.light3,
      borderRadius: (x) => x.radius,
      marginBetween: '1em',
    },

    footer: {
      marginY: '5rem',
      textColor: (x) => x.color.muted,
    },
  },
};
