import { envInt } from "@/lib/config/env";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfter: number };

// In-memory fixed-window limiter — per-instance only. Fine for a single-node
// deploy; swap for @upstash/ratelimit (Redis) if it ever scales out. NOTE: keyed
// by client IP from x-forwarded-for, which is only trustworthy behind a proxy you
// control — on a future multi-tenant SaaS, key by authenticated user instead.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic prune so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

// Tunable per deployment; defaults match the previous hardcoded 20 req / 60s so
// zero-config self-host is unchanged. Floors keep a typo from disabling the guard.
const AI_LIMIT = envInt("AI_RATE_LIMIT", 20);
const AI_WINDOW_MS = envInt("AI_RATE_WINDOW_MS", 60_000, 1000);

/** Guard the AI endpoints: returns a 429 Response when over budget, else null. */
export function enforceAiRateLimit(req: Request): Response | null {
  const { ok, retryAfter } = rateLimit(`ai:${clientIp(req)}`, AI_LIMIT, AI_WINDOW_MS);
  if (ok) return null;
  return Response.json(
    { error: "Too many requests. Give the model a moment and try again." },
    { status: 429, headers: { "retry-after": String(retryAfter) } },
  );
}
