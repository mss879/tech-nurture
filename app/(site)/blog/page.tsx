import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { getPublishedPosts } from "@/lib/blog";

// Refresh the list from the CMS at most once a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guides on air conditioning, refrigeration, inline water purifiers and bottle water dispensers, plus preventive maintenance, from the TechNurture team.",
  alternates: { canonical: "/blog" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  if (posts.length === 0) {
    return (
      <>
        <PageHero
          eyebrow="Blog & Articles"
          title="Insights and trends"
          sub="New articles are on the way — check back soon."
          page="Blog"
        />
        <section className="bg-mist py-24 text-center text-slate/60">
          No articles published yet.
        </section>
      </>
    );
  }

  const [featured, ...rest] = posts;
  return (
    <>
      <PageHero
        eyebrow="Blog & Articles"
        title="Insights and trends"
        sub="Whether you're optimizing today or building for tomorrow, our guides help you move faster with confidence."
        page="Blog"
      />

      <section className="bg-mist py-20 text-slate sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* featured */}
          <Reveal as="div">
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-[2rem] bg-mist-200 transition-colors hover:bg-white lg:grid-cols-2"
            >
              <div className="relative min-h-[300px] overflow-hidden">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <span className="absolute left-5 top-5 rounded-full bg-lime px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink">
                  Featured
                </span>
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <div className="flex items-center gap-3 text-sm text-slate/50">
                  <span className="eyebrow text-green">{featured.category}</span>
                  {featured.readTime && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {featured.readTime}
                      </span>
                    </>
                  )}
                </div>
                <h2 className="display mt-4 text-3xl text-slate sm:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-4 text-slate/60">{featured.excerpt}</p>
                <p className="mt-6 text-sm text-slate/45">
                  {formatDate(featured.date)}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-green">
                  Read article{" "}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>

          {/* grid */}
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 2) * 0.08} as="div">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-mist-200 transition-colors hover:bg-white"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-center gap-3 text-sm text-slate/50">
                      <span className="eyebrow text-green">{post.category}</span>
                      {post.readTime && (
                        <>
                          <span>·</span>
                          <span>{post.readTime}</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold leading-snug text-slate">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate/60">{post.excerpt}</p>
                    <p className="mt-auto pt-5 text-sm text-slate/45">
                      {formatDate(post.date)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
