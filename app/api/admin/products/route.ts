import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import {
  requireNav,
  requireCapability,
  actorId,
} from "@/lib/admin/permissions";
import { slugify } from "@/lib/admin/slug";
import { isBlankHtml, sanitizeHtml } from "@/lib/rich-text";

/* The shop catalogue, from the admin side. Unlike the public reads in
   lib/products.server.ts this returns unpublished products too. */

const SELECT = `
  id, created_at, updated_at, slug, name, subtitle, series, blurb,
  description, meta_title, meta_description,
  key_features, why_choose, perfect_for,
  images, features, specs, is_published, position,
  category_id, brand_id,
  product_variants ( id, model, option_label, price, plus_vat, position ),
  product_tag_links ( tag_id )
`;

type VariantInput = {
  model?: string;
  optionLabel?: string;
  price?: number | string;
  plusVat?: boolean;
};

/* Variants carry the prices, so they're normalised and validated rather
   than trusted as free-form JSON. A model with no name is dropped. */
function toVariantRows(productId: string, input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((v: VariantInput, i) => ({
      product_id: productId,
      model: String(v?.model ?? "").trim(),
      option_label: v?.optionLabel?.trim() || null,
      price: Number(v?.price ?? 0) || 0,
      plus_vat: v?.plusVat === true,
      position: i,
    }))
    .filter((v) => v.model);
}

function toJsonList(
  input: unknown,
  keys: [string, string],
  richValue = false
) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => {
      const raw = String(x[keys[1]] ?? "");
      return {
        [keys[0]]: String(x[keys[0]] ?? "").trim(),
        // A Highlight's explanation is rich text from the admin editor;
        // sanitised here so nothing but the allow-list ever reaches the DB.
        [keys[1]]: richValue
          ? isBlankHtml(raw)
            ? ""
            : sanitizeHtml(raw)
          : raw.trim(),
      };
    })
    .filter((x) => x[keys[0]] || x[keys[1]]);
}

