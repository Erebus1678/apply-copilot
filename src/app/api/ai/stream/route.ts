import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { maybeCompressViaProxy } from "@/lib/ai/compress-proxy";
import { streamRequestSchema } from "@/lib/ai/schemas";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Generic provider-agnostic streaming endpoint: prompt in, text stream out. */
export async function POST(req: Request) {
  const limited = enforceAiRateLimit(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = streamRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { prompt, system, provider, apiKey, model } = parsed.data;
  const finalPrompt = await maybeCompressViaProxy(prompt);

  try {
    const result = streamText({
      model: getModel({ provider, apiKey, model }),
      system,
      prompt: finalPrompt,
    });
    // A mid-stream provider error surfaces here as an empty stream rather than an
    // error event. Acceptable for this raw text endpoint; switch to
    // toUIMessageStreamResponse() (forwards errors via onError) if a caller needs
    // to tell "empty" apart from "failed".
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
