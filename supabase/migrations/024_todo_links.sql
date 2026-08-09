-- ============================================================
-- 024 — LINKING A TO-DO TO THE THING IT'S ABOUT
-- "Call this person back" is only useful if you can get to the enquiry
-- from the to-do. A to-do can now point at any number of enquiries, CRM
-- leads, orders and service bookings, mixed freely.
--
-- Four real foreign keys rather than a polymorphic (type, id) pair. It
-- matches the shape public.notifications already uses in 016, Postgres
-- guarantees the record exists, and `on delete cascade` means deleting an
-- order removes the LINK and leaves the to-do — a polymorphic column
-- would quietly rot into a chip pointing at nothing. Adding a fifth kind
-- costs a migration, which is the same deliberate friction 014 chose for
-- nav_access.
--
-- Requires: 001_orders.sql, 002_enquiries.sql, 003_crm.sql,
--           005_bookings.sql, 016_todos.sql, 023_todo_participants.sql.
-- ============================================================

create table if not exists public.todo_links (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  todo_id    uuid not null references public.todos (id) on delete cascade,
  enquiry_id uuid references public.enquiries (id) on delete cascade,
  lead_id    uuid references public.crm_leads (id) on delete cascade,
  order_id   uuid references public.orders    (id) on delete cascade,
  booking_id uuid references public.bookings  (id) on delete cascade,
  constraint todo_links_one_target check (
      (enquiry_id is not null)::int
    + (lead_id    is not null)::int
    + (order_id   is not null)::int
    + (booking_id is not null)::int = 1
  )
);

create index if not exists todo_links_todo_idx on public.todo_links (todo_id);

-- Entity column first so each index does two jobs: it stops the same
-- record being linked to one to-do twice, and it answers "which to-dos
-- are about this order?" for a record's own page later on.
create unique index if not exists todo_links_enquiry_uniq
  on public.todo_links (enquiry_id, todo_id) where enquiry_id is not null;
create unique index if not exists todo_links_lead_uniq
  on public.todo_links (lead_id, todo_id)    where lead_id    is not null;
create unique index if not exists todo_links_order_uniq
  on public.todo_links (order_id, todo_id)   where order_id   is not null;
create unique index if not exists todo_links_booking_uniq
  on public.todo_links (booking_id, todo_id) where booking_id is not null;

alter table public.todo_links enable row level security;

-- ---- Fold in the old single lead pointer --------------------

-- 016 gave todos a lead_id that the POST route wrote but nothing ever
-- rendered. One way to reference a lead is enough.
-- Guarded and EXECUTEd for the same reason as the assigned_to backfill in
-- 023: once the column is gone, a second run must be a no-op rather than
-- a parse error.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'todos'
       and column_name  = 'lead_id'
  ) then
    execute $mig$
      insert into public.todo_links (todo_id, lead_id)
      select t.id, t.lead_id from public.todos t where t.lead_id is not null
      on conflict do nothing
    $mig$;

    drop index if exists public.todos_lead_idx;
    alter table public.todos drop column lead_id;
  end if;
end $$;
-- notifications.lead_id stays: "a lead was assigned to you" is a
-- different fact from "this to-do is about that lead".

-- ---- What a linked record is called -------------------------

/* Resolving the label in SQL means "what an order is called" has exactly
   one definition, instead of being formatted in TSX and drifting from
   wherever else a chip gets drawn. */
create or replace view public.todo_link_labels as
select r.todo_id, 'enquiry'::text as kind, r.enquiry_id as entity_id,
       e.name as label, e.status as sub, '/admin/enquiries'::text as href
  from public.todo_links r join public.enquiries e on e.id = r.enquiry_id
union all
select r.todo_id, 'lead', r.lead_id, l.name, null, '/admin/crm'
  from public.todo_links r join public.crm_leads l on l.id = r.lead_id
union all
-- 001 gave orders no order number, so this is what the Orders page shows
-- on screen: the customer, plus a short id to tell repeats apart.
select r.todo_id, 'order', r.order_id,
       o.customer_name || ' · #' || left(o.id::text, 8), o.status, '/admin/orders'
  from public.todo_links r join public.orders o on o.id = r.order_id
union all
select r.todo_id, 'booking', r.booking_id,
       b.name || ' · ' || b.service, b.status, '/admin/bookings'
  from public.todo_links r join public.bookings b on b.id = r.booking_id;

revoke all on public.todo_link_labels from anon, authenticated;

-- ---- todos_for now carries the links ------------------------

-- Same function as 023, with one more lateral. Redefined here rather than
-- referenced forward so each migration stands on its own and 023 can be
-- run and verified before this one exists.
create or replace function public.todos_for(
  p_viewer uuid,
  p_scope  text default 'mine'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with me as (
  select a.id, a.role, a.department_id
  from public.admin_users a
  where a.id = p_viewer and a.is_active
),
visible as (
  select t.*
  from public.todos t, me
  where me.role = 'super_admin'
     or t.created_by = me.id
     or exists (select 1
                  from public.todo_participants p
                 where p.todo_id = t.id and p.user_id = me.id)
     or (me.role = 'dept_head' and me.department_id is not null and (
           exists (select 1
                     from public.admin_users a
                    where a.id = t.created_by
                      and a.department_id = me.department_id)
        or exists (select 1
                     from public.todo_participants p
                     join public.admin_users a on a.id = p.user_id
                    where p.todo_id = t.id
                      and p.kind = 'assignee'
                      and a.department_id = me.department_id)))
),
scoped as (
  select v.*
  from visible v, me
  where case p_scope
    when 'mine' then exists (
      select 1 from public.todo_participants p
       where p.todo_id = v.id and p.user_id = me.id and p.kind = 'assignee')
    when 'mentioned' then exists (
      select 1 from public.todo_participants p
       where p.todo_id = v.id and p.user_id = me.id and p.kind = 'mention')
    when 'created' then v.created_by = me.id
    when 'department' then me.department_id is not null and (
         exists (select 1
                   from public.admin_users a
                  where a.id = v.created_by
                    and a.department_id = me.department_id)
      or exists (select 1
                   from public.todo_participants p
                   join public.admin_users a on a.id = p.user_id
                  where p.todo_id = v.id
                    and p.kind = 'assignee'
                    and a.department_id = me.department_id))
    else true   -- 'all'
  end
)
select coalesce(
  jsonb_agg(r order by r.due_date asc nulls last, r.created_at desc),
  '[]'::jsonb
)
from (
  select s.id, s.created_at, s.updated_at, s.title, s.description,
         s.priority, s.status, s.due_date, s.completed_at, s.created_by,
         coalesce(pa.assignees, '[]'::jsonb) as assignees,
         coalesce(pa.mentions,  '[]'::jsonb) as mentions,
         coalesce(lk.links,     '[]'::jsonb) as links
  from scoped s
  left join lateral (
    select jsonb_agg(p.user_id) filter (where p.kind = 'assignee') as assignees,
           jsonb_agg(p.user_id) filter (where p.kind = 'mention')  as mentions
      from public.todo_participants p
     where p.todo_id = s.id
  ) pa on true
  -- Four hash joins across the whole scoped list, not four per row.
  left join lateral (
    select jsonb_agg(jsonb_build_object(
             'kind',  l.kind,
             'id',    l.entity_id,
             'label', l.label,
             'sub',   l.sub,
             'href',  l.href
           ) order by l.kind) as links
      from public.todo_link_labels l
     where l.todo_id = s.id
  ) lk on true
) r;
$$;

revoke execute on function public.todos_for(uuid, text)
  from public, anon, authenticated;
