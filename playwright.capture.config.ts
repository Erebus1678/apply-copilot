import { defineConfig, devices } from "@playwright/test";

// Standalone config for generating README/showcase assets — separate from the
// e2e suite (playwright.config.ts) so `pnpm e2e` and CI never run the capture
// script. The AI provider is mocked at the network layer inside the spec, so no
// live model, keys, or real personal data are involved. Run via `pnpm capture`.
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./scripts/capture",
  outputDir: "./scripts/capture/.artifacts",
  timeout: 120_000,
  reporter: "list",
  // Serial: the two specs otherwise race the default-profile auto-seed on a fresh
  // DB, creating duplicate "Personal" rows (which disables the switcher's auto-pick).
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // crisp, retina-quality PNGs
    colorScheme: "light", // light theme reads best on GitHub's README background
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    // Always start our OWN dev server against a throwaway, isolated PGlite datadir
    // (under gitignored .artifacts) — never reuse a running server or touch the
    // real ./data/pgdata, so a user's actual job-tracker data is never read,
    // written, or screenshotted, and the profile seed starts clean.
    reuseExistingServer: false,
    env: { PGLITE_PATH: "./scripts/capture/.artifacts/capture-db" },
    timeout: 120_000,
  },
});
