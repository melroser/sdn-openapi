import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["netlify/**/*.test.ts", "docs/**/*.test.js"],
    exclude: [".netlify/**", "node_modules/**"],
  },
});
