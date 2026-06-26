import { rateLimit, enforceAiRateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit, then blocks with a retry hint", () => {
    const key = "test-window";
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks budgets independently per key", () => {
    expect(rateLimit("key-a", 1, 60_000).ok).toBe(true);
    expect(rateLimit("key-b", 1, 60_000).ok).toBe(true);
    expect(rateLimit("key-a", 1, 60_000).ok).toBe(false);
  });
});

describe("enforceAiRateLimit", () => {
  // jsdom has no global Request; a minimal header stub is all enforceAiRateLimit reads.
  function reqFrom(ip: string): Request {
    return {
      headers: { get: (key: string) => (key === "x-forwarded-for" ? ip : null) },
    } as unknown as Request;
  }

  // The 429 branch builds a Web `Response`, which jsdom doesn't provide; that
  // path is verified live against the running routes. Here we cover IP
  // extraction + the under-budget guard.
  it("allows requests under the budget", () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < 5; i++) {
      expect(enforceAiRateLimit(reqFrom(ip))).toBeNull();
    }
  });
});
