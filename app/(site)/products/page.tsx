import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowUpRight, Droplets, Wind, Filter, Wrench } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { productCategories } from "@/lib/site";

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

const categoryIcon: Record<string, React.ElementType> = {
  "water-purifiers": Droplets,
  "air-conditioning": Wind,
  "filters-consumables": Filter,
  "spare-parts": Wrench,
};

const categoryImage: Record<string, string> = {
  "water-purifiers": "/products/dispenser-counter-front.jpeg",
  "air-conditioning": "/products/dispenser-counter-angle.jpeg",
  "filters-consumables": "/products/dispenser-floor-front.jpeg",
  "spare-parts": "/products/dispenser-floor-side.jpeg",
};

export default function ProductsPage() {
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
          {productCategories.map((cat, i) => {
            const Icon = categoryIcon[cat.slug] ?? Droplets;
            const reverse = i % 2 === 1;
            return (
              <Reveal key={cat.slug} as="div">
                <div className="grid items-stretch gap-0 overflow-hidden rounded-[2rem] bg-mist-200 lg:grid-cols-2">
                  <div
                    className={`flex flex-col justify-center p-8 sm:p-12 ${
                      reverse ? "lg:order-2" : ""
                    }`}
                  >
                    <span className="grid size-14 place-items-center rounded-2xl bg-ink text-lime">
                      <Icon className="size-6" />
                    </span>
                    <h2 className="display mt-6 text-3xl text-slate sm:text-4xl">
                      {cat.title}
                    </h2>
                    <p className="mt-3 max-w-md text-slate/60">{cat.intro}</p>
                    <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                      {cat.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm text-slate/75"
                        >
                          <Check className="size-4 shrink-0 text-green" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/shop"
                      className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-lime transition hover:bg-navy"
                    >
                      Shop Range <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                  <div
                    className={`relative min-h-[280px] bg-white ${
                      reverse ? "lg:order-1" : ""
                    }`}
                  >
                    <Image
                      src={categoryImage[cat.slug]}
                      alt={cat.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-8"
                    />
                  </div>
                </div>
              </Reveal>
            );
          })}
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
