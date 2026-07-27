-- ============================================================
-- 017 — PRODUCTS  (admin menu: "Products")
-- The shop catalogue, managed from the admin instead of hard-coded.
-- Categories and tags are created by the admin; tags are what the
-- public /shop page filters on.
--
-- A product has one category, any number of tags, and one or more
-- VARIANTS (the models a customer actually buys — each with its own
-- price). Variants are a real table rather than JSON because
-- /api/orders re-prices every basket line from them at checkout, so a
-- customer can never order at a price they made up.
--
-- Free-form display copy (features, spec sheet rows) stays as jsonb:
-- it's rendered, never queried.
--
-- Also grants the product permissions. Written to be safe whether or
-- not 014 has been run yet.
--
-- Requires: 001_orders.sql (set_updated_at), 014_admin_users.sql.
-- ============================================================

create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null,
  slug        text not null unique,
  description text,
  position    integer not null default 0
);

create table if not exists public.product_tags (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  slug       text not null unique
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  slug        text not null unique,
  name        text not null,
  series      text,
  form        text,                       -- e.g. "Floor-standing", "Countertop"
  blurb       text,
  category_id uuid references public.product_categories (id) on delete set null,
  images      text[] not null default '{}'::text[],
  pdf_url     text,
  -- [{ "title": "…", "body": "…" }]
  features    jsonb not null default '[]'::jsonb,
  -- [{ "label": "Capacity", "value": "10 L/h" }]
  specs       jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  position    integer not null default 0,
  created_by  uuid references public.admin_users (id) on delete set null,
  updated_by  uuid references public.admin_users (id) on delete set null
);

-- The models a customer chooses between. unique (product_id, model)
-- because /api/orders looks a line up by (product slug, model).
create table if not exists public.product_variants (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  product_id      uuid not null references public.products (id) on delete cascade,
  model           text not null,
  filtration      text,
  recommended_for text,
  filter_stages   text,
  price           numeric(12,2) not null default 0,
  plus_vat        boolean not null default false,
  position        integer not null default 0,
  unique (product_id, model)
);

create table if not exists public.product_tag_links (
  product_id uuid not null references public.products     (id) on delete cascade,
  tag_id     uuid not null references public.product_tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create index if not exists products_published_idx  on public.products (is_published, position);
create index if not exists products_category_idx   on public.products (category_id);
create index if not exists product_variants_idx    on public.product_variants (product_id, position);
create index if not exists product_tag_links_tag_idx on public.product_tag_links (tag_id);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists product_categories_set_updated_at on public.product_categories;
create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

-- ---- Storage: product images ---------------------------------

-- Public bucket 'products'. Uploads happen server-side via the
-- service-role key (which bypasses storage RLS); the public may only read.
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "public can read product images" on storage.objects;
create policy "public can read product images"
  on storage.objects for select
  to anon
  using (bucket_id = 'products');

-- ---- RLS -----------------------------------------------------

-- Unlike the rest of the admin tables, the catalogue is public — the
-- shop pages read it. Anon may SELECT, and only published products.
-- All writes still go through the service-role key in /api/admin/*.
alter table public.products           enable row level security;
alter table public.product_variants   enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_tags       enable row level security;
alter table public.product_tag_links  enable row level security;

drop policy if exists "public can read published products" on public.products;
create policy "public can read published products"
  on public.products for select
  to anon
  using (is_published = true);

drop policy if exists "public can read product variants" on public.product_variants;
create policy "public can read product variants"
  on public.product_variants for select
  to anon
  using (true);

drop policy if exists "public can read product categories" on public.product_categories;
create policy "public can read product categories"
  on public.product_categories for select
  to anon
  using (true);

drop policy if exists "public can read product tags" on public.product_tags;
create policy "public can read product tags"
  on public.product_tags for select
  to anon
  using (true);

drop policy if exists "public can read product tag links" on public.product_tag_links;
create policy "public can read product tag links"
  on public.product_tag_links for select
  to anon
  using (true);

-- ---- Permissions ---------------------------------------------

-- Who may add, change and remove products. Same three-way split as the
-- CRM permissions in 014.
alter table public.admin_users
  add column if not exists can_create_products boolean not null default false,
  add column if not exists can_edit_products   boolean not null default false,
  add column if not exists can_delete_products boolean not null default false;

-- Let 'products' into the menu whitelist. Written as drop-then-add so it
-- works whether 014 was run before or after this file was written.
alter table public.admin_users drop constraint if exists admin_users_nav_access_check;
alter table public.admin_users
  add constraint admin_users_nav_access_check
  check (nav_access <@ array['dashboard','todos','enquiries','chats','bookings',
                             'orders','products','crm','clients','blog','users']);

-- The owner gets the new menu and the new permissions.
update public.admin_users
   set nav_access = (
         select array(select distinct unnest(nav_access || array['products']))
       ),
       can_create_products = true,
       can_edit_products   = true,
       can_delete_products = true
 where role = 'super_admin';
