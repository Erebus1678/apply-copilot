"use client";

import { PROVIDER_IDS, type ProviderId } from "@/lib/ai/config";
import { cn } from "@/lib/utils";
import { useProvider, setProvider } from "./useProviderStore";

const LABELS: Record<ProviderId, string> = {
  local: "Local",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export function ProviderSwitcher() {
  const active = useProvider();

  return (
    <div
      role="group"
      aria-label="AI provider"
      className="border-border bg-muted/60 inline-flex items-center rounded-md border p-0.5"
    >
      {PROVIDER_IDS.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={active === id}
          onClick={() => setProvider(id)}
          className={cn(
            "focus-visible:ring-ring rounded px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
            active === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[id]}
        </button>
      ))}
    </div>
  );
}
