import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, ArrowUpRight, ArrowRight } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { serviceCatalog, getService, site, whatsappLink } from "@/lib/site";
import { serviceIcon } from "@/lib/service-icons";
import ServiceAssurance from "@/components/sections/ServiceAssurance";


export function generateStaticParams() {
  return serviceCatalog.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    keywords: service.keywords,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: `/services/${service.slug}`,
      type: "website",
      images: [service.image],
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const Icon = serviceIcon(service.icon);
  const related = service.related
    .map((r) => getService(r))
    .filter(Boolean) as NonNullable<ReturnType<typeof getService>>[];

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.h1 ?? service.title}
        sub={service.tagline}
        page={service.title}
      />

      {/* Section 1 — overview */}
      <section className="bg-mist py-20 text-slate sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal>
              <span className="grid size-14 place-items-center rounded-2xl bg-ink text-lime">
                <Icon className="size-6" />
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display mt-6 text-3xl text-slate sm:text-5xl">
                {service.intro.heading}
              </h2>
            </Reveal>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate/65">
              {service.intro.body.map((p, i) => (
                <Reveal key={i} as="p" delay={0.05 + i * 0.05}>
                  {p}
                </Reveal>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {service.intro.highlights.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1.5 rounded-full bg-mist-200 px-3.5 py-1.5 text-sm text-slate/75"
                >
                  <Check className="size-3.5 text-green" />
                  {h}
                </span>
              ))}
            </div>
          </div>
          <Reveal as="div" delay={0.1}>
            <div className="relative overflow-hidden rounded-[2rem] border border-black/[0.06] shadow-[0_20px_50px_-20px_rgba(5,47,67,0.15)] bg-mist-200">
              {/* The LCP element on every service page. Without `sizes` a
                  phone fetched the 1920px variant for a ~343px slot. */}
              <Image
                src={service.image}
                alt={service.imageAlt ?? service.title}
                width={900}
                height={600}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-[360px] w-full object-cover sm:h-[460px] transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section 2 — what we offer */}
      <section className="bg-ink py-20 text-mist sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-lime">
              <span className="size-1.5 rounded-full bg-lime" /> What we offer
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 max-w-2xl text-3xl text-mist sm:text-5xl">
              Everything your {service.title.toLowerCase()} needs, in one team.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {service.offerings.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.06} as="div">
                <div className="h-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 transition hover:border-lime/40 hover:bg-white/[0.05]">
                  <span className="eyebrow text-lime/70">0{i + 1}</span>
                  <h3 className="mt-4 text-xl font-semibold">{o.title}</h3>
                  <p className="mt-3 text-mist/60">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — how we work */}
      <section className="bg-mist py-20 text-slate sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green">
              <span className="size-1.5 rounded-full bg-green" /> How we work
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-3xl text-slate sm:text-5xl">
              A simple, transparent process.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {service.steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06} as="div">
                <div className="flex h-full flex-col rounded-2xl bg-mist-200 p-7">
                  <span className="text-3xl font-semibold text-green">{s.n}</span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate/60">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* All-brands + on-site vs walk-in (from the client's services brief) */}
      <ServiceAssurance />

      {/* Section 4 — related services (cross-links) + CTA */}
      <section className="bg-ink py-20 text-mist sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-lime">
              <span className="size-1.5 rounded-full bg-lime" /> Explore more services
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-3xl text-mist sm:text-4xl">
              One partner for every system you depend on.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {related.map((r, i) => {
              const RIcon = serviceIcon(r.icon);
              return (
                <Reveal key={r.slug} delay={i * 0.06} as="div">
                  <Link
                    href={`/services/${r.slug}`}
                    className="group flex h-full items-center gap-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-7 transition hover:border-lime/40 hover:bg-white/[0.05]"
                  >
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-lime/10 text-lime transition group-hover:bg-lime group-hover:text-ink">
                      <RIcon className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{r.title}</h3>
                      <p className="mt-1 text-sm text-mist/55">{r.summary}</p>
                    </div>
                    <ArrowRight className="ml-auto size-5 shrink-0 text-mist/40 transition group-hover:translate-x-1 group-hover:text-lime" />
                  </Link>
                </Reveal>
              );
            })}
          </div>

          {/* CTA band */}
          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-br from-navy via-teal to-green-600 p-9 sm:flex-row sm:items-center sm:p-12">
            <div>
              <h3 className="display text-2xl text-white sm:text-3xl">
                Ready to get started?
              </h3>
              <p className="mt-2 max-w-lg text-white/80">
                Book a free site inspection or request a quotation for {service.title.toLowerCase()} today.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/contact"
                className="btn-lime px-7 py-3.5 text-sm uppercase tracking-wider"
              >
                Book Inspection
              </Link>
              <a
                href={whatsappLink(
                  `Hi ${site.name}, I'd like to enquire about ${service.title}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 text-sm uppercase tracking-wider text-white"
              >
                WhatsApp Us <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Service structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.h1 ?? service.title,
            description: service.metaDescription,
            serviceType: service.title,
            areaServed: { "@type": "Country", name: "Sri Lanka" },
            provider: {
              "@type": "LocalBusiness",
              name: site.legal,
              url: `https://${site.domain}`,
              telephone: site.phone,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Colombo",
                addressCountry: "LK",
              },
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: `${service.title} services`,
              itemListElement: service.offerings.map((o) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: o.title,
                  description: o.body,
                },
              })),
            },
            url: `https://${site.domain}/services/${service.slug}`,
          }),
        }}
      />
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
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
              {
                "@type": "ListItem",
                position: 3,
                name: service.title,
                item: `https://${site.domain}/services/${service.slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
