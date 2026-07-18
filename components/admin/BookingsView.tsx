"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Clock,
  Trash2,
  X,
  RefreshCw,
  Repeat,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  PageHeader,
  StatusBadge,
  formatDate,
} from "./ui";

type Booking = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  district: string;
  preferred_date: string;
  preferred_time: string;
  address: string | null;
  message: string | null;
  status: "new" | "handling" | "completed" | "cancelled";
  client_id: string | null;
  returning: boolean;
};

const COLUMNS: {
  key: Booking["status"];
  label: string;
  accent: string;
}[] = [
  { key: "new", label: "New", accent: "text-blue-600" },
  { key: "handling", label: "Being Handled", accent: "text-orange-600" },
  { key: "completed", label: "Completed", accent: "text-green-600" },
  { key: "cancelled", label: "Cancelled", accent: "text-red-500" },
];

function formatDay(d: string) {
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BookingsView() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ bookings: Booking[] }>("/api/admin/bookings");
      setBookings(data.bookings);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: Booking["status"]) => {
    const prev = bookings;
    setBookings(
      (list) => list?.map((b) => (b.id === id ? { ...b, status } : b)) ?? null
    );
    setDetail((d) => (d && d.id === id ? { ...d, status } : d));
    try {
      await api("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      alert((e as Error).message);
      setBookings(prev ?? null);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking permanently?")) return;
    try {
      await api(`/api/admin/bookings?id=${id}`, { method: "DELETE" });
      setBookings((list) => list?.filter((b) => b.id !== id) ?? null);
      setDetail(null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const onDrop = (status: Booking["status"]) => {
    setDragOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const b = bookings?.find((x) => x.id === id);
    if (b && b.status !== status) updateStatus(id, status);
  };

  if (loading) return <Spinner />;
  if (error || !bookings) {
    return (
      <>
        <PageHeader
          title="Services Booking"
          sub="Online service bookings from the website."
        />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Services Booking"
        sub="Drag a booking between columns to update its status."
      >
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </PageHeader>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
          No bookings yet — submissions from the{" "}
          <span className="font-medium text-slate-500">/book</span> page will
          appear here.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = bookings
              .filter((b) => b.status === col.key)
              .sort(
                (a, b) =>
                  new Date(a.preferred_date).getTime() -
                  new Date(b.preferred_date).getTime()
              );
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.key);
                }}
                onDragLeave={() => setDragOver((c) => (c === col.key ? null : c))}
                onDrop={() => onDrop(col.key)}
                className={`flex flex-col rounded-2xl p-3 transition-colors ${
                  dragOver === col.key
                    ? "bg-lime/20 ring-2 ring-lime"
                    : "bg-slate-200/50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1.5">
                  <h3 className={`text-sm font-semibold ${col.accent}`}>
                    {col.label}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5">
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                      Drop here
                    </p>
                  )}
                  {items.map((b) => (
                    <button
                      key={b.id}
                      draggable
                      onDragStart={() => setDragId(b.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOver(null);
                      }}
                      onClick={() => setDetail(b)}
                      className="cursor-grab rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-slate-300 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {b.name}
                        </p>
                        {b.returning && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[0.6rem] font-semibold text-violet-700">
                            <Repeat className="size-2.5" /> Returning
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-green">
                        {b.service}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3 text-slate-300" />
                          {b.district}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <CalendarDays className="size-3 text-slate-300" />
                          {formatDay(b.preferred_date)}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="size-3 text-slate-300" />
                          {b.preferred_time}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="size-3 text-slate-300" />
                          {b.phone}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* detail modal */}
      {detail && (
        <div className="fixed inset-0 z-[95] grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetail(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {detail.name}
                  </h2>
                  {detail.returning && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[0.62rem] font-semibold text-violet-700">
                      <Repeat className="size-2.5" /> Returning
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Booked {formatDate(detail.created_at)}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Service" value={detail.service} />
              <Row label="District" value={detail.district} />
              <Row label="Preferred date" value={formatDay(detail.preferred_date)} />
              <Row label="Preferred time" value={detail.preferred_time} />
              <Row
                label="Phone"
                value={
                  <a href={`tel:${detail.phone}`} className="text-green hover:underline">
                    {detail.phone}
                  </a>
                }
              />
              {detail.email && (
                <Row
                  label="Email"
                  value={
                    <a
                      href={`mailto:${detail.email}`}
                      className="text-green hover:underline"
                    >
                      {detail.email}
                    </a>
                  }
                />
              )}
              {detail.address && <Row label="Address" value={detail.address} />}
              {detail.message && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                    {detail.message}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </p>
                <StatusBadge status={detail.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                {COLUMNS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => updateStatus(detail.id, c.key)}
                    disabled={detail.status === c.key}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      detail.status === c.key
                        ? "bg-ink text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href={`tel:${detail.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green px-3.5 py-2 font-medium text-white transition hover:bg-green-600"
                >
                  <Phone className="size-3.5" /> Call
                </a>
                {detail.email && (
                  <a
                    href={`mailto:${detail.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-slate-600 transition hover:bg-slate-50"
                  >
                    <Mail className="size-3.5" /> Email
                  </a>
                )}
                <button
                  onClick={() => deleteBooking(detail.id)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3.5 py-2 text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
