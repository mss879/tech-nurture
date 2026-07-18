import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { nav, site, creator, serviceCatalog, whatsappLink } from "@/lib/site";
import SocialLinks from "@/components/layout/SocialLinks";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pt-20 text-mist">
      <div className="mx-auto max-w-7xl px-6">
        {/* Big CTA band */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-teal to-green-600 p-10 sm:p-16">
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow text-lime">Let&apos;s talk</p>
            <h2 className="display mt-4 text-4xl text-white sm:text-6xl">
              Need urgent technical assistance?
            </h2>
            <p className="mt-5 max-w-lg text-white/80">
              Our service team is ready to help. Book a free site inspection or
              request a quotation today — island-wide across Sri Lanka.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="btn-lime px-7 py-3.5 text-sm uppercase tracking-wider"
              >
                Book a Site Inspection
              </Link>
              <a
                href={whatsappLink(
                  "Hi TechNurture, I'd like to request a quotation."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 text-sm uppercase tracking-wider text-white"
              >
                <MessageCircle className="size-4" /> WhatsApp Us
              </a>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-72 rounded-full bg-lime/30 blur-3xl"
            aria-hidden
          />
        </div>

        {/* Links */}
        <div className="grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center">
              <Image
                src="/tech-nature-side.png"
                alt="TechNurture"
                width={440}
                height={135}
                className="h-12 w-auto sm:h-14 lg:h-16"
                style={{ height: "auto" }}
              />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              {site.tagline}. Expert repair and maintenance for air
              conditioners, refrigerators and washing machines — a subsidiary
              of {site.parent}.
            </p>
            <SocialLinks className="mt-6" />
          </div>

          <div>
            <p className="eyebrow text-white/40">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-white/70 transition hover:text-lime"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow text-white/40">Services</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {serviceCatalog.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-white/70 transition hover:text-lime"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-white/70 transition hover:text-lime"
                >
                  All Services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-white/40">Contact</p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <a
                  href={site.phoneHref}
                  className="flex items-center gap-2.5 transition hover:text-lime"
                >
                  <Phone className="size-4 text-lime" /> {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-2.5 transition hover:text-lime"
                >
                  <Mail className="size-4 text-lime" /> {site.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-lime" /> {site.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 py-7 text-xs text-white/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.regName} · Company Reg. No.{" "}
            {site.regNo}. All rights reserved.
          </p>

          {/* Creator credit — dofollow backlink to ARC AI */}
          <a
            href={creator.url}
            target="_blank"
            rel="noopener external"
            title={`${creator.name} — ${creator.tagline}`}
            aria-label={`Designed and created by ${creator.name} — ${creator.tagline}. Visit ${creator.domain}`}
            className="group flex items-center gap-1.5 transition text-white/50 hover:text-lime"
          >
            <span>Designed &amp; created by</span>
            <img
              src={creator.logo}
              alt={`${creator.name} — ${creator.tagline}`}
              className="h-8 w-auto opacity-80 transition group-hover:opacity-100 translate-y-0.5"
            />
          </a>

          <p className="eyebrow text-white/30">{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
