import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, requireCapability } from "@/lib/admin/permissions";
import { slugify } from "@/lib/admin/slug";

/* Product brands. A product belongs to one, and it feeds the brand shown on
   the product page and the `brand` node in its Product JSON-LD — which used
   to be hard-coded to "Lusako".

   Same permission model as categories: managing the list counts as editing
   the catalogue, so it needs can_edit_products rather than its own flag. */

export async function POST(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "A brand needs a name." }, { status: 400 });
  }

  const { error } = await supabase.from("product_brands").insert({
    name,
    slug: slugify(body.slug || name),
    position: Number(body.position ?? 0) || 0,
  });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "There's already a brand with that web address." },
        { status: 400 }
      );
    }
    console.error("brand create failed:", error);
    return Response.json(
      { error: "Could not create the brand. Have you run 019_product_content_fields.sql?" },
      { status: 500 }
    );
  }
  return Response.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return Response.json({ error: "A brand needs a name." }, { status: 400 });
    }
    update.name = name;
  }
  if (body.slug !== undefined) update.slug = slugify(body.slug);
  if (body.position !== undefined) update.position = Number(body.position) || 0;

  const { error } = await supabase
    .from("product_brands")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("brand update failed:", error);
    return Response.json({ error: "Could not update the brand." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  /* products.brand_id is ON DELETE SET NULL, so removing a brand leaves its
     products in place without one — it never takes a product down with it. */
  const { error } = await supabase.from("product_brands").delete().eq("id", id);
  if (error) {
    console.error("brand delete failed:", error);
    return Response.json({ error: "Could not delete the brand." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
