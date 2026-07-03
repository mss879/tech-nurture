"use client";

import { useState } from "react";
import { Plus, Check, Droplets } from "lucide-react";
import { useCart } from "./CartContext";
import { formatLKR, type Product } from "@/lib/products";

export default function BuyPanel({ product }: { product: Product }) {
  const { add, items, openCart } = useCart();
  const [selected, setSelected] = useState(0);
  const variant = product.variants[selected];
  const cartId = `${product.slug}:${variant.model}`;
  const inCart = items.some((i) => i.id === cartId);

  return (
    <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
        Choose your model
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {product.variants.map((v, i) => (
          <button
            key={v.model}
            onClick={() => setSelected(i)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selected === i
                ? "border-green bg-green/5 ring-1 ring-green"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <Droplets
                className={`size-4 ${selected === i ? "text-green" : "text-slate-300"}`}
              />
              <span className="text-sm font-bold text-slate-800">
                {v.model}
              </span>
            </span>
            <span className="mt-1.5 block text-xs text-slate-500">
              {v.filtration} filtration — {v.recommendedFor}
            </span>
            <span className="mt-2 block text-sm font-semibold text-slate-900">
              {formatLKR(v.price)}
              {v.plusVat && (
                <span className="ml-1 text-[0.65rem] font-normal text-slate-400">
                  + VAT
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-700">
          {variant.filterStages}
        </span>
        <br />
        Recommended for {variant.recommendedFor.toLowerCase()}.
      </div>

      <button
        onClick={() => {
          if (inCart) {
            openCart();
            return;
          }
          add({
            id: cartId,
            slug: product.slug,
            name: product.name,
            model: variant.model,
            filtration: variant.filtration,
            category: product.category,
            image: product.images[0],
            price: variant.price,
            plusVat: variant.plusVat,
          });
        }}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition-all duration-300 ${
          inCart
            ? "bg-green text-white"
            : "bg-lime text-ink hover:bg-lime-bright hover:shadow-lg hover:shadow-lime/25"
        }`}
      >
        {inCart ? (
          <>
            <Check className="size-4" /> In basket — view basket
          </>
        ) : (
          <>
            <Plus className="size-4" /> Add {variant.model} to basket
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Place your order and an agent will call you as soon as possible.
      </p>
    </div>
  );
}
