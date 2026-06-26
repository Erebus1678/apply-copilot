import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // PGlite ships WASM; keep it external so it isn't bundled by the server build.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
