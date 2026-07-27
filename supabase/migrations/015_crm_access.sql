-- ============================================================
-- 015 — CRM ACCESS  (admin menu: "CRM")
-- Leads get an owner, stages get an outcome, and every stage change is
-- recorded. Together these back the three rules the admin now enforces:
--
--   * a team member sees only the leads assigned to them;
--   * a lead moves FORWARD through the stages — it can be marked Won or
--     Lost at any time, and only a super admin can move it back;
--   * deleting a stage can never silently delete its leads.
--
-- Requires: 003_crm.sql, 014_admin_users.sql.
-- ============================================================

-- ---- Who owns a lead ----------------------------------------

-- on delete set null, never cascade: removing a team member must not
-- delete the customer they happened to be working with.
alter table public.crm_leads
  add column if not exists assigned_to uuid references public.admin_users (id) on delete set null,
  add column if not exists assigned_by uuid references public.admin_users (id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists updated_by  uuid references public.admin_users (id) on delete set null;

create index if not exists crm_leads_assigned_to_idx on public.crm_leads (assigned_to);

-- ---- Progress vs outcome ------------------------------------

-- "Lost" is not a later step than "Won" — it's an outcome. Without this
-- split, "forward only" would happily allow Won → Lost, would trap a
-- mis-clicked lead in Lost for ever, and would change what every existing
-- lead is allowed to do the moment someone reorders the stages.
alter table public.crm_stages
  add column if not exists kind text not null default 'active'
  check (kind in ('active','won','lost'));

update public.crm_stages set kind = 'won'  where kind = 'active' and lower(name) = 'won';
update public.crm_stages set kind = 'lost' where kind = 'active' and lower(name) = 'lost';

-- Stages are shown to users as "step 2 of 5", so positions must be dense
-- and unique. Renumber first, in case existing boards share a position.
with ordered as (
  select id,
         row_number() over (partition by pipeline_id order by position, name) - 1 as pos
  from public.crm_stages
)
update public.crm_stages s
   set position = o.pos
  from ordered o
 where o.id = s.id
   and s.position is distinct from o.pos;

-- Deferrable, so reordering can pass through transient duplicates inside
-- a single statement and only be checked at commit.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'crm_stages_pipeline_position_uniq'
  ) then
    alter table public.crm_stages
      add constraint crm_stages_pipeline_position_uniq
      unique (pipeline_id, position) deferrable initially deferred;
  end if;
end $$;

-- ---- Deleting a stage must not delete leads ------------------

-- 003 declared stage_id with ON DELETE CASCADE, so removing a stage takes
-- its leads with it. Switch to NO ACTION.
--
-- Deliberately NOT `restrict`: crm_pipelines cascades to BOTH crm_stages
-- and crm_leads, and `restrict` is checked immediately — it would fire on
-- the stage cascade before the lead cascade ran, making it impossible to
-- delete a pipeline at all. `no action` defers the check to the end of the
-- statement, so deleting a pipeline still works while a bare stage delete
-- still errors, which is exactly the protection wanted.
--
-- Postgres named the inline constraint from 003 crm_leads_stage_id_fkey
-- (same reasoning as 012's crm_leads_source_check).
alter table public.crm_leads drop constraint if exists crm_leads_stage_id_fkey;
alter table public.crm_leads
  add constraint crm_leads_stage_id_fkey
  foreign key (stage_id) references public.crm_stages (id) on delete no action;

-- ---- Stage history -------------------------------------------

-- Feeds the timeline in the lead detail popup, and records the super
-- admin's "correct a mistake" moves so a backwards step is never silent.
-- Written by the API route rather than a trigger: every write uses the
-- service-role key, so the database has no idea who the person is.
create table if not exists public.crm_lead_stage_history (
  id            uuid primary key default gen_random_uuid(),
  moved_at      timestamptz not null default now(),
  lead_id       uuid not null references public.crm_leads   (id) on delete cascade,
  from_stage_id uuid references public.crm_stages (id) on delete set null,
  to_stage_id   uuid references public.crm_stages (id) on delete set null,
  -- set null, not cascade: the audit trail outlives the person.
  moved_by      uuid references public.admin_users (id) on delete set null,
  direction     text not null default 'forward'
                check (direction in ('forward','back','outcome','reopened')),
  note          text
);

create index if not exists crm_lead_stage_history_lead_idx
  on public.crm_lead_stage_history (lead_id, moved_at desc);

-- ---- Reordering stages ---------------------------------------

-- One statement, so the deferred unique constraint sees only the final
-- arrangement. p_ids is the stage ids in their new left-to-right order.
create or replace function public.crm_reorder_stages(p_pipeline uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.crm_stages s
     set position = idx.pos
    from (
      select unnest(p_ids) as id,
             generate_subscripts(p_ids, 1) - 1 as pos
    ) idx
   where s.id = idx.id
     and s.pipeline_id = p_pipeline;
end $$;

-- SECURITY DEFINER and it rewrites an admin-only table, so it must not be
-- callable over PostgREST with the public anon key.
revoke execute on function public.crm_reorder_stages(uuid, uuid[])
  from public, anon, authenticated;

-- RLS: history is admin-only, like the rest of the CRM. No policies —
-- all access goes through the service-role key in the /admin API routes.
alter table public.crm_lead_stage_history enable row level security;
