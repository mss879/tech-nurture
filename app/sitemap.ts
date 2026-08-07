import type { MetadataRoute } from "next";
import { posts, serviceCatalog, site } from "@/lib/site";
import { getProducts } from "@/lib/products.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${site.domain}`;
  const routes = [
    "",
    "/about",
    "/services",
    "/blog",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : path === "/services" ? 0.9 : 0.7,
  }));
  // Service pages are the primary ranking targets.
  const servicePages = serviceCatalog.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));
  const blog = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  /* Product pages are only linked from the header drop-down (there is no
     product index), so list them here or crawlers may never reach them. */
  const products = (await getProducts()).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [...routes, ...servicePages, ...blog, ...products];
}
