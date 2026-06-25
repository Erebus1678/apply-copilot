import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { getAiConfig, type ProviderId } from "./config";

export interface ProviderInfo {
  provider: ProviderId;
  model: string;
}

/** Active provider + model (no secrets) — safe to expose to the client. */
export function getActiveProviderInfo(override?: ProviderId): Readonly<ProviderInfo> {
  const cfg = getAiConfig();
  const provider = override ?? cfg.provider;
  const model =
    provider === "local"
      ? cfg.localModel
      : provider === "openai"
        ? cfg.openaiModel
        : cfg.anthropicModel;
  return { provider, model };
}

/**
 * Resolve a streaming-capable language model for the active (or overridden) provider.
 * Local LM Studio is OpenAI-compatible but only supports the chat-completions API,
 * so the OpenAI-family providers use `.chat()` rather than the default Responses API.
 */
export function getModel(override?: ProviderId): LanguageModel {
  const cfg = getAiConfig();
  const provider = override ?? cfg.provider;

  switch (provider) {
    case "local": {
      const openai = createOpenAI({ baseURL: cfg.localBaseUrl, apiKey: "lm-studio" });
      return openai.chat(cfg.localModel);
    }
    case "openai": {
      if (!cfg.openaiApiKey) throw new Error("OPENAI_API_KEY is not configured");
      const openai = createOpenAI({ apiKey: cfg.openaiApiKey });
      return openai.chat(cfg.openaiModel);
    }
    case "anthropic": {
      if (!cfg.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
      const anthropic = createAnthropic({ apiKey: cfg.anthropicApiKey });
      return anthropic(cfg.anthropicModel);
    }
  }
}
