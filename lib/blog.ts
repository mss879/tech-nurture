import { getServerSupabase } from "@/lib/supabase/server";
import { posts as staticPosts } from "@/lib/site";

/* Normalized post shape used by the public /blog pages, matching the
   fields the existing UI reads. Sourced from the database when Supabase
   is configured and has published posts, otherwise from the built-in
   posts in lib/site.ts so the public blog never renders empty. */
export type PostView = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO or yyyy-mm-dd
  readTime: string;
  category: string;
  image: string;
  body: string[];
  metaTitle?: string;
  metaDescription?: string;
};

type BlogRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  category: string | null;
  read_time: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
};

const FALLBACK_IMAGE = "/blog/ac-unit-maintenance.png";

/* Split a stored body (paragraphs separated by blank lines) into an
   array of paragraphs for the article renderer. */
export function bodyToParagraphs(body: string | null): string[] {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function toView(row: BlogRow): PostView {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    date: row.published_at ?? row.created_at,
    readTime: row.read_time ?? "",
    category: row.category ?? "News",
    image: row.cover_image || FALLBACK_IMAGE,
    body: bodyToParagraphs(row.body),
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
  };
}

// The built-in posts, in the normalized shape, as a fallback.
function fallbackPosts(): PostView[] {
  return staticPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    readTime: p.readTime,
    category: p.category,
    image: p.image,
    body: p.body,
  }));
}

/* All published posts, newest first. Falls back to the built-in posts
   when Supabase isn't configured, the table is empty, or a query fails. */
export async function getPublishedPosts(): Promise<PostView[]> {
  const supabase = getServerSupabase();
  if (!supabase) return fallbackPosts();
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return fallbackPosts();
    return (data as BlogRow[]).map(toView);
  } catch {
    return fallbackPosts();
  }
}

/* A single published post by slug, or null. Falls back to the built-in
   posts when the DB has nothing for that slug. */
export async function getPublishedPost(slug: string): Promise<PostView | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (data) return toView(data as BlogRow);
      // No published row for this slug. Only fall back to a built-in post when
      // the DB has NO published posts at all (fresh install). Once the CMS has
      // content it is the source of truth — an unpublished/deleted post 404s.
      const { count } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true);
      if ((count ?? 0) > 0) return null;
    } catch {
      // fall through to static
    }
  }
  const fallback = fallbackPosts().find((p) => p.slug === slug);
  return fallback ?? null;
}
