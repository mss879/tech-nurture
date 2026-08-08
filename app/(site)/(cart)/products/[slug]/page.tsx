import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import ProductGallery from "@/components/shop/ProductGallery";
import BuyPanel from "@/components/shop/BuyPanel";
import ProductCard from "@/components/shop/ProductCard";
import {
  SPEC_COLUMNS,
  formatLKR,
  lowestPrice,
  whyChooseHeading,
} from "@/lib/products";
import { htmlToText } from "@/lib/rich-text";
import { getProduct, getProducts } from "@/lib/products.server";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const from = lowestPrice(product);
  const brand = product.brand || "";
  /* The category is the product noun — "Water Purifiers", "Air Conditioners" —
     so the keywords follow the catalogue instead of assuming water. */
  const noun = (product.category || "product").toLowerCase().replace(/s$/, "");

  return {
    /* The admin's SEO title wins; otherwise the old pattern. */
    title:
      product.metaTitle ||
      (product.series
        ? `${product.name} — Price in Sri Lanka (${product.series})`
        : `${product.name} — Price in Sri Lanka`),
    /* Built only from what the admin entered — no invented sales claims. */
    description:
      product.metaDescription ||
      [
        product.blurb || htmlToText(product.description).slice(0, 155),
        from ? `From ${formatLKR(from)}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    keywords: [
      ...product.variants.map((v) => [brand, v.model].filter(Boolean).join(" ")),
      `${noun} Sri Lanka`,
      [brand, noun, "price Sri Lanka"].filter(Boolean).join(" "),
    ].filter(Boolean),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.series
        ? `${product.name} (${product.series})`
        : product.name,
      description:
        product.metaDescription ||
        product.blurb ||
        htmlToText(product.description).slice(0, 200),
      url: `/products/${product.slug}`,
      images: product.images,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const others = (await getProducts())
    .filter((p) => p.slug !== product.slug)
    .slice(0, 2);

  return (
    <>
      <section className="bg-slate-50 px-6 pb-16 pt-32 text-slate-800 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          {/* No product index to go back to — the header menu is the way
              between products, so this is a breadcrumb, not a back link. */}
          <div className="mb-8 flex items-center gap-2 text-slate-400">
            <Link href="/" className="eyebrow transition hover:text-green">
              Home
            </Link>
            <span className="eyebrow">/</span>
            <span className="eyebrow text-green">{product.name}</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal as="div">
              <ProductGallery images={product.images} name={product.name} />
            </Reveal>

            <div>
              {(product.brand || product.category) && (
                <p className="eyebrow text-green-600">
                  {[product.brand, product.category]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <h1 className="display mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="mt-2 text-lg text-slate-500">
                  {product.subtitle}
                </p>
              )}
              {product.series && (
                <p className="mt-1 text-sm font-medium text-slate-400">
                  Series {product.series}
                </p>
              )}
              {product.blurb && (
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {product.blurb}
                </p>
              )}

              {product.keyFeatures.length > 0 && (
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {product.keyFeatures.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8">
                <BuyPanel product={product} />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* description, and the two lists that sell it */}
      {(product.description ||
        product.whyChoose.length > 0 ||
        product.perfectFor.length > 0) && (
        <section className="border-t border-slate-200/60 bg-white px-6 py-16 text-slate-800 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.4fr_1fr]">
            {product.description && (
              <Reveal as="div">
                <h2 className="display text-2xl text-slate-900 sm:text-3xl">
                  About the {product.name}
                </h2>
                {/* Rich text written in the admin. Sanitised against an
                    allow-list on save and again on read — see lib/rich-text.ts. */}
                <div
                  className="prose-product mt-6 text-base leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </Reveal>
            )}

            <div className="space-y-10">
              {product.whyChoose.length > 0 && (
                <Reveal as="div">
                  {/* Heading follows the product name — see whyChooseHeading. */}
                  <h2 className="display text-2xl text-slate-900 sm:text-3xl">
                    {whyChooseHeading(product.name)}
                  </h2>
                  <ul className="mt-5 space-y-2.5">
                    {product.whyChoose.map((w) => (
                      <li key={w} className="flex gap-2.5">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green" />
                        <span className="text-sm leading-relaxed text-slate-600">
                          {w}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {product.perfectFor.length > 0 && (
                <Reveal as="div">
                  <h2 className="display text-2xl text-slate-900 sm:text-3xl">
                    Perfect for
                  </h2>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {product.perfectFor.map((w) => (
                      <li
                        key={w}
                        className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm text-slate-600"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      )}

      {/* full specification table */}
      {(product.specs.length > 0 || product.variants.length > 0) && (
        <section className="border-t border-slate-200/60 bg-white px-6 py-16 text-slate-800 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl">
              <Reveal>
                <h2 className="display text-2xl text-slate-900 sm:text-4xl">
                  Technical Specifications
                </h2>
              </Reveal>

              <Reveal as="div">
                <div className="mt-8 overflow-x-auto rounded-[1.5rem] border border-slate-200/70">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink text-left text-mist">
                        <th
                          scope="col"
                          className="w-2/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider sm:px-5"
                        >
                          {SPEC_COLUMNS[0]}
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider sm:px-5"
                        >
                          {SPEC_COLUMNS[1]}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.specs.map(([k, v], i) => (
                        <tr
                          key={k}
                          className={i % 2 === 0 ? "bg-slate-50/60" : "bg-white"}
                        >
                          <th
                            scope="row"
                            className="w-2/5 break-words px-4 py-3.5 text-left font-medium text-slate-500 sm:px-5"
                          >
                            {k}
                          </th>
                          <td className="break-words px-4 py-3.5 font-medium text-slate-800 sm:px-5">
                            {v}
                          </td>
                        </tr>
                      ))}
                      {product.variants.length > 0 && (
                        <tr className="bg-green/5">
                          <th
                            scope="row"
                            className="break-words px-4 py-3.5 text-left font-medium text-slate-500 sm:px-5"
                          >
                            Models
                          </th>
                          <td className="break-words px-4 py-3.5 font-medium text-slate-800 sm:px-5">
                            {product.variants
                              .map((v) =>
                                v.optionLabel
                                  ? `${v.model} (${v.optionLabel})`
                                  : v.model
                              )
                              .join("  ·  ")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* highlights — headline beside a rich-text explanation */}
      {product.features.length > 0 && (
        <section className="border-t border-slate-200/60 bg-slate-50 px-6 py-16 text-slate-800 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="display text-2xl text-slate-900 sm:text-4xl">
                Highlights
              </h2>
            </Reveal>
            <dl className="mt-8 divide-y divide-slate-200/70 border-y border-slate-200/70">
              {product.features.map((f) => (
                <Reveal key={f.title} as="div">
                  <div className="grid gap-2 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-10">
                    <dt className="text-base font-semibold text-slate-900">
                      {f.title}
                    </dt>
                    <dd
                      className="prose-product text-sm leading-relaxed text-slate-600"
                      dangerouslySetInnerHTML={{ __html: f.body }}
                    />
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* other models */}
      {others.length > 0 && (
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
      )}

      {/* Product structured data (every model as an offer) */}
      {product.variants.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.series
                ? `${product.name} (${product.series})`
                : product.name,
              description:
                product.blurb || htmlToText(product.description).slice(0, 300),
              // The brand is a real field now, not a hard-coded string.
              ...(product.brand
                ? { brand: { "@type": "Brand", name: product.brand } }
                : {}),
              image: product.images.map((img) =>
                img.startsWith("http") ? img : `https://${site.domain}${img}`
              ),
              url: `https://${site.domain}/products/${product.slug}`,
              offers: product.variants.map((v) => ({
                "@type": "Offer",
                name: [v.model, v.optionLabel].filter(Boolean).join(" — "),
                sku: v.model,
                price: v.price,
                priceCurrency: "LKR",
                availability: "https://schema.org/InStock",
                itemCondition: "https://schema.org/NewCondition",
                url: `https://${site.domain}/products/${product.slug}`,
                seller: { "@type": "Organization", name: site.legal },
              })),
            }),
          }}
        />
      )}
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
                name: product.name,
                item: `https://${site.domain}/products/${product.slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
