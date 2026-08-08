"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phone, RotateCcw } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";

/* Route-level error boundary for the public site. Without this, an unhandled
   render error on any public page falls through to the framework's default
   screen — no branding, no way to reach us. A visitor who hits this is a
   visitor we were about to lose, so the phone number is the point. */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col justify-center bg-ink px-6 py-24 text-mist">
      <div className="mx-auto w-full max-w-2xl">
        <p className="eyebrow text-lime">Something went wrong</p>
        <h1 className="display mt-6 text-4xl sm:text-5xl">
          We couldn&apos;t load this page.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-mist/65">
          Try again in a moment. If you need us now, call or message the team
          directly — we&apos;ll pick it up from there.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="btn-lime inline-flex items-center gap-2 px-7 py-3.5 text-sm uppercase tracking-wider"
          >
            <RotateCcw className="size-4" /> Try again
          </button>
          <a
            href={site.phoneHref}
            className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 text-sm uppercase tracking-wider text-white"
          >
            <Phone className="size-4" /> {site.phone}
          </a>
          <a
            href={whatsappLink("Hi TechNurture, I had trouble on your website.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-7 py-3.5 text-sm uppercase tracking-wider text-white"
          >
            WhatsApp
          </a>
        </div>

        <p className="mt-10 text-sm text-mist/45">
          <Link href="/" className="underline transition hover:text-lime">
            Back to home
          </Link>
          {error.digest ? ` · Reference ${error.digest}` : ""}
        </p>
      </div>
    </main>
  );
}
