import type { Metadata } from "next";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/shop/ContactForm";
import { site, faqs, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get a quotation, book a free inspection or request a repair or maintenance visit. Island-wide air conditioning, refrigeration and water purification service across Sri Lanka.",
  alternates: { canonical: "/contact" },
};

const contactCards = [
  {
    icon: Phone,
    label: "Call us",
    value: site.phone,
    href: site.phoneHref,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with our team",
    href: whatsappLink("Hi TechNurture, I'd like to make an inquiry."),
  },
  {
    icon: Mail,
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's get started."
        sub="Request a free site inspection, get a quotation or book a maintenance visit. We'll respond promptly — wherever you are in Sri Lanka."
        page="Contact"
      />

      <section className="bg-mist-200 py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* quick contact cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {contactCards.map((c, i) => (
              <Reveal key={c.label} delay={i * 0.06} as="div">
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-6 transition hover:border-green/30 hover:shadow-[0_10px_35px_rgba(5,47,67,0.06)]"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                    <c.icon className="size-5" />
                  </span>
                  <div>
                    <p className="eyebrow text-slate/50">{c.label}</p>
                    <p className="mt-1 font-semibold text-ink">{c.value}</p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* form */}
            <Reveal>
              <div className="rounded-[2rem] border border-black/[0.06] bg-white p-7 sm:p-10 shadow-[0_20px_50px_rgba(5,47,67,0.04)] text-ink">
                <h2 className="display text-3xl sm:text-4xl text-ink">
                  Request a quotation
                </h2>
                <p className="mt-3 text-slate/60">
                  Tell us what you need and we&apos;ll get back to you with a
                  tailored solution.
                </p>
                <div className="mt-8">
                  <ContactForm />
                </div>
              </div>
            </Reveal>

            {/* info */}
            <div className="space-y-6">
              <Reveal as="div">
                <div className="rounded-[1.75rem] bg-gradient-to-br from-green to-teal p-8 text-white shadow-[0_20px_50px_rgba(5,47,67,0.15)]">
                  <MapPin className="size-7" />
                  <h3 className="mt-5 text-xl font-semibold">Visit us</h3>
                  <p className="mt-2 text-white/85">{site.address}</p>
                  <div className="mt-5 flex items-center gap-2 text-white/85">
                    <Clock className="size-4" />
                    <span className="text-sm">{site.hours}</span>
                  </div>
                </div>
              </Reveal>
              <Reveal as="div" delay={0.08}>
                <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-8 shadow-[0_20px_50px_rgba(5,47,67,0.04)] text-ink">
                  <h3 className="text-xl font-semibold">Island-wide service</h3>
                  <p className="mt-2 text-slate/60">
                    We provide installation, maintenance and technical support
                    across all nine provinces of Sri Lanka.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-mist py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green">
              <span className="size-1.5 rounded-full bg-green" /> FAQ
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-4xl text-slate sm:text-5xl">
              Frequently asked questions
            </h2>
          </Reveal>
          <div className="mt-10 divide-y divide-slate/10">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-slate">
                  {f.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mist-200 text-green transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-slate/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
