-- ============================================================
-- 002 — ENQUIRIES  (admin menu: "Enquiries")
-- Enquiries submitted through the Contact form.
-- ============================================================

create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name       text not null,
  phone      text not null,
  email      text,
  service    text,
  province   text,
  message    text,
  status     text not null default 'new'
             check (status in ('new','contacted','in_crm','closed'))
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx     on public.enquiries (status);

drop trigger if exists enquiries_set_updated_at on public.enquiries;
create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

-- RLS: the public site may only INSERT (send an enquiry).
alter table public.enquiries enable row level security;

drop policy if exists "public can send enquiries" on public.enquiries;
create policy "public can send enquiries"
  on public.enquiries for insert
  to anon
  with check (true);
