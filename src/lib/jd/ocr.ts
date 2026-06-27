// Local OCR fallback for JD screenshots, used when the active provider's model
// can't read images. tesseract.js runs in the browser, so the image never leaves
// the device (only the language traineddata is fetched, once, from the CDN).
// ponytail: English only; add "eng+ukr" etc. here if non-English JDs come up.
export async function ocrImageLocally(file: File): Promise<string> {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(file, "eng");
  const text = data.text.trim();
  if (!text) throw new Error("Couldn't read any text from that screenshot.");
  return text;
}
