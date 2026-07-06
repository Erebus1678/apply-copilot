import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { assertPublicUrl } from "@/lib/jd/url-guard";
import { getAiConfig, type ProviderId } from "./config";
import { PROVIDERS } from "./providers";

export interface ProviderInfo {
  provider: ProviderId;
  model: string;
}

/** Per-request override: pick a provider, bring your own key, model, and/or base URL. */
export interface ModelOverride {
  provider?: ProviderId;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

function normalize(override?: ProviderId | ModelOverride): ModelOverride {
  return typeof override === "string" ? { provider: override } : (override ?? {});
}

/** Active provider + model (no secrets) — safe to expose to the client. */
export function getActiveProviderInfo(
  override?: ProviderId | ModelOverride,
): Readonly<ProviderInfo> {
  const o = normalize(override);
  const cfg = getAiConfig();
  const id = o.provider ?? cfg.provider;
  return { provider: id, model: o.model?.trim() || cfg.providers[id].model };
}

/**
 * Resolve a streaming-capable language model for the active (or overridden) provider.
 * Every provider except Anthropic is OpenAI-compatible and uses the chat-completions
 * API (`.chat()`), which local servers like LM Studio / Ollama require. A per-request
 * `apiKey` / `model` (BYO-key) takes precedence over the environment config.
 */
export function getModel(override?: ProviderId | ModelOverride): LanguageModel {
  const o = normalize(override);
  const cfg = getAiConfig();
  const id = o.provider ?? cfg.provider;
  const spec = PROVIDERS[id];
  const resolved = cfg.providers[id];
  const apiKey = o.apiKey?.trim() || resolved.apiKey;
  const model = o.model?.trim() || resolved.model;

  if (spec.kind === "anthropic") {
    if (!apiKey) throw new Error(`${spec.apiKeyEnv} is not configured`);
    return createAnthropic({ apiKey })(model);
  }

  if (spec.needsKey && !apiKey) {
    throw new Error(`${spec.apiKeyEnv} is not configured`);
  }

  // BYO base URL (per-device override, e.g. pointing at the user's own tunnel/router).
  // A user-supplied URL is an SSRF surface: validate it's a public http(s) host unless
  // the operator explicitly opts into self-hosted/localhost targets.
  const overrideBaseUrl = o.baseUrl?.trim();
  const baseUrl =
    overrideBaseUrl && process.env.ALLOW_PRIVATE_BASE_URL !== "1"
      ? assertPublicUrl(overrideBaseUrl).toString()
      : (overrideBaseUrl ?? resolved.baseUrl);

  const openai = createOpenAI({
    baseURL: baseUrl, // undefined → official OpenAI endpoint
    apiKey: apiKey ?? "not-needed", // keyless local servers ignore this
  });
  return openai.chat(model);
}
