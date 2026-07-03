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
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
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
            name: site.legal,
            description:
              "Water purification and air conditioning installation, maintenance and service across Sri Lanka.",
            url: `https://${site.domain}`,
            telephone: site.phone,
            email: site.email,
            areaServed: "Sri Lanka",
            slogan: site.tagline,
            parentOrganization: { "@type": "Organization", name: site.parent },
          }),
        }}
      />
    </>
  );
}
