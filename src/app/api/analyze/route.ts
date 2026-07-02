import { streamText, Output } from "ai";
import { getModel } from "@/lib/ai/provider";
import { analysisSchema, analyzeRequestSchema, buildAnalysisPrompt } from "@/lib/ai/analysis";
import { maybeCompressViaProxy } from "@/lib/ai/compress-proxy";
import { toFenceStrippedTextResponse } from "@/lib/ai/json-stream";
import { aiErrorResponse, logAiError } from "@/lib/ai/errors";
import { enforceAiRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Stream a structured JD analysis (+ optional CV fit) as a partial-object stream. */
export async function POST(req: Request) {
  const limited = enforceAiRateLimit(req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { system, prompt } = buildAnalysisPrompt(parsed.data);
  const finalPrompt = await maybeCompressViaProxy(prompt);

  try {
    const result = streamText({
      model: getModel(parsed.data),
      output: Output.object({ schema: analysisSchema }),
      system,
      prompt: finalPrompt,
      onError: ({ error }) => logAiError(error, "analyze"),
    });
    return toFenceStrippedTextResponse(result.textStream);
  } catch (error) {
    return aiErrorResponse(error, "analyze");
  }
}
