import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { getPublishedPosts } from "@/lib/blog";

function formatDate(d: string) {
  return new Date(d)
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

export default async function BlogPreview() {
  const list = (await getPublishedPosts()).slice(0, 3);
  return (
    <section className="bg-mist py-24 text-slate sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* left intro */}
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <Reveal>
            <p className="eyebrow flex items-center gap-2 text-green-600">
              <span className="size-1.5 rounded-full bg-green" />
              Blog & Articles
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-6 text-4xl text-slate sm:text-6xl">
              Latest insights and trends
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-sm text-lg text-slate/60">
              Practical guidance from our technicians — what the warning signs
              actually mean, and what preventive care is worth doing.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              href="/blog"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-medium uppercase tracking-wider text-lime transition hover:bg-navy"
            >
              All Articles <ArrowUpRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        {/* right list */}
        <div className="space-y-4">
          {list.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08} as="div">
              <Link
                href={`/blog/${post.slug}`}
                className="group grid grid-cols-[auto_1fr] items-center gap-6 rounded-[1.5rem] bg-mist-200 p-4 transition-colors duration-500 hover:bg-white sm:grid-cols-[200px_1fr]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="200px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="pr-4">
                  <p className="eyebrow text-slate/45">{formatDate(post.date)}</p>
                  <h3 className="mt-3 text-xl font-semibold leading-snug text-slate sm:text-2xl">
                    {post.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Read article <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
