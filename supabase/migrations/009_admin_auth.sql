-- ============================================================
-- 009 — ADMIN AUTH  (protects the whole /admin dashboard)
--
-- The admin dashboard is protected by Supabase Auth. Access model
-- (as configured in the app's middleware):
--
--   * ANY authenticated Supabase user may access /admin.
--   * You create the admin login yourself in the Supabase dashboard:
--       Authentication → Users → "Add user" (email + password).
--   * IMPORTANT: disable public sign-ups so nobody can create their
--     own admin account:
--       Authentication → Providers → Email → turn OFF "Enable sign ups"
--       (or Authentication → Settings → "Allow new users to sign up").
--
-- This migration doesn't create tables — it's a safety net that
-- re-asserts Row Level Security on every admin-only table, so that
-- even if the public anon key leaks, none of this data is readable
-- without the server-only service-role key.
-- Requires: 001–008.
-- ============================================================

-- Re-assert RLS on every admin-only / sensitive table (idempotent).
alter table if exists public.orders        enable row level security;
alter table if exists public.order_items   enable row level security;
alter table if exists public.enquiries     enable row level security;
alter table if exists public.crm_pipelines enable row level security;
alter table if exists public.crm_stages    enable row level security;
alter table if exists public.crm_leads     enable row level security;
alter table if exists public.bookings      enable row level security;
alter table if exists public.clients       enable row level security;
alter table if exists public.blog_posts    enable row level security;
alter table if exists public.page_views    enable row level security;

-- Defensive cleanup: drop any accidental public-read policies on the
-- admin-only tables. (Public write policies from earlier migrations,
-- and the "read published posts" policy from 007, are intentionally
-- left in place.)
drop policy if exists "public can read clients"    on public.clients;
drop policy if exists "public can read crm_leads"  on public.crm_leads;
drop policy if exists "public can read page_views" on public.page_views;
