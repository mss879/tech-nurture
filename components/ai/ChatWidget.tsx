"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { whatsappLink } from "@/lib/site";

type Msg = { id: string; role: "user" | "assistant" | "agent"; content: string };
const SID_KEY = "tn_chat_sid";
/* The transcript is kept next to the session id. The server remembers the
   conversation either way, but the widget used to start from a blank panel
   after any reload — so the visitor saw their booking details vanish, and
   the model was sent a history that began mid-sentence. */
const LOG_KEY = "tn_chat_log";
const LOG_LIMIT = 60;

/* Only assistant bubbles render Markdown, and none exist until the panel is
   opened — so the renderer is loaded on demand rather than on every page. */
const Markdown = dynamic(() => import("./Markdown"), { ssr: false });
// Warmed on the launcher click so the module is parsed before the panel
// finishes animating in and the greeting bubble has something to render with.
const warmMarkdown = () => void import("./Markdown");

/* WhatsApp glyph (lucide has no brand icon); inherits currentColor. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* Kept as a local copy rather than imported from lib/ai/context: that module
   builds the whole system prompt from the site content, and pulling it into a
   client component would ship all of it to the browser. Keep this in sync with
   GREETING there — it is the same message with Markdown emphasis. */
const GREETING =
  "Hi! 👋 I'm the **TechNurture** assistant. I can help with your air conditioner, refrigerator, inline water purifier or water dispenser — answer questions, get you a quotation, or book a service visit. How can I help?";

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: "greeting", role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [unread, setUnread] = useState(0);
  const openRef = useRef(false);
  const sessionId = useRef<string>("");
  const lastAgentAt = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nearBottomRef = useRef(true);

  // Persist the session id and the transcript so a conversation (and any
  // human takeover) survives page reloads.
  useEffect(() => {
    try {
      let id = localStorage.getItem(SID_KEY);
      if (!id) {
        id = newId();
        localStorage.setItem(SID_KEY, id);
      }
      sessionId.current = id;
      const saved = localStorage.getItem(LOG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      sessionId.current = sessionId.current || newId();
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(messages.slice(-LOG_LIMIT)));
    } catch {
      // storage full or blocked — the server still has the transcript
    }
  }, [messages]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* Poll for the team's replies (role 'agent') and for a switch to manual
     mode. This runs whether or not the panel is open: a visitor who closed
     the panel after asking for a person used to never learn that someone had
     answered. Closed, it polls slowly and raises an unread badge instead. */
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const sid = sessionId.current;
      if (sid) {
        try {
          const after = lastAgentAt.current;
          const res = await fetch(
            `/api/chat/poll?sessionId=${encodeURIComponent(sid)}${
              after ? `&after=${encodeURIComponent(after)}` : ""
            }`
          );
          const data = await res.json().catch(() => null);
          if (!active) return;
          if (data) {
            if (data.mode === "ai" || data.mode === "manual") setMode(data.mode);
            if (Array.isArray(data.messages) && data.messages.length > 0) {
              setMessages((m) => [
                ...m,
                ...data.messages.map((x: { id?: string; content: string }) => ({
                  id: x.id ?? newId(),
                  role: "agent" as const,
                  content: x.content,
                })),
              ]);
              lastAgentAt.current =
                data.messages[data.messages.length - 1].created_at;
              if (!openRef.current)
                setUnread((n) => n + data.messages.length);
            }
          }
        } catch {
          // best-effort
        }
      }
      if (active) timer = setTimeout(poll, openRef.current ? 5000 : 20000);
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Reveal the floating buttons once the visitor scrolls past the hero
  // (roughly the first screen). Lenis dispatches native scroll events, so a
  // window scroll listener works — same approach the header uses.
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onMessagesScroll = () => {
    const el = scrollRef.current;
    if (el) {
      nearBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }
  };

  // Auto-scroll on new content only if the user is already near the bottom,
  // so scrolling up to read history isn't yanked back down.
  useEffect(() => {
    if (open && nearBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [messages, loading, open]);

  // Focus the input when opening (not on every message), clear stale errors,
  // and restore focus to the launcher when closing.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setError(null);
      setUnread(0);
      nearBottomRef.current = true;
    } else {
      launcherRef.current?.focus();
    }
  }, [open]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const sent: Msg = { id: newId(), role: "user", content: text };
    const next = [...messages, sent];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId: sessionId.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }
      if (data.mode === "ai" || data.mode === "manual") setMode(data.mode);
      // In manual mode the reply comes from a human via polling (content null).
      if (typeof data.content === "string" && data.content) {
        setMessages((m) => [
          ...m,
          { id: newId(), role: "assistant", content: data.content },
        ]);
      }
    } catch {
      /* Roll back this exact message, not "the last one" — a team reply can
         arrive from the poll while the request is in flight, and slice(-1)
         would delete that instead. Only hand the text back if the box is
         still empty, so anything typed since isn't overwritten. */
      setMessages((m) => m.filter((x) => x.id !== sent.id));
      setInput((v) => (v ? v : text));
      setError("Couldn't reach the assistant. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // Show the floating buttons once past the hero. If the chat is open, keep
  // the dock visible even if scrolled back up (so the close button stays).
  const showDock = pastHero || open;

  return (
    <>
      {/* floating dock (WhatsApp + AI), bottom-right, revealed after the hero */}
      <div
        className={`fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3 transition-all duration-500 ease-out ${
          showDock
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        {/* WhatsApp — hidden while the chat panel is open */}
        {!open && (
          <a
            href={whatsappLink("Hi TechNurture, I'd like to make an inquiry.")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            title="WhatsApp"
            className="grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_35px_-8px_rgba(37,211,102,0.65)] transition hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon className="size-7" />
          </a>
        )}

        {/* AI assistant launcher */}
        <button
          ref={launcherRef}
          onPointerEnter={warmMarkdown}
          onFocus={warmMarkdown}
          onClick={() => {
            warmMarkdown();
            setOpen((v) => !v);
          }}
          aria-label={
            open
              ? "Close chat"
              : unread > 0
                ? `Chat with our AI assistant — ${unread} new ${
                    unread === 1 ? "reply" : "replies"
                  } from the team`
                : "Chat with our AI assistant"
          }
          className="relative grid size-14 place-items-center rounded-full bg-lime text-ink shadow-[0_10px_35px_-8px_rgba(143,209,63,0.7)] transition hover:bg-lime-bright active:scale-95"
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          {/* A person answered while the panel was shut — say so, or the
              visitor never finds out. */}
          {!open && unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-red-500 text-[0.65rem] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      {/* panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="TechNurture assistant"
          className="fixed bottom-24 right-5 z-[80] flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:w-[384px]"
        >
          {/* header */}
          <div className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
            <span className="grid size-9 place-items-center rounded-full bg-lime/20 text-lime">
              <MessageCircle className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                TechNurture Assistant
              </p>
              <p className="flex items-center gap-1.5 text-[0.7rem] text-white/50">
                <span className="size-1.5 rounded-full bg-lime" /> Online · replies
                instantly
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto grid size-8 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            onScroll={onMessagesScroll}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            {mode === "manual" && (
              <div className="mx-auto w-fit rounded-full bg-teal-50 px-3 py-1 text-center text-[0.7rem] font-medium text-teal-700">
                You&apos;re chatting with the TechNurture team
              </div>
            )}
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const isAgent = m.role === "agent";
              return (
                <div
                  key={m.id ?? i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-br-sm bg-green text-white"
                        : isAgent
                          ? "rounded-bl-sm border border-teal-200 bg-teal-50 text-slate-700"
                          : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {isAgent && (
                      <p className="mb-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-teal-600">
                        TechNurture team
                      </p>
                    )}
                    {m.role === "assistant" ? (
                      <div className="[&_a]:font-medium [&_a]:text-green [&_a]:underline [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-500">
                {error}
              </p>
            )}
          </div>

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-green focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-ink transition hover:bg-lime-bright disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>
          <p className="bg-white pb-2 text-center text-[0.62rem] text-slate-300">
            AI assistant · may occasionally be inaccurate
          </p>
        </div>
      )}
    </>
  );
}
