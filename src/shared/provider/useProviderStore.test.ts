import { setProviderBaseUrl, setProviderKey, useProviderOverride } from "./useProviderStore";
import { renderHook } from "@testing-library/react";

describe("provider base URL store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips setProviderBaseUrl through localStorage", () => {
    setProviderBaseUrl("local", "https://example.com/v1");
    const cfg = JSON.parse(localStorage.getItem("apply-copilot:provider-config") ?? "{}");
    expect(cfg.local.baseUrl).toBe("https://example.com/v1");
  });

  it("clears the entry when baseUrl is set to empty and no other field is set", () => {
    setProviderBaseUrl("local", "https://example.com/v1");
    setProviderBaseUrl("local", "");
    const cfg = JSON.parse(localStorage.getItem("apply-copilot:provider-config") ?? "{}");
    expect(cfg.local).toBeUndefined();
  });

  it("useProviderOverride includes baseUrl for the active provider", () => {
    setProviderKey("local", "");
    setProviderBaseUrl("local", "https://example.com/v1");
    const { result } = renderHook(() => useProviderOverride());
    expect(result.current).toEqual({
      provider: "local",
      apiKey: undefined,
      model: undefined,
      baseUrl: "https://example.com/v1",
    });
  });
});
