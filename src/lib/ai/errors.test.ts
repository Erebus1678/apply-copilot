/**
 * @jest-environment node
 */
// Node env: aiErrorResponse builds a Web Response, which jsdom's globals lack.
import { aiErrorResponse } from "./errors";

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
