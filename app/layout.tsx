import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site, creator, social } from "@/lib/site";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  title: {
    default:
      "TechNurture — AC, Refrigerator & Washing Machine Repair in Sri Lanka",
    template: "%s · TechNurture",
  },
  description:
    "TechNurture Pvt Ltd — fast, reliable repair, servicing and maintenance for air conditioners, refrigerators and washing machines across Sri Lanka. Genuine parts, trained technicians, island-wide. A subsidiary of Lusako Holdings.",
  keywords: [
    "appliance repair Sri Lanka",
    "AC repair Sri Lanka",
    "refrigerator repair Sri Lanka",
    "washing machine repair Sri Lanka",
    "appliance AMC Sri Lanka",
    "TechNurture",
  ],
  authors: [{ name: creator.name, url: creator.url }],
  creator: creator.name,
  publisher: site.legal,
  openGraph: {
    type: "website",
    siteName: site.name,
    url: `https://${site.domain}`,
    locale: "en_LK",
    title: "TechNurture — Appliance Repair & Maintenance in Sri Lanka",
    description:
      "Fast, reliable repair and maintenance for air conditioners, refrigerators and washing machines — island-wide across Sri Lanka.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "TechNurture — Appliance Repair & Maintenance in Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TechNurture — Appliance Repair & Maintenance in Sri Lanka",
    description:
      "Fast, reliable repair and maintenance for AC, refrigerators and washing machines across Sri Lanka.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#052f43",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${mono.variable}`}>
      <head>
        <link rel="author" href={creator.url} />
        {/* Site-wide creator / author credit — ARC AI */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `https://${site.domain}/#website`,
              name: site.name,
              url: `https://${site.domain}`,
              publisher: {
                "@type": "Organization",
                name: site.legal,
                url: `https://${site.domain}`,
              },
              creator: {
                "@type": "Organization",
                "@id": `${creator.url}/#organization`,
                name: creator.name,
                url: creator.url,
                description: creator.description,
                logo: `https://${site.domain}${creator.logo}`,
                sameAs: [creator.url],
              },
              author: {
                "@type": "Organization",
                "@id": `${creator.url}/#organization`,
                name: creator.name,
                url: creator.url,
              },
            }),
          }}
        />
        {/* Organization identity */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `https://${site.domain}/#organization`,
              name: site.legal,
              alternateName: site.name,
              url: `https://${site.domain}`,
              logo: `https://${site.domain}/tech-nature-side.png`,
              description:
                "Home-appliance repair, servicing and maintenance across Sri Lanka — air conditioners, refrigerators and washing machines.",
              telephone: site.phone,
              email: site.email,
              areaServed: { "@type": "Country", name: "Sri Lanka" },
              slogan: site.tagline,
              parentOrganization: {
                "@type": "Organization",
                name: site.parent,
              },
              sameAs: social.map((s) => s.href),
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
