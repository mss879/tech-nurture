import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Truck,
  Wrench,
  ShieldCheck,
  CalendarClock,
  Hammer,
} from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import Process from "@/components/sections/Process";
import ServicePlans from "@/components/sections/ServicePlans";
import ServiceAssurance from "@/components/sections/ServiceAssurance";
import { listedServices, site } from "@/lib/site";
import { serviceIcon } from "@/lib/service-icons";

export const metadata: Metadata = {
  title: "Installation, Maintenance & Repair Services",
  description:
    "Installation, preventive maintenance, breakdown repair and AMC for air conditioners, refrigerators, inline water purifiers and bottle water dispensers across Sri Lanka. All major brands, on-site or walk-in.",
  alternates: { canonical: "/services" },
};

/* What we do, independent of which appliance it is done to. The appliances
   themselves come from serviceCatalog; this is the capability list from the
   client's brief — two of these (relocation, inspection) are revenue lines
   the site had never mentioned anywhere. */
const capabilities = [
  {
    icon: Hammer,
    title: "Installation",
    body: "Sized, placed and commissioned properly the first time — the single biggest predictor of how long a unit lasts.",
  },
  {
    icon: CalendarClock,
    title: "Preventive maintenance",
    body: "Scheduled servicing that keeps efficiency up and turns most breakdowns into something you never find out about.",
  },
  {
    icon: Wrench,
    title: "Breakdown repairs",
    body: "Fast diagnosis and repair with quality replacement parts, so equipment is back in service rather than waiting on a decision.",
  },
  {
    icon: ShieldCheck,
    title: "Annual Maintenance Contracts",
    body: "Scheduled servicing, priority technical support and emergency breakdown cover at one predictable annual cost.",
  },
  {
    icon: Truck,
    title: "Relocation & reinstallation",
    body: "Dismantling, transport and reinstallation when an office or home moves — including the recommissioning most movers skip.",
  },
  {
    icon: ClipboardCheck,
    title: "Inspection & technical assessment",
    body: "An honest read on equipment condition, and whether repairing it is actually the cheaper option.",
  },
];

const whyChooseUs = [
  "Experienced & certified technical team",
  "Installation, maintenance & repairs",
  "All brands supported",
  "Genuine & quality spare parts",
  "Islandwide service coverage",
  "24/7 emergency assistance",
  "Digital service & breakdown history",
  "Transparent pricing",
  "Preventive maintenance programs",
  "Reliable after-sales support",
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Professional installation, maintenance & repair."
        sub="Whether you bought the equipment from us or from someone else, our technicians service it — air conditioning, refrigeration, inline water purification and bottled water dispensing, across Sri Lanka."
        page="Services"
      />

      {/* Intro */}
      <section className="bg-mist py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="display text-3xl text-slate sm:text-5xl">
              Complete solutions for the appliances you depend on.
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-7 text-lg leading-relaxed text-slate/70">
              TechNurture handles installation, maintenance, repair and Annual
              Maintenance Contracts for residential, commercial and industrial
              appliances. Most of the equipment we look after was supplied by
              somebody else — that has never been a reason to turn a job down.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-lg leading-relaxed text-slate/70">
              What we sell, in practice, is uptime. A hospital cannot run a ward
              on a cold room that failed overnight, and an office cannot put
              three hundred people back on bottled water because a dispenser
              started leaking. That shapes how we work: preventive schedules
              that catch faults early, and a technician who answers when a
              breakdown does happen.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Appliances we service — the preview grid; every card opens its own page */}
      <section className="bg-mist-200 py-20 text-slate sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green-600">
              <span className="size-1.5 rounded-full bg-green" /> Appliances We
              Service
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 max-w-2xl text-4xl text-slate sm:text-5xl">
              Pick the equipment, see exactly what we cover
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listedServices.map((s, i) => {
              const Icon = serviceIcon(s.icon);
              return (
                <Reveal key={s.slug} delay={i * 0.06} as="div">
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/[0.05] transition-colors duration-500 hover:bg-ink"
                  >
                    <div className="relative aspect-[3/2] w-full overflow-hidden">
                      <Image
                        src={s.image}
                        alt={s.imageAlt ?? s.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute left-5 top-5 grid size-12 place-items-center rounded-2xl bg-ink/90 text-lime backdrop-blur transition-colors duration-500 group-hover:bg-lime group-hover:text-ink">
                        <Icon className="size-5" />
                      </span>
                      <span className="eyebrow absolute right-5 top-5 rounded-full bg-ink/70 px-2.5 py-1 text-mist/80 backdrop-blur">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-8">
                      <h3 className="text-2xl font-semibold text-slate transition-colors duration-500 group-hover:text-mist">
                        {s.title}
                      </h3>
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-slate/60 transition-colors duration-500 group-hover:text-mist/65">
                        {s.summary}
                      </p>
                      <ul className="mt-6 grid flex-1 content-start gap-2 border-t border-slate/10 pt-5 transition-colors duration-500 group-hover:border-white/10">
                        {s.intro.highlights.map((h) => (
                          <li
                            key={h}
                            className="flex items-start gap-2 text-[0.82rem] text-slate/70 transition-colors duration-500 group-hover:text-mist/70"
                          >
                            <Check className="mt-0.5 size-3.5 shrink-0 text-green group-hover:text-lime" />
                            {h}
                          </li>
                        ))}
                      </ul>
                      <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-green-600 transition-colors duration-500 group-hover:text-lime">
                        Explore {s.title} <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* What we do on every appliance */}
      <section className="bg-mist py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green-600">
              <span className="size-1.5 rounded-full bg-green" /> Our Services
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 max-w-2xl text-4xl text-slate sm:text-5xl">
              Six things we do, on every appliance we cover
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06} as="div">
                <div className="flex h-full flex-col rounded-[1.5rem] bg-mist-200 p-7">
                  <span className="grid size-12 place-items-center rounded-xl bg-ink text-lime">
                    <c.icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-slate">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-slate/65">
                    {c.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* All major brands + on-site vs walk-in (shared with the service pages) */}
      <ServiceAssurance />

      {/* AMC plans */}
      <ServicePlans />

      {/* How we work — the client's 7-step journey */}
      <Process />

      {/* Why choose us */}
      <section className="bg-mist py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green-600">
              <span className="size-1.5 rounded-full bg-green" /> Why
              TechNurture
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 max-w-2xl text-4xl text-slate sm:text-5xl">
              What you get with us, every time
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {whyChooseUs.map((w, i) => (
              <Reveal key={w} delay={i * 0.03} as="li">
                <span className="flex items-start gap-3 border-b border-slate/10 pb-4 text-[1.05rem] text-slate/80">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-green/10 text-green-600">
                    <Check className="size-3.5" />
                  </span>
                  {w}
                </span>
              </Reveal>
            ))}
          </ul>
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
              Tell us what the appliance is doing and our team will tell you
              what it needs — island-wide across Sri Lanka.
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

      {/* Breadcrumb + service list structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: `https://${site.domain}`,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Services",
                    item: `https://${site.domain}/services`,
                  },
                ],
              },
              {
                "@type": "ItemList",
                name: "Appliance services",
                itemListElement: listedServices.map((s, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: s.title,
                  url: `https://${site.domain}/services/${s.slug}`,
                })),
              },
            ],
          }),
        }}
      />
    </>
  );
}
