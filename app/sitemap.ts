import type { MetadataRoute } from "next";
import { serviceCatalog, site } from "@/lib/site";
import { getPublishedPosts } from "@/lib/blog";
import { getProducts } from "@/lib/products.server";

/* Without this the sitemap renders once at build time and never again, so
   posts and products added through /admin stay invisible to search engines
   until the next deploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${site.domain}`;
  const now = new Date();

  const priorities: Record<string, number> = {
    "": 1,
    "/services": 0.9,
    "/book": 0.9,
  };

  const routes = ["", "/about", "/services", "/book", "/blog", "/contact"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: now,
      priority: priorities[path] ?? 0.7,
    })
  );

  // Service pages are the primary ranking targets. Retired services
  // (`listed: false`) stay in the sitemap: the pages are still live and
  // still hold whatever search equity they accrued.
  const servicePages = serviceCatalog.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: now,
    priority: s.listed === false ? 0.4 : 0.9,
  }));

  /* Sourced from lib/blog.ts, not the static array — the live blog is
     CMS-backed, and posts written in /admin were previously never listed
     here. Falls back to the built-in posts when Supabase isn't configured. */
  const blog = (await getPublishedPosts()).map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    priority: 0.6,
  }));

  /* Product pages are only linked from the header drop-down (there is no
     product index), so list them here or crawlers may never reach them. */
  const products = (await getProducts()).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: now,
    priority: 0.8,
  }));

  return [...routes, ...servicePages, ...blog, ...products];
}
