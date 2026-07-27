"use client";

import NotificationBell from "@/components/admin/NotificationBell";
import type { AdminProfile } from "@/lib/admin/types";
import { isSuperAdmin } from "@/lib/admin/types";

/* Desktop-only bar above the page content. On mobile the equivalent
   controls live in the bar inside AdminSidebar.

   This is the first place the admin shows *who you are*, which matters
   once more than one person can sign in. */
export default function AdminTopbar({
  me,
  children,
}: {
  me: AdminProfile;
  children?: React.ReactNode;
}) {
  const superAdmin = isSuperAdmin(me);
  const name = me.full_name?.trim() || me.email || "Signed in";

  return (
    <header className="sticky top-0 z-30 hidden items-center justify-end gap-3 border-b border-slate-200 bg-slate-100/90 px-8 py-3 backdrop-blur lg:flex lg:px-10">
      {children}
      <NotificationBell />
      <div className="flex items-center gap-2.5 rounded-full bg-white py-1 pl-1 pr-3.5 ring-1 ring-slate-200">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
            superAdmin ? "bg-lime text-ink" : "bg-slate-200 text-slate-600"
          }`}
        >
          {initials(name)}
        </span>
        <span className="min-w-0">
          <span className="block max-w-[14rem] truncate text-sm font-medium leading-tight text-slate-800">
            {name}
          </span>
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wider leading-tight text-slate-400">
            {superAdmin ? "Super admin" : "Team member"}
          </span>
        </span>
      </div>
    </header>
  );
}

function initials(name: string) {
  const parts = name.replace(/@.*$/, "").split(/[\s._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0] ?? "");
  return (letters.join("") || "?").toUpperCase();
}
