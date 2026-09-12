'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight, ShoppingBag } from 'lucide-react';

export interface DropProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  dropPrice?: number;
  images: string[];
  stock: number;
  inStock: boolean;
  category: string;
  rating: number;
  isDropItem?: boolean;
  isLimitedDrop?: boolean;
  dropDiscountBadge?: string;
}

export interface LimitedDropData {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  bannerImage?: string | null;
  products: DropProduct[];
}

interface LimitedDropSectionProps {
  drop: LimitedDropData | null;
  onQuickView?: (product: any) => void;
}

export default function LimitedDropSection({ drop }: LimitedDropSectionProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    ended: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    if (!drop || !drop.endDate) return;

    function calculateTime() {
      const difference = new Date(drop!.endDate).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, ended: false });
    }

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [drop]);

  // Hide completely when no active drop or when timer expires
  if (!drop || timeLeft.ended) {
    return null;
  }

  const discountBadge =
    drop.discountType === 'fixed'
      ? `ETB ${drop.discountValue.toLocaleString()} OFF`
      : `${drop.discountValue}% OFF`;

  const thumbnail = drop.products?.[0]?.images?.[0] ?? (drop.products?.[0] as any)?.image ?? drop.bannerImage;

  return (
    <section
      id="limited-drop"
      className="w-full bg-white pt-4 pb-2 sm:pt-6 sm:pb-3 scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/shop/limited-drop"
          className="group relative block overflow-hidden rounded-2xl border border-[#C9A96E]/40 bg-gradient-to-r from-[#17130E] via-[#120F0D] to-[#17130E] p-3 sm:p-4 lg:px-6 lg:py-3.5 shadow-xl transition-all duration-300 hover:border-[#C9A96E]/80 hover:shadow-2xl hover:shadow-[#C9A96E]/15"
        >
          {/* Subtle animated shine sweep across the banner */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shine-sweep bg-gradient-to-r from-transparent via-white/[0.05] to-transparent w-1/2" />

          {/* Top glossy hairline reflection */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/60 to-transparent" />

          {/* Ambient warm glow */}
          <div className="pointer-events-none absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-[#C9A96E]/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#C9A96E]/15 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* 1. Left: Product Thumbnail + Title & Campaign Info */}
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
              {/* Product Thumbnail Box (as seen in reference image) */}
              {thumbnail && (
                <div className="relative h-16 w-20 sm:h-18 sm:w-24 md:h-20 md:w-28 shrink-0 overflow-hidden rounded-xl border border-[#C9A96E]/50 bg-[#16120C] shadow-inner p-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/20 via-transparent to-black/40 pointer-events-none" />
                  <img
                    src={thumbnail}
                    alt={drop.title}
                    className="h-full w-full object-cover object-center rounded-lg transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Campaign text info */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#C9A96E] mb-0.5">
                  <span className="text-[#E5A93C] text-[13px] leading-none">⚡</span>
                  <span>LIMITED DROP</span>
                </div>

                <h3 className="font-serif text-base sm:text-lg lg:text-xl font-bold text-[#F5F0E8] tracking-tight group-hover:text-[#C9A96E] transition-colors truncate">
                  {drop.title}
                </h3>

                <p className="font-sans text-xs text-[#A89880] flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-[#C9A96E]">{discountBadge}</span>
                  <span className="text-[#5C5248]">•</span>
                  <span>{drop.description || 'Limited time only'}</span>
                </p>
              </div>
            </div>

            {/* 2. Center/Right: Digital Countdown + CTA Button */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-between md:justify-end">
              {/* Countdown Timer (Box format: Number over Label) */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-[#A89880] hidden lg:inline-block">
                  ENDS IN
                </span>

                <div className="flex items-center gap-1.5 font-mono">
                  {/* Days */}
                  <div className="flex flex-col items-center justify-center bg-[#0D0D0D]/95 border border-[#2A2420] rounded-lg px-2 py-1 min-w-[42px] sm:min-w-[46px] shadow-sm">
                    <span className="text-sm sm:text-base font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#A89880] uppercase tracking-wider font-sans mt-0.5">
                      DAYS
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex flex-col items-center justify-center bg-[#0D0D0D]/95 border border-[#2A2420] rounded-lg px-2 py-1 min-w-[42px] sm:min-w-[46px] shadow-sm">
                    <span className="text-sm sm:text-base font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#A89880] uppercase tracking-wider font-sans mt-0.5">
                      HRS
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="flex flex-col items-center justify-center bg-[#0D0D0D]/95 border border-[#2A2420] rounded-lg px-2 py-1 min-w-[42px] sm:min-w-[46px] shadow-sm">
                    <span className="text-sm sm:text-base font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#A89880] uppercase tracking-wider font-sans mt-0.5">
                      MIN
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="flex flex-col items-center justify-center bg-[#0D0D0D]/95 border border-[#2A2420] rounded-lg px-2 py-1 min-w-[42px] sm:min-w-[46px] shadow-sm">
                    <span className="text-sm sm:text-base font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#A89880] uppercase tracking-wider font-sans mt-0.5">
                      SEC
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button (Rounded pill in warm gold) */}
              <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C9A96E] group-hover:bg-[#b8955b] text-[#0D0D0D] font-sans text-xs font-bold uppercase tracking-wider px-5 py-2.5 sm:px-6 sm:py-3 shadow-md shadow-[#C9A96E]/20 transition-all duration-200 group-hover:scale-105 shrink-0">
                <span>SHOP THE DROP</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

          </div>
        </Link>
      </div>
    </section>
  );
}
