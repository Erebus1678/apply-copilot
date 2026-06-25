import { listApplications, createApplication } from "@/lib/applications/repository";
import { createApplicationSchema } from "@/lib/applications/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listApplications();
    return Response.json({ data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load applications";
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

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await createApplication(parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create application";
    return Response.json({ error: message }, { status: 500 });
  }
}
