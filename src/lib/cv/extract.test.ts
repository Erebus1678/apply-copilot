jest.mock("unpdf", () => ({ getDocumentProxy: jest.fn(), extractText: jest.fn() }));
jest.mock("mammoth", () => ({ __esModule: true, default: { extractRawText: jest.fn() } }));

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { cvKindFromName, extractCvText } from "./extract";

const mockGetDocumentProxy = getDocumentProxy as jest.Mock;
const mockExtractText = extractText as jest.Mock;
const mockExtractRawText = mammoth.extractRawText as unknown as jest.Mock;

function bytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

describe("cvKindFromName", () => {
  it("maps known extensions, case-insensitively", () => {
    expect(cvKindFromName("resume.PDF")).toBe("pdf");
    expect(cvKindFromName("cv.docx")).toBe("docx");
    expect(cvKindFromName("notes.txt")).toBe("text");
    expect(cvKindFromName("README.md")).toBe("text");
  });

  it("returns null for unsupported files", () => {
    expect(cvKindFromName("photo.png")).toBeNull();
    expect(cvKindFromName("noextension")).toBeNull();
  });
});

describe("extractCvText", () => {
  beforeEach(() => jest.clearAllMocks());

  it("decodes and normalizes plain text", async () => {
    const text = await extractCvText(bytes("a\r\n\n\n\nb  \n"), "text");
    expect(text).toBe("a\n\nb");
  });

  it("extracts a single merged string from a PDF", async () => {
    mockGetDocumentProxy.mockResolvedValue("pdf-handle");
    mockExtractText.mockResolvedValue({ text: "  PDF body\n\n\n\nmore  " });
    expect(await extractCvText(bytes("%PDF"), "pdf")).toBe("PDF body\n\nmore");
  });

  it("joins a per-page PDF text array", async () => {
    mockGetDocumentProxy.mockResolvedValue("pdf-handle");
    mockExtractText.mockResolvedValue({ text: ["page one", "page two"] });
    expect(await extractCvText(bytes("%PDF"), "pdf")).toBe("page one\npage two");
  });

  it("extracts raw text from a DOCX", async () => {
    mockExtractRawText.mockResolvedValue({ value: "Docx body" });
    expect(await extractCvText(bytes("PK"), "docx")).toBe("Docx body");
  });

  it("throws when the file yields no text", async () => {
    await expect(extractCvText(bytes("   \n\n  "), "text")).rejects.toThrow("No text found");
  });
});
