import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { coverLetterRequestSchema, buildCoverLetterPrompt } from "@/lib/ai/cover-letter";
import { maybeCompressViaProxy } from "@/lib/ai/compress-proxy";
import { aiErrorResponse, logAiError } from "@/lib/ai/errors";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Soft ceiling per length so no mode overruns a low-credit provider's cap
// (e.g. free OpenRouter accounts reject unbounded requests).
function maxOutputTokensFor(data: { length?: string; maxChars?: number }): number {
  if (data.length === "short") return 250;
  if (data.length === "custom") return Math.ceil((data.maxChars ?? 1200) / 3);
  return 1200; // standard
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
