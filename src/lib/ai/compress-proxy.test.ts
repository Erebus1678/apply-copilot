import { maybeCompressViaProxy } from "./compress-proxy";

describe("maybeCompressViaProxy", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.COMPRESS_PROXY_URL;
    delete process.env.COMPRESS_PROXY_TOKEN;
  });

  afterEach(() => {
    process.env = original;
    // @ts-expect-error reset injected mock
    delete global.fetch;
  });

  it("returns the original text when no proxy is configured", async () => {
    global.fetch = jest.fn();
    await expect(maybeCompressViaProxy("hello world")).resolves.toBe("hello world");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns the proxy-compressed text when configured", async () => {
    process.env.COMPRESS_PROXY_URL = "https://proxy.example/v1/compress";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ text: "hi" }) });
    await expect(maybeCompressViaProxy("hello   world")).resolves.toBe("hi");
  });

  it("sends a bearer token when COMPRESS_PROXY_TOKEN is set", async () => {
    process.env.COMPRESS_PROXY_URL = "https://proxy.example/v1/compress";
    process.env.COMPRESS_PROXY_TOKEN = "secret";
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ text: "hi" }) });
    global.fetch = fetchMock;
    await maybeCompressViaProxy("hello");
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.authorization).toBe("Bearer secret");
  });

  it("falls back to the original text when the proxy errors", async () => {
    process.env.COMPRESS_PROXY_URL = "https://proxy.example/v1/compress";
    global.fetch = jest.fn().mockRejectedValue(new Error("down"));
    await expect(maybeCompressViaProxy("keep me")).resolves.toBe("keep me");
  });

  it("falls back when the proxy returns a non-ok or malformed response", async () => {
    process.env.COMPRESS_PROXY_URL = "https://proxy.example/v1/compress";
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(maybeCompressViaProxy("keep me")).resolves.toBe("keep me");
  });

  it("ignores a non-http(s) proxy URL without sending the prompt (SSRF guard)", async () => {
    process.env.COMPRESS_PROXY_URL = "file:///etc/passwd";
    global.fetch = jest.fn();
    await expect(maybeCompressViaProxy("secret prompt")).resolves.toBe("secret prompt");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("ignores a malformed proxy URL", async () => {
    process.env.COMPRESS_PROXY_URL = "not a url";
    global.fetch = jest.fn();
    await expect(maybeCompressViaProxy("secret prompt")).resolves.toBe("secret prompt");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
