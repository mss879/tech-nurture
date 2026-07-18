"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* Anonymous, cookie-free page-view tracking for the public site.
   A persistent visitor id (localStorage) powers the unique-visitor
   count; a per-tab session id (sessionStorage) groups a visit. The
   path is beaconed on first load and on every client-side navigation.
   Mounted only in the public site layout — the admin is never tracked. */

function getId(storage: Storage, key: string): string {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      storage.setItem(key, id);
    }
    return id;
  } catch {
    // storage blocked (private mode) — fall back to an ephemeral id
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function Tracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;

    const visitorId = getId(localStorage, "tn_vid");
    const sessionId = getId(sessionStorage, "tn_sid");

    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          path: pathname,
          referrer: document.referrer || null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // best-effort — never throw from analytics
    }
  }, [pathname]);

  return null;
}
