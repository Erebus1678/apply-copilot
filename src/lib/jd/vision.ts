import { generateText } from "ai";
import { getModel, type ModelOverride } from "@/lib/ai/provider";

const OCR_PROMPT =
  "Transcribe ALL text from this image of a job posting, verbatim and in natural reading order. " +
  "Output only the transcribed text — no commentary, no markdown, no headings you add yourself.";

/**
 * OCR a job-description screenshot via the active provider's vision model.
 * Throws if the model can't read images (text-only providers) or returns nothing —
 * the caller falls back to local OCR in that case.
 */
export async function ocrJdImage(
  bytes: Uint8Array,
  mediaType: string,
  override?: ModelOverride,
): Promise<string> {
  const { text } = await generateText({
    model: getModel(override),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: OCR_PROMPT },
          { type: "image", image: bytes, mediaType: mediaType || "image/png" },
        ],
      },
    ],
  });
  const trimmed = text.trim();
  if (!trimmed) throw new Error("No text found in the image.");
  return trimmed;
}
