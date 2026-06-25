import { z } from "zod";
import { updateApplication, deleteApplication } from "@/lib/applications/repository";
import { updateApplicationSchema } from "@/lib/applications/schemas";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return Response.json({ error: "Invalid application id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateApplication(id, parsed.data);
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update application";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return Response.json({ error: "Invalid application id" }, { status: 400 });
  }

  try {
    const removed = await deleteApplication(id);
    if (!removed) return Response.json({ error: "Not found" }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete application";
    return Response.json({ error: message }, { status: 500 });
  }
}
