/**
 * @jest-environment node
 */
// Node env: aiErrorResponse builds a Web Response, which jsdom's globals lack.
import { aiErrorResponse, describeAiError } from "./errors";

describe("describeAiError", () => {
  const withStatus = (statusCode: number) =>
    Object.assign(new Error("provider blew up"), { statusCode });

  it("explains a paid-model / credits error (402)", () => {
    expect(describeAiError(withStatus(402))).toMatch(/needs credits/i);
  });

  it("explains a rejected key (401/403)", () => {
    expect(describeAiError(withStatus(401))).toMatch(/rejected the api key/i);
    expect(describeAiError(withStatus(403))).toMatch(/rejected the api key/i);
  });

  it("explains a missing model (404)", () => {
    expect(describeAiError(withStatus(404))).toMatch(/couldn't find that model/i);
  });

  it("explains a rate limit (429)", () => {
    expect(describeAiError(withStatus(429))).toMatch(/rate-limiting/i);
  });

  it("falls back to a generic message for unknown / non-HTTP errors", () => {
    expect(describeAiError(new Error("socket hang up"))).toMatch(/try again, or switch/i);
    expect(describeAiError("weird")).toMatch(/try again, or switch/i);
  });

  it("never echoes the raw provider text", () => {
    const msg = describeAiError(
      Object.assign(new Error("sk-secret-key leaked here"), { statusCode: 402 }),
    );
    expect(msg).not.toContain("sk-secret-key");
  });
});

describe("aiErrorResponse", () => {
  it("logs the real error server-side but returns a generic 502 without leaking it", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = aiErrorResponse(new Error("Anthropic key sk-leak invalid"), "analyze");

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).not.toContain("sk-leak");
    expect(body.error).toMatch(/AI request failed/i);
    expect(spy).toHaveBeenCalledWith("[ai:analyze]", expect.any(Error));
    spy.mockRestore();
  });

  it("handles a non-Error thrown value", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = aiErrorResponse("weird string failure", "stream");
    expect(res.status).toBe(502);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
