-- ============================================================
-- 022 — DEPARTMENTS & DEPARTMENT HEADS  (admin menu: "Users & Access")
-- Adds the middle layer the team model was missing. Until now you were
-- either a super admin (sees everything) or a user (sees only your own
-- rows), with nothing in between for someone who runs a team.
--
-- From here on:
--   super_admin  — the owner. Exactly one, created in 014. The API can no
--                  longer mint another; see roleOf() in
--                  app/api/admin/users/route.ts.
--   dept_head    — sees and assigns their own department's work.
--   user         — a department member. Sees only what is theirs.
--
-- Requires: 001_orders.sql (shared set_updated_at() trigger fn),
--           014_admin_users.sql (public.admin_users).
-- ============================================================

create table if not exists public.departments (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name       text not null
);

-- Case-insensitive, so "Sales" and "sales" can't both exist and leave the
-- owner guessing which one a person is actually in.
create unique index if not exists departments_name_uniq
  on public.departments (lower(name));

drop trigger if exists departments_set_updated_at on public.departments;
create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

-- RLS: admin-only, like every other table here. No policies at all — the
-- /admin API routes read this with the service-role key, and the browser
-- only ever holds the anon key.
alter table public.departments enable row level security;

-- ---- admin_users gains a department -------------------------

-- set null, not cascade: deleting a department must never delete people.
alter table public.admin_users
  add column if not exists department_id uuid
  references public.departments (id) on delete set null;

-- Answers "who is in my department", the driving filter of every head's
-- view. Partial, because the super admin's null is not worth indexing.
create index if not exists admin_users_department_idx
  on public.admin_users (department_id)
  where department_id is not null;

-- 014 wrote the check inline, so Postgres named it admin_users_role_check.
-- Same drop-then-add dance 017 does for nav_access.
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin','dept_head','user'));

-- ---- Bootstrap ----------------------------------------------

-- A head with no department is a member with a confusing label: they would
-- see nothing under "My department" and there'd be no error to explain
-- why. Make the state impossible rather than handling it everywhere.
--
-- Added AFTER the backfill below, so an existing row can't trip it.

do $$
declare v_dept uuid;
begin
  -- Everyone who already exists needs somewhere to live, or they'd fail
  -- the head constraint the moment the owner promoted them. Rename this
  -- on the Users & Access page — it is just a starting point.
  insert into public.departments (name)
  select 'General'
  where not exists (select 1 from public.departments);

  select id into v_dept from public.departments order by created_at limit 1;

  update public.admin_users
     set department_id = v_dept
   where role <> 'super_admin'
     and department_id is null;
end $$;

alter table public.admin_users
  drop constraint if exists admin_users_dept_head_has_department;
alter table public.admin_users
  add constraint admin_users_dept_head_has_department
  check (role <> 'dept_head' or department_id is not null);
