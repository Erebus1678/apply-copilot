import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// Every non-internal IPv4 of this machine. Used only by `next dev`: without it
// Next blocks client dev chunks from a non-localhost origin, so the app loads
// over the LAN but never hydrates (dead buttons). Computed at startup so any
// self-hoster's LAN IP just works — no hardcoding. Irrelevant in production
// (`next build`/`start`), which has no such restriction.
function lanOrigins(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net?.family === "IPv4" && !net.internal)
    .map((net) => net!.address);
}

const nextConfig: NextConfig = {
  output: "standalone",
  // PGlite ships WASM; keep it external so it isn't bundled by the server build.
  serverExternalPackages: ["@electric-sql/pglite"],
  // PGlite loads its postgres.wasm / postgres.data at runtime via fs, so Next's
  // file tracer can't see them and leaves them out of the standalone bundle —
  // the embedded DB then aborts on first query (CREATE SCHEMA … RuntimeError:
  // Aborted). Force its dist assets into the trace so `node server.js` (Docker
  // and bare-metal alike) ships a working DB.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@electric-sql/pglite/dist/**"],
  },
  allowedDevOrigins: lanOrigins(),
  // Defense-in-depth headers for every response. No CSP here: the theme-boot
  // inline script in layout.tsx would need a per-request nonce, which is a SaaS
  // concern (see EDITIONS.md) — these three are safe for a same-origin local app.
  // X-Frame-Options is SAMEORIGIN (not DENY): the app self-embeds its own CV PDF
  // preview via an <object> blob (CvInput.tsx), and Chrome enforces XFO on
  // embedded PDFs too, so DENY blanked that preview. Cross-origin framing is
  // still blocked.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
