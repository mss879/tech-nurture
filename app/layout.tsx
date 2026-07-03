import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site, creator } from "@/lib/site";

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
    default: "TechNurture — Water Purification & Air Conditioning Solutions",
    template: "%s · TechNurture",
  },
  description:
    "TechNurture Pvt Ltd — installation, maintenance, repairs and annual service contracts for water purifiers and air conditioning across Sri Lanka. A subsidiary of Lusako Holdings.",
  keywords: [
    "water purifier Sri Lanka",
    "air conditioning service Sri Lanka",
    "RO water purifier",
    "AMC maintenance contract",
    "TechNurture",
  ],
  authors: [{ name: creator.name, url: creator.url }],
  creator: creator.name,
  publisher: site.legal,
  openGraph: {
    title: "TechNurture — Technology Inspired by Nurture",
    description:
      "Reliable systems. Expert care. Total confidence. Trusted technology installation, maintenance and service across Sri Lanka.",
    type: "website",
  },
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
      </head>
      <body>{children}</body>
    </html>
  );
}
