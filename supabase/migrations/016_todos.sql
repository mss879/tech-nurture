-- ============================================================
-- 016 — TO-DOS & NOTIFICATIONS  (admin menu: "To-dos")
-- A to-do list with an urgency and a due date. Anyone can create their
-- own; a super admin can also create one for someone else. The bell in
-- the top bar shows what's coming due and anything newly assigned.
--
-- Two different things, deliberately stored two different ways:
--
--   * ASSIGNMENTS are events. They happen once and never change, so they
--     are rows in public.notifications, written at the moment the
--     assignment is made.
--
--   * DUE-DATE REMINDERS are not stored at all. They're derived from the
--     todos table by the todo_reminders view, so moving a due date can
--     never leave a stale "due tomorrow" behind, and completing or
--     deleting a to-do leaves nothing to clean up.
--     Dismissals are keyed on (person, to-do, due date, bucket) — which
--     means dismissing "due tomorrow" keeps it quiet only while it IS
--     tomorrow. At midnight the bucket becomes 'today', no dismissal
--     matches, and it speaks up again. That escalation is free.
--
-- No pg_cron: nothing here needs a scheduler.
--
-- Requires: 001_orders.sql (set_updated_at), 003_crm.sql,
--           014_admin_users.sql.
-- ============================================================

create table if not exists public.todos (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  title        text not null,
  description  text,
  priority     text not null default 'medium'
               check (priority in ('low','medium','high','urgent')),
  status       text not null default 'open'
               check (status in ('open','in_progress','done')),
  -- A date, not a timestamp: reminders are "due today / tomorrow", which
  -- is how people talk about them. A due_time can be added later without
  -- breaking anything.
  due_date     date,
  completed_at timestamptz,
  -- set null, never cascade: removing a team member must not delete the
  -- work itself.
  assigned_to  uuid references public.admin_users (id) on delete set null,
  created_by   uuid references public.admin_users (id) on delete set null,
  -- optional link back to the lead this is about
  lead_id      uuid references public.crm_leads (id) on delete set null
);

create index if not exists todos_assigned_idx on public.todos (assigned_to, status);
create index if not exists todos_due_idx      on public.todos (due_date) where status <> 'done';
create index if not exists todos_lead_idx     on public.todos (lead_id);

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();

-- ---- Event notifications -------------------------------------

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid not null references public.admin_users (id) on delete cascade,
  kind       text not null
             check (kind in ('todo_assigned','lead_assigned')),
  title      text not null,
  body       text,
  href       text,
  todo_id    uuid references public.todos    (id) on delete cascade,
  lead_id    uuid references public.crm_leads (id) on delete cascade,
  read_at    timestamptz
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- ---- Due-date reminders --------------------------------------

-- Dismissing a reminder records the reminder's CONTENT, not an id — so a
-- to-do whose due date is edited produces a tuple that has never been
-- dismissed, and reappears on its own.
create table if not exists public.notification_dismissals (
  user_id    uuid not null references public.admin_users (id) on delete cascade,
  todo_id    uuid not null references public.todos       (id) on delete cascade,
  due_date   date not null,   -- the due date as it was when dismissed
  bucket     text not null
             check (bucket in ('overdue','today','tomorrow')),
  created_at timestamptz not null default now(),
  primary key (user_id, todo_id, due_date, bucket)
);

-- Bucketed in Sri Lanka local time, matching the convention in 008, so
-- "today" rolls over at local midnight rather than at UTC midnight.
create or replace view public.todo_reminders as
select
  t.id          as todo_id,
  t.assigned_to as user_id,
  t.title,
  t.priority,
  t.due_date,
  case
    when t.due_date < (now() at time zone 'Asia/Colombo')::date then 'overdue'
    when t.due_date = (now() at time zone 'Asia/Colombo')::date then 'today'
    else 'tomorrow'
  end as bucket
from public.todos t
where t.assigned_to is not null
  and t.status <> 'done'
  and t.due_date is not null
  and t.due_date <= (now() at time zone 'Asia/Colombo')::date + 1;

-- Admin-only: hide it from the public API keys.
revoke all on public.todo_reminders from anon, authenticated;

-- RLS: all three tables are admin-only. No policies — access goes through
-- the service-role key used by the /admin API routes, which scope every
-- read to the signed-in person.
alter table public.todos                   enable row level security;
alter table public.notifications           enable row level security;
alter table public.notification_dismissals enable row level security;
