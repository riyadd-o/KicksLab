export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8 text-[#F5F0E8]">
      <h1 className="font-serif text-4xl font-bold text-[#F5F0E8] mb-8">Shipping & Returns</h1>
      <div className="space-y-6 font-sans text-[#A89880] leading-relaxed">
        <h2 className="text-xl font-bold text-[#F5F0E8] mt-8 mb-4">Shipping Options</h2>
        <p>
          We offer two main shipping options for our customers in Ethiopia:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>
            <strong className="text-[#C9A96E]">Express Delivery — Dire Dawa:</strong> For a flat fee of ETB 100, we offer expedited delivery directly to Dire Dawa.
          </li>
          <li>
            <strong className="text-[#C9A96E]">Regional Delivery:</strong> For all other regions in Ethiopia, the delivery fee will be calculated at the destination. Our team will contact you to confirm the exact regional delivery fee before your order is dispatched.
          </li>
        </ul>
        
        <h2 className="text-xl font-bold text-[#F5F0E8] mt-8 mb-4">Returns & Exchanges</h2>
        <p>
          We accept returns and exchanges within 30 days of the delivery date. Items must be unworn, in their original condition, and include all original packaging and accessories.
        </p>
        <p>
          To initiate a return or exchange, please contact our customer service team at <a href="mailto:KicksLab@gmail.com" className="text-[#C9A96E] hover:underline">KicksLab@gmail.com</a> with your order number. Return shipping costs are the responsibility of the customer unless the item received is defective or incorrect.
        </p>
      </div>
    </div>
  );
}
