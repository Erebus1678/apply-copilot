import { listProviderModels } from "./models";

const okJson = (body: unknown) =>
  ({ ok: true, json: async () => body }) as Response;

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

    expect(models).toEqual(["google/gemma-4-26b", "qwen/qwen3-coder-30b"]);
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
    expect(models).toEqual(["gpt-4o-mini"]);
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
