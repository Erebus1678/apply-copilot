import { getAiConfig, type ProviderId } from "./config";
import { PROVIDERS, type ProviderSpec } from "./providers";
import { envInt } from "@/lib/config/env";

// Tunneled/relayed base URLs (e.g. Tailscale Funnel) can push /models round-trips
// well past a few seconds; default high enough to tolerate that, env-tunable for
// operators who need it lower or higher.
const MODELS_TIMEOUT_MS = envInt("MODELS_TIMEOUT_MS", 8000);
const OPENAI_DEFAULT_BASE = "https://api.openai.com/v1";
const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";

type ModelsResponse = { data?: Array<{ id?: unknown }> };

/**
 * Pull chat-capable model ids out of an OpenAI/Anthropic `{ data: [{ id }] }`
 * listing. Embedding/reranker models are dropped — they can't chat, and would
 * otherwise pollute the picker (or be auto-selected and break every request).
 */
function parseIds(body: unknown): string[] {
  const data = (body as ModelsResponse)?.data;
  if (!Array.isArray(data)) return [];
  const ids = data
    .map((m) => (m && typeof m.id === "string" ? m.id : null))
    .filter((id): id is string => Boolean(id) && !/embed|rerank/i.test(id!));
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

function requestFor(
  spec: ProviderSpec,
  baseUrl: string | undefined,
  key: string | undefined,
): { url: string; headers: Record<string, string> } {
  if (spec.kind === "anthropic") {
    return {
      url: ANTHROPIC_MODELS_URL,
      headers: key ? { "x-api-key": key, "anthropic-version": "2023-06-01" } : {},
    };
  }
  const base = (baseUrl ?? OPENAI_DEFAULT_BASE).replace(/\/$/, "");
  return {
    url: `${base}/models`,
    headers: key ? { Authorization: `Bearer ${key}` } : {},
  };
}

/**
 * List the models a provider currently serves, via its OpenAI-compatible
 * `/models` endpoint (or Anthropic's `/v1/models`). Best-effort: any failure —
 * unreachable, missing key, non-JSON — resolves to `[]` so the UI falls back to
 * a free-text model field. `apiKey` is the caller's BYO key and overrides env.
 */
export async function listProviderModels(opts: {
  provider: ProviderId;
  apiKey?: string;
  baseUrl?: string;
}): Promise<string[]> {
  const spec = PROVIDERS[opts.provider];
  const resolved = getAiConfig().providers[opts.provider];
  const key = opts.apiKey?.trim() || resolved.apiKey;
  const baseUrl = opts.baseUrl?.trim() || resolved.baseUrl;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODELS_TIMEOUT_MS);
  try {
    const { url, headers } = requestFor(spec, baseUrl, key);
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return [];
    return parseIds(await res.json());
  } catch {
    return []; // unreachable / aborted / non-JSON — caller falls back to free text
  } finally {
    clearTimeout(timer);
  }
}
