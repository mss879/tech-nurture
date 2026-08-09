"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  X,
  MessageSquare,
  KanbanSquare,
  ShoppingBag,
  CalendarCheck,
} from "lucide-react";
import { api } from "./ui";

/* Pointing a to-do at the record it's actually about — an enquiry, a CRM
   lead, an order, a service booking.

   The search endpoint only returns kinds the caller can already open from
   the menu, so the picker quietly offers less to someone with narrower
   access rather than showing them results they'd be refused. */

export type LinkKind = "enquiry" | "lead" | "order" | "booking";

export type TodoLink = {
  kind: LinkKind;
  id: string;
  label: string;
  sub: string | null;
  href: string;
};

const KIND_META: Record<
  LinkKind,
  { label: string; Icon: typeof MessageSquare; chip: string }
> = {
  enquiry: {
    label: "Inquiry",
    Icon: MessageSquare,
    chip: "bg-teal-50 text-teal-700 ring-teal-200",
  },
  lead: {
    label: "Lead",
    Icon: KanbanSquare,
    chip: "bg-lime/20 text-green-700 ring-lime",
  },
  order: {
    label: "Order",
    Icon: ShoppingBag,
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  booking: {
    label: "Booking",
    Icon: CalendarCheck,
    chip: "bg-blue-50 text-blue-700 ring-blue-200",
  },
};

const input =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green";

/* A read-only row of chips, for a to-do card in the list. */
export function LinkChips({ links }: { links: TodoLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {links.map((l) => {
        const { Icon, chip } = KIND_META[l.kind];
        return (
          <Link
            key={`${l.kind}:${l.id}`}
            href={l.href}
            className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 transition hover:brightness-95 ${chip}`}
          >
            <Icon className="size-2.5 shrink-0" />
            <span className="truncate">{l.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function LinkPicker({
  value,
  onChange,
}: {
  value: TodoLink[];
  onChange: (links: TodoLink[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TodoLink[]>([]);
  const [loading, setLoading] = useState(false);

  /* Guards against a slow early request landing after a fast later one
     and overwriting the results with stale rows. */
  const seq = useRef(0);

  const search = useCallback(async (q: string) => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const data = await api<{ results: TodoLink[] }>(
        `/api/admin/search?q=${encodeURIComponent(q)}`
      );
      if (mine === seq.current) setResults(data.results ?? []);
    } catch {
      if (mine === seq.current) setResults([]);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // Debounced: the picker opens with the most recent records already
    // listed, and typing narrows them a beat later.
    const t = setTimeout(() => search(query), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, query, search]);

  const chosen = new Set(value.map((l) => `${l.kind}:${l.id}`));

  const add = (link: TodoLink) => {
    onChange([...value, link]);
    setQuery("");
  };

  const drop = (link: TodoLink) =>
    onChange(
      value.filter((l) => !(l.kind === link.kind && l.id === link.id))
    );

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((l) => {
            const { Icon, chip } = KIND_META[l.kind];
            return (
              <span
                key={`${l.kind}:${l.id}`}
                className={`inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-xs font-medium ring-1 ${chip}`}
              >
                <Icon className="size-3 shrink-0" />
                <span className="truncate">{l.label}</span>
                <button
                  type="button"
                  onClick={() => drop(l)}
                  aria-label={`Unlink ${l.label}`}
                  className="grid size-4 shrink-0 place-items-center rounded-full transition hover:bg-black/10"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open ? (
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inquiries, leads, orders, bookings"
              className={`${input} pl-9 pr-9`}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>

          <ul className="mt-2 max-h-56 space-y-0.5 overflow-auto">
            {results.length === 0 && !loading && (
              <li className="px-1 py-3 text-sm text-slate-400">
                {query ? "Nothing matches that." : "Nothing to link yet."}
              </li>
            )}
            {results
              .filter((r) => !chosen.has(`${r.kind}:${r.id}`))
              .map((r) => {
                const { Icon, label } = KIND_META[r.kind];
                return (
                  <li key={`${r.kind}:${r.id}`}>
                    <button
                      type="button"
                      onClick={() => add(r)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <Icon className="size-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-slate-700">{r.label}</span>
                      {r.sub && (
                        <span className="truncate text-xs text-slate-400">
                          {r.sub}
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-[0.65rem] uppercase tracking-wider text-slate-400">
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
            className="mt-2 text-xs font-medium text-slate-500 hover:underline"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Search className="size-3.5" />
          {value.length > 0 ? "Link another record" : "Link a record"}
        </button>
      )}
    </div>
  );
}
