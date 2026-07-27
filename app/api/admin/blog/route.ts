import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((k) => String(k).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return [];
}

/* Ensure the slug is unique, appending -2, -3, … if needed.
   `ignoreId` lets an edit keep its own slug. */
async function uniqueSlug(
  supabase: ReturnType<typeof getServerSupabase>,
  base: string,
  ignoreId?: string
): Promise<string> {
  if (!supabase) return base || "post";
  const root = base || "post";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = supabase.from("blog_posts").select("id").eq("slug", candidate);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

export async function GET() {
  const gate = await requireNav("blog");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("blog list failed:", error);
    return Response.json(
      { error: "Could not load posts. Have you run 007_blog.sql?" },
      { status: 500 }
    );
  }
  return Response.json({ posts: data });
}

export async function POST(request: Request) {
  const gate = await requireNav("blog");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.title?.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const base = slugify(body.slug?.trim() || body.title);
  const slug = await uniqueSlug(supabase, base);
  const published = Boolean(body.published);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() || null,
      body: body.body ?? null,
      cover_image: body.cover_image || null,
      category: body.category?.trim() || null,
      read_time: body.read_time?.trim() || null,
      meta_title: body.meta_title?.trim() || null,
      meta_description: body.meta_description?.trim() || null,
      keywords: toKeywords(body.keywords),
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    console.error("blog create failed:", error);
    return Response.json({ error: "Could not create post." }, { status: 500 });
  }
  return Response.json({ ok: true, id: data.id, slug: data.slug }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireNav("blog");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  // Read the current row so we can handle slug + first-publish correctly.
  const { data: current, error: readError } = await supabase
    .from("blog_posts")
    .select("published, published_at, slug")
    .eq("id", body.id)
    .single();
  if (readError || !current) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (!String(body.title).trim()) {
      return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    update.title = String(body.title).trim();
  }
  if (body.slug !== undefined) {
    const base = slugify(body.slug || (body.title ?? ""));
    if (base && base !== current.slug) {
      update.slug = await uniqueSlug(supabase, base, body.id);
    }
  }
  if (body.excerpt !== undefined) update.excerpt = body.excerpt?.trim() || null;
  if (body.body !== undefined) update.body = body.body ?? null;
  if (body.cover_image !== undefined)
    update.cover_image = body.cover_image || null;
  if (body.category !== undefined) update.category = body.category?.trim() || null;
  if (body.read_time !== undefined)
    update.read_time = body.read_time?.trim() || null;
  if (body.meta_title !== undefined)
    update.meta_title = body.meta_title?.trim() || null;
  if (body.meta_description !== undefined)
    update.meta_description = body.meta_description?.trim() || null;
  if (body.keywords !== undefined) update.keywords = toKeywords(body.keywords);

  if (body.published !== undefined) {
    const published = Boolean(body.published);
    update.published = published;
    // stamp published_at the first time it goes live
    if (published && !current.published_at) {
      update.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("blog_posts")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("blog update failed:", error);
    return Response.json({ error: "Could not update post." }, { status: 500 });
  }
  return Response.json({ ok: true, slug: update.slug ?? current.slug });
}

export async function DELETE(request: Request) {
  const gate = await requireNav("blog");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.error("blog delete failed:", error);
    return Response.json({ error: "Could not delete post." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
