// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck 😢
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-var-requires */

// FIXME: ekscss compiler types issues which need the eslint disable comments above

'use strict'; // eslint-disable-line strict, lines-around-directive

const { applyPlugin } = require('@ekscss/plugin-apply');
const { importPlugin } = require('@ekscss/plugin-import');
const { prefixPlugin } = require('@ekscss/plugin-prefix');
const { xcss } = require('ekscss');
const { color } = require('./utils');

// TODO: Document the use of xcss tagged template literals for special cases in
// XCSS configs or plugins

/** @type {import('./utils').XCSSConfig} */
module.exports = {
  plugins: [importPlugin, applyPlugin, prefixPlugin],
  globals: {
    fn: {
      color,
    },

    media: {
      ns: '(min-width: 30.01rem)',
      m: '(min-width: 30.01rem) and (max-width: 60rem)',
      l: '(min-width: 60.01rem)',
    },

    spacingValues: [
      '0',
      '0.25rem',
      '0.5rem',
      '1rem',
      '2rem',
      '4rem',
      '8rem',
      '16rem',
    ],

    /* Text */
    fontStack: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Helvetica',
      'Arial',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
    ].join(','),
    fontStackMonospace: [
      'ui-monospace',
      'SFMono-Regular',
      'SF Mono',
      'Menlo',
      'Consolas',
      'Liberation Mono',
      'monospace',
    ].join(','),
    textSize: '1.25em', // 20px; browser default 16px * 1.25
    textWeightLight: 300,
    textWeight: 400,
    textWeightMedium: 500,
    textWeightHeavy: 700,
    leadTextSize: '1.3em',
    leadTextWeight: (x) => x.textWeightLight,

    color: {
      /**
       * Based on palantir/blueprint colors
       * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
       * Licensed under the Apache License, Version 2.0.
       * @see https://github.com/palantir/blueprint/blob/d4c772931b861ec60a0f4ef2032fb296746f8d9b/packages/core/src/common/_colors.scss
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
      white: '#fff',
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
      disabled: (x) => x.color.gray3,
      background: (x) => x.color.light5,
      shadow: (x) => x.fn.color(x.color.dark4).alpha(0.1),
      text: (x) => x.color.dark2,
      link: (x) => x.color.primary,
      linkHover: (x) => x.color.primary,
      zebraBackground: (x) => x.color.light4,
    },

    /* Grid */
    containerWidthMax: '50rem', // 1000px @ 20px textSize
    containerNarrowWidthMax: '30rem',
    itemSize: '1fr',
    autoRows: 'auto',
    autoCols: 'auto',
    rowSteps: [1, 2, 3, 4, 5, 6],
    colSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    gutterRow: '1rem',
    gutterCol: '0.5rem',
    gutterRowLarge: '1rem',
    gutterColLarge: '1rem',

    radius: '4px',
    radiusLarge: '5px',

    animateSpeedIn: '224ms',
    animateSpeedOut: '192ms',

    hrMargin: '1.2rem 0',
    hrColor: (x) => x.fn.color(x.color.dark5).alpha(0.15),

    form: {
      groupMargin: '1rem',
      helpMargin: (x) => x.input.paddingY,
      helpTextColor: (x) => x.color.dark3,
      selectCaret: (x) => `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${encodeURIComponent(
        xcss`${x.color.text}`,
      )}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      checkboxSize: '1.4rem',
      checkboxBorder: (x) => xcss`2px solid ${x.color.gray3}`,
      checkboxRadius: (x) => x.input.radius,
      checkboxCheckedBackgroundColor: (x) => x.color.blue3,
      checkboxCheckedBorderColor: (x) => x.color.blue2,
      checkboxTick:
        "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%23fff' d='M12 5a1 1 0 00-.71.29L7 9.59l-2.29-2.3a1 1 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1 1 0 0012 5z'/%3e%3c/svg%3e\")",
    },

    input: {
      paddingX: '1rem',
      paddingY: '0.4rem',
      textColor: 'inherit',
      backgroundColor: (x) => x.color.white,
      outlineSize: '2px',
      activeBorderColor: (x) => x.color.primary,
      hoverBorderColor: (x) => x.fn.color(x.color.dark4).alpha(0.5),
      invalidColor: (x) => x.color.red2,
      invalidBorder: (x) => x.color.red3,
      errorTextColor: (x) => x.color.red4,
      placeholderTextColor: (x) => x.color.muted,
      border: (x) => xcss`1px solid ${x.color.gray4}`,
      radius: (x) => x.radius,
      disabledTextColor: (x) => x.color.disabled,
      disabledBackgroundColor: (x) => x.color.light4,
      disabledBorder: (x) => x.color.light1,
      disabledPlaceholderTextColor: (x) => x.color.disabled,
    },

    button: {
      paddingX: (x) => x.input.paddingX,
      paddingY: (x) => x.input.paddingY,
      textColor: 'inherit',
      textWeight: 'inherit',
      backgroundColor: (x) => x.input.backgroundColor,
      outlineSize: (x) => x.input.outlineSize,
      border: (x) => x.input.border,
      radius: (x) => x.radius,
      hoverBackgroundColor: (x) => x.color.light3,
      hoverBorderColor: (x) => x.input.hoverBorderColor,
      activeBackgroundColor: (x) => x.color.light3,
      activeBorderColor: (x) => x.input.activeBorderColor,
      disabledTextColor: (x) => x.input.disabledTextColor,
      disabledBackgroundColor: (x) => x.input.disabledBackgroundColor,
      disabledBorder: (x) => x.input.disabledBorder,
      level3: {
        backgroundColorFrom: (x) => x.color.light5,
        backgroundColorTo: (x) => x.color.light3,
        hoverBackgroundColor: (x) => x.color.light1,
      },
      primary: {
        textColor: (x) => x.color.white,
        backgroundColorFrom: (x) => x.color.blue3,
        backgroundColorTo: (x) => x.color.blue2,
        borderColor: (x) => x.color.blue2,
        hoverBackgroundColor: (x) => x.color.blue2,
      },
      success: {
        textColor: (x) => x.color.white,
        backgroundColorFrom: (x) => x.color.green4,
        backgroundColorTo: (x) => x.color.green3,
        borderColor: (x) => x.color.green2,
        hoverBackgroundColor: (x) => x.color.green2,
      },
      danger: {
        textColor: (x) => x.color.white,
        backgroundColorFrom: (x) => x.color.red4,
        backgroundColorTo: (x) => x.color.red3,
        borderColor: (x) => x.color.red2,
        hoverBackgroundColor: (x) => x.color.red2,
      },
    },

    /* Addon: alert.xcss */
    alert: {
      paddingX: '1rem',
      paddingY: '1rem',
      marginY: '2rem',
      backgroundColor: (x) => x.color.light3,
      borderSize: '0.4rem',
      infoTextColor: (x) => x.color.blue1,
      infoBorderColor: (x) => x.color.blue4,
      successTextColor: (x) => x.color.green1,
      successBorderColor: (x) => x.color.green4,
      warningTextColor: (x) => x.color.orange1,
      warningBorderColor: (x) => x.color.orange4,
      dangerTextColor: (x) => x.color.red1,
      dangerBorderColor: (x) => x.color.red4,
    },

    /* Addon: card.xcss */
    card: {
      backgroundColor: (x) => x.color.white,
      shadow: (x) => xcss`0 0.125rem 0.5rem 1px ${x.color.shadow}`,
      hoverZIndex: 1,
      hoverTextColor: (x) => x.color.text,
      hoverShadow: (x) => x.color.shadow,
      hoverAnimateSpeedIn: (x) => x.animateSpeedIn,
      hoverAnimateSpeedOut: (x) => x.animateSpeedOut,
      hoverHoverShadow: (x) => x.color.shadow,
      bodyMargin: '1.2rem 2rem',
      buttonTextColor: 'inherit',
      buttonBorder: (x) => xcss`1px solid ${x.fn.color(x.color.light3).alpha(0.5)}`,
    },

    /* Addon: code.xcss */
    codeInline: {
      paddingX: '3px',
      paddingY: '0',
      textColor: (x) => x.color.rose1,
      backgroundColor: (x) => x.fn.color(x.color.rose5).lighten(0.41),
    },
    codeBlock: {
      paddingX: '1rem',
      paddingY: '0.5rem',
      textColor: (x) => x.color.light3,
      backgroundColor: (x) => x.color.dark3,
      radius: (x) => x.radius,
    },

    /* Addon: spinner.xcss */
    spinner: {
      size: '48px',
      width: '5px',
      color: (x) => x.color.primary,
      backgroundColor: (x) => x.color.light1,
      animateSpeed: '496ms',
      animateTiming: 'linear',
    },

    /* Addon: tag.xcss */
    tag: {
      paddingX: '0.4em',
      paddingY: '0.2em',
      textSize: '0.9em',
      textColor: (x) => x.color.dark2,
      backgroundColor: (x) => x.color.light3,
      borderRadius: (x) => x.radius,
      marginBetween: '1em',
    },

    tooltip: {
      paddingX: (x) => x.input.paddingX,
      paddingY: (x) => x.input.paddingY,
      widthMax: '16rem',
      textSize: '1.1rem',
      textWeight: (x) => x.textWeight,
      color: (x) => x.color.text,
      backgroundColor: (x) => x.color.black,
      animateSpeed: '176ms',
      animateTiming: 'ease-in-out',
    },

    /* Addon: ux-larger-click-zone.xcss */
    linkClickArea: '0.4em', // XXX: Reduce if links overlap
  },
};
