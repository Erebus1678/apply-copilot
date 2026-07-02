/**
 * @jest-environment node
 */
// Node env for Web Request. These exercise the validation branches that run
// before any model call, so no provider/network is touched.
import { POST } from "./route";

function postJson(body: string): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/analyze validation", () => {
  it("rejects a malformed JSON body (400)", async () => {
    const res = await POST(postJson("{ not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid json/i);
  });

  it("rejects a body that fails the schema (400)", async () => {
    const res = await POST(postJson(JSON.stringify({})));
    expect(res.status).toBe(400);
    // zod flatten() error object is returned, not a model response.
    expect((await res.json()).error).toBeDefined();
  });
});
