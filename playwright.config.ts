import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: true,
  // WebGL performance/visual measurements must not compete for the same GPU.
  workers: 1,
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  use: { baseURL: "http://127.0.0.1:4174", trace: "on-first-retry" },
  webServer: {
    command:
      "pnpm --filter @anatomy/web preview --host 127.0.0.1 --port 4174 --strictPort",
    port: 4174,
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
