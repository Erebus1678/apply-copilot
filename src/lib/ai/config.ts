import { PROVIDER_IDS, PROVIDERS, isProviderId, type ProviderId } from "./providers";

export { PROVIDER_IDS, isProviderId };
export type { ProviderId };

/** Treat empty / whitespace env vars as unset so defaults apply. */
function env(value: string | undefined): string | undefined {
  return value && value.trim() ? value.trim() : undefined;
}

export interface ResolvedProvider {
  id: ProviderId;
  model: string;
  /** Present only for providers that take a key, when one is configured. */
  apiKey?: string;
  /** Present for openai-compatible providers with a non-default endpoint. */
  baseUrl?: string;
}

export interface AiConfig {
  /** The default provider used when a request doesn't override it. */
  provider: ProviderId;
  providers: Record<ProviderId, ResolvedProvider>;
}

/**
 * Read and validate AI provider configuration from the environment.
 * Read lazily (per call) so it always reflects the current env and stays testable.
 */
export function getAiConfig(): AiConfig {
  const requested = env(process.env.AI_PROVIDER);
  const provider: ProviderId = isProviderId(requested) ? requested : "local";

  const entries = PROVIDER_IDS.map((id): [ProviderId, ResolvedProvider] => {
    const spec = PROVIDERS[id];
    return [
      id,
      {
        id,
        model: env(process.env[spec.modelEnv]) ?? spec.defaultModel,
        apiKey: spec.apiKeyEnv ? env(process.env[spec.apiKeyEnv]) : undefined,
        baseUrl: spec.baseUrlEnv
          ? (env(process.env[spec.baseUrlEnv]) ?? spec.baseUrl)
          : spec.baseUrl,
      },
    ];
  });

  return {
    provider,
    providers: Object.fromEntries(entries) as Record<ProviderId, ResolvedProvider>,
  };
}