/* Key Features / Why Choose / Perfect For — plain one-line bullets. */
function toStringList(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

/* The copy fields shared by POST and PATCH, so the two can never drift. */
function contentColumns(body: Record<string, any>, partial: boolean) {
  const out: Record<string, unknown> = {};
  const text = (key: string, column: string) => {
    if (!partial || body[key] !== undefined) {
      out[column] = typeof body[key] === "string" && body[key].trim()
        ? body[key].trim()
        : null;
    }
  };
  text("subtitle", "subtitle");
  text("metaTitle", "meta_title");
  text("metaDescription", "meta_description");

  if (!partial || body.brandId !== undefined) out.brand_id = body.brandId || null;
  if (!partial || body.description !== undefined) {
    out.description = isBlankHtml(body.description)
      ? null
      : sanitizeHtml(body.description);
  }
  if (!partial || body.keyFeatures !== undefined) {
    out.key_features = toStringList(body.keyFeatures);
  }
  if (!partial || body.whyChoose !== undefined) {
    out.why_choose = toStringList(body.whyChoose);
  }
  if (!partial || body.perfectFor !== undefined) {
    out.perfect_for = toStringList(body.perfectFor);
  }
  return out;
}

/* Replace the child rows wholesale. Variant and tag counts are tiny, and
   order_items stores its own copy of name/model/price, so rewriting them
   can't disturb an existing order. */
async function replaceChildren(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>,
  productId: string,
  body: Record<string, unknown>
) {
  if (body.variants !== undefined) {
    await supabase.from("product_variants").delete().eq("product_id", productId);
    const rows = toVariantRows(productId, body.variants);
    if (rows.length > 0) {
      const { error } = await supabase.from("product_variants").insert(rows);
      if (error) return error;
    }
  }

  if (body.tagIds !== undefined) {
    await supabase
      .from("product_tag_links")
      .delete()
      .eq("product_id", productId);
    const ids = Array.isArray(body.tagIds) ? body.tagIds : [];
    if (ids.length > 0) {
      const { error } = await supabase
        .from("product_tag_links")
        .insert(ids.map((tag_id: string) => ({ product_id: productId, tag_id })));
      if (error) return error;
    }
  }
  return null;
}

export async function GET() {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const [productsRes, categoriesRes, tagsRes, brandsRes] = await Promise.all([
    supabase
      .from("products")
      .select(SELECT)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("product_categories")
      .select("id, name, slug, description, position")
      .order("position", { ascending: true }),
    supabase.from("product_tags").select("id, name, slug").order("name"),
    supabase
      .from("product_brands")
      .select("id, name, slug, position")
      .order("position", { ascending: true })
      .order("name"),
  ]);

  if (productsRes.error) {
    console.error("products list failed:", productsRes.error);
    return Response.json(
      { error: "Could not load products. Have you run 017_products.sql?" },
      { status: 500 }
    );
  }

  return Response.json({
    products: productsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    tags: tagsRes.data ?? [],
    // Empty until 019 has been run — the drop-down simply has no options.
    brands: brandsRes.error ? [] : brandsRes.data ?? [],
  });
}

export async function POST(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const denied = requireCapability(me, "can_create_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "A product needs a name." }, { status: 400 });
  }

  const slug = slugify(body.slug || name);
  if (!slug) {
    return Response.json(
      { error: "Could not build a web address from that name — add a slug." },
      { status: 400 }
    );
  }

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      slug,
      name,
      series: body.series?.trim() || null,
      blurb: body.blurb?.trim() || null,
      category_id: body.categoryId || null,
      images: Array.isArray(body.images) ? body.images : [],
      features: toJsonList(body.features, ["title", "body"], true),
      specs: toJsonList(body.specs, ["label", "value"]),
      ...contentColumns(body, false),
      is_published: body.isPublished === true,
      position: Number(body.position ?? 0) || 0,
      created_by: actorId(me),
      updated_by: actorId(me),
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      return Response.json(
        { error: `The web address "${slug}" is already used by another product.` },
        { status: 400 }
      );
    }
    console.error("product create failed:", error);
    return Response.json(
      { error: "Could not create the product." },
      { status: 500 }
    );
  }

  const childError = await replaceChildren(supabase, created.id, body);
  if (childError) {
    console.error("product children insert failed:", childError);
    return Response.json(
      { error: "Product saved, but its models or tags failed." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, id: created.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const denied = requireCapability(me, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_by: actorId(me) };
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return Response.json(
        { error: "A product needs a name." },
        { status: 400 }
      );
    }
    update.name = name;
  }
  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (!slug) {
      return Response.json({ error: "That web address isn't usable." }, { status: 400 });
    }
    update.slug = slug;
  }
  if (body.series !== undefined) update.series = body.series?.trim() || null;
  if (body.blurb !== undefined) update.blurb = body.blurb?.trim() || null;
  if (body.categoryId !== undefined) update.category_id = body.categoryId || null;
  if (body.images !== undefined) {
    update.images = Array.isArray(body.images) ? body.images : [];
  }
  if (body.features !== undefined) {
    update.features = toJsonList(body.features, ["title", "body"], true);
  }
  Object.assign(update, contentColumns(body, true));
  if (body.specs !== undefined) {
    update.specs = toJsonList(body.specs, ["label", "value"]);
  }
  if (body.isPublished !== undefined) {
    update.is_published = body.isPublished === true;
  }
  if (body.position !== undefined) {
    update.position = Number(body.position) || 0;
  }

  const { error } = await supabase
    .from("products")
    .update(update)
    .eq("id", body.id);

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "That web address is already used by another product." },
        { status: 400 }
      );
    }
    console.error("product update failed:", error);
    return Response.json(
      { error: "Could not update the product." },
      { status: 500 }
    );
  }

  const childError = await replaceChildren(supabase, body.id, body);
  if (childError) {
    console.error("product children update failed:", childError);
    return Response.json(
      { error: "Product saved, but its models or tags failed." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const denied = requireCapability(me, "can_delete_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  // Variants and tag links cascade. Past orders keep their own copy of the
  // name, model and price, so history survives the product being removed.
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("product delete failed:", error);
    return Response.json(
      { error: "Could not delete the product." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
