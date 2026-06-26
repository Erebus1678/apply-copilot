import { uploadCv } from "./client";

function file() {
  return new File(["cv"], "cv.pdf", { type: "application/pdf" });
}

describe("uploadCv", () => {
  afterEach(() => {
    // @ts-expect-error reset injected mock
    delete global.fetch;
  });

  it("returns the extracted text on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "extracted cv" }),
    });
    await expect(uploadCv(file())).resolves.toBe("extracted cv");
  });

  it("throws the server error message on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "File is too large (max 5 MB)." }),
    });
    await expect(uploadCv(file())).rejects.toThrow("File is too large");
  });

  it("falls back to a generic message when the body is unreadable", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("not json");
      },
    });
    await expect(uploadCv(file())).rejects.toThrow("Could not read the file.");
  });
});
