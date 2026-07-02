import { extractJdFromUrl } from "./extract-url";

const realFetch = global.fetch;

// jsdom has no global Response; mock only the surface extract-url reads.
type FetchLike = Pick<Response, "status" | "ok" | "headers" | "text">;

function mockResponse(init: { status: number; headers: Record<string, string>; body?: string }) {
  const headers = new Map(Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    status: init.status,
    ok: init.status >= 200 && init.status < 300,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    text: async () => init.body ?? "",
  } as unknown as FetchLike;
}

function redirectTo(location: string) {
  return mockResponse({ status: 302, headers: { location } });
}

function htmlPage(body: string) {
  return mockResponse({
    status: 200,
    headers: { "content-type": "text/html" },
    body: `<html><body>${body}</body></html>`,
  });
}

const JOB_TEXT =
  "Senior Frontend Engineer. We are hiring an experienced React and TypeScript " +
  "developer to build streaming dashboards. Requirements: 5+ years experience.";

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

describe("extractJdFromUrl redirect guard", () => {
  it("blocks a redirect that points at a private/metadata address", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(redirectTo("http://169.254.169.254/latest/meta-data/"));

    await expect(extractJdFromUrl("https://jobs.example.com/posting")).rejects.toThrow(
      /private address/,
    );
    // The guard must reject before the second (SSRF) request is ever made.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect to another public page and extracts its text", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(redirectTo("https://jobs.example.com/final"))
      .mockResolvedValueOnce(htmlPage(JOB_TEXT));

    const text = await extractJdFromUrl("https://jobs.example.com/posting");
    expect(text).toContain("Senior Frontend Engineer");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("stops after too many redirects", async () => {
    global.fetch = jest.fn().mockResolvedValue(redirectTo("https://jobs.example.com/loop"));

    await expect(extractJdFromUrl("https://jobs.example.com/start")).rejects.toThrow(
      /redirects too many times/,
    );
  });
});
