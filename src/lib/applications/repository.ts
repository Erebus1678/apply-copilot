import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, type Application } from "@/db/schema";
import type { CreateApplicationInput, UpdateApplicationInput } from "./schemas";

export function listApplications(): Promise<Application[]> {
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  const [row] = await db.insert(applications).values(input).returning();
  return row;
}

export async function updateApplication(
  id: string,
  patch: UpdateApplicationInput,
): Promise<Application | null> {
  const [row] = await db
    .update(applications)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();
  return row ?? null;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const rows = await db
    .delete(applications)
    .where(eq(applications.id, id))
    .returning({ id: applications.id });
  return rows.length > 0;
}
