import type { Metadata } from "next";
import Link from "next/link";
import { AirVent, Refrigerator, WashingMachine, Wrench, ArrowUpRight, Check } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { serviceCatalog, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore TechNurture's professional appliance services across Sri Lanka — air conditioning, refrigerator and washing machine repair, plus annual maintenance contracts. Island-wide coverage, trained technicians.",
  alternates: { canonical: "/services" },
};

const iconMap: Record<string, React.ElementType> = {
  air: AirVent,
  fridge: Refrigerator,
  washer: WashingMachine,
  wrench: Wrench,
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Expertise you can build on."
        sub="From installation to lifelong maintenance, we deliver dependable solutions grounded in over a decade of field experience — for homes, businesses and institutions across Sri Lanka."
        page="Services"
      />

      <section className="bg-mist py-20 text-slate sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {serviceCatalog.map((s, i) => {
              const Icon = iconMap[s.icon] ?? Wrench;
              return (
                <Reveal key={s.slug} delay={i * 0.08} as="div">
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-mist-200 p-8 transition-colors duration-500 hover:bg-ink"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid size-14 place-items-center rounded-2xl bg-ink text-lime transition-colors duration-500 group-hover:bg-lime group-hover:text-ink">
                        <Icon className="size-6" />
                      </span>
                      <span className="eyebrow text-slate/30 transition-colors duration-500 group-hover:text-mist/30">
                        0{i + 1}
                      </span>
                    </div>
                    <h2 className="mt-10 text-2xl font-semibold text-slate transition-colors duration-500 group-hover:text-mist">
                      {s.title}
                    </h2>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-slate/60 transition-colors duration-500 group-hover:text-mist/65">
                      {s.summary}
                    </p>
                    <ul className="mt-6 grid gap-2 border-t border-slate/10 pt-5 transition-colors duration-500 group-hover:border-white/10">
                      {s.intro.highlights.slice(0, 4).map((h) => (
                        <li
                          key={h}
                          className="flex items-center gap-2 text-[0.82rem] text-slate/70 transition-colors duration-500 group-hover:text-mist/70"
                        >
                          <Check className="size-3.5 shrink-0 text-green group-hover:text-lime" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-green transition-colors duration-500 group-hover:text-lime">
                      Explore service <ArrowUpRight className="size-4" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink py-20 text-mist">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="display text-3xl sm:text-4xl">
              Not sure what you need?
            </h2>
            <p className="mt-3 max-w-lg text-mist/60">
              Tell us about your requirement and our team will recommend the
              right solution — island-wide across {site.address.split(",").pop()?.trim()}.
            </p>
          </div>
          <Link
            href="/contact"
            className="btn-lime shrink-0 px-7 py-4 text-sm uppercase tracking-wider"
          >
            Talk to an Expert
          </Link>
        </div>
      </section>
    </>
  );
}
