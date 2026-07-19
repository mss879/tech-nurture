-- ============================================================
-- 013 — LIVE CHAT / HUMAN HANDOFF  (admin menu: "Live Chat")
-- Lets the owner watch AI conversations, get notified when a visitor
-- asks for a human, and take over — switching a conversation from the
-- AI to manual replies. Builds on the ai_messages log from 012.
-- Requires: 001_orders.sql (set_updated_at), 012_ai_agent.sql.
-- ============================================================

-- One row per chat conversation (keyed by the widget's session id).
create table if not exists public.chat_sessions (
  session_id           text primary key,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  mode                 text not null default 'ai'
                       check (mode in ('ai', 'manual')),
  status               text not null default 'open'
                       check (status in ('open', 'closed')),
  handoff_requested_at timestamptz,           -- set when a visitor asks for a human
  customer_name        text,                  -- captured by the AI if given
  customer_phone       text,
  last_message_at      timestamptz not null default now()
);

create index if not exists chat_sessions_activity_idx
  on public.chat_sessions (last_message_at desc);
create index if not exists chat_sessions_handoff_idx
  on public.chat_sessions (handoff_requested_at)
  where handoff_requested_at is not null;

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

-- Allow the human agent's messages in the transcript log.
-- (012 created ai_messages with role check in ('user','assistant').)
alter table public.ai_messages drop constraint if exists ai_messages_role_check;
alter table public.ai_messages
  add constraint ai_messages_role_check
  check (role in ('user', 'assistant', 'agent'));

-- RLS: conversations are admin-only. They're created and read through
-- server routes using the service-role key; nothing on the public anon
-- key can read them.
alter table public.chat_sessions enable row level security;
