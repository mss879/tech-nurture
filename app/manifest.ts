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
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
