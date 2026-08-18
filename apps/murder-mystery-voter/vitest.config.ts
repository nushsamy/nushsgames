import { defineConfig, configDefaults } from "vitest/config";
import { config as loadEnv } from "dotenv";

loadEnv();

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
    globalSetup: ["./test/setup/globalSetup.ts"],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 15000,
    // frontend/ is its own Vite app with its own vitest config -- run its tests via
    // `npm test` inside frontend/, not from this backend-only root config.
    exclude: [...configDefaults.exclude, "frontend/**"],
  },
});
