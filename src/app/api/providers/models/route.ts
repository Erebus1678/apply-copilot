import { z } from "zod";
import { PROVIDER_IDS } from "@/lib/ai/config";
import { listProviderModels } from "@/lib/ai/models";
import { assertPublicUrl } from "@/lib/jd/url-guard";

export const runtime = "nodejs";

// apiKey / baseUrl ride the body so cloud providers (or the user's own endpoint)
// can be listed with the device's BYO config — fine on a self-host. Local servers
// need neither.
const bodySchema = z.object({
  provider: z.enum(PROVIDER_IDS),
  apiKey: z.string().max(400).optional(),
  baseUrl: z.string().max(300).optional(),
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

  const baseUrl = parsed.data.baseUrl?.trim();
  if (baseUrl && process.env.ALLOW_PRIVATE_BASE_URL !== "1") {
    try {
      assertPublicUrl(baseUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid base URL";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  const data = await listProviderModels(parsed.data);
  return Response.json({ data });
}
