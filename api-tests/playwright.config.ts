import { defineConfig } from "@playwright/test";
import { BACKEND, BASE_URL } from "./helpers/backend-config";

/**
 * Both backends are tested with the identical suite below, selected via the
 * BACKEND env var (java|python, default python). They can't run concurrently
 * -- both docker-compose stacks bind host port 5432 for Postgres -- so run
 * one full pass, tear it down, then the other. See api-tests/README.md.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [
    ["list"],
    ["json", { outputFile: `results/${BACKEND}-results.json` }],
  ],
  globalSetup: require.resolve("./global-setup.ts"),
  use: {
    baseURL: BASE_URL,
  },
});
