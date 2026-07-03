"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { process } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Process() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const total = process.steps.length;

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
      steps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 60%",
          end: "bottom 60%",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });
        gsap.fromTo(
          step,
          { autoAlpha: 0.25, x: 40 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 80%", once: true },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative bg-ink py-24 text-mist sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <p className="eyebrow flex items-center gap-2 text-lime">
          <span className="size-1.5 rounded-full bg-lime" />
          {process.eyebrow}
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          {/* sticky counter */}
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <h2 className="display text-4xl sm:text-5xl">{process.heading}</h2>
            <div className="mt-12 flex items-end gap-4">
              <span className="text-[7rem] font-semibold leading-none text-lime tabular-nums sm:text-[10rem]">
                {String(active + 1).padStart(2, "0")}
              </span>
              <span className="mb-4 text-2xl text-mist/40">
                / {String(total).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${((active + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          {/* steps */}
          <ol className="space-y-5">
            {process.steps.map((s, i) => (
              <li
                key={s.n}
                data-step
                className={`rounded-[1.5rem] border p-7 transition-colors duration-500 ${
                  active === i
                    ? "border-lime/40 bg-white/[0.06]"
                    : "border-white/10 bg-transparent"
                }`}
              >
                <div className="flex items-start gap-5">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-full text-lg font-semibold transition-colors duration-500 ${
                      active === i
                        ? "bg-lime text-ink"
                        : "bg-white/5 text-mist/50"
                    }`}
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold sm:text-2xl">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-mist/60">{s.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
