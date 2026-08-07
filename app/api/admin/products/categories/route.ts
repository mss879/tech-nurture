import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, requireCapability } from "@/lib/admin/permissions";
import { slugify } from "@/lib/admin/slug";

/* Product categories. A product belongs to one, and it is shown above the
   name on the public product page.

   Managing categories counts as editing the catalogue, so it needs
   can_edit_products rather than a permission of its own — one more
   checkbox would be more to explain, not more control. */

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
    return Response.json({ error: "A category needs a name." }, { status: 400 });
  }

  const { error } = await supabase.from("product_categories").insert({
    name,
    slug: slugify(body.slug || name),
    description: body.description?.trim() || null,
    position: Number(body.position ?? 0) || 0,
  });

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "There's already a category with that web address." },
        { status: 400 }
      );
    }
    console.error("category create failed:", error);
    return Response.json(
      { error: "Could not create the category." },
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
      return Response.json(
        { error: "A category needs a name." },
        { status: 400 }
      );
    }
    update.name = name;
  }
  if (body.slug !== undefined) update.slug = slugify(body.slug);
  if (body.description !== undefined) {
    update.description = body.description?.trim() || null;
  }
  if (body.position !== undefined) update.position = Number(body.position) || 0;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("product_categories")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("category update failed:", error);
    return Response.json(
      { error: "Could not update the category." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}

/* DELETE ?id= — products in this category keep working; their category_id
   is set to null by the foreign key, so nothing disappears from the shop. */
export async function DELETE(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("category delete failed:", error);
    return Response.json(
      { error: "Could not delete the category." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
