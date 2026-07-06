import { listProviderModels } from "./models";

const okJson = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

describe("listProviderModels", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("parses, dedupes, sorts, and drops embedding models", async () => {
    fetchMock.mockResolvedValue(
      okJson({
        data: [
          { id: "qwen/qwen3-coder-30b" },
          { id: "google/gemma-4-26b" },
          { id: "qwen/qwen3-coder-30b" },
          { id: "text-embedding-nomic-embed-text-v1.5" },
        ],
      }),
    );

    const models = await listProviderModels({ provider: "local" });

    expect(models).toEqual([
      { id: "google/gemma-4-26b", group: "google", tier: undefined },
      { id: "qwen/qwen3-coder-30b", group: "qwen", tier: undefined },
    ]);
  });

  it("groups 9Router-style objects by owned_by with no tier (no pricing)", async () => {
    fetchMock.mockResolvedValue(
      okJson({
        data: [
          { id: "ag/claude-opus-4-6-thinking", object: "model", owned_by: "ag" },
          { id: "gh/gpt-5", object: "model", owned_by: "gh" },
        ],
      }),
    );

    const models = await listProviderModels({ provider: "local" });

    expect(models).toEqual([
      { id: "ag/claude-opus-4-6-thinking", group: "ag", tier: undefined },
      { id: "gh/gpt-5", group: "gh", tier: undefined },
    ]);
  });

  it("tags an ollama/ id and a *free* id as free when there is no pricing", async () => {
    fetchMock.mockResolvedValue(
      okJson({
        data: [
          { id: "ollama/llama3.1", owned_by: "ollama" },
          { id: "some/totally-free-model", owned_by: "some" },
        ],
      }),
    );

    const models = await listProviderModels({ provider: "local" });

    expect(models).toEqual([
      { id: "ollama/llama3.1", group: "ollama", tier: "free" },
      { id: "some/totally-free-model", group: "some", tier: "free" },
    ]);
  });

  it("derives free vs paid from OpenRouter pricing, and :free suffix as free", async () => {
    fetchMock.mockResolvedValue(
      okJson({
        data: [
          {
            id: "anthropic/claude-3.5-sonnet",
            pricing: { prompt: "0.000003", completion: "0.000015" },
          },
          {
            id: "meta-llama/llama-3-8b:free",
            pricing: { prompt: "0", completion: "0" },
          },
          {
            id: "some/other:free",
            pricing: { prompt: "0.000001", completion: "0" },
          },
        ],
      }),
    );

    const models = await listProviderModels({ provider: "openrouter" });

    expect(models).toEqual([
      { id: "anthropic/claude-3.5-sonnet", group: "anthropic", tier: "paid" },
      { id: "meta-llama/llama-3-8b:free", group: "meta-llama", tier: "free" },
      // :free suffix wins even though pricing.prompt is non-zero
      { id: "some/other:free", group: "some", tier: "free" },
    ]);
  });

  it("hits the keyless local /models with no auth header", async () => {
    fetchMock.mockResolvedValue(okJson({ data: [] }));

    await listProviderModels({ provider: "local" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:1234/v1/models");
    expect((init as RequestInit).headers).toEqual({});
  });

  it("sends a Bearer token for a cloud provider with a BYO key", async () => {
    fetchMock.mockResolvedValue(okJson({ data: [{ id: "gpt-4o-mini" }] }));

    const models = await listProviderModels({ provider: "openai", apiKey: "sk-test" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/models");
    expect((init as RequestInit).headers).toEqual({ Authorization: "Bearer sk-test" });
    expect(models).toEqual([{ id: "gpt-4o-mini", group: undefined, tier: undefined }]);
  });

  it("uses Anthropic's headers and endpoint for the anthropic provider", async () => {
    fetchMock.mockResolvedValue(okJson({ data: [{ id: "claude-sonnet-4-6" }] }));

    await listProviderModels({ provider: "anthropic", apiKey: "sk-ant" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/models");
    expect((init as RequestInit).headers).toMatchObject({
      "x-api-key": "sk-ant",
      "anthropic-version": "2023-06-01",
    });
  });

  it("returns [] when the server responds non-ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    expect(await listProviderModels({ provider: "local" })).toEqual([]);
  });

  it("returns [] when the fetch throws (unreachable / aborted)", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    expect(await listProviderModels({ provider: "local" })).toEqual([]);
  });
});
