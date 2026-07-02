/**
 * Turn a provider/SDK error into a safe API response. The raw error can name the
 * provider, its endpoint, or key state ("Anthropic API key invalid") — details we
 * don't want to hand an anonymous caller. Log the real thing server-side for
 * debugging; return a generic, provider-agnostic message.
 */
export function aiErrorResponse(error: unknown, context: string): Response {
  console.error(`[ai:${context}]`, error);
  return Response.json(
    { error: "The AI request failed. Try another provider, or check your key and model." },
    { status: 502 },
  );
}
