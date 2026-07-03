"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  PhoneCall,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useCart } from "./CartContext";
import { formatLKR } from "@/lib/products";
import { whatsappLink } from "@/lib/site";

const provinces = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function CheckoutClient() {
  const { items, remove, setQty, subtotal, hasVatItems, clear } = useCart();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [placedName, setPlacedName] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: provinces[0],
    notes: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const whatsappFallback = whatsappLink(
    `New order — TechNurture\n` +
      items.map((i) => `• ${i.name} (${i.model}) × ${i.qty}`).join("\n") +
      `\n\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}, ${form.city}`
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({ slug: i.slug, model: i.model, qty: i.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || "Something went wrong while placing your order."
        );
      }
      setPlacedName(form.name.split(" ")[0]);
      clear();
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-green focus:ring-1 focus:ring-green";
  const label = "mb-2 block text-sm font-medium text-slate-600";

  /* ---------- success screen ---------- */
  if (status === "success") {
    return (
      <section className="flex min-h-[70vh] items-center bg-slate-50 px-6 pb-20 pt-36 text-slate-800">
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-slate-200/60 bg-white p-10 text-center shadow-sm sm:p-14">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-green/10">
            <CheckCircle2 className="size-9 text-green" />
          </span>
          <h1 className="display mt-6 text-3xl text-slate-900 sm:text-4xl">
            Order received{placedName ? `, ${placedName}` : ""}!
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500">
            Thank you for your order.{" "}
            <span className="font-semibold text-slate-700">
              An agent will call you as soon as possible
            </span>{" "}
            to confirm your order, delivery and installation.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-5 py-2.5 text-sm text-slate-500">
            <PhoneCall className="size-4 text-green" />
            Keep your phone close — we usually call within business hours.
          </div>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="btn-lime inline-flex items-center justify-center px-7 py-3.5 text-sm"
            >
              Continue shopping
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-3.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- empty basket ---------- */
  if (items.length === 0) {
    return (
      <section className="flex min-h-[70vh] items-center bg-slate-50 px-6 pb-20 pt-36 text-slate-800">
        <div className="mx-auto w-full max-w-xl text-center">
          <ShoppingBag className="mx-auto size-12 text-slate-300" />
          <h1 className="display mt-6 text-3xl text-slate-900">
            Your basket is empty
          </h1>
          <p className="mt-3 text-slate-500">
            Add a purifier to your basket to place an order.
          </p>
          <Link
            href="/shop"
            className="btn-lime mt-8 inline-flex items-center justify-center px-7 py-3.5 text-sm"
          >
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  /* ---------- checkout form ---------- */
  return (
    <section className="bg-slate-50 px-6 pb-24 pt-32 text-slate-800 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-green"
        >
          <ChevronLeft className="size-4" /> Back to shop
        </Link>

        <h1 className="display text-3xl font-semibold text-slate-900 sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-3 max-w-xl text-slate-500">
          Fill in your details and place the order —{" "}
          <span className="font-medium text-slate-700">
            an agent will call you as soon as possible
          </span>{" "}
          to confirm everything before delivery.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* form */}
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="name">
                  Full name *
                </label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your name"
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="email">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className={field}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="phone">
                  Contact number *
                </label>
                <input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="07X XXX XXXX"
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="province">
                  Province
                </label>
                <select
                  id="province"
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                  className={`${field} appearance-none`}
                >
                  {provinces.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={label} htmlFor="address">
                Delivery address *
              </label>
              <input
                id="address"
                required
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street address"
                className={field}
              />
            </div>

            <div>
              <label className={label} htmlFor="city">
                City *
              </label>
              <input
                id="city"
                required
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="e.g. Colombo"
                className={field}
              />
            </div>

            <div>
              <label className={label} htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Preferred delivery time, installation notes…"
                className={`${field} resize-none`}
              />
            </div>

            {status === "error" && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{errorMsg}</p>
                <a
                  href={whatsappFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-semibold underline underline-offset-2"
                >
                  Or send your order via WhatsApp instead →
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn-lime inline-flex w-full items-center justify-center gap-2 px-7 py-4 text-sm uppercase tracking-wider disabled:opacity-60"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Placing order…
                </>
              ) : (
                <>Place Order</>
              )}
            </button>
            <p className="text-xs text-slate-400">
              No online payment needed — our agent confirms pricing, delivery
              and installation with you on the call.
            </p>
          </form>

          {/* summary */}
          <aside className="h-fit rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Order summary
            </h2>
            <ul className="mt-5 space-y-4">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white">
                    <Image
                      src={i.image}
                      alt={i.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium leading-tight text-slate-800">
                      {i.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Model {i.model} · {i.filtration}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-full border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setQty(i.id, i.qty - 1)}
                          aria-label="Decrease quantity"
                          className="grid size-6 place-items-center rounded-full transition hover:bg-slate-50"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-4 text-center text-xs">{i.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(i.id, i.qty + 1)}
                          aria-label="Increase quantity"
                          className="grid size-6 place-items-center rounded-full transition hover:bg-slate-50"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatLKR(i.price * i.qty)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i.id)}
                      className="mt-1 self-start text-[0.7rem] text-slate-400 underline-offset-2 hover:text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500">Subtotal</span>
                <span className="text-xl font-semibold text-slate-900">
                  {formatLKR(subtotal)}
                </span>
              </div>
              {hasVatItems && (
                <p className="mt-1 text-right text-xs text-slate-400">
                  + VAT applies to marked items
                </p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                Free installation up to 5m · Free delivery in Colombo &amp;
                suburbs · 2-year warranty with 3 free preventive services.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
