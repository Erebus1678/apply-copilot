import { CV_MAX_BYTES, cvKindFromName, extractCvText } from "@/lib/cv/extract";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Accept a CV upload (PDF/DOCX/TXT), return its extracted plain text. */
export async function POST(req: Request) {
  const limited = enforceAiRateLimit(req);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > CV_MAX_BYTES) {
    return Response.json({ error: "File is too large (max 5 MB)." }, { status: 413 });
  }

  const kind = cvKindFromName(file.name);
  if (!kind) {
    return Response.json(
      { error: "Unsupported file. Upload a PDF, DOCX, or TXT." },
      { status: 415 },
    );
  }

  try {
    const text = await extractCvText(await file.arrayBuffer(), kind);
    return Response.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the file.";
    return Response.json({ error: message }, { status: 422 });
  }
}
