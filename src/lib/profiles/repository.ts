import { asc, eq, sql } from "drizzle-orm";
import { db, dbReady } from "@/db/client";
import { profiles, type Profile } from "@/db/schema";
import type { CreateProfileInput } from "./schemas";

export async function listProfiles(): Promise<Profile[]> {
  await dbReady;
  return db.select().from(profiles).orderBy(asc(profiles.createdAt));
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  await dbReady;
  const [row] = await db.insert(profiles).values(input).returning();
  return row;
}

export async function renameProfile(id: string, name: string): Promise<Profile | null> {
  await dbReady;
  const [row] = await db.update(profiles).set({ name }).where(eq(profiles.id, id)).returning();
  return row ?? null;
}

/**
 * Guarantee at least one profile exists (first run), returning the full list.
 * A transaction-scoped advisory lock serializes concurrent first-boot requests so
 * they can't each insert a default (matters for server Postgres; PGlite is already
 * single-instance serial).
 */
export async function ensureDefaultProfile(): Promise<Profile[]> {
  await dbReady;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(733100)`);
    const existing = await tx.select().from(profiles).orderBy(asc(profiles.createdAt));
    if (existing.length > 0) return existing;
    const [created] = await tx.insert(profiles).values({ name: "Personal" }).returning();
    return [created];
  });
}
