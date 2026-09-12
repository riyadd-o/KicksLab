'use client';

import { useState, useEffect } from 'react';

interface Coupon {
  id: string;
  code: string;
  type: string;
  discount: number;
  discountType?: string;
  value?: number;
  minOrder: number;
  expiry: string;
  active: boolean;
  usageCount: number;
}

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/coupons/active');
        if (res.ok) {
          const data = await res.json();
          setCoupons(data);
        }
      } catch (err) {
        console.error("Failed to fetch promotions:", err);
      } finally {
        setMounted(true);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  // Helper: resolve discount display (supports both shapes)
  const getDiscountLabel = (c: Coupon) => {
    const type = c.discountType ?? c.type;
    const amount = c.value ?? c.discount;
    return type === 'percentage' ? `${amount}% off your order` : `ETB ${amount} off your order`;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#C9A96E] text-xs font-bold tracking-[0.3em] uppercase mb-3">
            Exclusive Promotions
          </p>
          <h1 className="text-[#F5F0E8] font-serif text-4xl sm:text-5xl font-bold mb-4">
            Special Offers &amp; Deals
          </h1>
          <p className="text-[#A89880] text-sm max-w-md mx-auto leading-relaxed">
            Copy any code below and paste it at checkout to redeem your discount.
          </p>
        </div>

        {/* Coupon Grid */}
        {!mounted ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#C9A96E] border-t-transparent animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🎟️</div>
            <p className="text-[#F5F0E8] font-semibold text-lg mb-2">No active promotions right now.</p>
            <p className="text-[#5C5248] text-sm">Check back soon for exclusive deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-[#141414] border border-[#2A2420] hover:border-[#C9A96E]/50 rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="text-3xl mb-4">🎟️</div>

                {/* Code Badge */}
                <div className="bg-[#1A1A1A] border border-dashed border-[#C9A96E]/60 rounded-lg px-4 py-2.5 mb-4 inline-block">
                  <span className="text-[#C9A96E] font-bold text-xl tracking-widest">
                    {coupon.code}
                  </span>
                </div>

                {/* Discount Info */}
                <p className="text-[#F5F0E8] text-sm font-medium mb-1">
                  {getDiscountLabel(coupon)}
                </p>
                {coupon.minOrder > 0 && (
                  <p className="text-[#A89880] text-xs mb-4">
                    Min. order: ETB {coupon.minOrder.toLocaleString()}
                  </p>
                )}
                {coupon.expiry && (
                  <p className="text-[#5C5248] text-xs mb-4">
                    Valid until: {new Date(coupon.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(coupon.code)}
                  className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-semibold text-sm tracking-widest uppercase py-2.5 rounded-lg transition-all duration-200"
                >
                  {copied === coupon.code ? '✓ Copied!' : 'Copy Code'}
                </button>
                <p className="text-[#5C5248] text-xs mt-2">Paste at checkout</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
