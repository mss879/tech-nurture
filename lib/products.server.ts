import { getServerSupabase } from "@/lib/supabase/server";
import { isMissingSchema } from "@/lib/admin/db";
import type { Category, Feature, Product, Tag, Variant } from "./products";

/* Server-only reads of the shop catalogue.

   Kept apart from lib/products.ts so the client components can import the
   types and formatLKR without dragging the Supabase server client into
   the browser bundle.

   Every function here degrades to an empty result when Supabase isn't
   configured or the tables don't exist yet, so /shop renders its
   "nothing here yet" state instead of throwing. */

const PRODUCT_SELECT = `
  id, slug, name, series, form, blurb, images, pdf_url, features, specs,
  is_published, position,
  product_categories ( id, name, slug ),
  product_variants ( model, filtration, recommended_for, filter_stages, price, plus_vat, position ),
  product_tag_links ( product_tags ( id, name, slug ) )
`;

type RawVariant = {
  model: string;
  filtration: string | null;
  recommended_for: string | null;
  filter_stages: string | null;
  price: number | string | null;
  plus_vat: boolean | null;
  position: number | null;
};

type RawRow = {
  id: string;
  slug: string;
  name: string;
  series: string | null;
  form: string | null;
  blurb: string | null;
  images: string[] | null;
  pdf_url: string | null;
  features: unknown;
  specs: unknown;
  product_categories: { id: string; name: string; slug: string } | null;
  product_variants: RawVariant[] | null;
  product_tag_links: { product_tags: Tag | null }[] | null;
};

function toFeatures(value: unknown): Feature[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => ({
      title: String(f.title ?? ""),
      body: String(f.body ?? ""),
    }))
    .filter((f) => f.title || f.body);
}

/* Stored as [{label, value}] because that's what the editor writes;
   rendered as [label, value] tuples by the spec table. */
function toSpecs(value: unknown): [string, string][] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => [String(s.label ?? ""), String(s.value ?? "")] as [string, string])
    .filter(([label]) => label);
}

function toVariants(rows: RawVariant[] | null): Variant[] {
  return [...(rows ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((v) => ({
      model: v.model,
      filtration: v.filtration ?? "",
      recommendedFor: v.recommended_for ?? "",
      filterStages: v.filter_stages ?? "",
      price: Number(v.price ?? 0),
      plusVat: v.plus_vat === true,
    }));
}

function toProduct(row: RawRow): Product {
  const tags = (row.product_tag_links ?? [])
    .map((l) => l.product_tags)
    .filter((t): t is Tag => !!t);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.product_categories?.name ?? "",
    categorySlug: row.product_categories?.slug ?? null,
    series: row.series ?? "",
    form: row.form ?? "",
    blurb: row.blurb ?? "",
    tags: tags.map((t) => t.name),
    tagSlugs: tags.map((t) => t.slug),
    images: row.images ?? [],
    pdf: row.pdf_url ?? "",
    features: toFeatures(row.features),
    specs: toSpecs(row.specs),
    variants: toVariants(row.product_variants),
  };
}

/* Published products, in the order the admin arranged them. */
export async function getProducts(): Promise<Product[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // 017 hasn't been run yet — an empty shop, not a crash.
    if (!isMissingSchema(error)) console.error("products load failed:", error);
    return [];
  }
  return (data as unknown as RawRow[]).map(toProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    if (!isMissingSchema(error)) console.error("product load failed:", error);
    return null;
  }
  return data ? toProduct(data as unknown as RawRow) : null;
}

/* Used by /api/orders to re-price a basket line from the real catalogue,
   so a customer can never order at a price they invented. */
export async function getVariant(
  slug: string,
  model: string
): Promise<{ product: Product; variant: Variant } | null> {
  const product = await getProduct(slug);
  if (!product) return null;
  const variant = product.variants.find((v) => v.model === model);
  return variant ? { product, variant } : null;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, slug, description")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (!isMissingSchema(error)) console.error("categories load failed:", error);
    return [];
  }
  return data ?? [];
}

/* Only tags that are actually on a published product — an empty filter
   chip is worse than no chip. */
export async function getTagsInUse(products: Product[]): Promise<Tag[]> {
  const seen = new Map<string, Tag>();
  for (const p of products) {
    p.tagSlugs.forEach((slug, i) => {
      if (!seen.has(slug)) {
        seen.set(slug, { id: slug, name: p.tags[i] ?? slug, slug });
      }
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
