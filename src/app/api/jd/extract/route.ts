import { CV_MAX_BYTES, cvKindFromName, extractCv } from "@/lib/cv/extract";
import type { ModelOverride } from "@/lib/ai/provider";
import { isProviderId } from "@/lib/ai/providers";
import { extractJdFromUrl } from "@/lib/jd/extract-url";
import { ocrJdImage } from "@/lib/jd/vision";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const JD_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // screenshots run larger than text docs
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;

function isImage(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXT_RE.test(file.name);
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function overrideFromForm(form: FormData): ModelOverride {
  const str = (key: string): string | undefined => {
    const value = form.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };
  const provider = str("provider");
  return {
    provider: provider && isProviderId(provider) ? provider : undefined,
    apiKey: str("apiKey"),
    model: str("model"),
  };
}

/** Resolve a JD from a document, a screenshot (vision), or a URL — return plain text. */
export async function POST(req: Request) {
  const limited = enforceAiRateLimit(req);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  // 1. URL — fetch + readability.
  const url = form.get("url");
  if (typeof url === "string" && url.trim()) {
    try {
      return Response.json({ text: await extractJdFromUrl(url.trim()) });
    } catch (error) {
      return Response.json({ error: messageOf(error, "Could not read that link.") }, { status: 422 });
    }
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file or URL provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The file is empty." }, { status: 400 });
  }

  // 2. Screenshot — provider vision; on failure the client falls back to local OCR.
  if (isImage(file)) {
    if (file.size > JD_IMAGE_MAX_BYTES) {
      return Response.json({ error: "Image is too large (max 10 MB)." }, { status: 413 });
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const text = await ocrJdImage(bytes, file.type, overrideFromForm(form));
      return Response.json({ text });
    } catch (error) {
      return Response.json(
        { error: messageOf(error, "Vision model couldn't read the image."), canOcr: true },
        { status: 422 },
      );
    }
  }

  // 3. Document — reuse the CV text extractor (PDF/DOCX/TXT).
  if (file.size > CV_MAX_BYTES) {
    return Response.json({ error: "File is too large (max 5 MB)." }, { status: 413 });
  }
  const kind = cvKindFromName(file.name);
  if (!kind) {
    return Response.json(
      { error: "Unsupported file. Upload a PDF, DOCX, TXT, or an image." },
      { status: 415 },
    );
  }
  try {
    const { text } = await extractCv(await file.arrayBuffer(), kind);
    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: messageOf(error, "Could not read the file.") }, { status: 422 });
  }
}
