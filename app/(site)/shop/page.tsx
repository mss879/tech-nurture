import type { Metadata } from "next";
import { ShieldCheck, Truck, Wrench, Sparkles } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/shop/ProductCard";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Buy Water Purifiers Online in Sri Lanka — Lusako Prices & Models",
  description:
    "Buy genuine Lusako inline water purifiers online in Sri Lanka. Floor-standing and countertop models with hot, normal and cool faucets — see prices, choose UF or RO, and order with free installation.",
  keywords: [
    "buy water purifier Sri Lanka",
    "water purifier price Sri Lanka",
    "Lusako water purifier",
    "water dispenser hot and cold Sri Lanka",
    "RO water purifier price",
  ],
  alternates: { canonical: "/shop" },
};

const perks = [
  { icon: ShieldCheck, label: "Genuine Lusako units" },
  { icon: Wrench, label: "Free installation up to 5m" },
  { icon: Truck, label: "Free delivery Colombo & suburbs" },
  { icon: Sparkles, label: "2-year warranty · 3 free services" },
];

export default function ShopPage() {
  return (
    <>
      {/* compact shop header */}
      <section className="relative overflow-hidden bg-slate-50 px-6 pb-10 pt-32 text-slate-800 sm:pt-36 border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-2 text-slate-400">
            <span className="eyebrow">Home</span>
            <span className="eyebrow">/</span>
            <span className="eyebrow text-green">Shop</span>
          </div>
          <h1 className="display text-3xl font-semibold text-slate-900 sm:text-5xl">
            Shop Lusako Water Purifiers
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            Genuine Lusako inline water purifiers with hot, normal and cool
            faucets. Choose the UF model for city water or the RO model for
            city &amp; well water, add it to your basket and place your order —
            an agent will call you to confirm.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-slate-200/60 pt-6">
            {perks.map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-2 text-sm text-slate-500"
              >
                <p.icon className="size-4 text-green" />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* product grid */}
      <section className="bg-slate-50/50 pb-24 pt-12 text-slate-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <Reveal
                key={product.slug}
                delay={(i % 3) * 0.07}
                as="div"
                className="h-full"
              >
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ordering note */}
      <section className="bg-mist py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <h2 className="display text-3xl text-slate sm:text-5xl">
                How ordering works
              </h2>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Choose your model",
                  d: "Pick UF for city water or RO for city & well water, and add it to your basket.",
                },
                {
                  n: "02",
                  t: "Place your order",
                  d: "Checkout with your name, contact number and address — an agent calls you to confirm.",
                },
                {
                  n: "03",
                  t: "Install & support",
                  d: "Free installation up to 5m, 2-year warranty with 3 free services, and AMC after.",
                },
              ].map((s) => (
                <Reveal key={s.n} as="div">
                  <div className="flex h-full flex-col rounded-2xl bg-mist-200 p-6">
                    <span className="text-3xl font-semibold text-green">
                      {s.n}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                    <p className="mt-2 text-sm text-slate/60">{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
