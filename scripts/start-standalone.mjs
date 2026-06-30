// Run the production build for self-hosting (bare metal, no Docker).
//
// `next build` uses `output: "standalone"` (see next.config.ts), so `next start`
// does NOT work — the standalone server is `.next/standalone/server.js`, and Next
// deliberately omits static assets, `public/`, and the DB migrations from it. This
// script stages them exactly like the Dockerfile's runner stage, then launches the
// server bound to 0.0.0.0 so other devices on your LAN can reach it.
//
// Usage: pnpm build && pnpm start   (override PORT / HOSTNAME / PGLITE_PATH via env)

import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const standalone = resolve(root, ".next/standalone");
const server = resolve(standalone, "server.js");

if (!existsSync(server)) {
  console.error("No standalone build found at .next/standalone/server.js.");
  console.error("Run `pnpm build` first.");
  process.exit(1);
}

// Stage the bits Next leaves out of the standalone output (mirrors Dockerfile).
cpSync(resolve(root, ".next/static"), resolve(standalone, ".next/static"), { recursive: true });
if (existsSync(resolve(root, "public"))) {
  cpSync(resolve(root, "public"), resolve(standalone, "public"), { recursive: true });
}
cpSync(resolve(root, "drizzle"), resolve(standalone, "drizzle"), { recursive: true });

const env = {
  ...process.env,
  HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
  PORT: process.env.PORT || "3000",
  // Persist the embedded DB at the repo root by default — NOT inside .next, which
  // is wiped on every rebuild. An absolute path keeps it stable regardless of cwd.
  PGLITE_PATH: process.env.PGLITE_PATH || resolve(root, "data/pgdata"),
};

const child = spawn(process.execPath, [server], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 0));
