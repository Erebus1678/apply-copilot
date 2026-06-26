import { desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/db/client";
import { applications, type Application } from "@/db/schema";
import type { CreateApplicationInput, UpdateApplicationInput } from "./schemas";

export async function listApplications(profileId?: string): Promise<Application[]> {
  await dbReady;
  const base = db.select().from(applications).$dynamic();
  if (profileId) base.where(eq(applications.profileId, profileId));
  return base.orderBy(desc(applications.createdAt));
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  await dbReady;
  const [row] = await db.insert(applications).values(input).returning();
  return row;
}

export async function createManyApplications(
  inputs: CreateApplicationInput[],
): Promise<Application[]> {
  await dbReady;
  if (inputs.length === 0) return [];
  return db.insert(applications).values(inputs).returning();
}

export async function updateApplication(
  id: string,
  patch: UpdateApplicationInput,
): Promise<Application | null> {
  await dbReady;
  const [row] = await db
    .update(applications)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();
  return row ?? null;
}

export async function deleteApplication(id: string): Promise<boolean> {
  await dbReady;
  const rows = await db
    .delete(applications)
    .where(eq(applications.id, id))
    .returning({ id: applications.id });
  return rows.length > 0;
}
