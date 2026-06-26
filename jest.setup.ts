import { TextDecoder, TextEncoder } from "node:util";
import { ReadableStream } from "node:stream/web";
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

// jsdom doesn't expose TextEncoder/TextDecoder or web streams; code under test
// (and the stream tests) rely on them.
Object.assign(globalThis, { TextEncoder, TextDecoder, ReadableStream });

expect.extend(toHaveNoViolations);
