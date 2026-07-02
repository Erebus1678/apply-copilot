// Local OCR fallback for JD screenshots, used when the active provider's model
// can't read images. tesseract.js runs in the browser, so the image never leaves
// the device (only the language traineddata is fetched, once, from the CDN).
// ponytail: English only; add "eng+ukr" etc. here if non-English JDs come up.
// tesseract can hang on a blurry or unusual image; cap it so the UI never sits
// in "processing" forever. Runs in the browser, so this is a plain const (server
// env wouldn't reach the client bundle).
const OCR_TIMEOUT_MS = 30_000;

export async function ocrImageLocally(file: File): Promise<string> {
  const { recognize } = await import("tesseract.js");
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Reading that screenshot timed out. Try a clearer or cropped image.")),
      OCR_TIMEOUT_MS,
    );
  });
  try {
    const { data } = await Promise.race([recognize(file, "eng"), timeout]);
    const text = data.text.trim();
    if (!text) throw new Error("Couldn't read any text from that screenshot.");
    return text;
  } finally {
    clearTimeout(timer!);
  }
}
