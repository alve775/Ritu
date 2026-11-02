import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['scripts/*world*.test.ts'],
    testTimeout: 3600000,
    hookTimeout: 60000,
    maxWorkers: 1,
    fileParallelism: false,
  },
});
