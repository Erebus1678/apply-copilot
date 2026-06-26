import { z } from "zod";
import { createManyApplications } from "@/lib/applications/repository";
import { createApplicationSchema } from "@/lib/applications/schemas";

export const runtime = "nodejs";

const importSchema = z.object({
  profileId: z.string().uuid().optional(),
  applications: z
    .array(createApplicationSchema)
    .min(1, "No applications to import")
    .max(500, "Too many rows (max 500 per import)"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { profileId, applications: rows } = parsed.data;
  const stamped = rows.map((row) => ({ ...row, profileId }));

  try {
    const created = await createManyApplications(stamped);
    return Response.json({ data: created, count: created.length }, { status: 201 });
  } catch (error) {
    // A bad profileId trips the FK constraint — report it as a client error, not a 500.
    if (error instanceof Error && /foreign key/i.test(error.message)) {
      return Response.json({ error: "Selected profile no longer exists" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to import applications";
    return Response.json({ error: message }, { status: 500 });
  }
}
