-- ============================================================
-- 006 — CLIENTS  (admin menu: "Clients")
-- A permanent contact registry. Every contact that ever reaches
-- us — through an enquiry (Contact form) or a booking — is captured
-- here automatically and kept forever, even if the originating
-- enquiry, booking or CRM lead is later deleted. Repeat contacts
-- are detected (interactions > 1) so the admin can tell when
-- "this customer has inquired before".
-- Requires: 002_enquiries.sql, 005_bookings.sql, 001_orders.sql
--           (shared set_updated_at() trigger fn).
-- ============================================================

create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),   -- first seen
  updated_at   timestamptz not null default now(),   -- last seen
  name         text not null,
  phone        text,
  email        text,
  district     text,
  province     text,
  first_source text not null default 'manual'        -- 'enquiry' | 'booking' | 'manual'
               check (first_source in ('enquiry','booking','manual')),
  last_source  text not null default 'manual'
               check (last_source in ('enquiry','booking','manual')),
  interactions integer not null default 0,
  notes        text,
  -- normalized phone key (last 9 digits) used to dedupe/return-detect
  phone_key    text
);

-- One client per phone number (when a phone is known). Email is a
-- secondary key, deduped in the capture function below.
create unique index if not exists clients_phone_key_uidx
  on public.clients (phone_key) where phone_key is not null;
create index if not exists clients_email_idx      on public.clients (lower(email));
create index if not exists clients_created_at_idx on public.clients (created_at desc);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---- helpers -------------------------------------------------

-- Normalize a phone number to a stable key: digits only, last 9.
-- Sri Lankan numbers written as 07XXXXXXXX, +947XXXXXXXX, 00947…
-- all collapse to the same 9-digit tail (7XXXXXXXX).
create or replace function public.normalize_phone(p text)
returns text language sql immutable as $$
  select case
    when p is null then null
    when length(regexp_replace(p, '\D', '', 'g')) < 7 then null
    else right(regexp_replace(p, '\D', '', 'g'), 9)
  end;
$$;

-- Stored phone key on enquiries & bookings so we can match a contact's
-- full history server-side (and detect returning customers) without
-- scanning every row in the app. normalize_phone() is immutable, so it
-- is valid in a generated column.
alter table public.enquiries
  add column if not exists phone_key text
  generated always as (public.normalize_phone(phone)) stored;
create index if not exists enquiries_phone_key_idx on public.enquiries (phone_key);

alter table public.bookings
  add column if not exists phone_key text
  generated always as (public.normalize_phone(phone)) stored;
create index if not exists bookings_phone_key_idx on public.bookings (phone_key);

-- Upsert a contact into public.clients. SECURITY DEFINER so it can
-- write to the (RLS-protected) clients table from an anon INSERT on
-- enquiries / bookings.
create or replace function public.capture_client(
  p_name text,
  p_phone text,
  p_email text,
  p_district text,
  p_province text,
  p_source text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key      text := public.normalize_phone(p_phone);
  v_existing public.clients%rowtype;
begin
  -- find an existing client by phone key first, then by email
  if v_key is not null then
    select * into v_existing from public.clients where phone_key = v_key limit 1;
  end if;
  if v_existing.id is null and p_email is not null and length(trim(p_email)) > 0 then
    select * into v_existing from public.clients
      where lower(email) = lower(trim(p_email)) limit 1;
  end if;

  if v_existing.id is not null then
    begin
      update public.clients set
        interactions = interactions + 1,
        last_source  = p_source,
        updated_at   = now(),
        -- backfill any details we didn't have before
        name      = case when coalesce(trim(name), '')     = '' then p_name     else name end,
        phone     = coalesce(phone, nullif(trim(p_phone), '')),
        phone_key = coalesce(phone_key, v_key),
        email     = coalesce(email, nullif(trim(p_email), '')),
        district  = coalesce(district, nullif(trim(p_district), '')),
        province  = coalesce(province, nullif(trim(p_province), ''))
      where id = v_existing.id;
    exception when unique_violation then
      -- The phone_key backfill collided with another client that already
      -- owns v_key. Keep counting the interaction, just skip the backfill.
      update public.clients set
        interactions = interactions + 1,
        last_source  = p_source,
        updated_at   = now(),
        name      = case when coalesce(trim(name), '')     = '' then p_name     else name end,
        email     = coalesce(email, nullif(trim(p_email), '')),
        district  = coalesce(district, nullif(trim(p_district), '')),
        province  = coalesce(province, nullif(trim(p_province), ''))
      where id = v_existing.id;
    end;
  else
    begin
      insert into public.clients
        (name, phone, email, district, province, first_source, last_source, interactions, phone_key)
      values (
        coalesce(nullif(trim(p_name), ''), 'Unknown'),
        nullif(trim(p_phone), ''),
        nullif(trim(p_email), ''),
        nullif(trim(p_district), ''),
        nullif(trim(p_province), ''),
        p_source, p_source, 1, v_key
      );
    exception when unique_violation then
      -- A concurrent insert created this client first — treat as a repeat
      -- contact instead of failing the enquiry/booking that triggered us.
      update public.clients set
        interactions = interactions + 1,
        last_source  = p_source,
        updated_at   = now(),
        email        = coalesce(email, nullif(trim(p_email), '')),
        district     = coalesce(district, nullif(trim(p_district), '')),
        province     = coalesce(province, nullif(trim(p_province), ''))
      where phone_key = v_key;
    end;
  end if;
end;
$$;

-- capture_client is SECURITY DEFINER and writes to the admin-only
-- clients table, so it must NOT be callable via PostgREST RPC with the
-- public anon key. Revoke EXECUTE from PUBLIC (which anon/authenticated
-- inherit). The triggers below still work — they run as their own
-- definer and invoke capture_client under those privileges.
revoke execute on function
  public.capture_client(text, text, text, text, text, text)
  from public, anon, authenticated;

-- ---- triggers: capture on every enquiry & booking ------------

create or replace function public.capture_client_from_enquiry()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.capture_client(
    new.name, new.phone, new.email, null, new.province, 'enquiry'
  );
  return new;
end;
$$;

create or replace function public.capture_client_from_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.capture_client(
    new.name, new.phone, new.email, new.district, null, 'booking'
  );
  return new;
end;
$$;

drop trigger if exists enquiries_capture_client on public.enquiries;
create trigger enquiries_capture_client
  after insert on public.enquiries
  for each row execute function public.capture_client_from_enquiry();

drop trigger if exists bookings_capture_client on public.bookings;
create trigger bookings_capture_client
  after insert on public.bookings
  for each row execute function public.capture_client_from_booking();

-- RLS: Clients are admin-only. No anon policies — the capture function
-- runs as SECURITY DEFINER, and all reads/writes from the admin go
-- through the service-role key.
alter table public.clients enable row level security;
