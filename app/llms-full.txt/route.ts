import { faqs, listedServices, servicePlans, site } from "@/lib/site";

/* /llms-full.txt — the long-form machine-readable reference for AI
   crawlers. Same reasoning as /llms.txt: generated, never hand-edited. */

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const base = `https://${site.domain}`;

  const services = listedServices
    .map((s) => {
      const offerings = s.offerings
        .map((o) => `- ${o.title}: ${o.body}`)
        .join("\n");
      return `## ${s.title} — ${base}/services/${s.slug}\n\n${s.summary}\n\n${offerings}`;
    })
    .join("\n\n");

  const plans = servicePlans.plans
    .map(
      (p) =>
        `- ${p.name}: ${p.priceLabel}\n  Includes: ${p.points.join("; ")}` +
        (p.note ? `\n  ${p.note}` : "")
    )
    .join("\n");

  const body = `# ${site.name} — Full Reference

> ${site.legal} is an appliance service company in Sri Lanka, providing installation, repair, servicing and maintenance for air conditioners, refrigerators, inline water purifiers and bottle water dispensers. Genuine parts, trained technicians and island-wide coverage. A subsidiary of ${site.parent}. Tagline: "${site.tagline}".

${site.name} services home and commercial appliances of all major brands — regardless of who supplied or installed the unit. Every job starts with an honest diagnosis and a transparent quotation before any work begins. Customers can be served on-site anywhere in Sri Lanka, or bring the appliance to the service centre at ${site.address}.

${services}

## Annual Maintenance Contracts — ${base}/services/maintenance-amc

${plans}

## Frequently asked questions

${faqs.map((f) => `- ${f.q}\n  ${f.a}`).join("\n")}

## Contact

- Phone: ${site.phone}
- Address: ${site.address}
- Hours: ${site.hours}
- Quotation & enquiries: ${base}/contact
- Online service booking: ${base}/book
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
