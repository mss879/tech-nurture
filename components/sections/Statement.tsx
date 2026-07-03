import WordReveal from "@/components/ui/WordReveal";

export default function Statement() {
  return (
    <section className="bg-ink py-28 sm:py-40">
      <div className="mx-auto max-w-5xl px-6">
        <p className="eyebrow mb-10 flex items-center gap-2 text-lime">
          <span className="size-1.5 rounded-full bg-lime" />
          Our Commitment
        </p>
        <WordReveal
          className="display text-3xl leading-[1.15] text-mist sm:text-5xl sm:leading-[1.12]"
          highlight={[
            "water",
            "purification",
            "air",
            "conditioning",
            "trust",
            "confidence",
          ]}
          text="We combine over a decade of technical expertise with a customer-first approach to deliver reliable water purification and air conditioning that homes, businesses and institutions can trust today and depend on tomorrow."
        />
      </div>
    </section>
  );
}
