import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";

/* The catalogue as the "New order" form needs it: every product with its
   models and prices.

   Separate from /api/admin/products for two reasons. That route is gated
   on the Products menu, and someone who only has Orders must still be
   able to build one; and it returns the whole product record — copy, SEO,
   images, tags — which is a lot of payload for a drop-down. This is
   fetched only when the form is opened, so the orders list itself doesn't
   pay for it.

   Drafts are included and flagged. A phone order is often placed for
   something that isn't on the site yet, and refusing to offer it would
   just push the client into typing the line by hand. */

type RawVariant = {
  model: string | null;
  option_label: string | null;
  price: number | string | null;
  plus_vat: boolean | null;
  position: number | null;
};

type RawProduct = {
  slug: string;
  name: string;
  is_published: boolean | null;
  product_variants: RawVariant[] | null;
};

export async function GET() {
  const gate = await requireNav("orders");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("products")
    .select(
      `slug, name, is_published,
       product_variants ( model, option_label, price, plus_vat, position )`
    )
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    /* 017 (or 019, which renamed `filtration` to `option_label`) hasn't
       been run. The form still works — every line is then typed in by
       hand, which is what a custom order is for — so an empty catalogue
       is a better answer here than an error screen. */
    if (isMissingSchema(error) || error.code === "PGRST200") {
      return Response.json({ products: [] });
    }
    console.error("order catalogue load failed:", error);
    return Response.json(
      { error: "Could not load the product list." },
      { status: 500 }
    );
  }

  const products = (data as unknown as RawProduct[])
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      isPublished: p.is_published !== false,
      variants: [...(p.product_variants ?? [])]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((v) => ({
          model: String(v.model ?? ""),
          optionLabel: v.option_label ?? "",
          price: Number(v.price ?? 0),
          plusVat: v.plus_vat === true,
        }))
        .filter((v) => v.model),
    }))
    // A product with no models has no price to put on a line.
    .filter((p) => p.variants.length > 0);

  return Response.json({ products });
}
