import {
  Landmark,
  HeartPulse,
  Hotel,
  Building2,
  GraduationCap,
  Factory,
  ShoppingCart,
   Landmark as Gov,
  Home,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import { partnershipsIntro, stats, industries } from "@/lib/site";

const icons: Record<string, React.ElementType> = {
  Banks: Landmark,
  Hospitals: HeartPulse,
  Hotels: Hotel,
  Offices: Building2,
  Education: GraduationCap,
  Manufacturing: Factory,
  Retail: ShoppingCart,
  Government: Gov,
  Residential: Home,
};

export default function Industries() {
  const loop = [...industries, ...industries];

  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.5fr_1.5fr]">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-lime">
              <span className="size-1.5 rounded-full bg-lime" />
              {partnershipsIntro.eyebrow}
            </p>
          </Reveal>

          <div>
            <Reveal>
              <h2 className="display text-4xl text-lime sm:text-6xl">
                {partnershipsIntro.title}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-mist/60">
                {partnershipsIntro.body}
              </p>
            </Reveal>

            {/* stats */}
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {stats.map((s) => (
                <Reveal key={s.label} as="div">
                  <div className="text-5xl font-semibold text-lime sm:text-6xl">
                    <CountUp to={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-mist/55">{s.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* industries marquee */}
      <div className="relative mt-20 flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee-track paused gap-5 pr-5">
          {loop.map((name, i) => {
            const Icon = icons[name] ?? Building2;
            return (
              <div
                key={`${name}-${i}`}
                className="flex h-24 w-60 shrink-0 items-center gap-4 rounded-2xl bg-white px-7 text-ink"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mist text-green">
                  <Icon className="size-5" />
                </span>
                <span className="text-lg font-semibold">{name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
