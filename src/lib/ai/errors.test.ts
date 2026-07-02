/**
 * @jest-environment node
 */
// Node env: aiErrorResponse builds a Web Response, which jsdom's globals lack.
import { aiErrorResponse, describeAiError, logAiError } from "./errors";

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

  it("unwraps an AI_RetryError to the underlying status (lastError)", () => {
    // Shape of AI_RetryError after 3 failed retries of a 429 insufficient_quota.
    const retry = Object.assign(new Error("Failed after 3 attempts"), {
      reason: "maxRetriesExceeded",
      lastError: withStatus(429),
      errors: [withStatus(429), withStatus(429), withStatus(429)],
    });
    expect(describeAiError(retry)).toMatch(/rate-limiting you or is out of quota/i);
  });

  it("unwraps a nested cause to the underlying status", () => {
    const wrapped = Object.assign(new Error("pipe failed"), { cause: withStatus(402) });
    expect(describeAiError(wrapped)).toMatch(/needs credits/i);
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
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[ai:analyze]"));
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

describe("logAiError", () => {
  const withStatus = (statusCode: number, message: string) =>
    Object.assign(new Error(message), { statusCode });

  it("logs a single clean, categorized line — never the raw error object", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    logAiError(withStatus(402, "[402] Paid Model"), "analyze");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toHaveLength(1); // one string arg, not (label, object)
    const [line] = spy.mock.calls[0];
    expect(typeof line).toBe("string");
    expect(line).toMatch(/\[ai:analyze\]/);
    expect(line).toMatch(/needs credits/i);
    spy.mockRestore();
  });

  it("never serializes the raw error, so the CV/JD prompt can't leak to logs", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    // AISDK's AI_APICallError carries requestBodyValues (the user's CV/JD text);
    // a raw console.error(error) would dump it. logAiError must not.
    const err = Object.assign(new Error("[402] Paid Model"), {
      statusCode: 402,
      requestBodyValues: { prompt: "SECRET_CV_TEXT alice@example.com" },
    });
    logAiError(err, "cover-letter");

    const logged = spy.mock.calls.flat().join(" ");
    expect(logged).not.toContain("SECRET_CV_TEXT");
    spy.mockRestore();
  });

  it("bounds a huge provider message so a log line stays a line", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    logAiError(new Error("x".repeat(5000)), "stream");
    const [line] = spy.mock.calls[0];
    expect(line.length).toBeLessThan(400);
    spy.mockRestore();
  });
});
