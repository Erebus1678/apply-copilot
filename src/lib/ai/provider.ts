import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { getAiConfig, type ProviderId } from "./config";
import { PROVIDERS } from "./providers";

export interface ProviderInfo {
  provider: ProviderId;
  model: string;
}

/** Active provider + model (no secrets) — safe to expose to the client. */
export function getActiveProviderInfo(override?: ProviderId): Readonly<ProviderInfo> {
  const cfg = getAiConfig();
  const id = override ?? cfg.provider;
  return { provider: id, model: cfg.providers[id].model };
}

/**
 * Resolve a streaming-capable language model for the active (or overridden) provider.
 * Every provider except Anthropic is OpenAI-compatible and uses the chat-completions
 * API (`.chat()`), which local servers like LM Studio / Ollama require.
 */
export function getModel(override?: ProviderId): LanguageModel {
  const cfg = getAiConfig();
  const id = override ?? cfg.provider;
  const spec = PROVIDERS[id];
  const resolved = cfg.providers[id];

  if (spec.kind === "anthropic") {
    if (!resolved.apiKey) throw new Error(`${spec.apiKeyEnv} is not configured`);
    return createAnthropic({ apiKey: resolved.apiKey })(resolved.model);
  }

  if (spec.needsKey && !resolved.apiKey) {
    throw new Error(`${spec.apiKeyEnv} is not configured`);
  }

  const openai = createOpenAI({
    baseURL: resolved.baseUrl, // undefined → official OpenAI endpoint
    apiKey: resolved.apiKey ?? "not-needed", // keyless local servers ignore this
  });
  return openai.chat(resolved.model);
}
