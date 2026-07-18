-- ============================================================
-- 012 — AI AGENT  (chat widget on the public site)
-- Logs the AI sales/support agent's conversations, and lets the agent
-- write to the existing backend: it can capture leads (into enquiries
-- + CRM) and create bookings, tagged with source = 'ai'.
-- Requires: 003_crm.sql, 005_bookings.sql.
-- ============================================================

-- ---- conversation log -----------------------------------------
create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null
);

create index if not exists ai_messages_session_idx
  on public.ai_messages (session_id, created_at);

-- The /api/chat route logs via the service-role key. RLS is on and there is
-- no SELECT policy, so transcripts stay unreadable by the public anon key.
-- An INSERT-only anon policy matches the other public-write tables and keeps
-- logging working if the server ever falls back to the anon key.
alter table public.ai_messages enable row level security;

drop policy if exists "public can log ai messages" on public.ai_messages;
create policy "public can log ai messages"
  on public.ai_messages for insert
  to anon
  with check (true);

-- ---- let the agent add CRM leads ------------------------------
-- Widen the crm_leads.source check to include 'ai'. The constraint was
-- created inline in 003_crm.sql, so Postgres named it crm_leads_source_check.
alter table public.crm_leads drop constraint if exists crm_leads_source_check;
alter table public.crm_leads
  add constraint crm_leads_source_check
  check (source in ('manual', 'enquiry', 'ai'));

-- ---- tag where a booking came from ----------------------------
alter table public.bookings
  add column if not exists source text not null default 'website'
  check (source in ('website', 'ai'));
