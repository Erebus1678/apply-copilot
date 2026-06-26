// Provider registry — the single source of truth for which model providers
// Apply Copilot supports. All but Anthropic are OpenAI-compatible and run
// through `createOpenAI({ baseURL }).chat()`. Add a provider by adding a row.

export type ProviderKind = "openai-compatible" | "anthropic";

export interface ProviderSpec {
  id: string;
  label: string;
  kind: ProviderKind;
  /** Base URL for openai-compatible providers; undefined = official OpenAI endpoint. */
  baseUrl?: string;
  /** Env var holding the API key; undefined for keyless local servers. */
  apiKeyEnv?: string;
  /** Whether a key is required to use the provider (cloud) vs optional (local). */
  needsKey: boolean;
  defaultModel: string;
  /** Env var overriding the default model. */
  modelEnv: string;
  /** Env var overriding the base URL (local servers). */
  baseUrlEnv?: string;
}

const REGISTRY = {
  local: {
    id: "local",
    label: "Local",
    kind: "openai-compatible",
    baseUrl: "http://localhost:1234/v1",
    needsKey: false,
    defaultModel: "qwen/qwen3-coder-30b",
    modelEnv: "LOCAL_AI_MODEL",
    baseUrlEnv: "LOCAL_AI_BASE_URL",
  },
  ollama: {
    id: "ollama",
    label: "Ollama",
    kind: "openai-compatible",
    baseUrl: "http://localhost:11434/v1",
    needsKey: false,
    defaultModel: "llama3.1",
    modelEnv: "OLLAMA_MODEL",
    baseUrlEnv: "OLLAMA_BASE_URL",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    kind: "openai-compatible",
    needsKey: true,
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    modelEnv: "OPENAI_MODEL",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    kind: "anthropic",
    needsKey: true,
    apiKeyEnv: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-6",
    modelEnv: "ANTHROPIC_MODEL",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai-compatible",
    baseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: "openai/gpt-4o-mini",
    modelEnv: "OPENROUTER_MODEL",
  },
  groq: {
    id: "groq",
    label: "Groq",
    kind: "openai-compatible",
    baseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    apiKeyEnv: "GROQ_API_KEY",
    defaultModel: "llama-3.3-70b-versatile",
    modelEnv: "GROQ_MODEL",
  },
  together: {
    id: "together",
    label: "Together",
    kind: "openai-compatible",
    baseUrl: "https://api.together.xyz/v1",
    needsKey: true,
    apiKeyEnv: "TOGETHER_API_KEY",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    modelEnv: "TOGETHER_MODEL",
  },
  ninerouter: {
    // 9Router (https://github.com/decolua/9router) — a local OpenAI-compatible
    // router that fans out to 40+ providers with auto-fallback + RTK token saving.
    // Keyless by default (runs on localhost); pick the routed model in the toggler.
    id: "ninerouter",
    label: "9Router",
    kind: "openai-compatible",
    baseUrl: "http://localhost:20128/v1",
    needsKey: false,
    defaultModel: "gpt-4o-mini",
    modelEnv: "NINEROUTER_MODEL",
    baseUrlEnv: "NINEROUTER_BASE_URL",
  },
} satisfies Record<string, ProviderSpec>;

export type ProviderId = keyof typeof REGISTRY;

// Literal keys (for ProviderId) with the full ProviderSpec value type so optional
// fields (baseUrl, apiKeyEnv, baseUrlEnv) are readable on a dynamically-indexed spec.
export const PROVIDERS: Record<ProviderId, ProviderSpec> = REGISTRY;

export const PROVIDER_IDS = Object.keys(REGISTRY) as [ProviderId, ...ProviderId[]];

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDERS;
}
