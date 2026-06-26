// Built-in prompt compression (RTK-style "compress before send"). Deterministic,
// lossless-for-meaning compaction of the prose we send to a provider — collapses
// whitespace, blank runs, separator lines, and consecutive duplicate lines — to
// cut input tokens without changing what the model reads.

export function compressPromptText(text: string): string {
  let out = text
    .replace(/\r\n/g, "\n")
    .replace(/​/g, "") // zero-width spaces
    .replace(/[ \t]+/g, " ") // runs of spaces/tabs → one space
    .replace(/ *\n/g, "\n") // trailing spaces before a newline
    .replace(/^[ \t]*[-=_*•]{4,}[ \t]*\n/gm, "") // separator/rule lines → gone
    .replace(/\n{3,}/g, "\n\n"); // collapse blank-line runs

  // Drop consecutive duplicate non-empty lines (repeated headers/separators).
  const lines = out.split("\n");
  out = lines.filter((line, i) => !(line.trim() !== "" && line === lines[i - 1])).join("\n");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** Rough token estimate (~4 chars/token) — good enough for a savings badge. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface CompressionStats {
  compressed: string;
  savedPercent: number;
}

/** Compress and report the estimated input-token saving (0-100). */
export function compressionStats(text: string): CompressionStats {
  const compressed = compressPromptText(text);
  const before = estimateTokens(text);
  const after = estimateTokens(compressed);
  const savedPercent = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
  return { compressed, savedPercent };
}
