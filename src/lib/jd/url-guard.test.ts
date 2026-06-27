import { assertPublicUrl } from "./url-guard";

describe("assertPublicUrl", () => {
  it("accepts public http(s) URLs", () => {
    expect(assertPublicUrl("https://jobs.example.com/123").hostname).toBe("jobs.example.com");
    expect(assertPublicUrl("http://careers.acme.io/role").protocol).toBe("http:");
  });

  it("does not flag public hosts that merely start with f-letters", () => {
    expect(assertPublicUrl("https://fc-barcelona.com").hostname).toBe("fc-barcelona.com");
  });

  it.each(["ftp://example.com/file", "file:///etc/passwd", "javascript:alert(1)"])(
    "rejects non-http schemes: %s",
    (url) => {
      expect(() => assertPublicUrl(url)).toThrow();
    },
  );

  it.each([
    "http://localhost/x",
    "http://127.0.0.1/x",
    "http://10.0.0.5/x",
    "http://192.168.1.1/x",
    "http://172.16.0.1/x",
    "http://169.254.169.254/latest/meta-data", // cloud metadata
    "http://printer.local/x",
    "http://[::1]/x",
  ])("rejects private/loopback addresses: %s", (url) => {
    expect(() => assertPublicUrl(url)).toThrow();
  });

  it("rejects garbage input", () => {
    expect(() => assertPublicUrl("not a url")).toThrow();
  });
});
