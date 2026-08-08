import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, Phone, Mail } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "TechNurture Privacy Policy — Learn how we collect, protect, and handle your personal information across our website and island-wide appliance repair and maintenance services in Sri Lanka.",
  alternates: { canonical: "/privacy-policy" },
};

const policyHighlights = [
  {
    icon: ShieldCheck,
    title: "Data Protection First",
    sub: "We implement strict technical and operational safeguards to protect your personal and service data.",
  },
  {
    icon: Lock,
    title: "Never Sold or Traded",
    sub: "Your contact details and property information are never sold or rented to third-party advertisers.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    sub: "You have complete visibility over what information we hold and how it is used for service delivery.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal & Governance"
        title="Privacy Policy"
        sub="How TechNurture collects, uses, protects, and respects your personal information when using our website, service bookings, and customer care."
        page="Privacy Policy"
      />

      <section className="bg-mist-200 py-20 text-slate sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          {/* Highlights grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            {policyHighlights.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08} as="div">
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                  <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-lime text-ink">
                    <item.icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-bold text-slate">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate/70">
                    {item.sub}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Main policy body */}
          <div className="mt-16 space-y-12 rounded-[2rem] border border-black/[0.06] bg-white p-8 sm:p-14 shadow-sm">
            <Reveal as="div">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 text-sm text-slate/50">
                <FileText className="size-4 text-green" />
                <span>Last updated: August 2026</span>
                <span>·</span>
                <span>TechNurture (PVT) Ltd</span>
              </div>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                1. Introduction
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                TechNurture (PVT) Ltd (&quot;TechNurture&quot;, &quot;we&quot;,
                &quot;us&quot;, or &quot;our&quot;), a subsidiary of Lusako Group,
                is dedicated to delivering premium, trustworthy appliance maintenance,
                installation, and repair services across Sri Lanka. We respect your privacy
                and are committed to protecting the personal data you share with us when visiting our website, booking on-site technician visits, purchasing maintenance plans, or contacting customer support.
              </p>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                2. Information We Collect
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                Depending on how you interact with our platform and services, we collect the following categories of information:
              </p>
              <ul className="mt-4 space-y-3 text-base leading-relaxed text-slate/75">
                <li className="flex gap-2">
                  <span className="font-semibold text-slate">• Contact &amp; Identity Data:</span>
                  <span>Name, email address, telephone numbers, and physical property address (including province, district, and landmark details for technician routing).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-slate">• Service &amp; Equipment Data:</span>
                  <span>Appliance type, brand, model numbers, reported issues, maintenance schedules, and past repair history.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-slate">• Billing &amp; Transaction Details:</span>
                  <span>Invoices, payment receipts, Annual Maintenance Contract (AMC) subscriptions, and quotation records processed via secure payment partners.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-slate">• Technical &amp; Usage Data:</span>
                  <span>IP address, browser type, device information, and essential website session cookies to maintain site security and optimal performance.</span>
                </li>
              </ul>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                3. How We Use Your Information
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                We use collected information solely for legitimate business purposes, including:
              </p>
              <ul className="mt-4 space-y-2 text-base leading-relaxed text-slate/75">
                <li>• Dispatching qualified technicians and completing on-site repairs, servicing, or inspections.</li>
                <li>• Sending appointment reminders, dispatch notifications, and warranty documentation via SMS, WhatsApp, or email.</li>
                <li>• Processing billing transactions, issuing tax receipts, and managing service agreements.</li>
                <li>• Monitoring site security, preventing fraudulent activity, and analyzing user feedback to refine our service quality.</li>
                <li>• Complying with regulatory obligations under the laws of Sri Lanka, including the Personal Data Protection Act No. 9 of 2022.</li>
              </ul>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                4. Data Protection &amp; Security
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                We implement administrative, technical, and physical safeguards designed to protect personal data against unauthorized access, loss, alteration, or disclosure. All web traffic and data transmissions are encrypted using standard SSL/TLS protocol. Access to customer records is restricted to authorized operations personnel and field technicians strictly on a need-to-know basis.
              </p>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                5. Data Sharing &amp; Disclosure
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                TechNurture does not sell, rent, or trade customer information to commercial third parties. We may share necessary details only with:
              </p>
              <ul className="mt-4 space-y-2 text-base leading-relaxed text-slate/75">
                <li>• Authorized service technicians and regional logistics team members assigned to your booking.</li>
                <li>• Certified payment gateways and financial institutions to process payments securely.</li>
                <li>• Cloud hosting and IT service providers bound by strict confidentiality and data protection agreements.</li>
                <li>• Legal or law enforcement authorities if required by Sri Lankan law or court order.</li>
              </ul>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                6. Cookies &amp; Tracking
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                Our website uses essential functional cookies to manage sessions, security, and preferences. We do not employ intrusive tracking cookies or cross-site behavioral ad profiling. You can adjust your browser settings to decline non-essential cookies, though certain site features may be affected.
              </p>
            </Reveal>

            <Reveal as="div">
              <h2 className="text-2xl font-bold text-slate sm:text-3xl">
                7. Your Rights &amp; Choices
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate/75">
                You have the right to request access to the personal data we hold about you, request corrections to out-of-date information, or request the deletion of your account records where legally permissible. To exercise your privacy rights, please contact our team using the details below.
              </p>
            </Reveal>

            <Reveal as="div">
              <div className="rounded-2xl border border-slate-200 bg-mist p-6 sm:p-8">
                <h3 className="text-xl font-bold text-slate">
                  8. Contact Privacy Team
                </h3>
                <p className="mt-2 text-sm text-slate/70">
                  If you have questions regarding this Privacy Policy or wish to make a data request, please reach out to our privacy officer:
                </p>
                <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-slate">
                  <a
                    href={site.phoneHref}
                    className="flex items-center gap-2.5 transition hover:text-green-600"
                  >
                    <Phone className="size-4 text-green" /> {site.phone}
                  </a>
                  <a
                    href={`mailto:${site.email}`}
                    className="flex items-center gap-2.5 transition hover:text-green-600"
                  >
                    <Mail className="size-4 text-green" /> {site.email}
                  </a>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200/80 text-xs text-slate/60">
                  {site.regName} · {site.address}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
