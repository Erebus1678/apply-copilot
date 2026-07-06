import { getAiConfig, type ProviderId } from "./config";
import { PROVIDERS, type ProviderSpec } from "./providers";
import { envInt } from "@/lib/config/env";

// Tunneled/relayed base URLs (e.g. Tailscale Funnel) can push /models round-trips
// well past a few seconds; default high enough to tolerate that, env-tunable for
// operators who need it lower or higher.
const MODELS_TIMEOUT_MS = envInt("MODELS_TIMEOUT_MS", 8000);
const OPENAI_DEFAULT_BASE = "https://api.openai.com/v1";
const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";

export type ModelInfo = { id: string; group?: string; tier?: "free" | "paid" };

type RawPricing = { prompt?: unknown; completion?: unknown };
type RawModel = { id?: unknown; owned_by?: unknown; pricing?: RawPricing };
type ModelsResponse = { data?: unknown };

/** `"0"`, `"0.0"`, 0 → 0. Anything else (missing, non-numeric) → NaN. */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

function deriveGroup(raw: RawModel, id: string): string | undefined {
  if (typeof raw.owned_by === "string" && raw.owned_by.trim()) return raw.owned_by;
  const slash = id.indexOf("/");
  return slash > 0 ? id.slice(0, slash) : undefined;
}

function deriveTier(raw: RawModel, id: string): "free" | "paid" | undefined {
  if (id.endsWith(":free")) return "free";
  if (raw.pricing) {
    const prompt = toNumber(raw.pricing.prompt);
    const completion = toNumber(raw.pricing.completion);
    if (Number.isNaN(prompt) || Number.isNaN(completion)) return undefined;
    return prompt === 0 && completion === 0 ? "free" : "paid";
  }
  // No pricing data at all (e.g. 9Router/plain OpenAI-compatible `/models`) — best
  // effort from the id only; anything else is left untagged rather than guessed.
  if (id.startsWith("ollama/") || /free/i.test(id)) return "free";
  return undefined;
}

/**
 * Turn an OpenAI/Anthropic/OpenRouter-style `{ data: [...] }` listing into
 * enriched model info: id (deduped, chat-only), a channel/vendor group, and a
 * best-effort free/paid tier. Embedding/reranker models are dropped — they
 * can't chat, and would otherwise pollute the picker (or be auto-selected and
 * break every request). Never throws — unparseable entries are skipped.
 */
function parseModels(body: unknown): ModelInfo[] {
  const data = (body as ModelsResponse)?.data;
  if (!Array.isArray(data)) return [];

  const byId = new Map<string, ModelInfo>();
  for (const entry of data) {
    try {
      const raw = entry as RawModel;
      const id = typeof raw?.id === "string" ? raw.id : null;
      if (!id || /embed|rerank/i.test(id) || byId.has(id)) continue;
      byId.set(id, { id, group: deriveGroup(raw, id), tier: deriveTier(raw, id) });
    } catch {
      // unparseable shape — skip this entry, keep the rest
    }
  }

  return [...byId.values()].sort((a, b) => {
    const groupCmp = (a.group ?? "").localeCompare(b.group ?? "");
    return groupCmp !== 0 ? groupCmp : a.id.localeCompare(b.id);
  });
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
}): Promise<ModelInfo[]> {
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
    return parseModels(await res.json());
  } catch {
    return []; // unreachable / aborted / non-JSON — caller falls back to free text
  } finally {
    clearTimeout(timer);
  }
}
