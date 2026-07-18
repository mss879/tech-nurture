"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Repeat,
  Pencil,
  Trash2,
  X,
  Loader2,
  MessageSquare,
  CalendarCheck,
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

type Client = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string | null;
  email: string | null;
  district: string | null;
  province: string | null;
  first_source: string;
  last_source: string;
  interactions: number;
  notes: string | null;
};

type EnquiryRow = {
  id: string;
  created_at: string;
  service: string | null;
  province: string | null;
  status: string;
};
type BookingRow = {
  id: string;
  created_at: string;
  service: string;
  district: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
};

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  district: string;
  notes: string;
};
const emptyForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  district: "",
  notes: "",
};

export default function ClientsView() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const [detail, setDetail] = useState<{
    client: Client;
    enquiries: EnquiryRow[];
    bookings: BookingRow[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [modal, setModal] = useState<
    { mode: "add" } | { mode: "edit"; client: Client } | null
  >(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const load = useCallback(async (q?: string) => {
    setError(null);
    try {
      const url = q
        ? `/api/admin/clients?q=${encodeURIComponent(q)}`
        : "/api/admin/clients";
      const data = await api<{ clients: Client[] }>(url);
      setClients(data.clients);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => load(query.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  const openDetail = async (client: Client) => {
    setDetail({ client, enquiries: [], bookings: [] });
    setDetailLoading(true);
    try {
      const data = await api<{
        client: Client;
        enquiries: EnquiryRow[];
        bookings: BookingRow[];
      }>(`/api/admin/clients?id=${client.id}`);
      setDetail(data);
    } catch (e) {
      alert((e as Error).message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ mode: "add" });
  };
  const openEdit = (client: Client) => {
    setForm({
      name: client.name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      district: client.district ?? "",
      notes: client.notes ?? "",
    });
    setModal({ mode: "edit", client });
  };

  const save = async () => {
    if (!modal || busy || !form.name.trim()) return;
    setBusy(true);
    try {
      if (modal.mode === "add") {
        await api("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await api("/api/admin/clients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: modal.client.id, ...form }),
        });
      }
      setModal(null);
      await load(query.trim() || undefined);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (client: Client) => {
    if (
      !confirm(
        `Delete client "${client.name}"? This removes their saved contact permanently.`
      )
    )
      return;
    try {
      await api(`/api/admin/clients?id=${client.id}`, { method: "DELETE" });
      setClients((list) => list?.filter((c) => c.id !== client.id) ?? null);
      setDetail((d) => (d && d.client.id === client.id ? null : d));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <Spinner />;
  if (error || !clients) {
    return (
      <>
        <PageHeader title="Clients" sub="Everyone who has ever contacted you." />
        <ErrorState error={error ?? new Error("No data")} onRetry={() => load()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Clients"
        sub="Every contact from enquiries and bookings — saved permanently."
      >
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="size-4" /> Add client
        </button>
      </PageHeader>

      {/* search */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <Search className="size-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
          {query
            ? "No clients match your search."
            : "No clients yet — they're captured automatically from enquiries and bookings."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:grid">
            <span>Name</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Activity</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {clients.map((c) => (
              <li
                key={c.id}
                className="grid cursor-pointer grid-cols-1 gap-2 px-5 py-4 transition hover:bg-slate-50/60 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] lg:items-center lg:gap-4"
                onClick={() => openDetail(c)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-800">
                      {c.name}
                    </p>
                    {c.interactions > 1 && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[0.6rem] font-semibold text-violet-700">
                        <Repeat className="size-2.5" /> Returning
                      </span>
                    )}
                  </div>
                  {c.district && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="size-3" /> {c.district}
                    </p>
                  )}
                </div>
                <span className="truncate text-sm text-slate-600">
                  {c.phone ?? "—"}
                </span>
                <span className="truncate text-sm text-slate-600">
                  {c.email ?? "—"}
                </span>
                <span className="text-sm text-slate-500">
                  {c.interactions}{" "}
                  <span className="text-slate-400">
                    {c.interactions === 1 ? "contact" : "contacts"}
                  </span>
                </span>
                <div
                  className="flex items-center gap-1 lg:justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openEdit(c)}
                    aria-label="Edit client"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    aria-label="Delete client"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* detail modal */}
      {detail && (
        <div className="fixed inset-0 z-[95] grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetail(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {detail.client.name}
                  </h2>
                  {detail.client.interactions > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[0.62rem] font-semibold text-violet-700">
                      <Repeat className="size-2.5" /> Returning customer
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  First seen {formatDate(detail.client.created_at)} ·{" "}
                  {detail.client.interactions} total contacts
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

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {detail.client.phone && (
                <a
                  href={`tel:${detail.client.phone}`}
                  className="flex items-center gap-2 hover:text-green"
                >
                  <Phone className="size-3.5 text-slate-400" />
                  {detail.client.phone}
                </a>
              )}
              {detail.client.email && (
                <a
                  href={`mailto:${detail.client.email}`}
                  className="flex items-center gap-2 hover:text-green"
                >
                  <Mail className="size-3.5 text-slate-400" />
                  {detail.client.email}
                </a>
              )}
              {detail.client.district && (
                <span className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-slate-400" />
                  {detail.client.district}
                </span>
              )}
            </div>

            {detail.client.notes && (
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                {detail.client.notes}
              </p>
            )}

            {detailLoading ? (
              <div className="grid place-items-center py-10 text-slate-400">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <HistorySection
                  title="Bookings"
                  icon={<CalendarCheck className="size-4 text-slate-400" />}
                  count={detail.bookings.length}
                >
                  {detail.bookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">
                          {b.service}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {b.district} · {b.preferred_date} · {b.preferred_time}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </HistorySection>

                <HistorySection
                  title="Enquiries"
                  icon={<MessageSquare className="size-4 text-slate-400" />}
                  count={detail.enquiries.length}
                >
                  {detail.enquiries.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">
                          {e.service ?? "General enquiry"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {formatDate(e.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={e.status} />
                    </li>
                  ))}
                </HistorySection>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  openEdit(detail.client);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                onClick={() => remove(detail.client)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3.5 py-2 text-sm text-red-500 transition hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* add / edit modal */}
      {modal && (
        <div className="fixed inset-0 z-[96] grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {modal.mode === "add" ? "Add client" : "Edit client"}
              </h2>
              <button
                onClick={() => setModal(null)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name *"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
                />
                <input
                  value={form.district}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, district: e.target.value }))
                  }
                  placeholder="District"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
                />
              </div>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
              />
            </div>
            <button
              onClick={save}
              disabled={busy || !form.name.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {modal.mode === "add" ? "Add client" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function HistorySection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="mt-1 text-xs text-slate-400">None yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100">{children}</ul>
      )}
    </div>
  );
}
