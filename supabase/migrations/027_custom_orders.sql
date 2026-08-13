-- ============================================================
-- 027 — CUSTOM (ADMIN-CREATED) ORDERS
-- Not every order arrives through the shop checkout. Most don't: the
-- customer rings up, agrees an order on the call, and it has to be typed
-- into the dashboard afterwards. Orders now has a "New order" button for
-- exactly that, and 001's schema was written on the assumption that a
-- checkout form was the only way in.
--
-- WHAT CHANGES
--  1. `source` records HOW the order came in. Existing rows and every
--     future checkout are 'website'; the admin form writes 'phone',
--     'walk_in', 'whatsapp' or 'other', so a phone order is
--     distinguishable in the list and countable later.
--  2. `created_by` records WHO typed it, or null for a real checkout.
--  3. email and address stop being required. On a call you reliably get
--     a name and a number; an email address and a full delivery address
--     often come later, and refusing the order until then is worse than
--     recording what you have. The checkout is unaffected — it still
--     demands all four in app/api/orders/route.ts, which is where that
--     rule belongs.
--  4. order_items.product_slug stops being required, so a line that
--     isn't in the catalogue at all ("replacement filter set, Rs 4,500")
--     can be typed in by hand. A catalogue line still carries its slug.
--
-- Nothing is dropped and no existing row changes meaning, so this is
-- safe to run on a live database and safe to re-run.
--
-- RLS is untouched: the public site may still only INSERT (009), and the
-- admin writes with the service-role key, which bypasses RLS. The gate on
-- creating an order is the Orders menu permission, checked in
-- app/api/admin/orders/route.ts.
--
-- Requires: 001_orders.sql, 014_admin_users.sql.
-- ============================================================

-- ---- 1 & 2. Where the order came from, and who took it --------

alter table public.orders
  add column if not exists source     text not null default 'website',
  add column if not exists created_by uuid references public.admin_users (id) on delete set null;

-- Named and re-created rather than inlined above, so re-running this file
-- can't leave two anonymous copies of the same constraint behind.
alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders add  constraint orders_source_check
  check (source in ('website','phone','walk_in','whatsapp','other'));

comment on column public.orders.source is
  'How the order reached us. ''website'' is a real checkout; the others are typed into the admin by hand.';
comment on column public.orders.created_by is
  'The admin who created a custom order. Null for website checkouts.';

-- Custom orders are a minority of rows, so index only those — the list
-- still reads by created_at, and this keeps "show me the phone orders"
-- cheap without paying for the website rows.
create index if not exists orders_custom_idx
  on public.orders (created_at desc) where source <> 'website';

-- ---- 3. A phone order may not have an email or an address -----

alter table public.orders
  alter column email   drop not null,
  alter column address drop not null;

-- ---- 4. A line that isn't in the catalogue --------------------

alter table public.order_items
  alter column product_slug drop not null;

comment on column public.order_items.product_slug is
  'The catalogue product this line came from, or null for a hand-typed line on a custom order.';

-- ============================================================
-- After running this, /admin/orders has a "New order" button: pick
-- products from the catalogue (drafts included) or type a line in by
-- hand, set the price, and save. Existing orders are untouched and show
-- as they always did.
-- ============================================================
