-- ============================================================
-- 019 — PRODUCT CONTENT FIELDS
-- Brings the product record in line with the client's "Product.xlsx"
-- brief, and makes it generic instead of water-purifier specific.
--
-- WHAT CHANGES
--  1. BRAND becomes a real drop-down (product_brands), alongside the
--     existing category and tag drop-downs. The brand was previously
--     hard-coded as "Lusako" in the product page's JSON-LD.
--  2. New copy fields the brief asks for: sub-title, long description
--     (rich text), SEO meta title/description.
--  3. Three new bullet lists: Key Features, Why Choose <product>, and
--     Perfect For. Stored as jsonb string arrays — they are rendered,
--     never queried, same reasoning as `features` and `specs` in 017.
--  4. product_variants loses its water-purifier vocabulary. `filtration`
--     and `filter_stages` become `option_label` and `option_detail`, so
--     the same table can describe an AC tonnage or a dispenser capacity.
--     `recommended_for` was already generic and keeps its name.
--
-- The existing `features` (headline + explanation) and `specs`
-- (label + value) columns already match the brief's Highlights and
-- Technical Specifications sections, so they are reused as-is.
--
-- Safe to re-run. Requires: 017_products.sql.
-- ============================================================

-- ---- 1. Brands ------------------------------------------------

create table if not exists public.product_brands (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name       text not null,
  slug       text not null unique,
  position   integer not null default 0
);

drop trigger if exists product_brands_set_updated_at on public.product_brands;
create trigger product_brands_set_updated_at
  before update on public.product_brands
  for each row execute function public.set_updated_at();

alter table public.products
  add column if not exists brand_id uuid references public.product_brands (id) on delete set null;

create index if not exists products_brand_idx on public.products (brand_id);

-- The catalogue is Lusako today and the product page hard-coded that name,
-- so seed it and adopt any product that has no brand yet. New products pick
-- their own from the drop-down.
insert into public.product_brands (name, slug, position)
values ('LUSAKO', 'lusako', 0)
on conflict (slug) do nothing;

update public.products
   set brand_id = (select id from public.product_brands where slug = 'lusako')
 where brand_id is null;

-- ---- 2. Copy fields -------------------------------------------

alter table public.products
  -- "Premium Countertop Hot, Cold & Normal Water Purifier"
  add column if not exists subtitle         text,
  -- The long description. Rich text, stored as sanitised HTML.
  add column if not exists description      text,
  -- SEO overrides. When blank the page falls back to the product name
  -- and short description, which is what it does today.
  add column if not exists meta_title       text,
  add column if not exists meta_description text;

-- ---- 3. Bullet lists ------------------------------------------

-- All three are jsonb arrays of plain strings, e.g. '["Homes","Offices"]'.
alter table public.products
  add column if not exists key_features jsonb not null default '[]'::jsonb,
  add column if not exists why_choose   jsonb not null default '[]'::jsonb,
  add column if not exists perfect_for  jsonb not null default '[]'::jsonb;

-- ---- 4. Generic variant vocabulary ----------------------------

-- Renames rather than new columns, so no data is lost and nothing has to
-- be re-entered. Guarded so the migration is safe to re-run.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'product_variants'
       and column_name  = 'filtration'
  ) then
    alter table public.product_variants rename column filtration to option_label;
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'product_variants'
       and column_name  = 'filter_stages'
  ) then
    alter table public.product_variants rename column filter_stages to option_detail;
  end if;
end $$;

-- Belt and braces: if a fresh install ever creates the table without them.
alter table public.product_variants
  add column if not exists option_label  text,
  add column if not exists option_detail text;

comment on column public.product_variants.option_label is
  'What distinguishes this model — "RO", "UF", "1.5 Ton", "19L". Was `filtration`.';
comment on column public.product_variants.option_detail is
  'Supporting detail for the model — filter stages, capacity, coverage. Was `filter_stages`.';

-- ---- 5. RLS ---------------------------------------------------

-- Brands are public, exactly like categories and tags: the product pages
-- read them. All writes still go through the service-role key.
alter table public.product_brands enable row level security;

drop policy if exists "public can read product brands" on public.product_brands;
create policy "public can read product brands"
  on public.product_brands for select
  to anon
  using (true);

-- ============================================================
-- After running this, in /admin/products you can set a brand, sub-title,
-- rich-text description, SEO title/description, and the Key Features,
-- Why Choose and Perfect For lists. Existing products keep everything
-- they already had.
-- ============================================================
