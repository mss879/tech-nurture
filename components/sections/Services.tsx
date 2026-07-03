import Link from "next/link";
import { Droplets, Wind, ShieldCheck, ArrowUpRight, Check } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { services } from "@/lib/site";

const iconMap: Record<string, React.ElementType> = {
  droplet: Droplets,
  wind: Wind,
  shield: ShieldCheck,
};

// map each homepage card to its dedicated service page
const slugMap: Record<string, string> = {
  droplet: "water-purification",
  wind: "air-conditioning",
  shield: "maintenance-amc",
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

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {services.cards.map((card, i) => {
            const Icon = iconMap[card.icon] ?? Droplets;
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
      </div>
    </section>
  );
}
