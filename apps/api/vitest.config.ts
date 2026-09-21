import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.vitest.test.ts", "tests/**/*.vitest.ts"],
    exclude: ["**/e2e-http-business-logic.vitest.test.ts", "**/node_modules/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    fileParallelism: false
  }
});
