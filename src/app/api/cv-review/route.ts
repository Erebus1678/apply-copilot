import { streamText, Output } from "ai";
import { getModel } from "@/lib/ai/provider";
import { buildCvReviewPrompt, cvReviewRequestSchema, cvReviewSchema } from "@/lib/ai/cv-review";
import { enforceAiRateLimit } from "@/lib/rate-limit";

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

  const { system, prompt } = buildCvReviewPrompt(parsed.data);

  try {
    const result = streamText({
      model: getModel(parsed.data),
      output: Output.object({ schema: cvReviewSchema }),
      system,
      prompt,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "CV review failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
