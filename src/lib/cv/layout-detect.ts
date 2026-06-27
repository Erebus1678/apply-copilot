import { unzipSync } from "fflate";
import { detectSections, type LayoutReport } from "./layout";

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;

/**
 * DOCX is OOXML in a zip — we read the parts directly, so these signals are
 * exact (high confidence). mammoth (our text extractor) drops columns, text
 * boxes, and headers/footers entirely, which is exactly why we parse the zip.
 */
export function detectDocxLayout(bytes: ArrayBuffer, text: string): LayoutReport {
  const files = unzipSync(new Uint8Array(bytes));
  const dec = new TextDecoder();
  const doc = files["word/document.xml"] ? dec.decode(files["word/document.xml"]) : "";

  const colNums = [...doc.matchAll(/<w:cols\b[^>]*\bw:num="(\d+)"/g)].map((m) => Number(m[1]));
  const maxCols = colNums.length ? Math.max(...colNums) : 1;
  const columns = maxCols >= 3 ? "multi" : maxCols === 2 ? 2 : 1;

  const headerFooter = Object.keys(files)
    .filter((p) => /^word\/(header|footer)\d*\.xml$/.test(p))
    .map((p) => dec.decode(files[p]))
    .join(" ")
    .replace(/<[^>]+>/g, " ");

  return {
    source: "docx",
    pageCount: null, // docx reflows — no fixed page count without rendering
    columns,
    hasTables: /<w:tbl[\s>]/.test(doc),
    hasTextBoxes: /<w:txbxContent|<v:textbox|<wps:txbx/.test(doc),
    contactInHeaderFooter: EMAIL_RE.test(headerFooter) || PHONE_RE.test(headerFooter),
    imageCount: Object.keys(files).filter((p) => p.startsWith("word/media/")).length,
    sections: detectSections(text),
    confidence: "high",
  };
}

// Minimal slice of the pdf.js page/document proxy we rely on (from unpdf).
// items is unknown[] because pdf.js text items are a union (TextItem |
// TextMarkedContent) — we narrow each at runtime.
type PdfPage = {
  getViewport(p: { scale: number }): { width: number; height: number };
  getTextContent(): Promise<{ items: unknown[] }>;
};
type PdfDoc = { numPages: number; getPage(n: number): Promise<PdfPage> };

type PositionedItem = { str: string; transform: number[] };

function asPositioned(item: unknown): PositionedItem | null {
  if (typeof item !== "object" || item === null) return null;
  const o = item as { str?: unknown; transform?: unknown };
  if (typeof o.str === "string" && o.str.trim() && Array.isArray(o.transform)) {
    return { str: o.str, transform: o.transform as number[] };
  }
  return null;
}

// ponytail: naive x-threshold column detection on page 1 — flags the common
// 1-vs-2-column case, the #1 ATS killer. Upgrade to gap-clustering across all
// pages if right-aligned date columns cause false positives.
const RIGHT_START = 0.52; // fraction of page width past which a line "starts in the right column"
const TWO_COL_RATIO = 0.25; // share of lines starting on the right to call it 2 columns
const MIN_ITEMS = 15;

/** PDF layout from pdf.js text positions — heuristic, so medium confidence. */
export async function detectPdfLayout(pdf: PdfDoc, text: string): Promise<LayoutReport> {
  const page = await pdf.getPage(1);
  const { width } = page.getViewport({ scale: 1 });
  const items = (await page.getTextContent()).items
    .map(asPositioned)
    .filter((i): i is PositionedItem => i !== null);

  let columns: LayoutReport["columns"] = 1;
  if (items.length >= MIN_ITEMS) {
    const rightStarts = items.filter((i) => i.transform[4] > width * RIGHT_START).length;
    if (rightStarts / items.length > TWO_COL_RATIO) columns = 2;
  }

  return {
    source: "pdf",
    pageCount: pdf.numPages,
    columns,
    hasTables: null, // unreliable from PDF text positions — left to v2 (vision)
    hasTextBoxes: null,
    contactInHeaderFooter: null, // a PDF "top of page" isn't a Word header — would be noise
    imageCount: null,
    sections: detectSections(text),
    confidence: "medium",
  };
}
