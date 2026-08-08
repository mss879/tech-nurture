import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import { listedServices, site } from "@/lib/site";

/* Root not-found. It renders under app/layout.tsx, NOT app/(site)/layout.tsx,
   so the header and footer of the site group are not available here — hence
   the self-contained layout below. No `robots` export: Next already serves
   this with a 404 status, which search engines treat as noindex. */

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-ink px-6 py-24 text-mist">
      <div className="mx-auto w-full max-w-3xl">
        <p className="eyebrow text-lime">404 — Page not found</p>
        <h1 className="display mt-6 text-4xl sm:text-6xl">
          That page isn&apos;t here.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist/65">
          The link may be out of date, or the page may have moved. Here is
          everything we service — or call us and we&apos;ll point you in the
          right direction.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/"
            className="btn-lime px-7 py-3.5 text-sm uppercase tracking-wider"
          >
            Back to home
          </Link>
          <a
            href={site.phoneHref}
            className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 text-sm uppercase tracking-wider text-white"
          >
            <Phone className="size-4" /> {site.phone}
          </a>
        </div>

        <ul className="mt-14 grid gap-x-8 gap-y-3 border-t border-white/10 pt-8 sm:grid-cols-2">
          {listedServices.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/services/${s.slug}`}
                className="group inline-flex items-center gap-1.5 text-mist/70 transition hover:text-lime"
              >
                {s.title}
                <ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-1.5 text-mist/70 transition hover:text-lime"
            >
              Contact & quotation
              <ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
          <li>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 text-mist/70 transition hover:text-lime"
            >
              Blog & articles
              <ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
