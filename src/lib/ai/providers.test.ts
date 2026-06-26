import { PROVIDER_IDS, PROVIDERS, isProviderId } from "./providers";

describe("provider registry", () => {
  it("registers every supported provider", () => {
    expect([...PROVIDER_IDS].sort()).toEqual(
      [
        "anthropic",
        "groq",
        "local",
        "ninerouter",
        "ollama",
        "openai",
        "openrouter",
        "together",
      ].sort(),
    );
  });

  it("marks local servers keyless and cloud providers as needing a key", () => {
    expect(PROVIDERS.local.needsKey).toBe(false);
    expect(PROVIDERS.ollama.needsKey).toBe(false);
    expect(PROVIDERS.openrouter.needsKey).toBe(true);
    expect(PROVIDERS.anthropic.needsKey).toBe(true);
  });

  it("gives keyed providers an apiKeyEnv and keyless ones none", () => {
    for (const id of PROVIDER_IDS) {
      const spec = PROVIDERS[id];
      expect(Boolean(spec.apiKeyEnv)).toBe(spec.needsKey);
    }
  });

  it("validates provider ids", () => {
    expect(isProviderId("openrouter")).toBe(true);
    expect(isProviderId("mistral")).toBe(false);
    expect(isProviderId(42)).toBe(false);
  });
});
