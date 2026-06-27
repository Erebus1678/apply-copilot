"use client";

import { useEffect, useRef, useState } from "react";
import { PROVIDER_IDS, type ProviderId } from "@/lib/ai/config";
import { PROVIDERS } from "@/lib/ai/providers";
import { cn } from "@/lib/utils";
import {
  setProvider,
  setProviderKey,
  setProviderModel,
  useProvider,
  useProviderConfig,
} from "./useProviderStore";

type Health = { hasEnvKey: boolean; live: boolean | null };
type HealthMap = Partial<Record<ProviderId, Health>>;

// A few suggestions per provider for the model datalist; free text is allowed.
const SUGGESTED_MODELS: Partial<Record<ProviderId, string[]>> = {
  openai: ["gpt-4o-mini", "gpt-4o", "o4-mini"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-1", "claude-haiku-4-5"],
  openrouter: ["openai/gpt-4o-mini", "anthropic/claude-sonnet-4.6", "meta-llama/llama-3.3-70b"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  together: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
};

type DotState = "ready" | "down" | "unknown";

function dotState(id: ProviderId, health: HealthMap, hasByoKey: boolean): DotState {
  const spec = PROVIDERS[id];
  const h = health[id];
  if (spec.needsKey) {
    if (hasByoKey || h?.hasEnvKey) return "ready";
    return "down"; // no key anywhere → can't be used
  }
  if (!h) return "unknown";
  return h.live ? "ready" : "down";
}

const DOT_CLASS: Record<DotState, string> = {
  ready: "bg-signal",
  down: "bg-destructive/70",
  unknown: "bg-muted-foreground/40",
};

const DOT_TITLE: Record<DotState, string> = {
  ready: "Configured",
  down: "Not configured / unreachable",
  unknown: "Status unknown",
};

export function ProviderSwitcher() {
  const active = useProvider();
  const config = useProviderConfig();
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState<HealthMap>({});
  const rootRef = useRef<HTMLDivElement>(null);

  // Per-provider status (no secrets; pings keyless local servers). Best-effort —
  // the switcher works without it, so swallow all errors. Re-runs on mount AND
  // whenever the menu opens: a local server (e.g. 9router) may have come up since
  // mount, so a once-only check goes stale and shows a working provider as down.
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/providers", { signal: controller.signal });
        if (!res.ok) return;
        const body = (await res.json()) as {
          data?: { id: ProviderId; hasEnvKey: boolean; live: boolean | null }[];
        };
        if (!body?.data) return;
        const map: HealthMap = {};
        for (const s of body.data) map[s.id] = { hasEnvKey: s.hasEnvKey, live: s.live };
        setHealth(map);
      } catch {
        // ignore — network/unavailable fetch
      }
    })();
    return () => controller.abort();
  }, [open]);

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeSpec = PROVIDERS[active];
  const activeEntry = config[active];
  const activeDot = dotState(active, health, Boolean(activeEntry?.apiKey));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-muted/60 hover:bg-muted inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
      >
        <span className={cn("size-1.5 rounded-full", DOT_CLASS[activeDot])} aria-hidden="true" />
        {activeSpec.label}
        <span className="text-muted-foreground" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="AI provider"
          className="border-border bg-background absolute right-0 z-20 mt-2 w-72 rounded-lg border p-2 shadow-lg"
        >
          <ul className="flex flex-col">
            {PROVIDER_IDS.map((id) => {
              const spec = PROVIDERS[id];
              const isActive = id === active;
              const state = dotState(id, health, Boolean(config[id]?.apiKey));
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => setProvider(id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                    )}
                  >
                    <span
                      className={cn("size-1.5 rounded-full", DOT_CLASS[state])}
                      title={DOT_TITLE[state]}
                      aria-hidden="true"
                    />
                    {spec.label}
                    <span className="sr-only">{DOT_TITLE[state]}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-border mt-2 flex flex-col gap-2 border-t pt-2">
            {activeSpec.needsKey && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">
                  {activeSpec.label} API key (this device)
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={activeEntry?.apiKey ?? ""}
                  onChange={(e) => setProviderKey(active, e.target.value)}
                  placeholder={activeSpec.apiKeyEnv}
                  className="border-border bg-background focus-visible:ring-ring rounded-md border px-2 py-1 font-mono text-xs outline-none focus-visible:ring-2"
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Model</span>
              <input
                type="text"
                list={`models-${active}`}
                value={activeEntry?.model ?? ""}
                onChange={(e) => setProviderModel(active, e.target.value)}
                placeholder={activeSpec.defaultModel}
                className="border-border bg-background focus-visible:ring-ring rounded-md border px-2 py-1 font-mono text-xs outline-none focus-visible:ring-2"
              />
              <datalist id={`models-${active}`}>
                {(SUGGESTED_MODELS[active] ?? [activeSpec.defaultModel]).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
