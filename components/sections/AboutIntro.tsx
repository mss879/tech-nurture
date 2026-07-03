import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import { about } from "@/lib/site";

export default function AboutIntro() {
  return (
    <section className="relative overflow-hidden bg-mist py-24 text-slate sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
        {/* left copy */}
        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green">
              <span className="size-1.5 rounded-full bg-green" />
              {about.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-4xl text-slate sm:text-5xl">
              {about.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-slate/65">
              {about.body}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              href="/about"
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-sm font-medium uppercase tracking-wider text-lime transition hover:bg-navy"
            >
              Learn More
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        {/* right widget card */}
        <Reveal delay={0.1} className="lg:justify-self-end">
          <div className="relative w-full max-w-md rounded-[2rem] bg-ink p-3 shadow-2xl">
            <div className="rounded-[1.5rem] bg-mist-200 p-6">
              <p className="text-xl font-semibold text-slate">Performance</p>
              <p className="text-sm text-slate/55">In the past 7 days</p>
            </div>
            <div className="px-6 py-8">
              <div className="flex items-end gap-3">
                <span className="text-6xl font-semibold text-lime">
                  <CountUp to={49} suffix="%" />
                </span>
                <span className="mb-3 flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-mist">
                  <TrendingUp className="size-3 text-lime" /> +2.5%
                </span>
              </div>
              <p className="mt-1 text-sm text-mist/60">
                Average efficiency gain after a service
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["RO + UV", "AC Service", "AMC Plans", "Genuine Parts"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/10 px-4 py-2 text-xs text-mist"
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
