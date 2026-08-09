import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Appliance Repair & Maintenance`,
    short_name: site.name,
    description:
      "Fast, reliable repair, servicing and maintenance for air conditioners, refrigerators, inline water purifiers and bottle water dispensers across Sri Lanka.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f4f0",
    theme_color: "#052f43",
    icons: [
      // Scalable first — an installed app can render it at any density
      // without a resample. Not marked "maskable": the hexagon runs to the
      // edges, so a circular mask would clip its corners off.
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
    ],
  };
}
