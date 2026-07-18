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
import { site, serviceCatalog } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Fast, reliable repair, servicing and maintenance for air conditioners, refrigerators and washing machines across Sri Lanka — genuine parts, trained technicians and island-wide coverage from TechNurture.",
  alternates: { canonical: "/" },
  openGraph: {
    url: `https://${site.domain}`,
    title: "TechNurture — Appliance Repair & Maintenance in Sri Lanka",
    description:
      "AC, refrigerator and washing machine repair, servicing and maintenance — island-wide across Sri Lanka.",
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
              "Repair, servicing and maintenance for air conditioners, refrigerators and washing machines across Sri Lanka.",
            url: `https://${site.domain}`,
            telephone: site.phone,
            email: site.email,
            image: `https://${site.domain}/tech-nature-side.png`,
            logo: `https://${site.domain}/tech-nature-side.png`,
            priceRange: "$$",
            // TODO(before launch): replace with the real street address.
            address: {
              "@type": "PostalAddress",
              addressLocality: "Colombo",
              addressRegion: "Western Province",
              addressCountry: "LK",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: site.geo.lat,
              longitude: site.geo.lng,
            },
            areaServed: { "@type": "Country", name: "Sri Lanka" },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ],
                opens: "08:30",
                closes: "18:00",
              },
            ],
            slogan: site.tagline,
            parentOrganization: { "@type": "Organization", name: site.parent },
            // TODO(before launch): add real social profile URLs.
            sameAs: [],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Appliance Services",
              itemListElement: serviceCatalog.map((s) => ({
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
