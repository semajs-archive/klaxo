import next from 'eslint-config-next';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'data/**', 'uploads/**'] },
  ...next,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
