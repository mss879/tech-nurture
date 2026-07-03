import Link from "next/link";
import LiquidBackground from "@/components/webgl/LiquidBackground";

export default function PageHero({
  eyebrow,
  title,
  sub,
  page,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  page?: string;
}) {
  return (
    <section className="noise relative flex min-h-[60vh] items-end overflow-hidden px-6 pb-16 pt-40">
      <LiquidBackground className="absolute inset-0 -z-10 h-full w-full opacity-90" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/50 via-ink/20 to-ink" />

      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex items-center gap-2 text-mist/50">
          <Link href="/" className="eyebrow transition hover:text-lime">
            Home
          </Link>
          <span className="eyebrow">/</span>
          <span className="eyebrow text-lime">{page ?? title}</span>
        </div>
        <p className="eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-lime backdrop-blur">
          {eyebrow}
        </p>
        <h1 className="display display-tight max-w-5xl text-[clamp(2.5rem,7vw,5.5rem)] text-mist">
          {title}
        </h1>
        {sub && (
          <p className="mt-6 max-w-2xl text-lg text-mist/70">{sub}</p>
        )}
      </div>
    </section>
  );
}
