"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Check, ArrowUpRight } from "lucide-react";
import { useCart } from "./CartContext";
import { formatLKR, type Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const { add, items } = useCart();
  const [selected, setSelected] = useState(0);
  // A product can be published before its models or photos are filled in.
  const variant = product.variants[selected] ?? null;
  const cartId = variant ? `${product.slug}:${variant.model}` : "";
  const inCart = variant && items.some((i) => i.id === cartId);
  const cover = product.images[0];

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {/* image */}
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-gradient-to-b from-white to-slate-50/50"
      >
        {cover ? (
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-6 transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-xs text-slate-300">
            Photo coming soon
          </span>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-wide text-lime backdrop-blur"
            >
              {t}
            </span>
          ))}
        </div>
      </Link>

      {/* body */}
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow text-slate-400">{product.category}</p>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mt-2 text-lg font-semibold text-slate-800 transition-colors hover:text-green">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {product.blurb}
        </p>

        {/* model selector */}
        <div className={product.variants.length > 0 ? "mt-5" : "hidden"}>
          <p className="mb-2 text-[0.7rem] uppercase tracking-wider text-slate-400">
            Choose your model
          </p>
          <div className="grid grid-cols-2 gap-2">
            {product.variants.map((v, i) => (
              <button
                key={v.model}
                onClick={() => setSelected(i)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                  selected === i
                    ? "border-green bg-green/5 ring-1 ring-green"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block text-xs font-semibold text-slate-800">
                  {v.model}
                </span>
                <span className="block text-[0.65rem] text-slate-400">
                  {v.filtration} · {v.recommendedFor}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-[0.7rem] uppercase tracking-wider text-slate-400">
              Price
            </p>
            <p className="font-semibold text-slate-900">
              {variant ? (
                <>
                  {formatLKR(variant.price)}
                  {variant.plusVat && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      + VAT
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium text-slate-400">
                  On request
                </span>
              )}
            </p>
          </div>
          {variant ? (
            <button
              onClick={() =>
                add({
                  id: cartId,
                  slug: product.slug,
                  name: product.name,
                  model: variant.model,
                  filtration: variant.filtration,
                  category: product.category,
                  image: cover ?? "",
                  price: variant.price,
                  plusVat: variant.plusVat,
                })
              }
              aria-label={`Add ${product.name} (${variant.model}) to basket`}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 ${
                inCart
                  ? "bg-green text-white"
                  : "bg-lime text-ink hover:bg-lime-bright hover:shadow-md hover:shadow-lime/20"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="size-4" /> Added
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Add
                </>
              )}
            </button>
          ) : (
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Enquire
            </Link>
          )}
        </div>

        <Link
          href={`/shop/${product.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-green underline-offset-4 hover:underline"
        >
          Full specs & gallery <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
