export default function AboutPage() {
  return (
    <main className="bg-[#0D0D0D] min-h-screen text-[#F5F0E8]">

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-3xl mx-auto">
        <span className="text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4 block">
          Our Story
        </span>
        <h1 className="text-5xl font-bold mb-6">
          Crafted With <span className="text-[#C9A96E]">Purpose</span>
        </h1>
        <p className="text-[#A89880] text-lg leading-relaxed">
          We curate premium footwear selected for quality, comfort, and style — 
          because the right pair of shoes carries you further.
        </p>
      </section>

      {/* Values */}
      <section className="py-20 px-6 border-t border-[#2A2420]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🧵", title: "Premium Quality", desc: "Every shoe is selected for its durable design and quality construction techniques." },
            { icon: "📦", title: "Complimentary Shipping", desc: "Free delivery on select orders. Easy 30-day returns, no questions asked." },
            { icon: "♻️", title: "Sustainably Sourced", desc: "We partner with ethical tanneries and suppliers who share our values." },
          ].map((item) => (
            <div key={item.title} className="bg-[#141414] border border-[#2A2420] 
                                              rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-[#C9A96E] font-bold text-lg mb-3">{item.title}</h3>
              <p className="text-[#A89880] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team / Brand Statement */}
      <section className="py-20 px-6 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">
          Built for <span className="text-[#C9A96E]">Every Stride</span>
        </h2>
        <p className="text-[#A89880] leading-relaxed">
          From boardrooms to boulevards, KicksLab curates footwear that moves 
          with you. Our team handpicks every style to ensure you walk with 
          confidence, comfort, and class.
        </p>
        <a href="/shop"
          className="inline-block mt-8 bg-[#C9A96E] hover:bg-[#C9A96E]-hover 
                     text-[#0D0D0D] font-semibold tracking-widest uppercase 
                     text-sm px-8 py-4 transition-all duration-300">
          Shop the Collection
        </a>
      </section>

    </main>
  );
}
