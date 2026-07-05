/**
 * @jest-environment node
 */
// Node env for Web Request. The validation tests exercise branches that run
// before any model call, so no provider/network is touched. The demo tests
// mock the provider/streamText so the "flag unset" fallthrough case can't
// accidentally hit a real network call either.
import { streamText } from "ai";
import { DEMO_ANALYSIS } from "@/lib/ai/demo";
import { POST } from "./route";

jest.mock("@/lib/ai/provider", () => ({ getModel: jest.fn(() => "mock-model") }));
jest.mock("ai", () => {
  const actual = jest.requireActual("ai");
  return { ...actual, streamText: jest.fn() };
});

function postJson(body: string): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

async function readAll(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value);
  }
  return out;
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

describe("POST /api/analyze demo mode", () => {
  const JD =
    "Senior Frontend Engineer. Build streaming dashboards in React and TypeScript. " +
    "5+ years experience required.";
  const originalFlag = process.env.NEXT_PUBLIC_DEMO_MODE;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = originalFlag;
    jest.clearAllMocks();
  });

  it("streams the fixture without calling the provider when demo:true and the flag is on", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "1";
    const res = await POST(postJson(JSON.stringify({ demo: true, jd: JD })));
    expect(res.status).toBe(200);
    expect(await readAll(res)).toBe(JSON.stringify(DEMO_ANALYSIS));
    expect(streamText).not.toHaveBeenCalled();
  });

  it("falls through to the normal path when demo:true but the flag is unset", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    (streamText as jest.Mock).mockReturnValue({
      textStream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue("{}");
          controller.close();
        },
      }),
    });
    const res = await POST(postJson(JSON.stringify({ demo: true, jd: JD })));
    expect(res.status).toBe(200);
    expect(streamText).toHaveBeenCalledTimes(1);
    expect(await readAll(res)).not.toBe(JSON.stringify(DEMO_ANALYSIS));
  });
});
