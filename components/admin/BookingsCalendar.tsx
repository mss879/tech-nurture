"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  Bot,
  Repeat,
  CalendarDays,
} from "lucide-react";
import { api, StatusBadge } from "./ui";

type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  district: string;
  preferred_date: string;
  preferred_time: string;
  address: string | null;
  message: string | null;
  status: string;
  source?: string;
  returning?: boolean;
};

const STATUSES = ["new", "handling", "completed", "cancelled"];

const DOT: Record<string, string> = {
  new: "bg-blue-500",
  handling: "bg-amber-500",
  completed: "bg-green-500",
  cancelled: "bg-slate-400",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Modal = { type: "day"; date: string } | { type: "booking"; booking: Booking };

export default function BookingsCalendar() {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [byDate, setByDate] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal | null>(null);

  const monthStr = `${cursor.y}-${pad(cursor.m + 1)}`;

  const reqRef = useRef(0);
  const load = useCallback(async () => {
    const token = ++reqRef.current;
    setLoading(true);
    try {
      const { bookings } = await api<{ bookings: Booking[] }>(
        `/api/admin/bookings?month=${monthStr}`
      );
      if (token !== reqRef.current) return; // a newer month load superseded this one
      const map: Record<string, Booking[]> = {};
      for (const b of bookings) (map[b.preferred_date] ??= []).push(b);
      setByDate(map);
    } catch {
      if (token === reqRef.current) setByDate({});
    } finally {
      if (token === reqRef.current) setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    load();
  }, [load]);

  const first = new Date(cursor.y, cursor.m, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const todayStr = ymd(new Date());
  const monthLabel = first.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const total = Object.values(byDate).reduce((n, l) => n + l.length, 0);

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthStr}-${pad(d)}`);

  const step = (dir: -1 | 1) => {
    setModal(null);
    setCursor(({ y, m }) => {
      const nm = m + dir;
      if (nm < 0) return { y: y - 1, m: 11 };
      if (nm > 11) return { y: y + 1, m: 0 };
      return { y, m: nm };
    });
  };

  const patchStatus = async (booking: Booking, status: string) => {
    const prevStatus = booking.status;
    setByDate((prev) => {
      const copy: Record<string, Booking[]> = {};
      for (const [k, v] of Object.entries(prev))
        copy[k] = v.map((b) => (b.id === booking.id ? { ...b, status } : b));
      return copy;
    });
    setModal((mo) =>
      mo?.type === "booking" && mo.booking.id === booking.id
        ? { type: "booking", booking: { ...mo.booking, status } }
        : mo
    );
    try {
      await api("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: booking.id, status }),
      });
    } catch {
      // revert both the grid and the open modal to the real status
      setModal((mo) =>
        mo?.type === "booking" && mo.booking.id === booking.id
          ? { type: "booking", booking: { ...mo.booking, status: prevStatus } }
          : mo
      );
      load();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4.5 text-green" />
          <h2 className="font-semibold text-slate-800">Bookings calendar</h2>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 hidden text-xs text-slate-400 sm:inline">
            {total} this month
          </span>
          <button
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[8.5rem] text-center text-sm font-medium text-slate-700">
            {monthLabel}
          </span>
          <button
            onClick={() => step(1)}
            aria-label="Next month"
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      <div className="p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="pb-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400"
            >
              <span className="sm:hidden">{w[0]}</span>
              <span className="hidden sm:inline">{w}</span>
            </div>
          ))}

          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />;
            const list = byDate[date];
            const dayNum = Number(date.slice(-2));
            const isToday = date === todayStr;
            const has = !!list?.length;
            return (
              <button
                key={date}
                type="button"
                disabled={!has}
                onClick={() => has && setModal({ type: "day", date })}
                className={`flex min-h-[3.25rem] flex-col rounded-lg border p-1 text-left transition sm:min-h-[5.25rem] sm:p-1.5 ${
                  has
                    ? "border-slate-200 bg-white hover:border-green/40 hover:bg-green/5"
                    : "border-transparent"
                } ${!has ? "cursor-default" : ""}`}
              >
                <span
                  className={`mb-0.5 grid size-5 place-items-center self-start rounded-full text-[0.7rem] font-semibold ${
                    isToday
                      ? "bg-ink text-white"
                      : has
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {dayNum}
                </span>
                {has && (
                  <>
                    {/* mobile: dots */}
                    <span className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                      {list.slice(0, 4).map((b) => (
                        <span
                          key={b.id}
                          className={`size-1.5 rounded-full ${DOT[b.status] ?? "bg-slate-400"}`}
                        />
                      ))}
                    </span>
                    {/* sm+: chips */}
                    <span className="mt-auto hidden flex-col gap-0.5 sm:flex">
                      {list.slice(0, 2).map((b) => (
                        <span
                          key={b.id}
                          className="flex items-center gap-1 truncate rounded bg-slate-100 px-1 py-0.5 text-[0.65rem] text-slate-600"
                        >
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${DOT[b.status] ?? "bg-slate-400"}`}
                          />
                          <span className="truncate">{b.name}</span>
                        </span>
                      ))}
                      {list.length > 2 && (
                        <span className="pl-1 text-[0.6rem] font-medium text-green">
                          +{list.length - 2} more
                        </span>
                      )}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {loading && (
          <p className="pt-3 text-center text-xs text-slate-400">Loading…</p>
        )}
        {!loading && total === 0 && (
          <p className="pt-3 text-center text-xs text-slate-400">
            No bookings this month.
          </p>
        )}
      </div>

      {/* day list modal */}
      {modal?.type === "day" && (
        <Overlay onClose={() => setModal(null)}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              {new Date(modal.date + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <CloseBtn onClose={() => setModal(null)} />
          </div>
          <ul className="space-y-2">
            {(byDate[modal.date] ?? []).map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setModal({ type: "booking", booking: b })}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-green/40 hover:bg-green/5"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${DOT[b.status] ?? "bg-slate-400"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {b.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {b.preferred_time} · {b.service}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              </li>
            ))}
          </ul>
        </Overlay>
      )}

      {/* booking detail modal */}
      {modal?.type === "booking" && (
        <Overlay onClose={() => setModal(null)}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {modal.booking.name}
                </h3>
                {modal.booking.source === "ai" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[0.62rem] font-medium text-violet-700">
                    <Bot className="size-2.5" /> AI
                  </span>
                )}
                {modal.booking.returning && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[0.62rem] font-medium text-teal-700">
                    <Repeat className="size-2.5" /> Returning
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(
                  modal.booking.preferred_date + "T00:00:00"
                ).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {modal.booking.preferred_time}
              </p>
            </div>
            <CloseBtn onClose={() => setModal(null)} />
          </div>

          <dl className="space-y-2.5 text-sm">
            <Row label="Service" value={modal.booking.service} />
            <Row label="District" value={modal.booking.district} />
            <Row
              label="Phone"
              value={
                <a href={`tel:${modal.booking.phone}`} className="text-green hover:underline">
                  <Phone className="mr-1 inline size-3.5" />
                  {modal.booking.phone}
                </a>
              }
            />
            {modal.booking.email && (
              <Row
                label="Email"
                value={
                  <a
                    href={`mailto:${modal.booking.email}`}
                    className="text-green hover:underline"
                  >
                    <Mail className="mr-1 inline size-3.5" />
                    {modal.booking.email}
                  </a>
                }
              />
            )}
            {modal.booking.address && (
              <Row
                label="Address"
                value={
                  <span>
                    <MapPin className="mr-1 inline size-3.5 text-slate-400" />
                    {modal.booking.address}
                  </span>
                }
              />
            )}
            {modal.booking.message && (
              <Row label="Notes" value={modal.booking.message} />
            )}
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Status
            </span>
            <select
              value={modal.booking.status}
              onChange={(e) => patchStatus(modal.booking, e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm capitalize outline-none focus:border-green"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "handling" ? "being handled" : s}
                </option>
              ))}
            </select>
          </div>
        </Overlay>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-slate-400">{label}</dt>
      <dd className="min-w-0 flex-1 whitespace-pre-wrap text-slate-700">{value}</dd>
    </div>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
    >
      <X className="size-4" />
    </button>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[95] grid place-items-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
