import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js doesn't pick up
  // a stray lockfile from the home directory.
  turbopack: {
    root: __dirname,
  },
  // Build a self-contained Node.js server into .next/standalone so the
  // production Docker image can run without needing node_modules copied.
  output: "standalone",
  // External packages that should not be bundled by Turbopack.
  serverExternalPackages: ["pg", "bcrypt"],
};

export default nextConfig;
