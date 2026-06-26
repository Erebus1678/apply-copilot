import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

/** Upload ceiling — CVs are text; 5 MB is generous for a PDF/DOCX résumé. */
export const CV_MAX_BYTES = 5 * 1024 * 1024;

export type CvFileKind = "pdf" | "docx" | "text";

const EXT_KIND: Record<string, CvFileKind> = {
  pdf: "pdf",
  docx: "docx",
  txt: "text",
  md: "text",
  markdown: "text",
};

/** Resolve which parser to use from a filename, or null if unsupported. */
export function cvKindFromName(filename: string): CvFileKind | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return EXT_KIND[ext] ?? null;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract normalized plain text from a CV upload. Throws if the file has no text. */
export async function extractCvText(bytes: ArrayBuffer, kind: CvFileKind): Promise<string> {
  let raw: string;
  if (kind === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    raw = Array.isArray(text) ? text.join("\n") : text;
  } else if (kind === "docx") {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    raw = value;
  } else {
    raw = new TextDecoder().decode(bytes);
  }

  const normalized = normalize(raw);
  if (!normalized) throw new Error("No text found in the file.");
  return normalized;
}
