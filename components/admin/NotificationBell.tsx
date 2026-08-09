"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CalendarClock,
  KanbanSquare,
  ListChecks,
  AtSign,
} from "lucide-react";
import { api } from "./ui";

type Item = {
  id: string;
  kind: "todo_assigned" | "todo_mentioned" | "lead_assigned" | "todo_due";
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string | null;
  unread: boolean;
  reminder?: { todoId: string; dueDate: string; bucket: string };
};

/* The bell. Mounted twice — in the desktop topbar and in the mobile bar
   inside AdminSidebar — like the menu itself.

   `dark` styles it for the near-black mobile bar. */
export default function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ items: Item[]; unread: number }>(
        "/api/admin/notifications"
      );
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // a failing bell must never take the page down
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, [load]);

  // Close when clicking anywhere else, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dismiss = async (item: Item) => {
    setItems((list) => list.filter((i) => i.id !== item.id));
    setUnread((n) => Math.max(0, n - 1));
    try {
      if (item.reminder) {
        await api("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            todoId: item.reminder.todoId,
            dueDate: item.reminder.dueDate,
            bucket: item.reminder.bucket,
          }),
        });
      } else {
        await api("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
      }
    } catch {
      await load();
    }
  };

  const markAllRead = async () => {
    try {
      await api("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // ignore
    }
    await load();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `Notifications (${unread} new)` : "Notifications"
        }
        aria-expanded={open}
        className={`relative grid size-9 place-items-center rounded-full transition ${
          dark
            ? "border border-white/15 text-white hover:bg-white/10"
            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[90] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Notifications
            </h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-green hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              Nothing needs your attention.
            </p>
          ) : (
            <ul className="max-h-[24rem] divide-y divide-slate-100 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    item.unread ? "bg-lime/5" : ""
                  }`}
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                    {item.kind === "todo_due" ? (
                      <CalendarClock className="size-3.5" />
                    ) : item.kind === "lead_assigned" ? (
                      <KanbanSquare className="size-3.5" />
                    ) : item.kind === "todo_mentioned" ? (
                      <AtSign className="size-3.5" />
                    ) : (
                      <ListChecks className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-slate-800 hover:text-green"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-slate-800">
                        {item.title}
                      </p>
                    )}
                    {item.body && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.body}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(item)}
                    aria-label={`Dismiss: ${item.title}`}
                    title="Dismiss"
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Check className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
