"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import Magnetic from "@/components/ui/Magnetic";
import Header from "@/components/layout/Header";
import { hero } from "@/lib/site";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if ((window as unknown as { __preloaderComplete?: boolean }).__preloaderComplete) {
      setIsLoaded(true);
      return;
    }

    const handleComplete = () => {
      setIsLoaded(true);
    };

    window.addEventListener("preloaderComplete", handleComplete);
    return () => window.removeEventListener("preloaderComplete", handleComplete);
  }, []);

  useGSAP(
    () => {
      if (!isLoaded) return;

      const tl = gsap.timeline({ defaults: { ease: "power4.out" }, delay: 0.15 });

      // Slide header down from top
      tl.fromTo(
        "[data-hero-header]",
        { y: -60, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.0 }
      );

      // Slide eyebrow from left
      tl.fromTo(
        "[data-hero-eyebrow]",
        { x: -50, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.8 },
        "-=0.75"
      );

      // Slide title lines from left
      tl.fromTo(
        "[data-hero-line] span",
        { x: -80, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 1.0, stagger: 0.1 },
        "-=0.6"
      );

      // Slide subtitle from left
      tl.fromTo(
        "[data-hero-sub]",
        { x: -40, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.8 },
        "-=0.6"
      );

      // Slide CTAs from left
      tl.fromTo(
        "[data-hero-cta]",
        { x: -30, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 },
        "-=0.55"
      );
    },
    { dependencies: [isLoaded], scope: root }
  );

  return (
    // 3px gap on every edge — the hero is a floating rounded card.
    <section ref={root} className="p-[3px]">
      <div className="relative flex min-h-[calc(100svh-6px)] flex-col overflow-hidden rounded-[2rem] border border-black/[0.06] bg-gradient-to-br from-mist via-white to-mist-200 px-[5%] py-5 shadow-[0_30px_80px_-40px_rgba(5,47,67,0.35)] sm:py-6 lg:py-8">
        {/* Cinematic background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-0"
        >
          <source src="/3D_particle_field_animation_wave…_202607020045.mp4" type="video/mp4" />
        </video>

        {/* High-end gradient mask fading from the top down (for navbar) */}
        <div 
          className="absolute inset-0 z-5 bg-gradient-to-b from-white via-white/80 via-25% to-transparent pointer-events-none"
        />

        {/* Subtle left-to-right gradient mask (for text copy readability) */}
        <div 
          className="absolute inset-y-0 left-0 w-[60%] z-5 bg-gradient-to-r from-white/90 via-white/35 to-transparent pointer-events-none"
        />

        {/* soft brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-[34rem] rounded-full bg-lime/20 blur-[120px] z-10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 size-[30rem] rounded-full bg-teal/10 blur-[120px] z-10"
        />

        {/* navbar lives inside the hero container */}
        <div className="relative z-40 opacity-0" data-hero-header>
          <Header embedded />
        </div>

        {/* hero content */}
        <div className="relative z-10 flex flex-1 items-center">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_0.85fr]">
            {/* left — minimal copy */}
            <div>
              <p
                data-hero-eyebrow
                className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-green/20 bg-green/[0.06] px-4 py-1.5 text-green opacity-0"
              >
                <span className="size-1.5 rounded-full bg-lime" />
                {hero.eyebrow}
              </p>

              <h1 className="display display-tight text-[clamp(2.6rem,6vw,4.8rem)] text-ink">
                {hero.headline.map((line) => (
                  <span
                    key={line}
                    data-hero-line
                    className="block overflow-hidden py-[0.02em]"
                  >
                    <span className="inline-block opacity-0">{line}</span>
                  </span>
                ))}
              </h1>

              <p
                data-hero-sub
                className="mt-5 max-w-xl text-base text-slate/60 sm:text-lg opacity-0"
              >
                {hero.sub}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div data-hero-cta className="inline-flex opacity-0">
                  <Magnetic strength={0.25}>
                    <Link
                      href={hero.primaryCta.href}
                      className="btn-lime inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-wider"
                    >
                      {hero.primaryCta.label} <ArrowUpRight className="size-4" />
                    </Link>
                  </Magnetic>
                </div>
                <div data-hero-cta className="inline-flex opacity-0">
                  <Magnetic strength={0.25}>
                    <Link
                      href={hero.secondaryCta.href}
                      className="btn-ghost inline-flex items-center justify-center px-7 py-4 text-sm uppercase tracking-wider text-slate"
                    >
                      {hero.secondaryCta.label}
                    </Link>
                  </Magnetic>
                </div>
              </div>
            </div>

            {/* right — spacer for visual structure on desktop */}
            <div className="relative hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
