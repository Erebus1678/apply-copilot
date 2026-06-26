import { TextDecoder, TextEncoder } from "node:util";
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

// jsdom doesn't expose TextEncoder/TextDecoder; code under test (and tests) use them.
Object.assign(globalThis, { TextEncoder, TextDecoder });

expect.extend(toHaveNoViolations);
