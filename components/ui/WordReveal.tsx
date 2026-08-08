"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Reveals a paragraph word-by-word as it scrolls through the
 * viewport (the "statement" effect from the reference design).
 */
export default function WordReveal({
  text,
  className = "",
  highlight = [],
}: {
  text: string;
  className?: string;
  highlight?: string[];
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const spans = el.querySelectorAll("[data-word] > span");
      gsap.fromTo(
        spans,
        { opacity: 0.12, y: 8 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          stagger: 0.2,
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "bottom 55%",
            scrub: 1,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const clean = w.replace(/[.,]/g, "").toLowerCase();
        const isHl = highlight.includes(clean);
        return (
          <span key={i} data-word className="inline-block">
            <span
              className={`inline-block ${isHl ? "text-lime" : ""}`}
              style={{ marginRight: "0.28em" }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </p>
  );
}
