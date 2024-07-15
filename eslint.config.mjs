import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import unicorn from 'eslint-plugin-unicorn';
// eslint-disable-next-line import/no-unresolved
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const OFF = 0;
const WARN = 1;
const ERROR = 2;

export default tseslint.config(
  eslint.configs.recommended,
  ...compat.extends('airbnb-base').map((config) => ({
    ...config,
    plugins: {}, // delete
  })),
  ...compat.extends('airbnb-typescript/base'),
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // @ts-expect-error - no types
  // eslint-disable-next-line
  unicorn.configs['flat/recommended'],
  {
    linterOptions: {
      reportUnusedDisableDirectives: WARN,
    },
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.ts.sh'],
        project: [
          'tsconfig.json',
          'tsconfig.node.json',
          'packages/svelte-ekscss/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: fixupPluginRules(
        compat.plugins('eslint-plugin-import')[0].plugins?.import ?? {},
      ),
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ERROR,
      '@typescript-eslint/no-confusing-void-expression': WARN,
      '@typescript-eslint/no-non-null-assertion': WARN,
      '@typescript-eslint/no-invalid-void-type': WARN,
      'import/no-relative-packages': OFF,
      'import/prefer-default-export': OFF,
      'no-restricted-syntax': OFF,
      'no-void': OFF,
      'unicorn/filename-case': OFF,
      'unicorn/import-style': WARN,
      'unicorn/no-abusive-eslint-disable': WARN,
      'unicorn/no-null': OFF,
      'unicorn/prefer-module': WARN,
      'unicorn/prefer-top-level-await': WARN,
      'unicorn/prevent-abbreviations': OFF,
      // bad browser support
      'unicorn/prefer-at': OFF,
      // we support node v12+
      'unicorn/prefer-node-protocol': OFF,

      /* Covered by biome formatter */
      '@typescript-eslint/indent': OFF,
      'function-paren-newline': OFF,
      'implicit-arrow-linebreak': OFF,
      'max-len': OFF,
      'object-curly-newline': OFF,
      'operator-linebreak': OFF,
      'unicorn/no-nested-ternary': OFF,
      'unicorn/number-literal-case': OFF,

      /* Performance and byte savings */
      'no-plusplus': OFF,
      // forEach is slower but more compact (for non-performance-critical code)
      'unicorn/no-array-for-each': OFF,
      // bad browser/node support and slower
      'unicorn/prefer-string-replace-all': OFF,
      // byte savings (minification doesn't currently automatically remove)
      'unicorn/switch-case-braces': [ERROR, 'avoid'],
    },
  },
  {
    files: [
      '**/*.cjs',
      '**/*.test-node.js',
      'packages/cli/*.js',
      'packages/framework/*.js',
    ],
    languageOptions: {
      parserOptions: {
        sourceType: 'script',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': OFF,
      '@typescript-eslint/prefer-nullish-coalescing': OFF,
      strict: [ERROR, 'global'],
      'unicorn/prefer-module': OFF,
    },
  },
  {
    files: [
      '*.config.mjs',
      '*.config.ts',
      '*.d.ts',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.test-node.js',
      'packages/*/*.config.ts',
      'packages/*/*.d.ts',
      'packages/*/build.ts',
      'packages/*/test/**',
      'test/**',
    ],
    rules: {
      'import/no-extraneous-dependencies': OFF,
    },
  },
  {
    files: ['packages/*/build.ts'],
    rules: {
      'no-console': OFF,
    },
  },
  {
    files: ['packages/cli/index.js'],
    rules: {
      '@typescript-eslint/restrict-template-expressions': OFF,
      'global-require': OFF,
      'no-await-in-loop': OFF,
      'no-console': OFF,
      'unicorn/no-anonymous-default-export': OFF,
      'unicorn/no-process-exit': OFF,

      // TODO: Fix these and remove (upgrade to error)
      '@typescript-eslint/no-unsafe-assignment': WARN,
    },
  },
  {
    ignores: ['**/*.bak', '**/dist/**', 'packages/framework/*.d.ts'],
  },
);
