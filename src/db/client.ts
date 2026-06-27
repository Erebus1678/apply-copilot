import { mkdirSync } from "node:fs";
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
  // During `next build`, route modules are imported for analysis but their
  // handlers never run. Opening the real PGlite datadir here would race a running
  // dev server (PGlite is single-process) and can corrupt it. Skip it: any actual
  // query during build throws, but dynamic routes don't query at build time.
  if (!connectionString && process.env.NEXT_PHASE === "phase-production-build") {
    const stub = new Proxy(
      {},
      {
        get() {
          throw new Error("Database is not available during build.");
        },
      },
    );
    return { db: stub as unknown as PostgresJsDatabase<Schema>, ready: Promise.resolve() };
  }

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
  // `|| ` (not `??`) so an empty/whitespace PGLITE_PATH — e.g. the `PGLITE_PATH=`
  // line shipped in .env.example — falls back to the default instead of "".
  const pglitePath = process.env.PGLITE_PATH?.trim() || "./data/pgdata";
  // PGlite mkdir's the datadir non-recursively, so it ENOENTs on a fresh checkout
  // where ./data doesn't exist yet. Create the path ourselves so zero-config
  // `pnpm dev` works without any setup step.
  mkdirSync(pglitePath, { recursive: true });
  const pg = globalForDb.pglite ?? new PGlite(pglitePath);
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
