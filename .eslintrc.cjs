const OFF = 0;
const WARN = 1;
const ERROR = 2;

// /** @type {import('eslint/lib/shared/types').ConfigData & { parserOptions: import('@typescript-eslint/types').ParserOptions }} */
module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.lint.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:unicorn/recommended',
    'prettier',
  ],
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': ERROR,
    '@typescript-eslint/no-confusing-void-expression': WARN,
    '@typescript-eslint/no-invalid-void-type': OFF,
    '@typescript-eslint/no-non-null-assertion': WARN,
    'import/order': OFF, // broken with prettier
    'import/prefer-default-export': OFF,
    'prettier/prettier': WARN,
    'unicorn/filename-case': OFF,
    'unicorn/no-abusive-eslint-disable': WARN,
    'unicorn/no-null': OFF,
    'unicorn/prefer-at': OFF, // poor support
    'unicorn/prefer-module': OFF,
    'unicorn/prefer-node-protocol': OFF,
    'unicorn/prefer-string-replace-all': OFF, // requires node v15+ but we loosely support v12
    'unicorn/prevent-abbreviations': OFF,
    'unicorn/switch-case-braces': [ERROR, 'avoid'],
  },
};
