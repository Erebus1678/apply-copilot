const recognize = jest.fn();
jest.mock("tesseract.js", () => ({ recognize: (...args: unknown[]) => recognize(...args) }));

import { ocrImageLocally } from "./ocr";

function image(): File {
  return new File([new Uint8Array([1, 2, 3])], "jd.png", { type: "image/png" });
}

describe("ocrImageLocally", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("returns the trimmed recognized text", async () => {
    recognize.mockResolvedValue({ data: { text: "  Senior Engineer  " } });
    await expect(ocrImageLocally(image())).resolves.toBe("Senior Engineer");
  });

  it("throws when nothing readable was found", async () => {
    recognize.mockResolvedValue({ data: { text: "   \n  " } });
    await expect(ocrImageLocally(image())).rejects.toThrow(/couldn't read/i);
  });

  it("times out if recognition hangs", async () => {
    jest.useFakeTimers();
    recognize.mockReturnValue(new Promise(() => {})); // never resolves
    const p = ocrImageLocally(image());
    // Let the dynamic import + race setup settle, then trip the timeout.
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(30_000);
    await expect(p).rejects.toThrow(/timed out/i);
  });
});
