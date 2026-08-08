import Link from "next/link";
import { Building2, Truck } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

/* Two blocks the client supplied for the (now removed) /services index:
   "We Service All Major Brands" and "Choose the Service That Suits You".

   There is no services landing page any more — the header drop-down goes
   straight to a service — so these live on every service page instead, which
   is where the objection they answer actually comes up ("will you touch a unit
   you didn't sell me?" and "do I have to wait in for a visit?"). */

const channels = [
  {
    icon: Truck,
    title: "On-site service",
    body: "Our technicians come to your home or business for installation, maintenance and repairs — anywhere in Sri Lanka.",
  },
  {
    icon: Building2,
    title: "Walk-in service centre",
    body: "Bring the appliance to our service centre for diagnosis, repair and testing. Usually the faster route for a portable unit.",
  },
];

export default function ServiceAssurance() {
  return (
    <section className="bg-mist-200 py-20 text-slate sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="eyebrow flex items-center gap-2 text-green-600">
            <span className="size-1.5 rounded-full bg-green" /> All Major Brands
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mt-6 max-w-3xl text-3xl text-slate sm:text-5xl">
            Your equipment doesn&apos;t have to be our product to get our
            support.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate/65">
            It makes no difference where an appliance was bought or who
            installed it. Our technicians are equipped for all leading brands,
            and most of the units on our maintenance contracts today came to us
            second-hand from another supplier.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {channels.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} as="div">
              <div className="flex h-full gap-5 rounded-[1.75rem] bg-white p-8 ring-1 ring-black/[0.05]">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                  <c.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate">
                    {c.title}
                  </h3>
                  <p className="mt-2.5 leading-relaxed text-slate/65">
                    {c.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14} as="div">
          <div className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-green to-teal p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-semibold">
                  Need a quick diagnosis?
                </h3>
                <p className="mt-3 leading-relaxed text-white/85">
                  Bring the appliance to our service centre. We inspect the
                  unit, give you a written assessment, and carry out the repair
                  with quality spare parts — no call-out wait.
                </p>
              </div>
              <Link
                href="/contact"
                className="btn-lime shrink-0 self-start px-7 py-3.5 text-sm uppercase tracking-wider sm:self-auto"
              >
                Get Directions
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
