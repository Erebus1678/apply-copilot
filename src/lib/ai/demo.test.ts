/**
 * @jest-environment node
 */
// Node env: ReadableStream reading mirrors how the route consumes it.
import { analysisSchema } from "./analysis";
import { DEMO_ANALYSIS, isDemoEnabled, streamDemoAnalysis } from "./demo";

describe("DEMO_ANALYSIS", () => {
  it("satisfies analysisSchema", () => {
    expect(() => analysisSchema.parse(DEMO_ANALYSIS)).not.toThrow();
  });
});

describe("isDemoEnabled", () => {
  const original = process.env.NEXT_PUBLIC_DEMO_MODE;
  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = original;
  });

  it("is false when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    expect(isDemoEnabled()).toBe(false);
  });

  it("is true when the env var is '1'", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "1";
    expect(isDemoEnabled()).toBe(true);
  });
});

describe("streamDemoAnalysis", () => {
  it("reconstructs the full JSON.stringify(DEMO_ANALYSIS) when read to completion", async () => {
    const reader = streamDemoAnalysis().getReader();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out += value;
    }
    expect(out).toBe(JSON.stringify(DEMO_ANALYSIS));
  });
});
