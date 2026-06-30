import { z } from "zod";
import { PROVIDER_IDS } from "@/lib/ai/config";
import { listProviderModels } from "@/lib/ai/models";

export const runtime = "nodejs";

// apiKey rides the body so cloud providers can list models with the device's
// BYO key — fine on a self-host (the user's own server). Local servers need none.
const bodySchema = z.object({
  provider: z.enum(PROVIDER_IDS),
  apiKey: z.string().max(400).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = await listProviderModels(parsed.data);
  return Response.json({ data });
}
