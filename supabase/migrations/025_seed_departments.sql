-- ============================================================
-- 025 — THE REAL DEPARTMENTS
-- 022 created a single placeholder department called "General" purely so
-- no existing account was left without one. This replaces it with the
-- four the business actually runs on.
--
-- Anyone still sitting in "General" is moved to Customer Care and the
-- placeholder is dropped. That is a starting point, not a judgement —
-- change it on Users & Access → the person's Department dropdown. They
-- can't simply be left behind, because 022 requires every department head
-- to have a department and every member is expected to have one too.
--
-- Requires: 022_departments.sql.
-- ============================================================

insert into public.departments (name)
select v.name
from (values ('Customer Care'), ('Sales'), ('Technical'), ('Finance')) as v(name)
where not exists (
  -- departments_name_uniq is a lower(name) index, so match the same way
  -- and re-running this file is a no-op.
  select 1 from public.departments d where lower(d.name) = lower(v.name)
);

do $$
declare
  v_general uuid;
  v_care    uuid;
  v_moved   integer;
begin
  select id into v_general from public.departments where lower(name) = 'general';
  if v_general is null then
    return;   -- already retired, or this is a fresh install
  end if;

  select id into v_care from public.departments where lower(name) = 'customer care';

  update public.admin_users
     set department_id = v_care
   where department_id = v_general;
  get diagnostics v_moved = row_count;

  delete from public.departments where id = v_general;

  if v_moved > 0 then
    raise notice
      'Moved % account(s) from "General" to "Customer Care". Check them on Users & Access.',
      v_moved;
  end if;
end $$;
