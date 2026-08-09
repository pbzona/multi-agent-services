import { defineConfig } from "nitro";

export default defineConfig({
  compatibilityDate: "2025-07-15",
  serverDir: "./server",
  errorHandler: "./server/error.ts",
  noPublicDir: true,
  routeRules: {
    "/api/**": {
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  },
});
