//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Read configuration from `env` in src/config/env.ts instead of touching process.env directly.',
        },
      ],
    },
  },
  {
    // the config center is the one place allowed to read process.env
    files: ['src/config/env.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      // build artifacts, not source
      '.output/**',
      '.nitro/**',
      '.tanstack/**',
      'dist/**',
      'src/routeTree.gen.ts',
    ],
  },
]
