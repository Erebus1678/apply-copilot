import { z } from "zod";
import { renameProfile } from "@/lib/profiles/repository";
import { createProfileSchema } from "@/lib/profiles/schemas";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return Response.json({ error: "Invalid profile id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await renameProfile(id, parsed.data.name);
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rename profile";
    return Response.json({ error: message }, { status: 500 });
  }
}
