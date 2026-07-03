-- ============================================================
-- 004 — DASHBOARD  (admin menu: "Dashboard")
-- Aggregated stats view used by the admin overview page.
-- Requires: 001_orders.sql, 002_enquiries.sql, 003_crm.sql.
-- ============================================================

create or replace view public.dashboard_stats as
select
  (select count(*) from public.orders)                             as total_orders,
  (select count(*) from public.orders    where status = 'new')     as new_orders,
  (select coalesce(sum(total), 0) from public.orders
     where status not in ('cancelled'))                            as order_value,
  (select count(*) from public.enquiries)                          as total_enquiries,
  (select count(*) from public.enquiries where status = 'new')     as new_enquiries,
  (select count(*) from public.crm_pipelines)                      as pipelines,
  (select count(*) from public.crm_leads)                          as leads;

-- Admin-only: hide the view from the public API keys.
revoke all on public.dashboard_stats from anon, authenticated;
