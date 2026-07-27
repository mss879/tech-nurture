"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Globe, LogOut, Menu, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { NAV_ITEMS, landingPathFor, navItemsFor } from "@/lib/admin/nav";
import { NAV_ICONS } from "@/components/admin/navIcons";
import NotificationBell from "@/components/admin/NotificationBell";
import type { AdminProfile } from "@/lib/admin/types";

type Counts = { chatsPending?: number; todosDue?: number };

export default function AdminSidebar({ me }: { me?: AdminProfile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [counts, setCounts] = useState<Counts>({});

  // Before the permission tables exist, `me` is absent and everyone sees the
  // full menu — the pre-014 behaviour.
  const items = me ? navItemsFor(me) : NAV_ITEMS;
  const home = me ? landingPathFor(me) : "/admin";

  // One poll for every sidebar badge, so a second badge doesn't mean a
  // second interval.
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await fetch("/api/admin/badges");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setCounts(data ?? {});
      } catch {
        // ignore
      }
    };
    check();
    const iv = setInterval(check, 20000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, []);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await createBrowserSupabase().auth.signOut();
    } catch {
      // ignore — still send them to the login screen
    }
    router.replace("/admin/login");
    router.refresh();
  };

  const links = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.key];
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const count = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? "bg-lime text-ink"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-4.5" />
            {item.label}
            {count > 0 && (
              <span
                className={`ml-auto grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                  active ? "bg-ink text-lime" : "bg-red-500 text-white"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Globe className="size-4.5" /> View website
      </Link>
      <button
        onClick={signOut}
        disabled={signingOut}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
      >
        <LogOut className="size-4.5" /> {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-ink px-5 py-3 lg:hidden">
        <Link href={home} className="flex items-center gap-2">
          <Image
            src="/tech-nature-side.png"
            alt="TechNurture"
            width={160}
            height={49}
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="rounded bg-lime/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-lime">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* the bell's other mount point — the topbar is desktop-only */}
          {me && <NotificationBell dark />}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle admin menu"
            className="grid size-9 place-items-center rounded-lg border border-white/15 text-white"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-[57px] z-40 flex max-h-[calc(100vh-57px)] flex-col overflow-y-auto border-t border-white/10 bg-ink p-4 lg:hidden">
          {links}
          {footer}
        </div>
      )}
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-4 py-6 lg:flex">
        <Link href={home} className="mb-8 flex items-center gap-2 px-2">
          <Image
            src="/tech-nature-side.png"
            alt="TechNurture"
            width={180}
            height={55}
            className="h-9 w-auto brightness-0 invert"
          />
          <span className="rounded bg-lime/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-lime">
            Admin
          </span>
        </Link>
        {links}
        {footer}
      </aside>
    </>
  );
}
