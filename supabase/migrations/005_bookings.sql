-- ============================================================
-- 005 — SERVICE BOOKINGS  (admin menu: "Services Booking")
-- Online service bookings placed through the public /book page:
-- service type, district, preferred date and time slot.
-- Requires: 001_orders.sql (for the shared set_updated_at() trigger fn).
-- ============================================================

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  name           text not null,
  phone          text not null,
  email          text,
  service        text not null,   -- e.g. "Air Conditioning — Repair / Service"
  district       text not null,   -- one of Sri Lanka's 25 districts
  preferred_date date not null,
  preferred_time text not null,   -- time-slot label, e.g. "Morning · 8:30am – 12:00pm"
  address        text,
  message        text,
  status         text not null default 'new'
                 check (status in ('new','handling','completed','cancelled'))
);

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_status_idx     on public.bookings (status);
create index if not exists bookings_date_idx        on public.bookings (preferred_date);

-- keep updated_at fresh (function defined in 001_orders.sql)
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- RLS: the public site may only INSERT (place a booking).
-- Reading/updating is done by the admin dashboard via the service-role key.
alter table public.bookings enable row level security;

drop policy if exists "public can place bookings" on public.bookings;
create policy "public can place bookings"
  on public.bookings for insert
  to anon
  with check (true);
