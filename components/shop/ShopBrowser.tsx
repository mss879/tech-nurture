"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/shop/ProductCard";
import type { Category, Product, Tag } from "@/lib/products";

/* The shop grid plus its filters.

   Filtering happens in the browser over the already-loaded catalogue —
   it's a small list, and this keeps every filter click instant instead of
   a round trip. Category narrows; tags widen (a product matching ANY
   selected tag is shown), which is how a shopper expects chips to behave. */
export default function ShopBrowser({
  products,
  categories,
  tags,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  tags: Tag[];
  initialCategory?: string;
}) {
  const [category, setCategory] = useState<string | null>(
    initialCategory ?? null
  );
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Only offer categories that actually have something in them.
  const usedCategories = useMemo(
    () =>
      categories.filter((c) =>
        products.some((p) => p.categorySlug === c.slug)
      ),
    [categories, products]
  );

  const visible = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.categorySlug !== category) return false;
        if (activeTags.length === 0) return true;
        return p.tagSlugs.some((t) => activeTags.includes(t));
      }),
    [products, category, activeTags]
  );

  const toggleTag = (slug: string) =>
    setActiveTags((list) =>
      list.includes(slug) ? list.filter((t) => t !== slug) : [...list, slug]
    );

  const filtering = category !== null || activeTags.length > 0;

  return (
    <>
      {(usedCategories.length > 0 || tags.length > 0) && (
        <div className="mb-10 space-y-4">
          {usedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === null
                    ? "bg-ink text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                All products
              </button>
              {usedCategories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    category === c.slug
                      ? "bg-ink text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Filter
              </span>
              {tags.map((t) => {
                const on = activeTags.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    onClick={() => toggleTag(t.slug)}
                    aria-pressed={on}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      on
                        ? "bg-green text-white"
                        : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
              {filtering && (
                <button
                  onClick={() => {
                    setCategory(null);
                    setActiveTags([]);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 underline-offset-4 transition hover:text-green hover:underline"
                >
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200/60 bg-white px-6 py-20 text-center">
          <p className="text-slate-500">
            {products.length === 0
              ? "Our products are being added — please check back shortly, or contact us and we'll help you choose."
              : "Nothing matches those filters."}
          </p>
          {filtering && products.length > 0 && (
            <button
              onClick={() => {
                setCategory(null);
                setActiveTags([]);
              }}
              className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Show all products
            </button>
          )}
        </div>
      ) : (
        <>
          {filtering && (
            <p className="mb-5 text-sm text-slate-400">
              {visible.length} {visible.length === 1 ? "product" : "products"}
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product, i) => (
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
        </>
      )}
    </>
  );
}
