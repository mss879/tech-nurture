"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  Send,
  Trash2,
  ChevronLeft,
  Bot,
  Headset,
  Phone,
  CircleUser,
  CheckCheck,
  Hand,
} from "lucide-react";
import { api, ApiError, Spinner, ErrorState, PageHeader } from "./ui";

type Session = {
  session_id: string;
  created_at: string;
  updated_at: string;
  mode: "ai" | "manual";
  status: "open" | "closed";
  handoff_requested_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  last_message_at: string;
  last?: { role: string; content: string; created_at: string } | null;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  created_at: string;
};

function pendingHandoff(s: Session) {
  return s.status === "open" && s.mode === "ai" && !!s.handoff_requested_at;
}

export default function ChatsView() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<{
    session: Session;
    messages: Message[];
  } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const data = await api<{ sessions: Session[] }>("/api/admin/chats");
      setSessions(data.sessions);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Open a conversation deep-linked from the notification email (?id=…).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setSelectedId(id);
  }, []);

  useEffect(() => {
    loadList();
    const iv = setInterval(loadList, 10000); // refresh list + badges
    return () => clearInterval(iv);
  }, [loadList]);

  // Poll the open conversation for new messages (customer or AI) live.
  const loadThread = useCallback(async (id: string) => {
    try {
      const data = await api<{ session: Session; messages: Message[] }>(
        `/api/admin/chats?id=${encodeURIComponent(id)}`
      );
      setThread(data);
    } catch {
      // keep the current thread on a transient error
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setThread(null);
      return;
    }
    loadThread(selectedId);
    const iv = setInterval(() => loadThread(selectedId), 4000);
    return () => clearInterval(iv);
  }, [selectedId, loadThread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  const setMode = async (mode: "ai" | "manual") => {
    if (!thread || busy) return;
    setBusy(true);
    setThread((t) => (t ? { ...t, session: { ...t.session, mode } } : t));
    try {
      await api("/api/admin/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: thread.session.session_id, mode }),
      });
      loadList();
    } catch (e) {
      alert((e as Error).message);
      if (selectedId) loadThread(selectedId);
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    const content = reply.trim();
    if (!content || !thread || sending) return;
    setSending(true);
    try {
      await api("/api/admin/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: thread.session.session_id,
          content,
        }),
      });
      setReply("");
      await loadThread(thread.session.session_id);
      loadList();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!thread) return;
    const next = thread.session.status === "open" ? "closed" : "open";
    setBusy(true);
    try {
      await api("/api/admin/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: thread.session.session_id,
          status: next,
        }),
      });
      await loadThread(thread.session.session_id);
      loadList();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation and its messages permanently?")) return;
    try {
      await api(`/api/admin/chats?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (selectedId === id) setSelectedId(null);
      setSessions((list) => list?.filter((s) => s.session_id !== id) ?? null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <Spinner />;
  if (error || !sessions) {
    return (
      <>
        <PageHeader title="Live Chat" sub="Watch conversations and jump in." />
        <ErrorState error={error ?? new Error("No data")} onRetry={loadList} />
      </>
    );
  }

  const pendingCount = sessions.filter(pendingHandoff).length;

  return (
    <>
      <PageHeader
        title="Live Chat"
        sub="Watch the AI's conversations, take over, and reply as your team."
      >
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-red-200">
            <Hand className="size-4" /> {pendingCount} waiting for you
          </span>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* conversation list */}
        <div
          className={`rounded-2xl border border-slate-200 bg-white ${
            selectedId ? "hidden lg:block" : ""
          }`}
        >
          {sessions.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-slate-400">
              No conversations yet. They appear here when visitors chat with the
              assistant.
            </p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {sessions.map((s) => (
                <li key={s.session_id}>
                  <button
                    onClick={() => setSelectedId(s.session_id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      selectedId === s.session_id ? "bg-slate-50" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
                        pendingHandoff(s)
                          ? "bg-red-100 text-red-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <CircleUser className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {s.customer_name || "Website visitor"}
                        </p>
                        <span className="shrink-0 text-[0.65rem] text-slate-400">
                          {new Date(s.last_message_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-400">
                        {s.last?.content ?? "New conversation"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {pendingHandoff(s) && (
                          <Tag className="bg-red-50 text-red-600">
                            <Hand className="size-2.5" /> Wants a person
                          </Tag>
                        )}
                        {s.mode === "manual" && (
                          <Tag className="bg-teal-50 text-teal-700">
                            <Headset className="size-2.5" /> Manual
                          </Tag>
                        )}
                        {s.status === "closed" && (
                          <Tag className="bg-slate-100 text-slate-500">Closed</Tag>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* conversation thread */}
        <div
          className={`flex min-h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white ${
            selectedId ? "" : "hidden lg:flex"
          }`}
        >
          {!thread ? (
            <div className="grid flex-1 place-items-center p-10 text-center text-sm text-slate-400">
              Select a conversation to read it and reply.
            </div>
          ) : (
            <>
              {/* thread header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                <button
                  onClick={() => setSelectedId(null)}
                  className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
                  aria-label="Back to list"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {thread.session.customer_name || "Website visitor"}
                  </p>
                  {thread.session.customer_phone && (
                    <a
                      href={`tel:${thread.session.customer_phone}`}
                      className="flex items-center gap-1 text-xs text-green hover:underline"
                    >
                      <Phone className="size-3" /> {thread.session.customer_phone}
                    </a>
                  )}
                </div>

                {/* AI / Manual toggle */}
                <button
                  onClick={() =>
                    setMode(thread.session.mode === "ai" ? "manual" : "ai")
                  }
                  disabled={busy}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                    thread.session.mode === "ai"
                      ? "bg-green/10 text-green ring-1 ring-green/20"
                      : "bg-teal-500 text-white"
                  }`}
                  title={
                    thread.session.mode === "ai"
                      ? "AI is answering — switch to manual to take over"
                      : "You're replying — switch AI back on"
                  }
                >
                  {thread.session.mode === "ai" ? (
                    <>
                      <Bot className="size-3.5" /> AI is ON
                    </>
                  ) : (
                    <>
                      <Headset className="size-3.5" /> Manual
                    </>
                  )}
                </button>

                <button
                  onClick={closeConversation}
                  disabled={busy}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {thread.session.status === "open" ? "Close" : "Reopen"}
                </button>
                <button
                  onClick={() => deleteConversation(thread.session.session_id)}
                  aria-label="Delete conversation"
                  className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {pendingHandoff(thread.session) && (
                <div className="flex items-center gap-2 bg-red-50 px-5 py-2 text-xs font-medium text-red-600">
                  <Hand className="size-3.5" /> This visitor asked to speak with a
                  person. Reply below (the AI turns off automatically).
                </div>
              )}

              {/* messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-5"
                style={{ maxHeight: "56vh" }}
              >
                {thread.messages.map((m) => {
                  const isAgent = m.role === "agent";
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isAgent
                            ? "rounded-br-sm bg-green text-white"
                            : isUser
                              ? "rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-200"
                              : "rounded-bl-sm bg-slate-100 text-slate-600"
                        }`}
                      >
                        <p
                          className={`mb-0.5 text-[0.6rem] font-semibold uppercase tracking-wide ${
                            isAgent
                              ? "text-white/70"
                              : isUser
                                ? "text-slate-400"
                                : "text-slate-400"
                          }`}
                        >
                          {isAgent ? "You" : isUser ? "Customer" : "AI"}
                        </p>
                        {m.role === "assistant" ? (
                          <div className="[&_a]:text-green [&_a]:underline [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {thread.messages.length === 0 && (
                  <p className="py-10 text-center text-xs text-slate-400">
                    No messages yet.
                  </p>
                )}
              </div>

              {/* reply box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendReply();
                }}
                className="flex items-center gap-2 border-t border-slate-100 p-3"
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={
                    thread.session.mode === "ai"
                      ? "Reply (this switches AI off)…"
                      : "Reply as your team…"
                  }
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-green focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  aria-label="Send reply"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-green text-white transition hover:bg-green-600 disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <CheckCheck className="size-3.5" /> Conversations and every message are
        saved automatically. Updates appear live while this page is open.
      </p>
    </>
  );
}

function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium ${className}`}
    >
      {children}
    </span>
  );
}
