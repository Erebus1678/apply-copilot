/** The HTTP status of a provider/SDK API error, or undefined for non-HTTP
 *  failures. AI_APICallError carries `statusCode`; the SDK also wraps retried
 *  failures in AI_RetryError (real error under `lastError` / `errors[]`) and may
 *  nest a cause under `cause` — so we unwrap those. Duck-typed to stay robust
 *  across SDK versions; depth-bounded so a cyclic cause can't loop. */
function statusOf(error: unknown, depth = 0): number | undefined {
  if (depth > 5 || !error || typeof error !== "object") return undefined;
  const e = error as {
    statusCode?: unknown;
    lastError?: unknown;
    errors?: unknown;
    cause?: unknown;
  };
  if (typeof e.statusCode === "number") return e.statusCode;
  if (e.lastError != null) return statusOf(e.lastError, depth + 1);
  if (Array.isArray(e.errors) && e.errors.length > 0) {
    return statusOf(e.errors[e.errors.length - 1], depth + 1);
  }
  if (e.cause != null) return statusOf(e.cause, depth + 1);
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
      // OpenAI-compatible providers use 429 for both transient rate limits and
      // hard quota/billing exhaustion (insufficient_quota) — cover both.
      return "The provider is rate-limiting you or is out of quota. Wait and retry, check the provider's plan/billing, or switch model or provider.";
    default:
      return "The AI request failed. Try again, or switch model or provider.";
  }
}

/**
 * Log a provider/SDK error as ONE clean, bounded server-side line: the
 * categorized user message plus the error's own short message. Deliberately NOT
 * `console.error(error)` — a raw AISDK error object serializes `requestBodyValues`
 * (the full prompt, i.e. the user's CV/JD text) and other noise into the logs.
 * This is the single logging path for every AI failure (routes' onError,
 * stream teardown, and aiErrorResponse) so nothing dumps the raw object.
 */
export function logAiError(error: unknown, context: string): void {
  const detail = (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .slice(0, 300);
  console.error(`[ai:${context}] ${describeAiError(error)} — ${detail}`);
}

/**
 * Turn a provider/SDK error into a safe API response: log it cleanly server-side
 * for debugging, return a clean, provider-agnostic message (specific when the
 * status code is known) so no provider/key detail leaks to the caller.
 */
export function aiErrorResponse(error: unknown, context: string): Response {
  logAiError(error, context);
  return Response.json({ error: describeAiError(error) }, { status: 502 });
}
