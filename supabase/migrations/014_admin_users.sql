-- ============================================================
-- 014 — ADMIN USERS & PERMISSIONS  (admin menu: "Users & Access")
-- Turns the admin from a single-owner tool into a team tool. One row per
-- person who can sign in, holding their role, which menu items they may
-- open, and what they may do to CRM leads.
--
-- This replaces the access model documented in 009 ("ANY authenticated
-- Supabase user may access /admin"). From here on the rule is:
--   no active row in this table  ⇒  no access.
-- Passwords still live in Supabase Auth; this table only holds who the
-- person is and what they're allowed to touch.
--
-- ⚠ BEFORE RUNNING — check who already has a login. Everyone who exists
--   gets a profile, but only the owner below is made a super admin;
--   anyone else drops to limited access (CRM + To-dos):
--     select id, email, created_at from auth.users order by created_at;
--   Delete any test accounts first (Authentication → Users).
--
-- Keep public sign-ups DISABLED (see 009). The admin creates users with
-- the service-role key, which is unaffected by that setting.
--
-- Requires: 001_orders.sql (shared set_updated_at() trigger fn).
-- ============================================================

create table if not exists public.admin_users (
  id               uuid primary key references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  email            text not null,
  full_name        text,
  role             text not null default 'user'
                   check (role in ('super_admin','user')),
  is_active        boolean not null default true,
  -- Menu items this person may open. Super admins ignore this list and
  -- see everything, so a bad array can never lock one out.
  -- Mirrored by NAV_KEYS in lib/admin/types.ts — widening it needs a
  -- migration on purpose, so a typo'd key fails here instead of
  -- silently denying access.
  nav_access       text[] not null default array['crm','todos']::text[]
                   check (nav_access <@ array['dashboard','todos','enquiries','chats',
                                              'bookings','orders','products','crm',
                                              'clients','blog','users']),
  -- What they may do to CRM leads. Moving a lead through the stages is
  -- part of editing; without can_edit_leads the board is read-only.
  can_create_leads boolean not null default false,
  can_edit_leads   boolean not null default false,
  can_delete_leads boolean not null default false
);

create index if not exists admin_users_email_idx  on public.admin_users (lower(email));
create index if not exists admin_users_active_idx on public.admin_users (is_active);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- RLS: profiles are admin-only. No anon policies — the /admin API routes
-- read this with the service-role key, and the browser only ever holds
-- the anon key.
alter table public.admin_users enable row level security;

-- ---- Bootstrap the owner ------------------------------------

-- No trigger on auth.users: any exception in an after-insert trigger
-- there aborts the GoTrue transaction, which would break both user
-- creation from the app and "Add user" in the Supabase dashboard. The
-- app creates the profile itself, and surfaces any auth account that
-- has no profile on the Users & Access page.

do $$
-- The owner account. If your admin login uses a different address,
-- change it on this one line before running.
declare v_super constant text := 'admin@technurture.lk';
begin
  -- Everyone who already has a login gets a profile, so nobody is
  -- orphaned. Re-running never demotes anyone.
  insert into public.admin_users (id, email, full_name, role, is_active, nav_access)
  select u.id,
         u.email,
         nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
         'user',
         true,
         array['crm','todos']::text[]
  from auth.users u
  where u.email is not null
  on conflict (id) do nothing;

  -- …and the owner is promoted to super admin, with every menu item.
  update public.admin_users
     set role       = 'super_admin',
         is_active  = true,
         nav_access = array['dashboard','todos','enquiries','chats','bookings',
                            'orders','products','crm','clients','blog',
                            'users']::text[],
         can_create_leads = true,
         can_edit_leads   = true,
         can_delete_leads = true
   where lower(email) = lower(v_super);

  -- Fail loudly rather than leaving zero super admins — otherwise the
  -- only way back in would be this SQL editor.
  if not found then
    raise exception
      'No auth user with email %. Create it first (Authentication → Users), '
      'or change v_super in this migration. Aborting so you are not locked out.',
      v_super;
  end if;
end $$;
