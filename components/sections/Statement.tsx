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
            "air",
            "conditioning",
            "refrigeration",
            "water",
            "purification",
            "trust",
          ]}
          text="A subsidiary of Lusako Holdings, we combine over a decade of technical expertise with a customer-first approach to deliver reliable air conditioning, refrigeration and water purification service that homes, businesses, banks and hospitals across Sri Lanka can trust today and depend on tomorrow."
        />
      </div>
    </section>
  );
}
