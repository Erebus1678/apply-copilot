// The AI SDK ships ESM-only source that Jest's CJS transform can't load from
// node_modules. We test our own provider-selection logic, so stub the SDK factories.
jest.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => ({ chat: (model: string) => ({ provider: "openai", model }) }),
}));
jest.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: () => (model: string) => ({ provider: "anthropic", model }),
}));

import { getActiveProviderInfo, getModel } from "./provider";
import { streamRequestSchema } from "./schemas";

const AI_ENV_KEYS = [
  "AI_PROVIDER",
  "LOCAL_AI_BASE_URL",
  "LOCAL_AI_MODEL",
  "OLLAMA_BASE_URL",
  "OLLAMA_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "GROQ_API_KEY",
  "GROQ_MODEL",
  "TOGETHER_API_KEY",
  "TOGETHER_MODEL",
  "NINEROUTER_BASE_URL",
  "NINEROUTER_MODEL",
] as const;

describe("AI provider configuration", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    for (const key of AI_ENV_KEYS) delete process.env[key];
  });

  afterAll(() => {
    process.env = original;
  });

  it("defaults to the local provider when AI_PROVIDER is unset", () => {
    expect(getActiveProviderInfo()).toEqual({ provider: "local", model: "qwen/qwen3-coder-30b" });
  });

  it("resolves a local model without requiring an API key", () => {
    expect(getModel()).toBeDefined();
  });

  it("honors a per-request provider override for reported info", () => {
    process.env.ANTHROPIC_MODEL = "claude-sonnet-4-6";
    expect(getActiveProviderInfo("anthropic")).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-6",
    });
  });

  it("throws a clear error when the OpenAI key is missing", () => {
    process.env.AI_PROVIDER = "openai";
    expect(() => getModel()).toThrow(/OPENAI_API_KEY/);
  });

  it("throws a clear error when the Anthropic key is missing", () => {
    expect(() => getModel("anthropic")).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("builds a cloud model when the key is present", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(getModel("openai")).toBeDefined();
  });

  it("builds a keyless Ollama model from the registry", () => {
    expect(getModel("ollama")).toBeDefined();
    expect(getActiveProviderInfo("ollama")).toEqual({ provider: "ollama", model: "llama3.1" });
  });

  it("builds a keyless 9Router model (local OpenAI-compatible router)", () => {
    expect(getModel("ninerouter")).toBeDefined();
    expect(getActiveProviderInfo("ninerouter")).toEqual({
      provider: "ninerouter",
      model: "gpt-4o-mini",
    });
  });

  it("requires a key for OpenRouter and builds one when present", () => {
    expect(() => getModel("openrouter")).toThrow(/OPENROUTER_API_KEY/);
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    expect(getModel("openrouter")).toBeDefined();
  });

  it("honors a model override env var per provider", () => {
    process.env.GROQ_MODEL = "llama-3.1-8b-instant";
    expect(getActiveProviderInfo("groq").model).toBe("llama-3.1-8b-instant");
  });

  it("builds a cloud model from a per-request BYO key with no env key", () => {
    expect(() => getModel({ provider: "openai" })).toThrow(/OPENAI_API_KEY/);
    expect(getModel({ provider: "openai", apiKey: "sk-byo" })).toBeDefined();
  });

  it("reflects a per-request model override in the reported info", () => {
    expect(getActiveProviderInfo({ provider: "openai", model: "gpt-4o" }).model).toBe("gpt-4o");
  });
});

describe("streamRequestSchema", () => {
  it("rejects an empty prompt", () => {
    expect(streamRequestSchema.safeParse({ prompt: "" }).success).toBe(false);
  });

  it("accepts a now-registered provider like groq", () => {
    expect(streamRequestSchema.safeParse({ prompt: "hi", provider: "groq" }).success).toBe(true);
  });

  it("rejects an unregistered provider", () => {
    expect(streamRequestSchema.safeParse({ prompt: "hi", provider: "mistral" }).success).toBe(
      false,
    );
  });

  it("accepts a valid request with an optional provider override", () => {
    const parsed = streamRequestSchema.safeParse({
      prompt: "Summarize this JD",
      provider: "local",
    });
    expect(parsed.success).toBe(true);
  });
});
