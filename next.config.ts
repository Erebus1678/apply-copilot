import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // PGlite ships WASM; keep it external so it isn't bundled by the server build.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Allow loading the dev server from the LAN (phone / another machine) — without
  // this, Next blocks client dev chunks from a non-localhost origin, so the page
  // renders but never hydrates (every button goes dead). Add your machine's LAN IP.
  allowedDevOrigins: ["192.168.1.136"],
};

export default nextConfig;
