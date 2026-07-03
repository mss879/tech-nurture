"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Leaf } from "lucide-react";

/* An abstract, continuously-looping "living system" animation.
   Deliberately generic — orbiting nodes, a sweeping scan and
   pulsing rings — so it never implies a fixed set of services. */
export default function HeroVisual() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // orbits (one full cycle ≈ 6.5s)
      gsap.to("[data-orbit-a]", { rotate: 360, duration: 6.5, repeat: -1, ease: "none", transformOrigin: "200px 200px" });
      gsap.to("[data-orbit-b]", { rotate: -360, duration: 9, repeat: -1, ease: "none", transformOrigin: "200px 200px" });

      // rotating rings + radar sweep
      gsap.to("[data-ring-a]", { rotate: 360, duration: 22, repeat: -1, ease: "none", transformOrigin: "200px 200px" });
      gsap.to("[data-ring-b]", { rotate: -360, duration: 30, repeat: -1, ease: "none", transformOrigin: "200px 200px" });
      gsap.to("[data-sweep]", { rotate: 360, duration: 6.5, repeat: -1, ease: "none", transformOrigin: "200px 200px" });

      // pulse rings
      gsap.utils.toArray<SVGCircleElement>("[data-pulse]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { attr: { r: 66 }, opacity: 0.4 },
          { attr: { r: 150 }, opacity: 0, duration: 3.2, repeat: -1, ease: "sine.out", delay: i * 1.05 }
        );
      });

      // hub breathe + floating particles
      gsap.to("[data-hub]", { scale: 1.06, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.utils.toArray<HTMLElement>("[data-particle]").forEach((p, i) => {
        gsap.to(p, {
          y: i % 2 ? 14 : -14,
          x: i % 3 ? 10 : -10,
          duration: 3 + (i % 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative aspect-square w-full max-w-md select-none" aria-hidden>
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="hv-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.16" />
            <stop offset="70%" stopColor="var(--color-green)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hv-sweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-green)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="400" height="400" fill="url(#hv-glow)" />

        {/* radar sweep wedge */}
        <g data-sweep>
          <path d="M200 200 L330 125 A150 150 0 0 1 330 275 Z" fill="url(#hv-sweep)" />
        </g>

        {/* pulse rings */}
        <circle data-pulse cx="200" cy="200" r="66" fill="none" stroke="var(--color-green)" strokeWidth="1" />
        <circle data-pulse cx="200" cy="200" r="66" fill="none" stroke="var(--color-teal)" strokeWidth="1" />
        <circle data-pulse cx="200" cy="200" r="66" fill="none" stroke="var(--color-lime-dark)" strokeWidth="1" />

        {/* static + rotating guide rings */}
        <circle cx="200" cy="200" r="90" fill="none" stroke="var(--color-green)" strokeOpacity="0.12" strokeWidth="1" />
        <g data-ring-a>
          <circle cx="200" cy="200" r="120" fill="none" stroke="var(--color-teal)" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="2 10" />
        </g>
        <g data-ring-b>
          <circle cx="200" cy="200" r="150" fill="none" stroke="var(--color-green)" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="1 13" />
        </g>

        {/* orbit A — 3 nodes at r=120 */}
        <g data-orbit-a>
          <circle cx="320" cy="200" r="6" fill="var(--color-lime-dark)" />
          <circle cx="140" cy="303.9" r="4.5" fill="var(--color-teal)" />
          <circle cx="140" cy="96.1" r="5" fill="var(--color-green)" />
        </g>

        {/* orbit B — 2 nodes at r=150 */}
        <g data-orbit-b>
          <circle cx="200" cy="50" r="3.5" fill="var(--color-green)" fillOpacity="0.7" />
          <circle cx="200" cy="350" r="3.5" fill="var(--color-lime-dark)" fillOpacity="0.7" />
        </g>
      </svg>

      {/* floating particles */}
      {["left-[14%] top-[28%]", "left-[80%] top-[22%]", "left-[72%] top-[68%]", "left-[22%] top-[62%]"].map((p) => (
        <span key={p} data-particle className={`absolute ${p} size-1.5 rounded-full bg-green/40`} />
      ))}

      {/* central hub */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          data-hub
          className="grid size-[4.4rem] place-items-center rounded-2xl bg-gradient-to-br from-green to-teal text-white shadow-[0_16px_44px_-10px_var(--color-green)]"
        >
          <Leaf className="size-8" />
        </div>
      </div>
    </div>
  );
}
