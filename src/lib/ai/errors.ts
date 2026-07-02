/** The HTTP status of a provider/SDK API error (AI SDK's AI_APICallError carries
 *  `statusCode`), or undefined for non-HTTP failures. Duck-typed to stay robust
 *  across SDK versions. */
function statusOf(error: unknown): number | undefined {
  if (error && typeof error === "object" && "statusCode" in error) {
    const code = (error as { statusCode?: unknown }).statusCode;
    if (typeof code === "number") return code;
  }
  return undefined;
}

/**
 * Map a provider/SDK error to a clean, actionable message for the user. Known
 * HTTP statuses get a specific hint (paid model, bad key, wrong model, rate
 * limit); everything else gets a generic fallback. We never echo the raw
 * provider body — it can name the provider/endpoint/key state (see aiErrorResponse).
 */
export function describeAiError(error: unknown): string {
  switch (statusOf(error)) {
    case 401:
    case 403:
      return "The provider rejected the API key. Check the key set for this provider.";
    case 402:
      return "This model needs credits on the provider. Add credits, or switch to a free or local model.";
    case 404:
      return "The provider couldn't find that model. Check the model id for this provider.";
    case 429:
      return "The provider is rate-limiting requests. Wait a moment and try again.";
    default:
      return "The AI request failed. Try again, or switch model or provider.";
  }
}

/**
 * Turn a provider/SDK error into a safe API response: log the real thing
 * server-side for debugging, return a clean, provider-agnostic message (specific
 * when the status code is known) so no provider/key detail leaks to the caller.
 */
export function aiErrorResponse(error: unknown, context: string): Response {
  console.error(`[ai:${context}]`, error);
  return Response.json({ error: describeAiError(error) }, { status: 502 });
}
