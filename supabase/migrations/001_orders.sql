-- ============================================================
-- 001 — ORDERS  (admin menu: "Orders")
-- Orders placed through the Shop checkout, with line items.
-- Run this first in the Supabase SQL editor (or `supabase db push`).
-- ============================================================

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  customer_name text not null,
  email         text not null,
  phone         text not null,
  address       text not null,
  city          text,
  province      text,
  notes         text,
  total         numeric(12,2) not null default 0,
  has_vat_items boolean not null default false,
  status        text not null default 'new'
                check (status in ('new','contacted','confirmed','delivered','cancelled'))
);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  model        text not null,
  filtration   text,
  unit_price   numeric(12,2) not null default 0,
  plus_vat     boolean not null default false,
  qty          integer not null default 1 check (qty > 0)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Row Level Security: the public site may only INSERT (place orders).
-- Reading/updating is done by the admin dashboard via the service-role
-- key, which bypasses RLS.
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public can place orders" on public.orders;
create policy "public can place orders"
  on public.orders for insert
  to anon
  with check (true);

drop policy if exists "public can add order items" on public.order_items;
create policy "public can add order items"
  on public.order_items for insert
  to anon
  with check (true);
