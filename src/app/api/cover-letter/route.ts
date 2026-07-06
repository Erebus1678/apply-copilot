import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { coverLetterRequestSchema, buildCoverLetterPrompt } from "@/lib/ai/cover-letter";
import { maybeCompressViaProxy } from "@/lib/ai/compress-proxy";
import { aiErrorResponse, logAiError } from "@/lib/ai/errors";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Soft ceiling so short/custom modes don't overrun; standard stays uncapped
// since the deterministic clamp only applies to custom mode client-side.
function maxOutputTokensFor(data: { length?: string; maxChars?: number }): number | undefined {
  if (data.length === "short") return 250;
  if (data.length === "custom") return Math.ceil((data.maxChars ?? 1200) / 3);
  return undefined;
}

/** Stream a tailored, anti-slop cover letter as plain text. */
export async function POST(req: Request) {
  const limited = enforceAiRateLimit(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = coverLetterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { system, prompt } = buildCoverLetterPrompt(parsed.data);
  const finalPrompt = await maybeCompressViaProxy(prompt);

  try {
    const result = streamText({
      model: getModel(parsed.data),
      system,
      prompt: finalPrompt,
      maxOutputTokens: maxOutputTokensFor(parsed.data),
      onError: ({ error }) => logAiError(error, "cover-letter"),
    });
    return result.toTextStreamResponse();
  } catch (error) {
    return aiErrorResponse(error, "cover-letter");
  }
}
