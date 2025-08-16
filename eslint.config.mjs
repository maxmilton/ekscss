import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import unicorn from "eslint-plugin-unicorn";
import ts from "typescript-eslint";

const OFF = 0;
const WARN = 1;
const ERROR = 2;

/** @type {import("typescript-eslint").ConfigArray} */
const config = ts.config(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: ERROR,
    },
    languageOptions: {
      parserOptions: {
        project: [
          "tsconfig.json",
          "tsconfig.bun.json",
          "tsconfig.node.json",
          "packages/*/tsconfig.json",
        ],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": WARN, // compatibility with node >= v12
      "no-plusplus": OFF, // byte savings
      quotes: [ERROR, "double", { avoidEscape: true }],
      "unicorn/no-array-callback-reference": OFF, // byte savings
      "unicorn/no-array-for-each": OFF, // slower but more compact (for non-performance-critical code)
      "unicorn/prefer-at": OFF, // bad browser support
      "unicorn/prefer-global-this": OFF, // prefer to clearly separate Bun and DOM
      "unicorn/prefer-string-replace-all": OFF, // bad browser support and slower
      "unicorn/switch-case-braces": [ERROR, "avoid"], // byte savings (minification doesn't automatically remove)
    },
  },
  {
    files: [
      "**/*.cjs",
      "**/*.test-node.js",
      "packages/cli/*.js",
      "packages/framework/*.js",
    ],
    languageOptions: {
      parserOptions: {
        sourceType: "script",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": OFF,
      "@typescript-eslint/prefer-nullish-coalescing": OFF,
      strict: [ERROR, "global"],
      "unicorn/prefer-module": OFF,
    },
  },
  {
    files: [
      "*.config.mjs",
      "*.config.ts",
      "*.d.ts",
      "**/*.spec.ts",
      "**/*.test.ts",
      "**/*.test-node.js",
      "packages/*/*.config.ts",
      "packages/*/*.d.ts",
      "packages/*/build.ts",
      "packages/*/test/**",
      "test/**",
    ],
    rules: {
      "import/no-extraneous-dependencies": OFF,
    },
  },
  {
    files: ["packages/*/build.ts"],
    rules: {
      "no-console": OFF,
    },
  },
  {
    files: ["packages/cli/index.js"],
    rules: {
      // "@typescript-eslint/no-unsafe-assignment": WARN,
      "@typescript-eslint/prefer-optional-chain": OFF,
      "@typescript-eslint/restrict-template-expressions": OFF,
      "global-require": OFF,
      "no-await-in-loop": OFF,
      "no-console": OFF,
      "unicorn/no-anonymous-default-export": OFF,
      "unicorn/no-process-exit": OFF,
    },
  },
  { ignores: ["**/*.bak", "**/dist", "coverage", "packages/framework/*.d.ts"] },
);

export default config;
