import { getActiveProviderInfo } from "@/lib/ai/provider";

export const runtime = "nodejs";

/** Health/info endpoint — reports the active provider and model (no secrets). */
export function GET() {
  return Response.json(getActiveProviderInfo());
}
