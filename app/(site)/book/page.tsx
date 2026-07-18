import type { Metadata } from "next";
import { CalendarCheck, Clock, MapPin, PhoneCall } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import BookingForm from "@/components/booking/BookingForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Service",
  description:
    "Book an air conditioning, refrigerator or washing machine service online — pick your service, district, date and preferred time. Island-wide across Sri Lanka, fast confirmation.",
  alternates: { canonical: "/book" },
};

const steps = [
  {
    icon: CalendarCheck,
    title: "Pick your service & time",
    body: "Choose the service, your district and a date and time that suits you.",
  },
  {
    icon: PhoneCall,
    title: "We confirm by phone",
    body: "Our team calls you to confirm the visit and answer any questions.",
  },
  {
    icon: Clock,
    title: "A technician visits",
    body: "A trained technician arrives in your preferred window and gets to work.",
  },
];

export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Online Booking"
        title="Book a service."
        sub="Tell us what you need, where you are and when suits you — we'll confirm your visit and send a technician. Island-wide across Sri Lanka."
        page="Book"
      />

      <section className="bg-mist-200 py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* how it works */}
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06} as="div">
                <div className="flex h-full items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="mt-1 text-sm text-slate/60">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* form */}
            <Reveal>
              <div className="rounded-[2rem] border border-black/[0.06] bg-white p-7 shadow-[0_20px_50px_rgba(5,47,67,0.04)] text-ink sm:p-10">
                <h2 className="display text-3xl text-ink sm:text-4xl">
                  Request your booking
                </h2>
                <p className="mt-3 text-slate/60">
                  It takes under a minute. We&apos;ll call you to confirm.
                </p>
                <div className="mt-8">
                  <BookingForm />
                </div>
              </div>
            </Reveal>

            {/* info */}
            <div className="space-y-6">
              <Reveal as="div">
                <div className="rounded-[1.75rem] bg-gradient-to-br from-green to-teal p-8 text-white shadow-[0_20px_50px_rgba(5,47,67,0.15)]">
                  <MapPin className="size-7" />
                  <h3 className="mt-5 text-xl font-semibold">
                    Island-wide coverage
                  </h3>
                  <p className="mt-2 text-white/85">
                    We serve all 25 districts across Sri Lanka&apos;s nine
                    provinces — pick yours in the form.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-white/85">
                    <Clock className="size-4" />
                    <span className="text-sm">{site.hours}</span>
                  </div>
                </div>
              </Reveal>
              <Reveal as="div" delay={0.08}>
                <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-8 shadow-[0_20px_50px_rgba(5,47,67,0.04)] text-ink">
                  <h3 className="text-xl font-semibold">Need it urgently?</h3>
                  <p className="mt-2 text-slate/60">
                    For emergency breakdowns, call us directly and we&apos;ll do
                    our best to respond the same day.
                  </p>
                  <a
                    href={site.phoneHref}
                    className="mt-4 inline-flex items-center gap-2 font-semibold text-green underline underline-offset-4 hover:text-green-600"
                  >
                    <PhoneCall className="size-4" /> {site.phone}
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
