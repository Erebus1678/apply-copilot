import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Schema = typeof schema;

// Reuse one client/instance across hot-reloads and serverless invocations.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  pglite?: PGlite;
  dbReady?: Promise<unknown>;
};

const connectionString = process.env.DATABASE_URL;

function makeDb(): { db: PostgresJsDatabase<Schema>; ready: Promise<unknown> } {
  if (connectionString) {
    // Server Postgres (SaaS, or a self-host that points at its own server).
    // `prepare: false` is required for Supabase's transaction pooler (port 6543).
    const client = globalForDb.pgClient ?? postgres(connectionString, { prepare: false });
    globalForDb.pgClient = client;
    return { db: drizzlePg(client, { schema }), ready: Promise.resolve() };
  }

  // OSS default: embedded Postgres (PGlite), file-backed — zero external service.
  // Migrations run once on first boot from the committed ./drizzle folder. Resolve
  // it from cwd (absolute) so it works under standalone/Docker, not just the repo root.
  const pg = globalForDb.pglite ?? new PGlite(process.env.PGLITE_PATH ?? "./data/pgdata");
  globalForDb.pglite = pg;
  const pgliteDb = drizzlePglite(pg, { schema });
  const ready =
    globalForDb.dbReady ??
    migratePglite(pgliteDb, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  // Cache the instance + migration promise globally (idempotent) so a hot-reload or
  // a re-import never spins up a second PGlite or re-runs migrations.
  globalForDb.dbReady = ready;
  // PGlite and postgres-js return slightly different drizzle types but
  // share drizzle's identical pg query API; cast unifies the type for callers.
  return { db: pgliteDb as unknown as PostgresJsDatabase<Schema>, ready };
}

const made = makeDb();

export const db = made.db;

/** Resolves once the local schema is ready (PGlite boot migration); instant for server Postgres. */
export const dbReady = made.ready;
