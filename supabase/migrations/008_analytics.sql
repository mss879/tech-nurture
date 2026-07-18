-- ============================================================
-- 008 — ANALYTICS  (admin menu: "Dashboard" → analytics panel)
-- Lightweight, privacy-friendly page-view tracking for the public
-- site: unique visitors, where they are (from hosting geo headers)
-- and what time of day they visit. No third-party trackers.
-- ============================================================

create table if not exists public.page_views (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id text not null,            -- anonymous id from localStorage (unique-visitor key)
  session_id text,                     -- anonymous id from sessionStorage
  path       text not null,
  referrer   text,
  country    text,                     -- from hosting geo headers (e.g. "LK")
  region     text,                     -- province / state
  city       text,
  device     text,                     -- 'mobile' | 'tablet' | 'desktop'
  user_agent text
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_visitor_idx    on public.page_views (visitor_id);
create index if not exists page_views_path_idx        on public.page_views (path);

-- RLS: the public site may only INSERT a view. Reporting is admin-only
-- (service-role key), and the views below are revoked from the public keys.
alter table public.page_views enable row level security;

drop policy if exists "public can record views" on public.page_views;
create policy "public can record views"
  on public.page_views for insert
  to anon
  with check (true);

-- ---- Reporting views (admin-only) ----------------------------

create or replace view public.analytics_overview as
select
  count(*)                                                             as total_views,
  count(distinct visitor_id)                                          as unique_visitors,
  count(*) filter (where created_at > now() - interval '7 days')      as views_7d,
  count(distinct visitor_id)
    filter (where created_at > now() - interval '7 days')             as unique_7d,
  count(*) filter (where created_at > now() - interval '1 day')       as views_24h
from public.page_views;

create or replace view public.analytics_by_region as
select
  coalesce(nullif(trim(region), ''), 'Unknown') as region,
  count(*)                    as views,
  count(distinct visitor_id)  as unique_visitors
from public.page_views
group by 1
order by views desc;

create or replace view public.analytics_by_city as
select
  coalesce(nullif(trim(city), ''), 'Unknown') as city,
  count(*)                    as views,
  count(distinct visitor_id)  as unique_visitors
from public.page_views
group by 1
order by views desc;

-- Views bucketed by hour of day (0–23), in Sri Lanka local time
-- (Supabase stores timestamptz in UTC; convert so the chart reads as
-- local time-of-day regardless of the DB session timezone).
create or replace view public.analytics_by_hour as
select
  extract(hour from (created_at at time zone 'Asia/Colombo'))::int as hour,
  count(*)                                                          as views
from public.page_views
group by 1
order by 1;

create or replace view public.analytics_by_day as
select
  date_trunc('day', (created_at at time zone 'Asia/Colombo'))::date as day,
  count(*)                                                          as views,
  count(distinct visitor_id)                                       as unique_visitors
from public.page_views
where created_at > now() - interval '30 days'
group by 1
order by 1;

create or replace view public.analytics_top_paths as
select
  path,
  count(*)                   as views,
  count(distinct visitor_id) as unique_visitors
from public.page_views
group by 1
order by views desc;

-- Hide all reporting from the public API keys.
revoke all on public.analytics_overview  from anon, authenticated;
revoke all on public.analytics_by_region from anon, authenticated;
revoke all on public.analytics_by_city   from anon, authenticated;
revoke all on public.analytics_by_hour   from anon, authenticated;
revoke all on public.analytics_by_day    from anon, authenticated;
revoke all on public.analytics_top_paths from anon, authenticated;
