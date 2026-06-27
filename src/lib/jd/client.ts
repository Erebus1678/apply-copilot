import { ocrImageLocally } from "./ocr";

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;

/** True when a file is an image (JD screenshot) rather than a document. */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXT_RE.test(file.name);
}

type ExtractResponse = { text?: string; error?: string; canOcr?: boolean };

async function postForm(form: FormData): Promise<{ ok: boolean; data: ExtractResponse | null }> {
  const res = await fetch("/api/jd/extract", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as ExtractResponse | null;
  return { ok: res.ok, data };
}

/** Extract JD text from an uploaded document (PDF/DOCX/TXT). */
export async function extractJdFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { ok, data } = await postForm(form);
  if (!ok || !data?.text) throw new Error(data?.error ?? "Could not read the file.");
  return data.text;
}

/** Extract JD text from a job-posting URL. */
export async function extractJdUrl(url: string): Promise<string> {
  const form = new FormData();
  form.append("url", url);
  const { ok, data } = await postForm(form);
  if (!ok || !data?.text) throw new Error(data?.error ?? "Could not read that link.");
  return data.text;
}

/**
 * Extract JD text from a screenshot. Tries the provider's vision model first; if
 * the server reports it can't (text-only model), falls back to local OCR so the
 * feature still works on any provider.
 */
export async function extractJdImage(
  file: File,
  override: { provider?: string; apiKey?: string; model?: string },
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  if (override.provider) form.append("provider", override.provider);
  if (override.apiKey) form.append("apiKey", override.apiKey);
  if (override.model) form.append("model", override.model);

  const { ok, data } = await postForm(form);
  if (ok && data?.text) return data.text;
  if (data?.canOcr) return ocrImageLocally(file);
  throw new Error(data?.error ?? "Could not read the screenshot.");
}
