import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const STUB_PORT = 4010;

export default defineConfig({
  testDir: "./e2e",
  // Dev mode compiles each page on first visit, so give it time.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure", // a step-by-step replay when a test fails
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    // 1. The fake explain-back model (e2e/model-stub.mjs).
    {
      command: "node e2e/model-stub.mjs",
      url: `http://localhost:${STUB_PORT}/health`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    // 2. The app, always started by Playwright so it talks to the fake model, never to Gemini.
    //    Stop your own `npm run dev` before running the tests, or port 3000 will be taken.
    {
      command: "npm run dev",
      url: `http://localhost:${PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        EXPLAIN_MODEL_KEY: "e2e-stub",
        EXPLAIN_MODEL_URL: `http://localhost:${STUB_PORT}/v1/chat/completions`,
        EXPLAIN_MODEL_NAME: "stub",
        // No Redis during tests, so the AI and sign-up limits never cut a run short.
        REDIS_URL: "",
      },
    },
  ],
});