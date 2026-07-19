"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { whatsappLink } from "@/lib/site";

type Msg = { role: "user" | "assistant"; content: string };

/* WhatsApp glyph (lucide has no brand icon); inherits currentColor. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const GREETING =
  "Hi! 👋 I'm the **TechNurture** assistant. I can help with your air conditioner, refrigerator or washing machine — answer questions, get you a quotation, or book a service visit. How can I help?";

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
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const sessionId = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    sessionId.current = newId();
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
    const next = [...messages, { role: "user" as const, content: text }];
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
      if (!res.ok || typeof data?.content !== "string") {
        throw new Error(data?.error || "Something went wrong.");
      }
      setMessages((m) => [...m, { role: "assistant", content: data.content }]);
    } catch {
      // roll back the optimistic user message and give the text back
      setMessages((m) => m.slice(0, -1));
      setInput(text);
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
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Chat with our AI assistant"}
          className="grid size-14 place-items-center rounded-full bg-lime text-ink shadow-[0_10px_35px_-8px_rgba(143,209,63,0.7)] transition hover:bg-lime-bright active:scale-95"
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
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
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-green text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="[&_a]:font-medium [&_a]:text-green [&_a]:underline [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
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
