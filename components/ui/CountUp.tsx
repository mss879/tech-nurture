"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function CountUp({
  to,
  suffix = "",
  className = "",
  duration = 2,
}: {
  to: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      /* The markup ships the FINAL number so the figure is real without JS and
         readable by crawlers — the server HTML used to say "0+". Reset to zero
         here (a layout effect, i.e. before paint) so the count-up still starts
         from nothing. */
      el.textContent = "0" + suffix;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: to,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = Math.round(obj.v).toString() + suffix;
        },
      });
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={className}>
      {to}
      {suffix}
    </span>
  );
}
