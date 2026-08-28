import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      AI_DEV_MODE: 'true',
      DATABASE_FILE: ':memory:',
      APP_SECRET: 'test-secret-value-not-a-real-secret',
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
