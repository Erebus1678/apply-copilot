import { z } from "zod";
import { providerOverrideFields } from "./override";

const schema = z.object(providerOverrideFields);

describe("providerOverrideFields", () => {
  it("accepts a valid baseUrl", () => {
    const parsed = schema.safeParse({ baseUrl: "https://example.com/v1" });
    expect(parsed.success).toBe(true);
  });

  it("accepts a request with no baseUrl (optional)", () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("rejects a baseUrl over 300 chars", () => {
    const parsed = schema.safeParse({ baseUrl: "https://example.com/" + "a".repeat(300) });
    expect(parsed.success).toBe(false);
  });
});
