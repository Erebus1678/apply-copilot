import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { streamRequestSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Generic provider-agnostic streaming endpoint: prompt in, text stream out. */
export async function POST(req: Request) {
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

  const { prompt, system, provider } = parsed.data;

  try {
    const result = streamText({ model: getModel(provider), system, prompt });
    // ponytail: toTextStreamResponse() masks mid-stream provider errors as an
    // empty stream. Fine for this backend primitive; switch to
    // toUIMessageStreamResponse() (forwards errors via onError) when the
    // streaming UI lands in Phase 2/3.
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
