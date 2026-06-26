"use client";

import { compressionStats } from "@/lib/ai/compress";

const MIN_CHARS = 200; // not worth showing for tiny inputs

/** Shows the estimated input-token saving from built-in prompt compression. */
export function CompressionHint({ sources }: { sources: string[] }) {
  const text = sources.filter(Boolean).join("\n");
  if (text.length < MIN_CHARS) return null;

  const { savedPercent } = compressionStats(text);
  if (savedPercent < 1) return null;

  return (
    <p className="text-muted-foreground font-mono text-xs" role="status">
      ~{savedPercent}% input tokens trimmed before sending
    </p>
  );
}
