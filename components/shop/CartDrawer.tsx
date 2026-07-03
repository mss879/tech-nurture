"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "./CartContext";
import { formatLKR } from "@/lib/products";

export default function CartDrawer() {
  const { items, open, closeCart, remove, setQty, count, subtotal, hasVatItems } =
    useCart();

  return (
    <>
      {/* overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[91] flex h-full w-full max-w-md flex-col bg-ink text-mist shadow-2xl transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-lime" />
            <h2 className="text-lg font-semibold">Your Basket ({count})</h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close basket"
            className="grid size-9 place-items-center rounded-full border border-white/15 transition hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-white/50">
              <ShoppingBag className="mb-4 size-10" />
              <p>Your basket is empty.</p>
              <p className="mt-1 text-sm">
                Choose a model and add it to your basket to place an order.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex gap-4 rounded-2xl bg-white/[0.04] p-3"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image
                      src={i.image}
                      alt={i.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium leading-tight">{i.name}</p>
                    <p className="mt-0.5 text-xs text-white/45">
                      Model {i.model} · {i.filtration}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-lime">
                      {formatLKR(i.price)}
                      {i.plusVat && (
                        <span className="ml-1 text-[0.65rem] font-normal text-white/40">
                          + VAT
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-white/15">
                        <button
                          onClick={() => setQty(i.id, i.qty - 1)}
                          aria-label="Decrease quantity"
                          className="grid size-7 place-items-center rounded-full transition hover:bg-white/10"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-sm">{i.qty}</span>
                        <button
                          onClick={() => setQty(i.id, i.qty + 1)}
                          aria-label="Increase quantity"
                          className="grid size-7 place-items-center rounded-full transition hover:bg-white/10"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.id)}
                        className="text-xs text-white/45 underline-offset-2 transition hover:text-lime hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-5">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-sm text-white/60">Subtotal</span>
            <span className="text-lg font-semibold">
              {formatLKR(subtotal)}
              {hasVatItems && (
                <span className="ml-1 text-xs font-normal text-white/40">
                  + VAT
                </span>
              )}
            </span>
          </div>
          <Link
            href="/shop/checkout"
            onClick={closeCart}
            aria-disabled={items.length === 0}
            className={`btn-lime flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm ${
              items.length === 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Proceed to Checkout <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-white/40">
            Place your order and an agent will call you to confirm delivery &
            installation.
          </p>
        </div>
      </aside>
    </>
  );
}
