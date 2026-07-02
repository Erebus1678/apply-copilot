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
    // Integration boundaries — verified by Playwright e2e + live API/DB checks, not unit tests.
    // Route error/validation paths now also have colocated *.route.test.ts (node env)
    // that run regardless of this exclusion; routes stay out of the coverage % because
    // their happy paths call live providers/DB that unit tests don't drive.
    "!src/app/**/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/app/**/route.ts",
    // Next.js runtime hook — wiring only; runs under the server runtime, not unit tests.
    "!src/instrumentation.ts",
    "!src/db/**",
    // Repositories are thin Drizzle wrappers — integration boundary, covered live.
    "!src/lib/**/repository.ts",
  ],
  coverageThreshold: {
    // Statements & lines clear 80% (the headline coverage). Functions/branches
    // are noisier (every arrow callback counts) so they sit slightly lower.
    global: { statements: 80, branches: 70, functions: 78, lines: 80 },
  },
};

export default createJestConfig(config);
