import { strToU8, zipSync } from "fflate";
import { detectDocxLayout, detectPdfLayout } from "./layout-detect";

function docx(parts: Record<string, string | Uint8Array>): ArrayBuffer {
  const entries: Record<string, Uint8Array> = {};
  for (const [path, val] of Object.entries(parts)) {
    entries[path] = typeof val === "string" ? strToU8(val) : val;
  }
  const zip = zipSync(entries);
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;
}

describe("detectDocxLayout", () => {
  it("reads columns, tables, text boxes, images, and header contact from OOXML", () => {
    const document = `<w:document><w:body>
      <w:tbl><w:tr><w:tc></w:tc></w:tr></w:tbl>
      <w:p><w:drawing><w:txbxContent></w:txbxContent></w:drawing></w:p>
      <w:sectPr><w:cols w:num="2" w:space="708"/></w:sectPr>
    </w:body></w:document>`;
    const layout = detectDocxLayout(
      docx({
        "word/document.xml": document,
        "word/header1.xml": "<w:hdr><w:p><w:r><w:t>me@example.com</w:t></w:r></w:p></w:hdr>",
        "word/media/image1.png": new Uint8Array([1, 2, 3]),
      }),
      "Experience\nAcme",
    );
    expect(layout).toMatchObject({
      source: "docx",
      columns: 2,
      hasTables: true,
      hasTextBoxes: true,
      contactInHeaderFooter: true,
      imageCount: 1,
      confidence: "high",
    });
    expect(layout.sections).toEqual(["Experience"]);
  });

  it("reports a clean single-column doc with no extras", () => {
    const layout = detectDocxLayout(
      docx({ "word/document.xml": "<w:document><w:body><w:p/></w:body></w:document>" }),
      "Skills\nTS",
    );
    expect(layout).toMatchObject({
      columns: 1,
      hasTables: false,
      hasTextBoxes: false,
      contactInHeaderFooter: false,
      imageCount: 0,
    });
  });
});

describe("detectPdfLayout", () => {
  function fakePdf(xs: number[]) {
    return {
      numPages: 2,
      getPage: async () => ({
        getViewport: () => ({ width: 600, height: 800 }),
        getTextContent: async () => ({
          items: xs.map((x) => ({ str: "word", transform: [1, 0, 0, 1, x, 400] })),
        }),
      }),
    };
  }

  it("flags two columns when many lines start in the right half", async () => {
    const xs = Array.from({ length: 20 }, (_, i) => (i % 2 ? 400 : 50)); // half on the right
    const layout = await detectPdfLayout(fakePdf(xs), "Experience");
    expect(layout).toMatchObject({ source: "pdf", columns: 2, pageCount: 2, confidence: "medium" });
  });

  it("reports a single column for left-aligned text", async () => {
    const xs = Array.from({ length: 20 }, () => 50);
    const layout = await detectPdfLayout(fakePdf(xs), "Experience");
    expect(layout.columns).toBe(1);
  });
});
