import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  Wrench,
  FileDown,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import ProductGallery from "@/components/shop/ProductGallery";
import BuyPanel from "@/components/shop/BuyPanel";
import ProductCard from "@/components/shop/ProductCard";
import { products, getProduct, purchaseTerms, formatLKR } from "@/lib/products";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Price in Sri Lanka (${product.series})`,
    description: `${product.blurb} From ${formatLKR(
      Math.min(...product.variants.map((v) => v.price))
    )} with free installation up to 5m and a 2-year warranty.`,
    keywords: [
      ...product.variants.map((v) => `Lusako ${v.model}`),
      `${product.form.toLowerCase()} water purifier Sri Lanka`,
      "Lusako inline water purifier price",
    ],
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: `${product.name} (${product.series})`,
      description: product.blurb,
      url: `/shop/${product.slug}`,
      images: product.images,
      type: "website",
    },
  };
}

const terms = [
  { icon: Wrench, title: "Installation", body: purchaseTerms.installation },
  { icon: Truck, title: "Delivery", body: purchaseTerms.delivery },
  { icon: ShieldCheck, title: "Warranty", body: purchaseTerms.warranty },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const others = products.filter((p) => p.slug !== product.slug);

  return (
    <>
      <section className="bg-slate-50 px-6 pb-16 pt-32 text-slate-800 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/shop"
            className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-green"
          >
            <ChevronLeft className="size-4" /> Back to shop
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal as="div">
              <ProductGallery images={product.images} name={product.name} />
            </Reveal>

            <div>
              <p className="eyebrow text-green">{product.category}</p>
              <h1 className="display mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Series {product.series}
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {product.blurb}
              </p>

              <ul className="mt-6 space-y-3">
                {product.features.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green" />
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {f.title}
                      </span>{" "}
                      — {f.body}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <BuyPanel product={product} />
              </div>

              <a
                href={product.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-green underline-offset-4 hover:underline"
              >
                <FileDown className="size-4" /> Download spec sheet (PDF)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* full specification table */}
      <section className="border-t border-slate-200/60 bg-white px-6 py-16 text-slate-800 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <Reveal>
                <h2 className="display text-2xl text-slate-900 sm:text-4xl">
                  Full specifications
                </h2>
              </Reveal>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
                Both models share the same purifier platform — the difference
                is the filtration stage: <strong>UF</strong> for city water and{" "}
                <strong>RO</strong> for city &amp; well water.
              </p>

              <div className="mt-8 space-y-4">
                {terms.map((t) => (
                  <div
                    key={t.title}
                    className="flex gap-4 rounded-2xl bg-slate-50 p-5"
                  >
                    <t.icon className="size-5 shrink-0 text-green" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {t.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{t.body}</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Lusako after-sales
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {purchaseTerms.afterSales}
                  </p>
                </div>
              </div>
            </div>

            <Reveal as="div">
              <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200/70">
                <table className="w-full text-sm">
                  <tbody>
                    {product.specs.map(([k, v], i) => (
                      <tr
                        key={k}
                        className={i % 2 === 0 ? "bg-slate-50/60" : "bg-white"}
                      >
                        <td className="w-2/5 break-words px-4 py-3.5 font-medium text-slate-500 sm:px-5">
                          {k}
                        </td>
                        <td className="break-words px-4 py-3.5 font-medium text-slate-800 sm:px-5">
                          {v}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green/5">
                      <td className="break-words px-4 py-3.5 font-medium text-slate-500 sm:px-5">
                        Filtration
                      </td>
                      <td className="break-words px-4 py-3.5 font-medium text-slate-800 sm:px-5">
                        {product.variants
                          .map((v) => `${v.model}: ${v.filterStages}`)
                          .join("  ·  ")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* other models */}
      <section className="bg-slate-50/50 px-6 py-16 text-slate-800 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="display mb-8 text-2xl text-slate-900 sm:text-3xl">
            Other models
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
            {others.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Product structured data (both model variants as offers) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${product.name} (${product.series})`,
            description: product.blurb,
            brand: { "@type": "Brand", name: "Lusako" },
            image: product.images.map(
              (img) => `https://${site.domain}${img}`
            ),
            url: `https://${site.domain}/shop/${product.slug}`,
            offers: product.variants.map((v) => ({
              "@type": "Offer",
              name: `${v.model} (${v.filtration} — ${v.recommendedFor})`,
              sku: v.model,
              price: v.price,
              priceCurrency: "LKR",
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
              url: `https://${site.domain}/shop/${product.slug}`,
              seller: { "@type": "Organization", name: site.legal },
            })),
          }),
        }}
      />
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `https://${site.domain}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Shop",
                item: `https://${site.domain}/shop`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: `https://${site.domain}/shop/${product.slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
