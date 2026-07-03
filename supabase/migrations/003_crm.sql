-- ============================================================
-- 003 — CRM  (admin menu: "CRM")
-- Pipelines the user can add/edit/delete, each with ordered
-- stages and leads. Enquiries can be sent into a pipeline.
-- Requires: 002_enquiries.sql (leads reference enquiries).
-- ============================================================

create table if not exists public.crm_pipelines (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null
);

create table if not exists public.crm_stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  name        text not null,
  position    integer not null default 0
);

create table if not exists public.crm_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  stage_id    uuid not null references public.crm_stages (id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  source      text not null default 'manual'
              check (source in ('manual','enquiry')),
  enquiry_id  uuid references public.enquiries (id) on delete set null,
  value       numeric(12,2),
  notes       text
);

create index if not exists crm_stages_pipeline_idx on public.crm_stages (pipeline_id, position);
create index if not exists crm_leads_pipeline_idx  on public.crm_leads (pipeline_id);
create index if not exists crm_leads_stage_idx     on public.crm_leads (stage_id);

drop trigger if exists crm_leads_set_updated_at on public.crm_leads;
create trigger crm_leads_set_updated_at
  before update on public.crm_leads
  for each row execute function public.set_updated_at();

-- RLS: CRM is admin-only. No anon policies — all access goes through
-- the service-role key used by the /admin API routes.
alter table public.crm_pipelines enable row level security;
alter table public.crm_stages    enable row level security;
alter table public.crm_leads     enable row level security;
