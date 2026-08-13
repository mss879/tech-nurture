"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Loader2,
} from "lucide-react";
import {
  ADMIN_ORDER_SOURCES,
  orderSourceLabel,
  type AdminOrderSource,
} from "@/lib/orders";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  StatusBadge,
  PageHeader,
  Modal,
  useToast,
  formatDate,
  formatLKR,
} from "./ui";

const STATUSES = ["new", "contacted", "confirmed", "delivered", "cancelled"];

const input =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green";

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
  // Optional since 027: a phone order often has neither.
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  total: number;
  has_vat_items: boolean;
  status: string;
  // Absent on a pre-027 database, and on rows written before it ran.
  source?: string | null;
  order_items: OrderItem[];
};

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);

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
        <PageHeader
          title="Orders"
          sub="Orders placed through the shop, and orders you take yourself."
        />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <PageHeader
        title="Orders"
        sub="Orders placed through the shop, and orders you take yourself."
      >
        <div className="flex flex-wrap items-center gap-1.5">
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
          <button
            onClick={() => setCreating(true)}
            className="ml-1.5 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="size-4" /> New order
          </button>
        </div>
      </PageHeader>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
          {orders.length === 0
            ? "No orders yet — shop checkouts appear here, and you can add one yourself with “New order”."
            : "No orders with this status."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            const sourceLabel = orderSourceLabel(o.source);
            const place = [o.address, o.city, o.province]
              .filter(Boolean)
              .join(", ");
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
                    <p className="flex items-center gap-2 truncate font-medium text-slate-800">
                      {o.customer_name}
                      {sourceLabel && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                          {sourceLabel}
                        </span>
                      )}
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
                                {/* A hand-typed line has no model or option,
                                    so build the caption from what's there. */}
                                <p className="text-xs text-slate-400">
                                  {[i.model, i.filtration]
                                    .filter(Boolean)
                                    .join(" · ")}
                                  {(i.model || i.filtration) && " · "}× {i.qty}
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
                          {o.email && (
                            <p className="flex items-center gap-2">
                              <Mail className="size-3.5 text-slate-400" />
                              <a
                                href={`mailto:${o.email}`}
                                className="hover:text-green"
                              >
                                {o.email}
                              </a>
                            </p>
                          )}
                          {place && (
                            <p className="flex items-start gap-2">
                              <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                              {place}
                            </p>
                          )}
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

      {creating && (
        <NewOrderModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </>
  );
}

/* ---------- New order ------------------------------------------------

   The client takes most orders on the phone. This is the same order
   record a checkout creates, typed in by hand: pick models from the
   catalogue to fill a line in, or write the line yourself for anything
   that isn't a listed product. Prices are editable — agreeing a figure on
   a call is the whole reason this exists.                              */

type CatalogueProduct = {
  slug: string;
  name: string;
  isPublished: boolean;
  variants: {
    model: string;
    optionLabel: string;
    price: number;
    plusVat: boolean;
  }[];
};

type Line = {
  key: number;
  slug: string; // "" = a hand-typed line
  model: string;
  name: string;
  optionLabel: string;
  unitPrice: string;
  plusVat: boolean;
  qty: string;
};

let nextLineKey = 1;

function blankLine(): Line {
  return {
    key: nextLineKey++,
    slug: "",
    model: "",
    name: "",
    optionLabel: "",
    unitPrice: "",
    plusVat: false,
    qty: "1",
  };
}

/* The <option> value for a catalogue model. Split on the FIRST separator
   only, so the model keeps anything that looks like one. */
const choiceValue = (slug: string, model: string) => `${slug}::${model}`;

function NewOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [catalogue, setCatalogue] = useState<CatalogueProduct[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
    notes: "",
  });
  const [source, setSource] = useState<AdminOrderSource>("phone");
  const [status, setStatus] = useState("confirmed");
  const [lines, setLines] = useState<Line[]>([blankLine()]);

  useEffect(() => {
    let live = true;
    api<{ products: CatalogueProduct[] }>("/api/admin/orders/catalogue")
      .then((d) => {
        if (live) setCatalogue(d.products);
      })
      .catch(() => {
        // Not fatal — every line can still be typed in by hand.
        if (live) setCatalogue([]);
      });
    return () => {
      live = false;
    };
  }, []);

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((list) =>
      list.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );

  const pick = (line: Line, value: string) => {
    if (!value) {
      setLine(line.key, {
        slug: "",
        model: "",
        name: "",
        optionLabel: "",
        unitPrice: "",
        plusVat: false,
      });
      return;
    }
    const at = value.indexOf("::");
    const slug = value.slice(0, at);
    const model = value.slice(at + 2);
    const product = catalogue?.find((p) => p.slug === slug);
    const variant = product?.variants.find((v) => v.model === model);
    if (!product || !variant) return;
    setLine(line.key, {
      slug,
      model,
      name: product.name,
      optionLabel: variant.optionLabel,
      unitPrice: String(variant.price),
      plusVat: variant.plusVat,
    });
  };

  // A line is worth sending once it names something.
  const filled = lines.filter((l) => l.slug || l.name.trim());
  const total = filled.reduce(
    (n, l) =>
      n + (Number(l.unitPrice) || 0) * Math.max(1, Number(l.qty) || 1),
    0
  );
  const anyVat = filled.some((l) => l.plusVat);
  const ready =
    customer.name.trim() !== "" && customer.phone.trim() !== "" && filled.length > 0;

  const save = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await api("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          source,
          status,
          items: filled.map((l) =>
            l.slug
              ? {
                  slug: l.slug,
                  model: l.model,
                  unitPrice: l.unitPrice,
                  plusVat: l.plusVat,
                  qty: l.qty,
                }
              : {
                  name: l.name,
                  unitPrice: l.unitPrice,
                  plusVat: l.plusVat,
                  qty: l.qty,
                }
          ),
        }),
      });
      toast("Order created.", "success");
      onCreated();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New order"
      sub="For an order taken on a call, at the counter, or over WhatsApp."
      size="xl"
      align="start"
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* ---- customer ---- */}
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Customer
          </h3>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                autoFocus
                value={customer.name}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="Full name *"
                className={input}
              />
              <input
                value={customer.phone}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, phone: e.target.value }))
                }
                placeholder="Contact number *"
                className={input}
              />
            </div>
            <input
              value={customer.email}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, email: e.target.value }))
              }
              placeholder="Email (if they gave one)"
              type="email"
              className={input}
            />
            <input
              value={customer.address}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, address: e.target.value }))
              }
              placeholder="Delivery address"
              className={input}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={customer.city}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, city: e.target.value }))
                }
                placeholder="City"
                className={input}
              />
              <input
                value={customer.province}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, province: e.target.value }))
                }
                placeholder="Province"
                className={input}
              />
            </div>
            <textarea
              value={customer.notes}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, notes: e.target.value }))
              }
              placeholder="Notes — delivery instructions, what was agreed on the call…"
              rows={2}
              className={`${input} resize-none`}
            />
          </div>
        </section>

        {/* ---- items ---- */}
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Items
          </h3>
          <div className="space-y-2.5">
            {lines.map((line) => (
              <div
                key={line.key}
                className="space-y-2.5 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex gap-2">
                  <select
                    value={line.slug ? choiceValue(line.slug, line.model) : ""}
                    onChange={(e) => pick(line, e.target.value)}
                    disabled={catalogue === null}
                    className={`${input} flex-1 disabled:opacity-60`}
                  >
                    <option value="">
                      {catalogue === null
                        ? "Loading products…"
                        : "Something else — type it in"}
                    </option>
                    {(catalogue ?? []).map((p) => (
                      <optgroup
                        key={p.slug}
                        label={p.isPublished ? p.name : `${p.name} (draft)`}
                      >
                        {p.variants.map((v) => (
                          <option
                            key={v.model}
                            value={choiceValue(p.slug, v.model)}
                          >
                            {v.model}
                            {v.optionLabel ? ` · ${v.optionLabel}` : ""} —{" "}
                            {formatLKR(v.price)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      setLines((list) =>
                        list.length === 1
                          ? [blankLine()]
                          : list.filter((l) => l.key !== line.key)
                      )
                    }
                    aria-label="Remove item"
                    className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {!line.slug && (
                  <input
                    value={line.name}
                    onChange={(e) =>
                      setLine(line.key, { name: e.target.value })
                    }
                    placeholder="What is it? e.g. Replacement filter set"
                    className={input}
                  />
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLine(line.key, { unitPrice: e.target.value })
                    }
                    placeholder="Unit price (Rs)"
                    type="number"
                    min="0"
                    className={`${input} min-w-40 flex-1`}
                  />
                  <label className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={line.plusVat}
                      onChange={(e) =>
                        setLine(line.key, { plusVat: e.target.checked })
                      }
                      className="size-4 accent-green"
                    />
                    + VAT
                  </label>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-slate-400">Qty</span>
                    <input
                      value={line.qty}
                      onChange={(e) => setLine(line.key, { qty: e.target.value })}
                      type="number"
                      min="1"
                      className={`${input} w-20`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setLines((list) => [...list, blankLine()])}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Plus className="size-3.5" /> Add item
            </button>
            <p className="text-sm text-slate-500">
              Total{" "}
              <span className="font-semibold text-slate-800">
                {formatLKR(Math.round(total * 100) / 100)}
              </span>
              {anyVat && (
                <span className="ml-1 text-xs text-slate-400">
                  + VAT on some items
                </span>
              )}
            </p>
          </div>
        </section>

        {/* ---- how it came in ---- */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              How it came in
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as AdminOrderSource)}
              className={input}
            >
              {ADMIN_ORDER_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${input} capitalize`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>

      <button
        onClick={save}
        disabled={!ready || busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Create order
      </button>
      {!ready && (
        <p className="mt-2 text-center text-xs text-slate-400">
          A name, a contact number and at least one item are needed.
        </p>
      )}
    </Modal>
  );
}
