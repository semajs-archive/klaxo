import next from 'eslint-config-next';

export default [
  { ignores: ['.next/**', 'out/**', 'node_modules/**'] },
  ...next,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
