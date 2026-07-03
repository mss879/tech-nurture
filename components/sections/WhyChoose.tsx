import {
  Users,
  Zap,
  CalendarCheck,
  MapPin,
  PackageCheck,
  Handshake,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { whyChoose } from "@/lib/site";

const icons = [Users, Zap, CalendarCheck, MapPin, PackageCheck, Handshake];

export default function WhyChoose() {
  return (
    <section className="bg-mist py-24 text-slate sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green">
              <span className="size-1.5 rounded-full bg-green" />
              {whyChoose.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-4xl text-slate sm:text-5xl">
              {whyChoose.heading}
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyChoose.cards.map((c, i) => {
            const Icon = icons[i] ?? Users;
            const featured = i === 0;
            return (
              <Reveal key={c.title} delay={(i % 3) * 0.06} as="div">
                <div
                  className={`flex h-full flex-col rounded-[1.5rem] p-7 transition-transform duration-500 hover:-translate-y-1.5 ${
                    featured
                      ? "bg-lime text-ink"
                      : "bg-mist-200 text-slate"
                  }`}
                >
                  <span
                    className={`grid size-12 place-items-center rounded-xl ${
                      featured ? "bg-ink text-lime" : "bg-ink text-lime"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-8 text-xl font-semibold">{c.title}</h3>
                  <p
                    className={`mt-2 text-[0.95rem] leading-relaxed ${
                      featured ? "text-ink/75" : "text-slate/60"
                    }`}
                  >
                    {c.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
