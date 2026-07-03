import type { Metadata } from "next";
import Image from "next/image";
import { Target, Eye, Quote } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import { about, stats, trustCards, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "TechNurture Pvt Ltd — a subsidiary of Lusako Holdings, delivering reliable water purification and air conditioning solutions across Sri Lanka for over a decade.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title={
          <>
            Nurturing technology.
            <br className="hidden sm:inline" /> Delivering confidence.
          </>
        }
        sub={site.trustLine}
        page="About"
      />

      {/* story */}
      <section className="bg-mist py-24 text-slate sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="eyebrow flex items-center gap-2 text-green">
                <span className="size-1.5 rounded-full bg-green" /> Our Story
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display mt-6 text-4xl text-slate sm:text-5xl">
                Built on a decade of trusted service.
              </h2>
            </Reveal>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-slate/65">
            <Reveal>
              <p>{about.story}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <p>{about.heritage}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* stats band */}
      <section className="bg-ink py-20 text-mist">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-3">
          {stats.map((s) => (
            <Reveal key={s.label} as="div" className="text-center">
              <div className="text-6xl font-semibold text-lime">
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-mist/60">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* mission & vision */}
      <section className="bg-mist py-24 text-slate sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2">
          <Reveal as="div">
            <div className="flex h-full flex-col rounded-[1.75rem] bg-ink p-9 text-mist">
              <span className="grid size-14 place-items-center rounded-2xl bg-lime text-ink">
                <Target className="size-6" />
              </span>
              <h3 className="mt-8 text-2xl font-semibold">Our Mission</h3>
              <p className="mt-3 text-mist/65">{about.mission}</p>
            </div>
          </Reveal>
          <Reveal as="div" delay={0.08}>
            <div className="flex h-full flex-col rounded-[1.75rem] bg-gradient-to-br from-green to-teal p-9 text-white">
              <span className="grid size-14 place-items-center rounded-2xl bg-white/15">
                <Eye className="size-6" />
              </span>
              <h3 className="mt-8 text-2xl font-semibold">Our Vision</h3>
              <p className="mt-3 text-white/85">{about.vision}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* values */}
      <section className="bg-mist pb-24 text-slate">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="display text-3xl text-slate sm:text-4xl">
              Core values that guide every project
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {about.values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 5) * 0.05} as="div">
                <div className="flex h-full flex-col rounded-2xl bg-mist-200 p-6">
                  <span className="text-3xl font-semibold text-green">
                    0{i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-slate/60">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* trust cards */}
      <section className="bg-ink py-24 text-mist sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-lime">
              <span className="size-1.5 rounded-full bg-lime" /> Why customers
              trust us
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {trustCards.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08} as="div">
                <div className="h-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8">
                  <Quote className="size-7 text-lime" />
                  <h3 className="mt-6 text-xl font-semibold">{c.title}</h3>
                  <p className="mt-3 text-mist/60">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
