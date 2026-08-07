/* Shop catalogue — shared types and pure helpers.

   Deliberately free of any server or Supabase import, because the shop's
   client components (ProductCard, BuyPanel, CartDrawer, CheckoutClient)
   import `formatLKR` and `type Product` from here.

   The data itself lives in the database and is read through
   lib/products.server.ts, which is server-only. */

export type Variant = {
  model: string;
  filtration: string;
  recommendedFor: string;
  filterStages: string;
  price: number;
  plusVat: boolean;
};

export type Feature = { title: string; body: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  /* The category's display name — the cards and the detail page print
     this directly. */
  category: string;
  categorySlug: string | null;
  series: string;
  form: string;
  blurb: string;
  tags: string[];
  /* Tag slugs — kept for grouping in the admin; the badges on a product
     card render `tags` (the display names). */
  tagSlugs: string[];
  images: string[];
  pdf: string;
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
