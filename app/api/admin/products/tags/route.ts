import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, requireCapability } from "@/lib/admin/permissions";
import { slugify } from "@/lib/admin/slug";

/* Product tags — what the public /shop page filters on. A product can
   carry any number of them. */

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
    return Response.json({ error: "A tag needs a name." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("product_tags")
    .insert({ name, slug: slugify(name) })
    .select("id, name, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: `There's already a tag called "${name}".` },
        { status: 400 }
      );
    }
    console.error("tag create failed:", error);
    return Response.json({ error: "Could not create the tag." }, { status: 500 });
  }
  return Response.json({ ok: true, tag: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!body?.id || !name) {
    return Response.json({ error: "id and name are required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("product_tags")
    .update({ name, slug: slugify(name) })
    .eq("id", body.id);

  if (error) {
    console.error("tag update failed:", error);
    return Response.json({ error: "Could not rename the tag." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

/* DELETE ?id= — the links to products cascade, so the tag simply stops
   appearing on them and in the shop filters. */
export async function DELETE(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("product_tags").delete().eq("id", id);
  if (error) {
    console.error("tag delete failed:", error);
    return Response.json({ error: "Could not delete the tag." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
