-- ============================================================
-- 010 — DASHBOARD  (admin menu: "Dashboard")
-- Replaces the aggregated stats view from 004 with the full set of
-- counts the new dashboard shows: enquiries, bookings, CRM, clients,
-- blog and analytics.
-- Requires: 001–008.
-- ============================================================

-- 004 created dashboard_stats with a different column order; CREATE OR REPLACE
-- VIEW can only append columns, not reorder, so drop it first and recreate.
drop view if exists public.dashboard_stats;

create view public.dashboard_stats as
select
  -- orders (from 001; kept for compatibility)
  (select count(*) from public.orders)                                as total_orders,
  (select count(*) from public.orders    where status = 'new')        as new_orders,
  (select coalesce(sum(total), 0) from public.orders
     where status not in ('cancelled'))                               as order_value,
  -- enquiries
  (select count(*) from public.enquiries)                             as total_enquiries,
  (select count(*) from public.enquiries where status = 'new')        as new_enquiries,
  -- bookings
  (select count(*) from public.bookings)                              as total_bookings,
  (select count(*) from public.bookings  where status = 'new')        as new_bookings,
  (select count(*) from public.bookings  where status = 'handling')   as handling_bookings,
  (select count(*) from public.bookings  where status = 'completed')  as completed_bookings,
  -- CRM
  (select count(*) from public.crm_pipelines)                         as pipelines,
  (select count(*) from public.crm_leads)                             as leads,
  -- clients
  (select count(*) from public.clients)                               as total_clients,
  (select count(*) from public.clients   where interactions > 1)      as returning_clients,
  -- blog
  (select count(*) from public.blog_posts)                            as total_posts,
  (select count(*) from public.blog_posts where published)            as published_posts,
  -- analytics
  (select count(*) from public.page_views)                            as total_views,
  (select count(distinct visitor_id) from public.page_views)          as unique_visitors;

-- Admin-only: hide the view from the public API keys.
revoke all on public.dashboard_stats from anon, authenticated;
