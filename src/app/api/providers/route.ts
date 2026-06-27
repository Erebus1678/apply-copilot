import { getAiConfig } from "@/lib/ai/config";
import { PROVIDER_IDS, PROVIDERS } from "@/lib/ai/providers";

export const runtime = "nodejs";

export interface ProviderStatus {
  id: string;
  label: string;
  needsKey: boolean;
  /** An env-configured key is present server-side (never the key itself). */
  hasEnvKey: boolean;
  /** Reachability of a keyless local server; null for cloud providers. */
  live: boolean | null;
}

const PING_TIMEOUT_MS = 1500;

async function pingModels(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    // Any HTTP response means the server is up. Some OpenAI-compatible servers
    // (e.g. 9router) 404/401 on /models yet serve /chat/completions fine, so
    // gating on res.ok wrongly marks a working provider as down.
    await fetch(`${baseUrl.replace(/\/$/, "")}/models`, { signal: controller.signal });
    return true;
  } catch {
    return false; // network error / timeout → genuinely unreachable
  } finally {
    clearTimeout(timer);
  }
}

/** Per-provider configuration status for the provider switcher (no secrets). */
export async function GET() {
  const cfg = getAiConfig();

  const data: ProviderStatus[] = await Promise.all(
    PROVIDER_IDS.map(async (id) => {
      const spec = PROVIDERS[id];
      const resolved = cfg.providers[id];
      const live = !spec.needsKey && resolved.baseUrl ? await pingModels(resolved.baseUrl) : null;
      return {
        id,
        label: spec.label,
        needsKey: spec.needsKey,
        hasEnvKey: Boolean(resolved.apiKey),
        live,
      };
    }),
  );

  return Response.json({ data });
}
