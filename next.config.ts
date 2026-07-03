import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows CI / verification builds to compile into a separate folder
  // without disturbing a running dev server (defaults to .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
