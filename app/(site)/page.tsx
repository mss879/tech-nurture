import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import Industries from "@/components/sections/Industries";
import AboutIntro from "@/components/sections/AboutIntro";
import Services from "@/components/sections/Services";
import ServicePlans from "@/components/sections/ServicePlans";
import Process from "@/components/sections/Process";
import WhyChoose from "@/components/sections/WhyChoose";
import Statement from "@/components/sections/Statement";
import BlogPreview from "@/components/sections/BlogPreview";
import { site, listedServices, social } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Fast, reliable repair, servicing and maintenance for air conditioners, refrigerators, inline water purifiers and bottle water dispensers across Sri Lanka — genuine parts, trained technicians, island-wide coverage.",
  alternates: { canonical: "/" },
  openGraph: {
    url: `https://${site.domain}`,
    title: "TechNurture — Appliance Repair & Maintenance in Sri Lanka",
    description:
      "AC, refrigerator, water purifier and dispenser repair, servicing and maintenance — island-wide across Sri Lanka.",
    images: ["/opengraph-image.png"],
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Industries />
      <AboutIntro />
      <Services />
      <ServicePlans />
      <Process />
      <WhyChoose />
      <Statement />
      <BlogPreview />

      {/* LocalBusiness structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": `https://${site.domain}/#localbusiness`,
            name: site.legal,
            alternateName: site.name,
            description:
              "Repair, servicing and maintenance for air conditioners, refrigerators, inline water purifiers and bottle water dispensers across Sri Lanka.",
            url: `https://${site.domain}`,
            telephone: site.phone,
            email: site.email,
            image: `https://${site.domain}/tech-nature-side.png`,
            logo: `https://${site.domain}/tech-nature-side.png`,
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              streetAddress: "19A, 1st Lane, Gothami Road",
              addressLocality: "Colombo 08",
              addressRegion: "Western Province",
              addressCountry: "LK",
              // TODO(before launch): confirm the postal code with the client.
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: site.geo.lat,
              longitude: site.geo.lng,
            },
            areaServed: { "@type": "Country", name: "Sri Lanka" },
            // Kept in step with site.hours — see the note there before editing.
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: site.openDays,
                opens: site.opens,
                closes: site.closes,
              },
            ],
            slogan: site.tagline,
            parentOrganization: { "@type": "Organization", name: site.parent },
            sameAs: social.map((s) => s.href),
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Appliance Services",
              itemListElement: listedServices.map((s) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: s.title,
                  url: `https://${site.domain}/services/${s.slug}`,
                },
              })),
            },
          }),
        }}
      />
    </>
  );
}
