import { faqs, listedServices, site } from "@/lib/site";

/* /llms.txt — the short machine-readable summary for AI crawlers
   (llmstxt.org). Generated from lib/site.ts rather than hand-written:
   the previous static file in public/ had already gone stale against the
   service catalogue, which is exactly the failure this avoids. */

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const base = `https://${site.domain}`;
  const services = listedServices
    .map((s) => `- [${s.title}](${base}/services/${s.slug}): ${s.summary}`)
    .join("\n");

  const body = `# ${site.name}

> ${site.legal} is an appliance service company in Sri Lanka, providing installation, repair, servicing and maintenance for air conditioners, refrigerators, inline water purifiers and bottle water dispensers. Genuine parts, trained technicians and island-wide coverage. A subsidiary of ${site.parent}. Tagline: "${site.tagline}".

## Services

${services}

## Company

- [About ${site.name}](${base}/about): a subsidiary of ${site.parent} with over a decade of experience serving banks, hospitals, corporates and institutions across Sri Lanka.
- [Blog](${base}/blog): practical guides on appliance repair, water quality and preventive maintenance.

## Contact

- [Contact & quotation](${base}/contact): request a quote, book a repair or maintenance visit. Island-wide service across Sri Lanka.
- [Book a service](${base}/book): choose a service, district, date and preferred time online.
- Phone: ${site.phone} · Address: ${site.address} · Hours: ${site.hours}

## Frequently asked questions

${faqs.map((f) => `- ${f.q} ${f.a}`).join("\n")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
