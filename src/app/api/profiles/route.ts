import { createProfile, ensureDefaultProfile } from "@/lib/profiles/repository";
import { createProfileSchema } from "@/lib/profiles/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await ensureDefaultProfile();
    return Response.json({ data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profiles";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const created = await createProfile(parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create profile";
    return Response.json({ error: message }, { status: 500 });
  }
}
