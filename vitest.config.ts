import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './src',
    include: ['**/*.unit.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/main.ts', '**/dto/**'],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});
