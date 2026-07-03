"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { nav, site } from "@/lib/site";
import Magnetic from "@/components/ui/Magnetic";

export default function Header({ embedded = false }: { embedded?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The homepage renders its own <Header embedded /> inside the hero card.
  // The global floating header only appears on the homepage when scrolled.
  if (!embedded && pathname === "/" && !isSticky) return null;

  const logo = (
    <Link href="/" className="flex items-center" aria-label="TechNurture home">
      <Image
        src="/tech-nature-side.png"
        alt="TechNurture"
        width={440}
        height={135}
        className="h-10 w-auto transition-all duration-300 sm:h-12 lg:h-14"
        priority
      />
    </Link>
  );

  const desktopNav = (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 xl:flex">
      {nav.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const children = "children" in item ? item.children : undefined;

        if (children) {
          return (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={`eyebrow flex items-center gap-1 rounded-lg px-4 py-2 font-bold transition-colors ${
                  active ? "text-green" : "text-slate/75 hover:text-navy"
                }`}
              >
                {item.label}
                <ChevronDown className="size-3.5 transition-transform duration-300 group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-xl">
                  {children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        pathname === c.href
                          ? "bg-mist text-green"
                          : "text-slate/80 hover:bg-mist hover:text-navy"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`eyebrow rounded-lg px-4 py-2 font-bold transition-colors ${
              active ? "text-green" : "text-slate/75 hover:text-navy"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const rightActions = (
    <div className="flex items-center gap-3">
      <Magnetic strength={0.2} className="hidden sm:inline-block">
        <Link
          href="/shop"
          className="btn-lime inline-flex items-center px-5 py-2.5 text-[0.78rem] uppercase tracking-wider"
        >
          Shop Now
        </Link>
      </Magnetic>

      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
        className="grid size-10 place-items-center rounded-full border border-slate-200 text-slate transition hover:border-slate-300 hover:bg-slate-50 xl:hidden"
      >
        {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
    </div>
  );

  const mobileMenu = (
    <div
      className={`origin-top rounded-3xl border border-slate-200/70 bg-white p-4 shadow-xl transition-all duration-300 xl:hidden ${
        menuOpen
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0"
      }`}
    >
      <nav className="flex flex-col">
        {nav.map((item) => {
          const children = "children" in item ? item.children : undefined;
          return (
            <div key={item.href} className="border-b border-slate-100 last:border-0">
              <Link
                href={item.href}
                className="block px-3 py-3 text-lg font-semibold text-slate hover:text-green"
              >
                {item.label}
              </Link>
              {children && (
                <div className="mb-2 ml-3 flex flex-col gap-1 border-l border-slate-100 pl-3">
                  {children
                    .filter((c) => c.href !== item.href)
                    .map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="py-1.5 text-sm text-slate/70 hover:text-green"
                      >
                        {c.label}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          );
        })}
        <Link
          href="/shop"
          className="btn-lime mt-3 grid place-items-center px-5 py-3 text-sm uppercase tracking-wider"
        >
          Shop Now
        </Link>
        <a
          href={site.phoneHref}
          className="mt-2 grid place-items-center px-5 py-2 text-sm text-slate/70"
        >
          {site.phone}
        </a>
      </nav>
    </div>
  );

  // ---- Embedded: sits inside the hero container, at the top ----
  if (embedded) {
    return (
      <div
        className={`relative z-40 transition-all duration-300 ${
          isSticky ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {logo}
          {desktopNav}
          {rightActions}
        </div>
        <div className="absolute inset-x-0 top-[calc(100%+0.75rem)]">
          {mobileMenu}
        </div>
      </div>
    );
  }

  // ---- Floating: default header on all interior pages, and homepage on scroll ----
  return (
    <>
      <header
        className={`pointer-events-auto z-45 mx-auto flex max-w-7xl items-center justify-between rounded-2xl border bg-white/95 px-6 py-1.5 shadow-md backdrop-blur-md transition-all duration-300 sm:py-2
          ${isSticky
            ? "fixed inset-x-4 top-4 sm:inset-x-6 sm:top-6 lg:inset-x-8 lg:top-8 border-slate-200/50"
            : "absolute inset-x-4 top-4 sm:inset-x-6 sm:top-6 lg:inset-x-8 lg:top-8 border-slate-200/30"
          }`}
      >
        {logo}
        {desktopNav}
        {rightActions}
      </header>

      <div
        className={`pointer-events-auto z-40 inset-x-4 transition-all duration-300
          ${isSticky
            ? "fixed top-[72px] sm:top-[80px]"
            : "absolute top-[72px] sm:top-[80px]"
          }`}
      >
        {mobileMenu}
      </div>
    </>
  );
}
