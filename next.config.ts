import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so a stray lockfile in a parent folder is never picked up.
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
};

export default nextConfig;
