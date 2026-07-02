import { streamText, generateText, Output } from "ai";
import { getModel } from "@/lib/ai/provider";
import { buildCvReviewPrompt, cvReviewRequestSchema, cvReviewSchema } from "@/lib/ai/cv-review";
import { buildCvExtractPrompt } from "@/lib/ai/cv-extract";
import { cleanAiText } from "@/lib/ai/clean-text";
import { maybeCompressViaProxy } from "@/lib/ai/compress-proxy";
import { toFenceStrippedTextResponse } from "@/lib/ai/json-stream";
import { aiErrorResponse } from "@/lib/ai/errors";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Stream a structured CV quality / ATS review as a partial-object stream. */
export async function POST(req: Request) {
  const limited = enforceAiRateLimit(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = cvReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Thorough mode: extract a structured outline first (best-effort), then review
  // against it. A failed extraction just falls back to the normal single pass.
  let outline: string | undefined;
  if (parsed.data.thorough) {
    try {
      const extracted = await generateText({
        model: getModel(parsed.data),
        ...buildCvExtractPrompt(parsed.data.cv),
      });
      outline = cleanAiText(extracted.text);
    } catch {
      outline = undefined;
    }
  }

  const { system, prompt } = buildCvReviewPrompt(parsed.data, outline);
  const finalPrompt = await maybeCompressViaProxy(prompt);

  try {
    const result = streamText({
      model: getModel(parsed.data),
      output: Output.object({ schema: cvReviewSchema }),
      system,
      prompt: finalPrompt,
    });
    return toFenceStrippedTextResponse(result.textStream);
  } catch (error) {
    return aiErrorResponse(error, "cv-review");
  }
}
