"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

const targetWord = "WELCOME";
const glyphs = "X&?*+!Ø#@%{}<>[]/\\|+=~_";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    targetWord.split("").map(() => glyphs[Math.floor(Math.random() * glyphs.length)])
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    // Disable scrolling during load
    document.body.style.overflow = "hidden";

    // Preload video in the background
    const videoReq = new XMLHttpRequest();
    videoReq.open("GET", "/hero-vid.mp4", true);
    videoReq.responseType = "blob";
    videoReq.send();

    // Background orbs slow drift
    gsap.to(".bg-orb-1", {
      x: "25vw",
      y: "15vh",
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(".bg-orb-2", {
      x: "-25vw",
      y: "-15vh",
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(".bg-orb-3", {
      x: "15vw",
      y: "-10vh",
      duration: 14,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Animate turbulence frequency in background
    let animationFrameId: number;
    let uTime = 0;
    const tick = () => {
      uTime += 0.015;
      if (turbulenceRef.current) {
        const baseFreqX = 0.03 + Math.sin(uTime) * 0.006;
        const baseFreqY = 0.06 + Math.cos(uTime * 0.8) * 0.006;
        turbulenceRef.current.setAttribute("baseFrequency", `${baseFreqX} ${baseFreqY}`);
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();

    // Core progress timeline
    const progressObj = { value: 0 };
    const loadingTimeline = gsap.timeline({
      onComplete: () => {
        // Exit Sequence
        const exitTl = gsap.timeline({
          onComplete: () => {
            // Re-enable scroll
            document.body.style.overflow = "";
            (window as any).__preloaderComplete = true;
            window.dispatchEvent(new Event("preloaderComplete"));
          },
        });

        exitTl
          .to([textRef.current, counterRef.current, progressLineRef.current], {
            opacity: 0,
            y: -25,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.inOut",
          })
          // Melt the text outward as it fades
          .to(
            displacementRef.current,
            {
              attr: { scale: 140 },
              duration: 0.6,
              ease: "power2.in",
            },
            0
          )
          .to(
            containerRef.current,
            {
              yPercent: -100,
              duration: 1.0,
              ease: "power4.inOut",
            },
            "-=0.3"
          );
      },
    });

    // Morph the SVG displacement scale from 120 (highly distorted) to 0 (crisp text)
    loadingTimeline.to(
      displacementRef.current,
      {
        attr: { scale: 0 },
        duration: 3.8,
        ease: "power2.inOut",
      },
      0
    );

    // Count progress from 0% to 100%
    loadingTimeline.to(
      progressObj,
      {
        value: 100,
        duration: 4.0,
        ease: "power2.out",
        onUpdate: () => {
          const currentProgress = Math.round(progressObj.value);
          setProgress(currentProgress);

          // Calculate scramble characters
          const ratio = currentProgress / 100;
          const nextChars = targetWord.split("").map((char, index) => {
            const threshold = index / targetWord.length;
            // Fully lock in letters once past their progress threshold
            if (ratio >= threshold + 0.1) {
              return char;
            }
            // Give a flicker chance when close to threshold
            if (ratio > threshold - 0.1 && Math.random() > 0.45) {
              return char;
            }
            // Scramble glyph
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          });
          setDisplayChars(nextChars);
        },
      },
      0
    );

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sync visual bar width
  useEffect(() => {
    if (progressLineRef.current) {
      gsap.to(progressLineRef.current, {
        width: `${progress}%`,
        duration: 0.2,
        ease: "power1.out",
      });
    }
  }, [progress]);

  return (
    <div
      ref={containerRef}
      className="noise fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-mist select-none overflow-hidden"
      style={{ willChange: "transform" }}
    >
      {/* Background ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="bg-orb-1 absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal/20 blur-[100px] mix-blend-screen" />
        <div className="bg-orb-2 absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-lime/10 blur-[100px] mix-blend-screen" />
        <div className="bg-orb-3 absolute top-[30%] left-[35%] w-[30vw] h-[30vw] rounded-full bg-green/10 blur-[80px] mix-blend-screen" />
      </div>

      {/* SVG Liquid Warp Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" focusable="false">
        <defs>
          <filter id="liquid-warp">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.03 0.06"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="noise"
              scale="120"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Center text wrapper */}
      <div className="flex flex-col items-center justify-center pointer-events-none z-10 select-none">
        <span className="eyebrow text-lime/60 mb-6 tracking-[0.3em] text-[10px] sm:text-xs">
          INITIALIZING CONNECTION
        </span>

        <h1
          ref={textRef}
          className="text-6xl sm:text-8xl md:text-9xl font-black tracking-[0.18em] select-none text-center flex items-center justify-center font-display"
          style={{ filter: "url(#liquid-warp)" }}
        >
          {displayChars.map((char, index) => {
            const isGlyph = char !== targetWord[index];
            return (
              <span
                key={index}
                className={`inline-block transition-all duration-75 mx-[0.02em] ${
                  isGlyph
                    ? "text-lime/30 font-mono scale-95 opacity-40"
                    : "bg-gradient-to-r from-lime via-green to-teal bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(143,209,63,0.35)]"
                }`}
              >
                {char}
              </span>
            );
          })}
        </h1>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-16 left-8 right-8 max-w-lg mx-auto flex flex-col gap-3 w-[calc(100%-4rem)] pointer-events-none z-10">
        <div className="flex justify-between items-end text-xs font-mono tracking-wider opacity-60">
          <span>GENERATIVE ALIGNMENT</span>
          <span ref={counterRef}>{progress}%</span>
        </div>
        {/* Progress Line Track */}
        <div className="h-[1px] w-full bg-white/10 rounded-full overflow-hidden">
          {/* Active Progress Line */}
          <div
            ref={progressLineRef}
            className="h-full bg-lime w-0 rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
