import { getServerSupabase } from "@/lib/supabase/server";
import { isMissingSchema } from "@/lib/admin/db";
import type { Category, Feature, Product, Tag, Variant } from "./products";
import { sanitizeHtml } from "./rich-text";

/* Server-only reads of the shop catalogue.

   Kept apart from lib/products.ts so the client components can import the
   types and formatLKR without dragging the Supabase server client into
   the browser bundle.

   Every function here degrades to an empty result when Supabase isn't
   configured or the tables don't exist yet, so the header's Products menu
   simply comes up empty instead of throwing. */

const PRODUCT_SELECT = `
  id, slug, name, subtitle, series, blurb, description,
  meta_title, meta_description, key_features, why_choose, perfect_for,
  images, features, specs, is_published, position,
  product_categories ( id, name, slug ),
  product_brands ( id, name, slug ),
  product_variants ( model, option_label, price, plus_vat, position ),
  product_tag_links ( product_tags ( id, name, slug ) )
`;

/* The column set as it existed before 019_product_content_fields.sql.

   The shop must not go dark in the window between deploying this code and
   running that migration, so every read tries the full set first and falls
   back to this one when Postgres says a column doesn't exist. Products then
   render exactly as they did before, just without the new fields. */
const LEGACY_PRODUCT_SELECT = `
  id, slug, name, series, blurb,
  images, features, specs, is_published, position,
  product_categories ( id, name, slug ),
  product_variants ( model, filtration, price, plus_vat, position ),
  product_tag_links ( product_tags ( id, name, slug ) )
`;

/* True when the failure is "this migration hasn't been run yet".

   Wider than the shared isMissingSchema: asking for the product_brands
   relationship before 019 exists fails with PGRST200 ("could not find a
   relationship"), not with a missing-column code. Kept local rather than
   added to lib/admin/db.ts, because that helper also gates the admin
   permission fallback and widening it there could change who gets let in. */
function isPreMigration(error: { code?: string } | null | undefined) {
  return isMissingSchema(error) || error?.code === "PGRST200";
}

/* Normalises a pre-019 row into the shape toProduct expects. */
function fromLegacy(row: Record<string, unknown>): RawRow {
  const variants = (row.product_variants as Record<string, unknown>[] | null) ?? [];
  return {
    ...(row as unknown as RawRow),
    subtitle: null,
    description: null,
    meta_title: null,
    meta_description: null,
    key_features: [],
    why_choose: [],
    perfect_for: [],
    product_brands: null,
    product_variants: variants.map((v) => ({
      model: String(v.model ?? ""),
      option_label: (v.filtration as string | null) ?? null,
      price: v.price as number | string | null,
      plus_vat: v.plus_vat as boolean | null,
      position: v.position as number | null,
    })),
  };
}

type RawVariant = {
  model: string;
  option_label: string | null;
  price: number | string | null;
  plus_vat: boolean | null;
  position: number | null;
};

type RawRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  key_features: unknown;
  why_choose: unknown;
  perfect_for: unknown;
  product_brands: { id: string; name: string; slug: string } | null;
  series: string | null;
  blurb: string | null;
  images: string[] | null;
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
      // A Highlight's explanation is rich text; sanitised again on the way
      // out so an older row written before 019 can't render raw markup.
      body: sanitizeHtml(String(f.body ?? "")),
    }))
    .filter((f) => f.title || f.body);
}

/* The plain bullet lists — Key Features, Why Choose, Perfect For. Stored as
   a jsonb array of strings; tolerant of nulls and stray objects. */
function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v : String((v as { text?: string })?.text ?? "")))
    .map((v) => v.trim())
    .filter(Boolean);
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
      optionLabel: v.option_label ?? "",
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
    subtitle: row.subtitle ?? "",
    brand: row.product_brands?.name ?? "",
    category: row.product_categories?.name ?? "",
    categorySlug: row.product_categories?.slug ?? null,
    series: row.series ?? "",
    blurb: row.blurb ?? "",
    tags: tags.map((t) => t.name),
    tagSlugs: tags.map((t) => t.slug),
    images: row.images ?? [],
    description: sanitizeHtml(row.description),
    metaTitle: row.meta_title ?? "",
    metaDescription: row.meta_description ?? "",
    keyFeatures: toStringList(row.key_features),
    whyChoose: toStringList(row.why_choose),
    perfectFor: toStringList(row.perfect_for),
    features: toFeatures(row.features),
    specs: toSpecs(row.specs),
    variants: toVariants(row.product_variants),
  };
}

/* Published products, in the order the admin arranged them. */
export async function getProducts(): Promise<Product[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];

  const query = (select: string) =>
    supabase
      .from("products")
      .select(select)
      .eq("is_published", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

  const { data, error } = await query(PRODUCT_SELECT);
  if (!error) return (data as unknown as RawRow[]).map(toProduct);

  if (isPreMigration(error)) {
    // Either 019 hasn't been run (retry without its columns) or 017 hasn't
    // either (the retry fails too, and the shop is simply empty).
    const legacy = await query(LEGACY_PRODUCT_SELECT);
    if (!legacy.error) {
      return (legacy.data as unknown as Record<string, unknown>[])
        .map(fromLegacy)
        .map(toProduct);
    }
    return [];
  }

  console.error("products load failed:", error);
  return [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const query = (select: string) =>
    supabase
      .from("products")
      .select(select)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

  const { data, error } = await query(PRODUCT_SELECT);
  if (!error) return data ? toProduct(data as unknown as RawRow) : null;

  if (isPreMigration(error)) {
    const legacy = await query(LEGACY_PRODUCT_SELECT);
    if (!legacy.error) {
      return legacy.data
        ? toProduct(fromLegacy(legacy.data as unknown as Record<string, unknown>))
        : null;
    }
    return null;
  }

  console.error("product load failed:", error);
  return null;
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

/* Only tags that are actually on a published product. */
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
