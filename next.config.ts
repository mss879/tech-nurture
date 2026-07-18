import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows CI / verification builds to compile into a separate folder
  // without disturbing a running dev server (defaults to .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Blog cover images uploaded through the admin live in Supabase Storage
    // (https://<project-ref>.supabase.co/storage/v1/object/public/blog/...).
    // Allow next/image to optimize them.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Baseline security headers on every route.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // The hero video is immutable — cache it hard.
        source: "/hero-particles.mp4",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
