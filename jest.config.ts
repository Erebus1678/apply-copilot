import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/*.d.ts",
    // Integration boundaries — verified by Playwright e2e + live API/DB checks, not unit tests:
    "!src/app/**/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/app/**/route.ts",
    "!src/db/**",
  ],
  coverageThreshold: {
    // Statements & lines clear 80% (the headline coverage). Functions/branches
    // are noisier (every arrow callback counts) so they sit slightly lower.
    global: { statements: 80, branches: 70, functions: 78, lines: 80 },
  },
};

export default createJestConfig(config);
