import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  workers: 1,
  expect: {
    timeout: 15000
  },
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 200
    }
  }
});
