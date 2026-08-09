-- ============================================================
-- 023 — SHARED TO-DOS: MANY ASSIGNEES, PLUS @MENTIONS
-- A to-do stops being one person's sticky note. It can now be handed to
-- several people at once, and other people can be tagged on it so they
-- can see it without it becoming their job.
--
--   assignee — on the hook. Gets the notification and the due-date nags,
--              can edit it and tick it off.
--   mention  — looped in. Gets one notification and can read it. No nags,
--              no edit, no delete. That distinction is the whole point.
--
-- This replaces todos.assigned_to, which is dropped: two sources of truth
-- for "whose to-do is this" would drift, and an unconverted read path that
-- keeps working while returning the wrong answer is worse than one that
-- fails loudly. Run this migration, then deploy.
--
-- Requires: 016_todos.sql, 022_departments.sql.
-- ============================================================

create table if not exists public.todo_participants (
  todo_id  uuid not null references public.todos (id) on delete cascade,
  -- cascade here, but todos.created_by stays `on delete set null`: the
  -- link is meaningless without the person, while the work outlives them.
  user_id  uuid not null references public.admin_users (id) on delete cascade,
  kind     text not null check (kind in ('assignee','mention')),
  added_by uuid references public.admin_users (id) on delete set null,
  added_at timestamptz not null default now(),
  -- One row per person per to-do. `kind` is an attribute, not part of the
  -- key: being an assignee already implies seeing it, so nobody is ever
  -- both, promoting a mention is one upsert rather than a delete+insert,
  -- and the reminder view below needs no `distinct`.
  primary key (todo_id, user_id)
);

-- The PK already answers "who is on this to-do" (todo_id prefix). This
-- answers the reverse — "which to-dos am I on" — which is the driving
-- filter of every scope tab, with or without the kind predicate.
create index if not exists todo_participants_user_idx
  on public.todo_participants (user_id, kind, todo_id);

alter table public.todo_participants enable row level security;

-- ---- Move the single assignee across, then retire the column ----

-- The 016 view selects todos.assigned_to, so Postgres refuses to drop the
-- column while the view exists. Nothing is lost by dropping it: every row
-- it produces is derived, and it is rebuilt below.
drop view if exists public.todo_reminders;

-- Guarded so the file stays re-runnable: on a second run the column is
-- already gone, and a bare `select t.assigned_to` would fail to parse
-- rather than quietly finding nothing to move. EXECUTE keeps the
-- reference out of the planner until the branch is actually taken.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'todos'
       and column_name  = 'assigned_to'
  ) then
    execute $mig$
      insert into public.todo_participants (todo_id, user_id, kind, added_by)
      select t.id, t.assigned_to, 'assignee', t.created_by
        from public.todos t
       where t.assigned_to is not null
      on conflict do nothing
    $mig$;

    drop index if exists public.todos_assigned_idx;
    alter table public.todos drop column assigned_to;
  end if;
end $$;

-- "Created by me" was a scope tab with no index behind it. It is now one
-- of three tabs everybody sees, so it gets one.
create index if not exists todos_created_by_idx on public.todos (created_by);

-- ---- Reminders fan out, one row per assignee ----------------

-- 016 selected `t.assigned_to as user_id`; with several assignees each of
-- them needs their own row or only one person would ever be nagged.
-- Column names are unchanged on purpose: lib/admin/inbox.ts filters this
-- by user_id, and notification_dismissals keys off (user_id, todo_id,
-- due_date, bucket) — both keep working untouched, including 016's nice
-- property that moving a due date resurfaces a dismissed reminder.
create view public.todo_reminders as
select
  t.id      as todo_id,
  p.user_id as user_id,
  t.title,
  t.priority,
  t.due_date,
  case
    when t.due_date < (now() at time zone 'Asia/Colombo')::date then 'overdue'
    when t.due_date = (now() at time zone 'Asia/Colombo')::date then 'today'
    else 'tomorrow'
  end as bucket
from public.todos t
-- Assignees only. A mention is "so you know" — it never becomes a nag.
join public.todo_participants p
  on p.todo_id = t.id
 and p.kind    = 'assignee'
where t.status <> 'done'
  and t.due_date is not null
  and t.due_date <= (now() at time zone 'Asia/Colombo')::date + 1;

revoke all on public.todo_reminders from anon, authenticated;

-- ---- A mention is a new kind of notification ----------------

-- 016 wrote the check inline, so Postgres named it notifications_kind_check.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('todo_assigned','todo_mentioned','lead_assigned'));

