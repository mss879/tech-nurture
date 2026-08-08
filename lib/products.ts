/* Shop catalogue — shared types and pure helpers.

   Deliberately free of any server or Supabase import, because the shop's
   client components (ProductCard, BuyPanel, CartDrawer, CheckoutClient)
   import `formatLKR` and `type Product` from here.

   The data itself lives in the database and is read through
   lib/products.server.ts, which is server-only. */

export type Variant = {
  model: string;
  /* What distinguishes this model. Water purifiers use "RO"/"UF"; an AC
     would use "1.5 Ton". Generic on purpose — the catalogue is no longer
     water-only. Stored as product_variants.option_label.

     Anything more than this — what a model is recommended for, its filter
     stages — belongs in the product description or the Technical
     Specifications table, which is where the client's brief puts it. */
  optionLabel: string;
  price: number;
  plusVat: boolean;
};

/* A Highlight: a headline and an explanation, side by side. The
   explanation is rich text (HTML) because the client's copy for these runs
   to several lines — see the "Highlights" block in Product.xlsx. */
export type Feature = { title: string; body: string };

/* One row of the Technical Specifications table. */
export type Spec = { label: string; value: string };

/* The Technical Specifications table's column headings, from the brief. */
export const SPEC_COLUMNS: [string, string] = ["Specification", "Details"];

export type Product = {
  id: string;
  slug: string;
  name: string;
  /* "Premium Countertop Hot, Cold & Normal Water Purifier" */
  subtitle: string;
  /* Display name of the brand, from the brands drop-down. */
  brand: string;
  /* The category's display name — the cards and the detail page print
     this directly. */
  category: string;
  categorySlug: string | null;
  series: string;
  blurb: string;
  tags: string[];
  /* Tag slugs — kept for grouping in the admin; the badges on a product
     card render `tags` (the display names). */
  tagSlugs: string[];
  images: string[];
  /* Long-form product description. Rich text (sanitised HTML). */
  description: string;
  /* SEO overrides; blank means "fall back to the name and short description". */
  metaTitle: string;
  metaDescription: string;
  /* Plain bullet lists. `whyChoose` renders under a heading built from the
     product name — "Why Choose AquaElite 3X?" — so the client never types
     the product name twice. */
  keyFeatures: string[];
  whyChoose: string[];
  perfectFor: string[];
  features: Feature[];
  /* [label, value] pairs, rendered as the spec table. */
  specs: [string, string][];
  variants: Variant[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Tag = { id: string; name: string; slug: string };

export function formatLKR(amount: number) {
  return `Rs ${Number(amount).toLocaleString("en-LK")}`;
}

/* A product is only orderable if it has at least one model with a price. */
export function lowestPrice(product: Product) {
  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function findVariant(product: Product, model: string) {
  return product.variants.find((v) => v.model === model);
}

/* The heading above the `whyChoose` list. The brief writes this as
   "Why Choose AquaElite 3X?" — the product name is substituted in rather
   than stored, so renaming a product renames the heading with it. */
export function whyChooseHeading(name: string) {
  return `Why Choose ${name}?`;
}
