import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ArrowUpRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { posts, site, whatsappLink, getService } from "@/lib/site";

/* Map each post category to its service page so every article passes
   keyword-anchored internal links to the page that should rank. */
const categoryToService: Record<string, string> = {
  "Air Conditioning": "air-conditioning",
  Refrigerator: "refrigerator",
  "Washing Machine": "washing-machine",
  Maintenance: "maintenance-amc",
};

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
  };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = posts.filter((p) => p.slug !== slug).slice(0, 2);
  const service = getService(categoryToService[post.category] ?? "");

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-ink px-6 pb-16 pt-36 text-mist">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-mist/60 transition hover:text-lime"
          >
            <ArrowLeft className="size-4" /> All articles
          </Link>
          <div className="mt-8 flex items-center gap-3 text-sm text-mist/60">
            <span className="eyebrow text-lime">{post.category}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {post.readTime}
            </span>
          </div>
          <h1 className="display display-tight mt-5 text-4xl sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg text-mist/70">{post.excerpt}</p>
          <p className="mt-6 text-sm text-mist/45">{formatDate(post.date)}</p>
        </div>
      </section>

      {/* cover */}
      <div className="bg-ink px-6 pb-4">
        <div className="mx-auto max-w-5xl">
          <div className="relative aspect-[16/8] overflow-hidden rounded-[2rem]">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* body */}
      <article className="bg-mist py-20 text-slate">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-6 text-lg leading-relaxed text-slate/75">
            {post.body.map((para, i) => (
              <Reveal key={i} as="p" y={18}>
                {para}
              </Reveal>
            ))}
          </div>

          {/* related service link — internal link with keyword anchor */}
          {service && (
            <p className="mt-10 text-lg text-slate/75">
              Looking for professional help?{" "}
              <Link
                href={`/services/${service.slug}`}
                className="font-semibold text-green underline underline-offset-4 hover:text-green-600"
              >
                {service.h1 ?? service.title}
              </Link>{" "}
              — {service.tagline.toLowerCase()}
            </p>
          )}

          {/* inline CTA */}
          <div className="mt-12 rounded-[1.75rem] bg-ink p-8 text-mist sm:p-10">
            <h3 className="display text-2xl sm:text-3xl">
              Need help with your system?
            </h3>
            <p className="mt-3 text-mist/65">
              Book a free site inspection or request a quotation — island-wide
              across Sri Lanka.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="btn-lime px-6 py-3.5 text-sm uppercase tracking-wider"
              >
                Book Inspection
              </Link>
              {service && (
                <Link
                  href={`/services/${service.slug}`}
                  className="btn-ghost px-6 py-3.5 text-sm uppercase tracking-wider text-mist"
                >
                  {service.title} Services
                </Link>
              )}
              <a
                href={whatsappLink(
                  `Hi ${site.name}, I read "${post.title}" and have a question.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost px-6 py-3.5 text-sm uppercase tracking-wider text-mist"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </article>

      {/* related */}
      <section className="bg-mist pb-24 text-slate">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="display text-2xl sm:text-3xl">Keep reading</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-mist-200 transition-colors hover:bg-white"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <span className="eyebrow text-green">{p.category}</span>
                  <h3 className="mt-2 text-lg font-semibold leading-snug">
                    {p.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green">
                    Read <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: `https://${site.domain}${post.image}`,
            datePublished: post.date,
            author: { "@type": "Organization", name: site.legal },
            publisher: { "@type": "Organization", name: site.legal },
            mainEntityOfPage: `https://${site.domain}/blog/${post.slug}`,
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
                name: "Blog",
                item: `https://${site.domain}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: `https://${site.domain}/blog/${post.slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
