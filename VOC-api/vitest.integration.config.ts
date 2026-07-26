import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/modules/financialRecord/__tests__/integration/**/*.test.ts",
      "src/modules/post/__tests__/integration/**/*.test.ts",
      "src/modules/notification/__tests__/integration/**/*.test.ts",
    ],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    globalSetup: "./vitest.integration.global-setup.ts",
    env: {
      DATABASE_URL: "postgresql://voc:voc_local@localhost:15432/voc_test?schema=public",
    },
  },
});
