"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

/* Decides whether the welcome sequence runs, and loads it only if so.

   The decision lives here, in a component with no heavy imports, because the
   overlay pulls in three.js — around 140 KB gzipped. It used to be imported
   statically by the site layout, so every page (including /checkout) paid for
   it whether or not it ever ran. Below, `dynamic(..., { ssr: false })` keeps
   that chunk out of every route except a first homepage visit.

   Three reasons to skip:
     · not the homepage — inner pages should load straight into content
     · the visitor prefers reduced motion (SmoothScroll and LiquidBackground
       already honour this; the most motion-heavy element on the site didn't)
     · already seen this session — a brand intro on every return visit is
       just latency wearing a nice coat

   Whenever it is skipped, `preloaderComplete` must still fire: the hero holds
   its entrance animation until that event arrives. */

const PreloaderOverlay = dynamic(() => import("./Preloader"), { ssr: false });

const SEEN_KEY = "tn:intro-seen";

function shouldPlay(pathname: string) {
  if (pathname !== "/") return false;
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
    return false;
  try {
    if (sessionStorage.getItem(SEEN_KEY) === "1") return false;
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private mode / storage blocked — playing it once is harmless.
  }
  return true;
}

export default function PreloaderGate() {
  const pathname = usePathname();
  /* `null` until mounted. Two of the three checks (reduced motion, session
     storage) are browser-only, so deciding during render would make the first
     client render disagree with the server HTML — a hydration error. Staying
     undecided through SSR and the first paint keeps them identical, and has
     the side benefit that the hero is on screen from the very first frame. */
  const [play, setPlay] = useState<boolean | null>(null);

  useEffect(() => {
    const yes = shouldPlay(pathname);
    setPlay(yes);
    if (yes) return;
    (
      window as unknown as { __preloaderComplete?: boolean }
    ).__preloaderComplete = true;
    window.dispatchEvent(new Event("preloaderComplete"));
    // Deliberately mount-only: the intro belongs to the landing page load, not
    // to later client-side navigations back to /.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return play ? <PreloaderOverlay /> : null;
}
