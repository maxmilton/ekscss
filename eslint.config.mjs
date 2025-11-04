import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import { defineConfig } from "eslint/config";
import unicorn from "eslint-plugin-unicorn";
import ts from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
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
      "@typescript-eslint/prefer-nullish-coalescing": "warn", // compatibility with node >= v12
      "no-plusplus": "off", // byte savings
      "unicorn/no-array-callback-reference": "off", // byte savings
      "unicorn/no-array-for-each": "off", // slower but more compact (for non-performance-critical code)
      "unicorn/prefer-at": "off", // bad browser support
      "unicorn/prefer-global-this": "off", // prefer to clearly separate Bun and DOM
      "unicorn/prefer-string-replace-all": "off", // bad browser support and slower
      "unicorn/switch-case-braces": ["error", "avoid"], // byte savings (minification doesn't automatically remove)
    },
  },
  {
    files: ["**/*.cjs", "**/*.test-node.js", "packages/cli/*.js", "packages/framework/*.js"],
    languageOptions: {
      parserOptions: {
        sourceType: "script",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      strict: ["error", "global"],
      "unicorn/prefer-module": "off",
    },
  },
  {
    files: ["packages/*/build.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["packages/cli/index.js"],
    rules: {
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "global-require": "off",
      "no-await-in-loop": "off",
      "no-console": "off",
      "unicorn/no-anonymous-default-export": "off",
      "unicorn/no-process-exit": "off",
    },
  },
  { ignores: ["**/*.bak", "**/dist", "coverage", "packages/framework/*.d.ts"] },
);
