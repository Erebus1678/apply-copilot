import { streamText, Output } from "ai";
import { getModel } from "@/lib/ai/provider";
import { analysisSchema, analyzeRequestSchema, buildAnalysisPrompt } from "@/lib/ai/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Stream a structured JD analysis (+ optional CV fit) as a partial-object stream. */
export async function POST(req: Request) {
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

  try {
    const result = streamText({
      model: getModel(),
      output: Output.object({ schema: analysisSchema }),
      system,
      prompt,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
