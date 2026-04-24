import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './src',
    include: ['**/*.unit.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'article/article.service.ts',
        'auth/auth.service.ts',
        'auth/guards/*.ts',
        'category/category.service.ts',
        'comment/comment.service.ts',
        'user/user.service.ts',
        'common/errors.ts',
        'common/all-exceptions.filter.ts',
        'common/custom-logger.ts',
        'common/logging.middleware.ts',
      ],
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});
