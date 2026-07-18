-- ============================================================
-- 007 — BLOG  (admin menu: "Blog")
-- Blog posts managed from the admin, rendered on /blog and
-- /blog/[slug]. Includes SEO metadata (slug, meta title/description,
-- keywords) and a cover image stored in Supabase Storage.
-- Requires: 001_orders.sql (shared set_updated_at() trigger fn).
-- ============================================================

create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  slug             text not null unique,
  title            text not null,
  excerpt          text,
  body             text,                       -- paragraphs separated by blank lines
  cover_image      text,                       -- public URL in the 'blog' storage bucket
  category         text,
  author           text not null default 'TechNurture',
  read_time        text,                       -- e.g. "4 min read"
  meta_title       text,
  meta_description text,
  keywords         text[] not null default '{}',
  published        boolean not null default false,
  published_at     timestamptz
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc);
create index if not exists blog_posts_created_at_idx
  on public.blog_posts (created_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- RLS: the public site (anon key) may read ONLY published posts.
-- The admin creates/edits/deletes via the service-role key (bypasses RLS).
alter table public.blog_posts enable row level security;

drop policy if exists "public can read published posts" on public.blog_posts;
create policy "public can read published posts"
  on public.blog_posts for select
  to anon
  using (published = true);

-- ---- Storage: cover images -----------------------------------
-- Public bucket 'blog'. Uploads happen server-side via the service-role
-- key (which bypasses storage RLS); the public may only read.
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

drop policy if exists "public can read blog images" on storage.objects;
create policy "public can read blog images"
  on storage.objects for select
  to anon
  using (bucket_id = 'blog');
