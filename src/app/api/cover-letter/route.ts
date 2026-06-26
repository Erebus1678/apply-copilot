import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { coverLetterRequestSchema, buildCoverLetterPrompt } from "@/lib/ai/cover-letter";
import { enforceAiRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  try {
    const result = streamText({ model: getModel(parsed.data.provider), system, prompt });
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cover letter generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
