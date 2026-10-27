import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@anatomy/core": fileURLToPath(
        new URL("./packages/anatomy-core/src/index.ts", import.meta.url),
      ),
      "@anatomy/data": fileURLToPath(
        new URL("./packages/anatomy-data/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./apps/web/src/test/setup.ts"],
    exclude: ["apps/web/e2e/**", "**/node_modules/**", "**/dist/**"],
    coverage: { reporter: ["text", "html"] },
  },
});
