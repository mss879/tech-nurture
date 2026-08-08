import Link from "next/link";
import { Check } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { servicePlans, whatsappLink } from "@/lib/site";

export default function ServicePlans() {
  return (
    <section className="bg-mist py-24 text-slate sm:py-32 border-t border-slate/5">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <Reveal>
            <p className="eyebrow inline-flex items-center gap-2 text-green">
              <span className="size-1.5 rounded-full bg-green animate-pulse" />
              {servicePlans.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-4xl text-slate sm:text-6xl">
              {servicePlans.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg text-slate/60 leading-relaxed">
              {servicePlans.sub}
            </p>
          </Reveal>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {servicePlans.plans.map((plan, i) => {
            const isFeatured = plan.featured;
            
            return (
              <Reveal key={plan.id} delay={i * 0.08} as="div" className="h-full">
                <div
                  className={`flex flex-col h-full rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 ${
                    isFeatured
                      ? "bg-ink text-mist shadow-xl shadow-ink/10 hover:shadow-2xl hover:shadow-ink/20 border border-white/5"
                      : "bg-mist-200 text-slate shadow-sm border border-slate/10 hover:border-slate/20 hover:shadow-xl"
                  }`}
                >
                  {/* Top Badge / Spacing Spacer */}
                  <div className="h-8 mb-6 flex items-center">
                    {isFeatured ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink font-semibold">
                        {plan.badge}
                      </span>
                    ) : (
                      <div className="h-8" /> // Empty spacer for visual alignment
                    )}
                  </div>

                  {/* Plan Name */}
                  <h3
                    className={`text-3xl font-bold tracking-tight ${
                      isFeatured ? "text-white" : "text-ink"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  {/* Blurb / Description */}
                  <p
                    className={`mt-4 text-[0.95rem] leading-relaxed min-h-[50px] ${
                      isFeatured ? "text-mist/75" : "text-slate/65"
                    }`}
                  >
                    {plan.priceLabel}
                  </p>

                  {/* Divider */}
                  <div
                    className={`w-full h-px my-6 ${
                      isFeatured ? "bg-white/10" : "bg-slate/15"
                    }`}
                  />

                  {/* Features List */}
                  <ul className="space-y-4 flex-grow">
                    {plan.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 text-[0.95rem] leading-snug"
                      >
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                            isFeatured
                              ? "bg-lime/10 text-lime"
                              : "bg-green/10 text-green"
                          }`}
                        >
                          <Check className="size-3.5" />
                        </span>
                        <span className={isFeatured ? "text-mist/90" : "text-slate/85"}>
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* What the plan does NOT cover — stated up front rather
                      than discovered at the point of failure. */}
                  {plan.note && (
                    <p
                      className={`mt-6 border-t pt-4 text-xs leading-relaxed ${
                        isFeatured
                          ? "border-white/10 text-mist/55"
                          : "border-slate/10 text-slate/55"
                      }`}
                    >
                      {plan.note}
                    </p>
                  )}

                  {/* CTA Button */}
                  <Link
                    href={whatsappLink(
                      `Hi TechNurture, I'd like to enquire about the ${plan.name} plan.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 w-full py-4 px-6 rounded-full text-center text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                      isFeatured
                        ? "bg-lime text-ink hover:bg-lime-bright hover:shadow-lg hover:shadow-lime/20"
                        : "border border-ink/20 text-ink hover:bg-ink hover:text-lime hover:border-ink hover:shadow-md"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
