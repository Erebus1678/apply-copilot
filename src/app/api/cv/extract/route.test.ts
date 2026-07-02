/**
 * @jest-environment node
 */
// Node env: the route handler uses Web Request/FormData/File, which jsdom's
// globals don't provide. Only validation branches are exercised here — a valid
// file would invoke unpdf/mammoth, which are covered by cv/extract unit tests.
import { POST } from "./route";
import { CV_MAX_BYTES } from "@/lib/cv/extract";

function postWith(form: FormData): Request {
  return new Request("http://localhost/api/cv/extract", { method: "POST", body: form });
}

describe("POST /api/cv/extract validation", () => {
  it("rejects a request with no file (400)", async () => {
    const res = await POST(postWith(new FormData()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no file/i);
  });

  it("rejects an empty file (400)", async () => {
    const form = new FormData();
    form.set("file", new File([], "cv.pdf", { type: "application/pdf" }));
    const res = await POST(postWith(form));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/empty/i);
  });

  it("rejects a file over the size ceiling (413) with the configured limit in the message", async () => {
    const form = new FormData();
    form.set(
      "file",
      new File([new Uint8Array(CV_MAX_BYTES + 1)], "cv.pdf", { type: "application/pdf" }),
    );
    const res = await POST(postWith(form));
    expect(res.status).toBe(413);
    const maxMb = Math.floor(CV_MAX_BYTES / (1024 * 1024));
    expect((await res.json()).error).toContain(`${maxMb} MB`);
  });

  it("accepts a file exactly at the ceiling (size check is inclusive) — falls through to type check", async () => {
    const form = new FormData();
    // Exactly CV_MAX_BYTES must NOT be rejected by the size guard; an unsupported
    // extension then yields 415, proving the boundary is inclusive-pass, not 413.
    form.set(
      "file",
      new File([new Uint8Array(CV_MAX_BYTES)], "cv.exe", { type: "application/octet-stream" }),
    );
    const res = await POST(postWith(form));
    expect(res.status).toBe(415);
  });

  it("rejects an unsupported file type (415)", async () => {
    const form = new FormData();
    form.set("file", new File(["hello"], "cv.exe", { type: "application/octet-stream" }));
    const res = await POST(postWith(form));
    expect(res.status).toBe(415);
    expect((await res.json()).error).toMatch(/pdf, docx, or txt/i);
  });
});
