import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows CI / verification builds to compile into a separate folder
  // without disturbing a running dev server (defaults to .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  compress: true,
  /* lucide-react ships ~6,000 icon modules behind one barrel file; without
     this every import pulls the barrel through the bundler. */
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    /* Optimized variants were being revalidated every 4 hours (the default)
       and the widest source image is 1476px, so w=3840 was returning bytes
       identical to w=1080. */
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
  /* The shop was folded into /products — the browse page is gone and each
     product is reached straight from the header menu. Keep the old URLs
     alive so links already in the wild (and Google) land in the right
     place. Order matters: /shop/checkout must be matched before /shop/:slug. */
  async redirects() {
    return [
      { source: "/shop/checkout", destination: "/checkout", permanent: true },
      { source: "/shop/:slug", destination: "/products/:slug", permanent: true },
      { source: "/shop", destination: "/products", permanent: true },
    ];
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
      {
        /* Everything else in public/ was being served `max-age=0`, so the
           logo and hero poster were refetched on every navigation. These
           filenames are NOT content-hashed, so `immutable` would be wrong —
           a day of freshness with a week of stale-while-revalidate lets a
           replaced asset roll out without a cache-busting rename. */
        source: "/:path*.(png|jpg|jpeg|webp|avif|svg|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
