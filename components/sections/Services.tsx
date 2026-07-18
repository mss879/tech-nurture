import Link from "next/link";
import { AirVent, Refrigerator, WashingMachine, Wrench, ArrowUpRight, Check } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { services } from "@/lib/site";

const iconMap: Record<string, React.ElementType> = {
  air: AirVent,
  fridge: Refrigerator,
  washer: WashingMachine,
  wrench: Wrench,
};

// map each homepage card to its dedicated service page
const slugMap: Record<string, string> = {
  air: "air-conditioning",
  fridge: "refrigerator",
  washer: "washing-machine",
  wrench: "maintenance-amc",
};

export default function Services() {
  return (
    <section className="bg-mist py-24 text-slate sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Reveal>
              <p className="eyebrow flex items-center gap-2 text-green">
                <span className="size-1.5 rounded-full bg-green" />
                {services.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display mt-6 text-4xl text-slate sm:text-6xl">
                {services.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-lg text-lg text-slate/60">
                {services.sub}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-medium uppercase tracking-wider text-lime transition hover:bg-navy"
            >
              View Services <ArrowUpRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        {/* Three repair services in a row, Maintenance & AMC as a wide card below */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.cards.slice(0, 3).map((card, i) => {
            const Icon = iconMap[card.icon] ?? Wrench;
            const slug = slugMap[card.icon] ?? "";
            return (
              <Reveal key={card.title} delay={i * 0.08} as="div">
                <Link
                  href={`/services/${slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-mist-200 p-7 transition-colors duration-500 hover:bg-ink"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-14 place-items-center rounded-2xl bg-ink text-lime transition-colors duration-500 group-hover:bg-lime group-hover:text-ink">
                      <Icon className="size-6" />
                    </span>
                    <span className="eyebrow text-slate/30 transition-colors duration-500 group-hover:text-mist/30">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold text-slate transition-colors duration-500 group-hover:text-mist">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-slate/60 transition-colors duration-500 group-hover:text-mist/65">
                    {card.body}
                  </p>
                  <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate/10 pt-5 transition-colors duration-500 group-hover:border-white/10">
                    {card.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-1.5 text-[0.8rem] text-slate/70 transition-colors duration-500 group-hover:text-mist/70"
                      >
                        <Check className="size-3.5 shrink-0 text-green group-hover:text-lime" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green transition-colors duration-500 group-hover:text-lime">
                    Learn more <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* Maintenance & AMC — full-width horizontal card */}
        {services.cards[3] && (
          <Reveal as="div" delay={0.24} className="mt-5">
            <Link
              href={`/services/${slugMap[services.cards[3].icon] ?? ""}`}
              className="group relative flex flex-col gap-7 overflow-hidden rounded-[1.75rem] bg-mist-200 p-7 transition-colors duration-500 hover:bg-ink lg:flex-row lg:items-center lg:gap-10 lg:p-9"
            >
              {/* left — icon + title + body */}
              <div className="flex items-start gap-5 lg:w-[34%] lg:shrink-0">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-lime transition-colors duration-500 group-hover:bg-lime group-hover:text-ink">
                  <Wrench className="size-6" />
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-semibold text-slate transition-colors duration-500 group-hover:text-mist">
                      {services.cards[3].title}
                    </h3>
                    <span className="eyebrow text-slate/30 transition-colors duration-500 group-hover:text-mist/30">
                      04
                    </span>
                  </div>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-slate/60 transition-colors duration-500 group-hover:text-mist/65">
                    {services.cards[3].body}
                  </p>
                </div>
              </div>

              {/* middle — plans as a tidy 2×2 grid */}
              <div className="border-t border-slate/10 pt-6 transition-colors duration-500 group-hover:border-white/10 lg:flex-1 lg:border-l lg:border-t-0 lg:px-9 lg:pt-0">
                <ul className="grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
                  {services.cards[3].points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2.5 text-sm text-slate/75 transition-colors duration-500 group-hover:text-mist/75"
                    >
                      <Check className="size-4 shrink-0 text-green group-hover:text-lime" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* right — CTA pill, vertically centered */}
              <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-6 py-3 text-sm font-medium text-lime transition-colors duration-500 group-hover:bg-lime group-hover:text-ink lg:self-center">
                Learn more <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
