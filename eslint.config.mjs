import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Higgsedit uses native JSX nodes, rather than React reconciliation.
  {
    files: ['video/**/*.jsx'],
    rules: {
      'react/jsx-key': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  // The standalone Playwright capture script is an intentional Node CJS entry point.
  {
    files: ['video/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  globalIgnores(['.next/**', 'research/**', 'test-results/**', 'next-env.d.ts']),
]);
