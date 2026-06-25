import { z } from "zod";

export const PROVIDER_IDS = ["local", "openai", "anthropic"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/** Treat empty / whitespace env vars as unset so schema defaults apply. */
function env(value: string | undefined): string | undefined {
  return value && value.trim() ? value.trim() : undefined;
}

const configSchema = z.object({
  provider: z.enum(PROVIDER_IDS).default("local"),
  localBaseUrl: z.string().url().default("http://localhost:1234/v1"),
  localModel: z.string().min(1).default("qwen/qwen3-coder-30b"),
  openaiApiKey: z.string().min(1).optional(),
  openaiModel: z.string().min(1).default("gpt-4o-mini"),
  anthropicApiKey: z.string().min(1).optional(),
  anthropicModel: z.string().min(1).default("claude-sonnet-4-6"),
});

export type AiConfig = z.infer<typeof configSchema>;

/**
 * Read and validate AI provider configuration from the environment.
 * Read lazily (per call) so it always reflects the current env and stays testable.
 */
export function getAiConfig(): AiConfig {
  return configSchema.parse({
    provider: env(process.env.AI_PROVIDER),
    localBaseUrl: env(process.env.LOCAL_AI_BASE_URL),
    localModel: env(process.env.LOCAL_AI_MODEL),
    openaiApiKey: env(process.env.OPENAI_API_KEY),
    openaiModel: env(process.env.OPENAI_MODEL),
    anthropicApiKey: env(process.env.ANTHROPIC_API_KEY),
    anthropicModel: env(process.env.ANTHROPIC_MODEL),
  });
}
