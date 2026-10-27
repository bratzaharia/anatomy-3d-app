import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@anatomy/core": fileURLToPath(
        new URL("../../packages/anatomy-core/src/index.ts", import.meta.url),
      ),
      "@anatomy/data": fileURLToPath(
        new URL("../../packages/anatomy-data/src/index.ts", import.meta.url),
      ),
    },
  },
  build: { target: "es2022", sourcemap: true },
});
