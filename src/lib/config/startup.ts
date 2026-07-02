import { getAiConfig, invalidRequestedProvider } from "@/lib/ai/config";
import { dbInfo, dbReady } from "@/db/client";

/**
 * One-time server-start log: the resolved AI default (key presence only, never
 * the key itself) and the DB driver/path, plus a warning for a typo'd
 * AI_PROVIDER. Awaits dbReady so a failed boot migration is surfaced in the log
 * instead of as a cryptic 500 on the first request. Never throws.
 */
export async function logStartup(): Promise<void> {
  try {
    const bad = invalidRequestedProvider();
    if (bad) {
      console.warn(
        `[config] AI_PROVIDER="${bad}" is not a known provider — falling back to "local".`,
      );
    }
    const cfg = getAiConfig();
    const p = cfg.providers[cfg.provider];
    console.info(
      `[config] AI default=${cfg.provider} model=${p.model}` +
        `${p.baseUrl ? ` baseUrl=${p.baseUrl}` : ""} key=${p.apiKey ? "set" : "none"}`,
    );
    console.info(`[db] driver=${dbInfo.driver}${dbInfo.path ? ` path=${dbInfo.path}` : ""}`);
  } catch (error) {
    console.error("[startup] config log failed:", error);
  }

  try {
    await dbReady;
    console.info("[db] schema ready");
  } catch (error) {
    console.error("[db] boot migration failed — the DB may be unusable:", error);
  }
}
