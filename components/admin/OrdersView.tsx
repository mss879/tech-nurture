"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Trash2, Phone, Mail, MapPin } from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  StatusBadge,
  PageHeader,
  formatDate,
  formatLKR,
} from "./ui";

const STATUSES = ["new", "contacted", "confirmed", "delivered", "cancelled"];

type OrderItem = {
  id: string;
  product_name: string;
  model: string;
  filtration: string | null;
  unit_price: number;
  plus_vat: boolean;
  qty: number;
};

type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  province: string | null;
  notes: string | null;
  total: number;
  has_vat_items: boolean;
  status: string;
  order_items: OrderItem[];
};

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ orders: Order[] }>("/api/admin/orders");
      setOrders(data.orders);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const prev = orders;
    setOrders(
      (o) => o?.map((x) => (x.id === id ? { ...x, status } : x)) ?? null
    );
    try {
      await api("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      setOrders(prev ?? null); // roll back on failure
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order permanently?")) return;
    try {
      await api(`/api/admin/orders?id=${id}`, { method: "DELETE" });
      setOrders((o) => o?.filter((x) => x.id !== id) ?? null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <Spinner />;
  if (error || !orders) {
    return (
      <>
        <PageHeader title="Orders" sub="Orders placed through the shop." />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <PageHeader title="Orders" sub="Orders placed through the shop.">
        <div className="flex flex-wrap gap-1.5">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                filter === s
                  ? "bg-ink text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </PageHeader>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
          {orders.length === 0
            ? "No orders yet — they'll appear here when customers checkout on the shop page."
            : "No orders with this status."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div
                key={o.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-left transition hover:bg-slate-50/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">
                      {o.customer_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(o.created_at)} ·{" "}
                      {o.order_items.reduce((n, i) => n + i.qty, 0)} item(s)
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatLKR(o.total)}
                    {o.has_vat_items && (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        + VAT
                      </span>
                    )}
                  </span>
                  <StatusBadge status={o.status} />
                  <ChevronDown
                    className={`size-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-6 py-5">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      {/* items */}
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Items
                        </h3>
                        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                          {o.order_items.map((i) => (
                            <li
                              key={i.id}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-700">
                                  {i.product_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {i.model} · {i.filtration} × {i.qty}
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-slate-700">
                                {formatLKR(i.unit_price * i.qty)}
                                {i.plus_vat && (
                                  <span className="ml-1 text-[0.65rem] font-normal text-slate-400">
                                    + VAT
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {o.notes && (
                          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <span className="font-semibold">Note:</span>{" "}
                            {o.notes}
                          </p>
                        )}
                      </div>

                      {/* customer + actions */}
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Customer
                        </h3>
                        <div className="space-y-2 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Phone className="size-3.5 text-slate-400" />
                            <a
                              href={`tel:${o.phone}`}
                              className="hover:text-green"
                            >
                              {o.phone}
                            </a>
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="size-3.5 text-slate-400" />
                            <a
                              href={`mailto:${o.email}`}
                              className="hover:text-green"
                            >
                              {o.email}
                            </a>
                          </p>
                          <p className="flex items-start gap-2">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                            {[o.address, o.city, o.province]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>

                        <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Status
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateStatus(o.id, e.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-green"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteOrder(o.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
