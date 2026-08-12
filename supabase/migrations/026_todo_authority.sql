-- ============================================================
-- 026 — WHO OWNS A TO-DO'S TERMS
-- 023 gave a to-do several assignees and split "can see" from "can edit".
-- It left one hole: an assignee got the SAME edit right as the person who
-- set the work. So a member handed "Service the Kandy unit, due Friday"
-- by the super admin could open it and move Friday to next month, and the
-- super admin would never know. That makes handing work out meaningless.
--
-- The rule from here on is ownership of the TERMS:
--
--   see      — creator, anyone on it (assignee or mention), their head,
--              the super admin. Unchanged.
--   progress — move it along: open → in progress → done, and back.
--              Assignees, plus anyone who can manage it. This is the
--              assignee's actual job and stays wide open.
--   manage   — change what the work IS: title, details, priority, THE DUE
--              DATE, who's on it, what it's about. Whoever created it,
--              their head, the super admin. NOT a plain assignee.
--   delete   — same set as manage.
--
-- Second hole, same root cause: is_head_over in 023 fires when a to-do
-- merely has an ASSIGNEE in the head's department. The super admin
-- assigning a job into Sales therefore handed the Sales head edit AND
-- delete on the super admin's own to-do. A head's authority now stops at
-- work set by someone who outranks them: they may manage what their
-- members created, never what a super admin or another head set.
--
-- Nothing is taken from anyone over their OWN work — created_by still
-- grants full control, so a member's private to-do behaves exactly as
-- before.
--
-- todo_access changes shape (can_edit becomes can_manage + can_progress),
-- so app/api/admin/todos/route.ts must ship with this. Run the migration,
-- then deploy — the route reads the old name and would fail closed, which
-- is the safe direction but not one to sit in.
--
-- Requires: 016_todos.sql, 022_departments.sql, 023_todo_participants.sql,
--           024_todo_links.sql.
-- ============================================================

-- ---- One row: may I see / progress / manage / delete this? ----

-- The OUT columns change, which create-or-replace cannot do.
drop function if exists public.todo_access(uuid, uuid);

create function public.todo_access(p_todo uuid, p_viewer uuid)
returns table (
  can_see      boolean,
  can_progress boolean,
  can_manage   boolean,
  can_delete   boolean
)
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
-- The rank of whoever set the work. Null when their account is gone —
-- todos.created_by is `on delete set null` (016), which outlives them on
-- purpose.
author as (
  select (select a.role from public.admin_users a, t where a.id = t.created_by)
         as role
),
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
    /* How far a head's department REACHES. Identical to 023's is_head_over
       and to the department branch of todos_for's visible CTE — the three
       have to agree or a row appears in the list and 404s when touched.
       Reach alone no longer decides what may be DONE; see below. */
    (me.role = 'dept_head'
     and me.department_id is not null
     and (
       exists (select 1 from public.admin_users a
                where a.id = t.created_by
                  and a.department_id = me.department_id)
    or exists (select 1 from public.todo_participants p
                 join public.admin_users a on a.id = p.user_id
                where p.todo_id = t.id and p.kind = 'assignee'
                  and a.department_id = me.department_id))) as is_head_scope,
    /* …and where it STOPS. A head may rewrite what their members set, and
       nothing else: not a super admin's, not another head's (their own is
       is_creator above), and not an ownerless one — a null author reads as
       false here, so deleting the account of whoever set the work cannot
       quietly demote it to a member's and hand a head the deadline. The
       super admin can still clear those up. */
    coalesce(author.role = 'user', false) as author_is_member
  from t, me, author
)
select
  -- Seeing it: being mentioned is enough, and a head still sees everything
  -- landing on their team — including work the super admin sent them.
  (is_super or is_creator or is_participant or is_head_scope),
  -- Moving it along: the assignee's job, and the reason they were told.
  -- A head may tick off their team's work; it is reversible and visible.
  (is_super or is_creator or is_head_scope or is_assignee),
  -- Changing what the work IS, the due date included: only whoever set it.
  -- An assignee is deliberately absent — that is this migration.
  (is_super or is_creator or (is_head_scope and author_is_member)),
  -- Deleting: the same authority as managing. Being one of four assignees
  -- has never allowed it, and now neither does being one of one.
  (is_super or is_creator or (is_head_scope and author_is_member))
from facts;
$$;

revoke execute on function public.todo_access(uuid, uuid)
  from public, anon, authenticated;

-- ---- The list carries the same answer, per row ----------------

-- 023's comment warned about the classic failure here: a list query and a
-- permission check that disagree, so a button appears and then 403s. The
-- surest fix is to stop having two definitions — todos_for now CALLS
-- todo_access per row instead of restating the rule, so the buttons the
-- browser draws are the server's own answer and cannot drift from it.
--
-- Visibility below is still spelled out inline: it is a WHERE clause over
-- the whole table and has to stay a set operation, whereas the four flags
-- are per-row and cheap. The two are kept honest by can_see, which the
-- lateral recomputes for every row the visible CTE let through.
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
     -- Seeing a department's work is unchanged: a head still sees what
     -- the super admin sent their team. Only what they may DO with it
     -- narrowed, and that lives in todo_access.
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
         coalesce(lk.links,     '[]'::jsonb) as links,
         -- No rows back from the lateral would mean the viewer vanished
         -- mid-query; false is the right reading of that.
         coalesce(ac.can_progress, false) as can_progress,
         coalesce(ac.can_manage,   false) as can_manage,
         coalesce(ac.can_delete,   false) as can_delete,
         -- Who set the work, so the browser can say "Priya set this" next
         -- to a row somebody can't change, instead of just hiding the
         -- pencil and leaving them to wonder.
         cb.full_name as created_by_name,
         cb.role      as created_by_role
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
  left join lateral (
    select * from public.todo_access(s.id, p_viewer)
  ) ac on true
  left join public.admin_users cb on cb.id = s.created_by
) r;
$$;

revoke execute on function public.todos_for(uuid, text)
  from public, anon, authenticated;
