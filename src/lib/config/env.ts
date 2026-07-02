/**
 * Read a positive-integer env var, or fall back to a default. An unset, empty,
 * non-integer, or below-floor value uses the default — so a self-hoster can tune
 * a limit without risking a nonsense value (e.g. `CV_MAX_BYTES=abc` or `0`) that
 * would silently break uploads.
 */
export function envInt(name: string, fallback: number, min = 1): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) return fallback;
  return n;
}