-- ============================================================
-- Who may see what.
--
-- These three functions are the single definition of to-do visibility.
-- Writing it once in SQL is deliberate: the classic failure here is a
-- list query and a permission check that disagree, so you can see a row
-- on screen and get a 403 the moment you touch it.
--
-- security definer + revoke, matching crm_reorder_stages in 015. The
-- admin API reaches these with the service-role key today; if the app
-- ever moves off it, these functions become the policy rather than
-- needing the same rule written a second time.
-- ============================================================

/* Every to-do p_viewer may see, narrowed by one scope tab, as a JSON
   array. One round trip instead of a scope query plus a participants
   query plus a merge — and the sort order lives here rather than being
   re-implemented in TypeScript and drifting. */
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
-- What this person may see AT ALL. One EXISTS per rule so each can use
-- its own index, OR'd in the WHERE rather than UNIONed, so a to-do you
-- both created and are assigned to needs no DISTINCT.
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
-- The tab NARROWS `visible` and can never widen it: even 'all' flows
-- through it, so a head's "all" is their department and a member's is
-- their own work. No tab can leak, however it is called.
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
         coalesce(pa.mentions,  '[]'::jsonb) as mentions
  from scoped s
  left join lateral (
    select jsonb_agg(p.user_id) filter (where p.kind = 'assignee') as assignees,
           jsonb_agg(p.user_id) filter (where p.kind = 'mention')  as mentions
      from public.todo_participants p
     where p.todo_id = s.id
  ) pa on true
) r;
$$;

revoke execute on function public.todos_for(uuid, text)
  from public, anon, authenticated;

/* The same rule for one row, so PATCH and DELETE can't be more or less
   generous than the list. Returns no rows at all when the to-do or the
   viewer doesn't exist — callers must read that as "denied". */
create or replace function public.todo_access(p_todo uuid, p_viewer uuid)
returns table (can_see boolean, can_edit boolean, can_delete boolean)
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
t as (select * from public.todos where id = p_todo),
facts as (
  select
    me.role = 'super_admin' as is_super,
    -- created_by is nullable, and null is not false.
    coalesce(t.created_by = me.id, false) as is_creator,
    exists (select 1 from public.todo_participants p
             where p.todo_id = t.id and p.user_id = me.id
               and p.kind = 'assignee') as is_assignee,
    exists (select 1 from public.todo_participants p
             where p.todo_id = t.id and p.user_id = me.id) as is_participant,
    (me.role = 'dept_head' and me.department_id is not null and (
       exists (select 1 from public.admin_users a
                where a.id = t.created_by
                  and a.department_id = me.department_id)
    or exists (select 1 from public.todo_participants p
                 join public.admin_users a on a.id = p.user_id
                where p.todo_id = t.id and p.kind = 'assignee'
                  and a.department_id = me.department_id))) as is_head_over
  from t, me
)
select
  -- Seeing it: being mentioned is enough.
  (is_super or is_creator or is_participant or is_head_over),
  -- Editing and ticking it off: assignees, not mentions.
  (is_super or is_creator or is_assignee or is_head_over),
  -- Deleting: NOT a co-assignee. With one assignee, assignee meant owner
  -- and 016 was right to allow it. With four, one of them should not be
  -- able to bin shared work out from under the other three — they can
  -- still mark it done.
  (is_super or is_creator or is_head_over)
from facts;
$$;

revoke execute on function public.todo_access(uuid, uuid)
  from public, anon, authenticated;

/* Hand one person's assignments to another when their account is deleted.

   A plain `update … set user_id = p_to` throws 23505 the moment the
   successor is already on one of those to-dos, so the three cases are
   handled explicitly — and in one transaction, which is why this is a
   function rather than three round trips from the route. */
create or replace function public.todos_reassign_assignee(
  p_from uuid,
  p_to   uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_moved integer;
begin
  -- 1. The successor is already a MENTION there. Promote them, so the
  --    merge never quietly loses an assignment.
  update public.todo_participants p
     set kind = 'assignee'
   where p.user_id = p_to
     and p.kind    = 'mention'
     and exists (select 1 from public.todo_participants q
                  where q.todo_id = p.todo_id
                    and q.user_id = p_from
                    and q.kind    = 'assignee');

  -- 2. The successor isn't on the to-do at all. Move the row across.
  update public.todo_participants p
     set user_id = p_to
   where p.user_id = p_from
     and p.kind    = 'assignee'
     and not exists (select 1 from public.todo_participants q
                      where q.todo_id = p.todo_id and q.user_id = p_to);
  get diagnostics v_moved = row_count;

  -- 3. Anything left duplicates an assignment the successor already has.
  --    Mentions are not workload and are never moved — the FK cascade
  --    drops them with the account, which is the right outcome.
  delete from public.todo_participants
   where user_id = p_from and kind = 'assignee';

  return v_moved;
end $$;

revoke execute on function public.todos_reassign_assignee(uuid, uuid)
  from public, anon, authenticated;
