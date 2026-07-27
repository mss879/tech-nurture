import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Package } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { getCategories, getProducts } from "@/lib/products.server";
import { formatLKR, lowestPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Product Range — Genuine Filters, Consumables & Spare Parts",
  description:
    "Browse TechNurture's full product range: genuine filters, RO membranes, UV lamps, consumables, spare parts and cooling systems — selected for reliability and long-term performance.",
  keywords: [
    "genuine water filter Sri Lanka",
    "RO membrane replacement",
    "water purifier spare parts",
    "AC spare parts Sri Lanka",
    "UV lamp replacement",
  ],
  alternates: { canonical: "/products" },
};

/* The range overview: one panel per category, driven entirely by what the
   admin has published. Each panel links into /shop filtered to that
   category. */
export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  const panels = categories
    .map((category) => ({
      category,
      items: products.filter((p) => p.categorySlug === category.slug),
    }))
    .filter((panel) => panel.items.length > 0);

  // Anything published without a category still deserves to be found.
  const uncategorised = products.filter((p) => !p.categorySlug);

  return (
    <>
      <PageHero
        eyebrow="Products"
        title="Reliable products, carefully selected."
        sub="Whether you need a new installation, replacement parts or consumable filters, our team recommends the most suitable solution for your needs."
        page="Products"
      />

      <section className="bg-mist py-20 text-slate sm:py-28">
        <div className="mx-auto max-w-7xl space-y-6 px-6">
          {panels.length === 0 && uncategorised.length === 0 ? (
            <div className="rounded-[2rem] bg-mist-200 px-8 py-16 text-center">
              <Package className="mx-auto size-10 text-slate/30" />
              <p className="mt-4 text-slate/60">
                Our range is being updated. Get in touch and our team will
                recommend the right product for you.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-lime transition hover:bg-navy"
              >
                Ask an Expert <ArrowUpRight className="size-4" />
              </Link>
            </div>
          ) : (
            panels.map(({ category, items }, i) => {
              const reverse = i % 2 === 1;
              const cover = items.find((p) => p.images[0])?.images[0];
              const from = items
                .map(lowestPrice)
                .filter((p): p is number => p != null);

              return (
                <Reveal key={category.slug} as="div">
                  <div className="grid items-stretch gap-0 overflow-hidden rounded-[2rem] bg-mist-200 lg:grid-cols-2">
                    <div
                      className={`flex flex-col justify-center p-8 sm:p-12 ${
                        reverse ? "lg:order-2" : ""
                      }`}
                    >
                      <span className="grid size-14 place-items-center rounded-2xl bg-ink text-lime">
                        <Package className="size-6" />
                      </span>
                      <h2 className="display mt-6 text-3xl text-slate sm:text-4xl">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="mt-3 max-w-md text-slate/60">
                          {category.description}
                        </p>
                      )}
                      <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        {items.slice(0, 6).map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={`/shop/${item.slug}`}
                              className="flex items-center gap-2 text-sm text-slate/75 transition hover:text-green"
                            >
                              <ArrowUpRight className="size-4 shrink-0 text-green" />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {from.length > 0 && (
                        <p className="mt-5 text-sm font-semibold text-slate">
                          From {formatLKR(Math.min(...from))}
                        </p>
                      )}
                      <Link
                        href={`/shop?category=${category.slug}`}
                        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-lime transition hover:bg-navy"
                      >
                        Shop {category.name} <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                    <div
                      className={`relative min-h-[280px] bg-white ${
                        reverse ? "lg:order-1" : ""
                      }`}
                    >
                      {cover && (
                        <Image
                          src={cover}
                          alt={category.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain p-8"
                        />
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}

          {uncategorised.length > 0 && (
            <Reveal as="div">
              <div className="rounded-[2rem] bg-mist-200 p-8 sm:p-12">
                <h2 className="display text-3xl text-slate sm:text-4xl">
                  More products
                </h2>
                <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {uncategorised.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/shop/${item.slug}`}
                        className="flex items-center gap-2 text-sm text-slate/75 transition hover:text-green"
                      >
                        <ArrowUpRight className="size-4 shrink-0 text-green" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink py-20 text-mist">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="display text-3xl sm:text-4xl">
              Not sure which model fits?
            </h2>
            <p className="mt-3 max-w-lg text-mist/60">
              Our technical team can identify the correct product or replacement
              part for your equipment and ensure professional installation.
            </p>
          </div>
          <Link
            href="/contact"
            className="btn-lime shrink-0 px-7 py-4 text-sm uppercase tracking-wider"
          >
            Ask an Expert
          </Link>
        </div>
      </section>
    </>
  );
}
