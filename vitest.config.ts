import { defineConfig } from "vitest/config";
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
  },
});
