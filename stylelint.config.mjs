/** @type {import("stylelint").Config} */
export default {
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  reportUnscopedDisables: true,
  extends: [
    "stylelint-config-standard",
    "@maxmilton/stylelint-config",
    "@maxmilton/stylelint-config/xcss",
  ],
  ignoreFiles: [
    "**/*.bak/**",
    "**/dist/**",
    "**/node_modules/**",

    // FIXME: Remove these when fixed.
    "packages/framework/addon/alert.xcss",
    "packages/framework/addon/ux-larger-click-zone.xcss",
    "packages/framework/level1/type.xcss",
    "packages/framework/level2/display.xcss",
    "packages/framework/level2/flex.xcss",
    "packages/framework/level2/form.xcss",
    "packages/framework/level2/grid.xcss",
    "packages/framework/level2/position.xcss",
    "packages/framework/level2/spacing.xcss",
  ],
  rules: {
    "media-query-no-invalid": null,
  },
};
