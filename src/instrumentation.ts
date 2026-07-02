/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * We use it to log the resolved config and warm up the DB (surfacing a failed
 * boot migration in the log). Guarded to the Node.js runtime so it never runs
 * in the edge runtime, and dynamically imported so server-only deps (PGlite)
 * aren't pulled into other bundles.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logStartup } = await import("@/lib/config/startup");
  await logStartup();
}
