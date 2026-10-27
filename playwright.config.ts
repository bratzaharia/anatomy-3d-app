import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:4174", trace: "on-first-retry" },
  webServer: {
    command:
      "pnpm --filter @anatomy/web preview --host 127.0.0.1 --port 4174 --strictPort",
    port: 4174,
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
