"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  KanbanSquare,
  Globe,
  Menu,
  X,
} from "lucide-react";

const menu = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
  { label: "CRM", href: "/admin/crm", icon: KanbanSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1">
      {menu.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
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
            <item.icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-ink px-5 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
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
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle admin menu"
          className="grid size-9 place-items-center rounded-lg border border-white/15 text-white"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-[57px] z-40 border-t border-white/10 bg-ink p-4 lg:hidden">
          {links}
          <Link
            href="/"
            className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 hover:text-white"
          >
            <Globe className="size-4.5" /> View website
          </Link>
        </div>
      )}
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
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
        <div className="mt-auto border-t border-white/10 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Globe className="size-4.5" /> View website
          </Link>
        </div>
      </aside>
    </>
  );
}
