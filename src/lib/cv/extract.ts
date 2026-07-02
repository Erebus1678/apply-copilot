import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { envInt } from "@/lib/config/env";
import { detectDocxLayout, detectPdfLayout } from "./layout-detect";
import { emptyLayout, textLayout, type LayoutReport } from "./layout";

/** Upload ceiling — CVs are text; 5 MB is generous for a PDF/DOCX résumé. Raise
 *  via CV_MAX_BYTES (e.g. for high-res scans); floor of 1 KB guards a typo. */
export const CV_MAX_BYTES = envInt("CV_MAX_BYTES", 5 * 1024 * 1024, 1024);

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

export type ExtractedCv = { text: string; layout: LayoutReport };

/** Layout detection is best-effort — a failure must never block text extraction. */
async function safeLayout(
  source: "pdf" | "docx",
  detect: () => LayoutReport | Promise<LayoutReport>,
): Promise<LayoutReport> {
  try {
    return await detect();
  } catch {
    return emptyLayout(source);
  }
}

/** Extract normalized text + a structural layout report. Throws if the file has no text. */
export async function extractCv(bytes: ArrayBuffer, kind: CvFileKind): Promise<ExtractedCv> {
  if (kind === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    const normalized = normalize(Array.isArray(text) ? text.join("\n") : text);
    if (!normalized) {
      // A PDF with no extractable text is almost always a scan (image-only) or
      // an encrypted file — tell the user why instead of a blank "no text".
      throw new Error(
        "This PDF has no selectable text — it looks like a scan or is encrypted. " +
          "Export a text-based PDF or DOCX, or paste the text directly.",
      );
    }
    return {
      text: normalized,
      layout: await safeLayout("pdf", () => detectPdfLayout(pdf, normalized)),
    };
  }
  if (kind === "docx") {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const normalized = normalize(value);
    if (!normalized) throw new Error("No text found in the file.");
    return {
      text: normalized,
      layout: await safeLayout("docx", () => detectDocxLayout(bytes, normalized)),
    };
  }
  const normalized = normalize(new TextDecoder().decode(bytes));
  if (!normalized) throw new Error("No text found in the file.");
  return { text: normalized, layout: textLayout(normalized) };
}

/** Text-only convenience over {@link extractCv}. */
export async function extractCvText(bytes: ArrayBuffer, kind: CvFileKind): Promise<string> {
  return (await extractCv(bytes, kind)).text;
}
