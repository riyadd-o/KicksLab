'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Flame, ArrowLeft, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import QuickViewModal from '@/components/product/QuickViewModal';
import { Product } from '@/lib/products';

interface DropProduct extends Product {
  dropPrice?: number;
  isDropItem?: boolean;
}

interface LimitedDropData {
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

export default function LimitedDropPage() {
  const [drop, setDrop] = useState<LimitedDropData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    ended: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    async function fetchActiveDrop() {
      try {
        const res = await fetch('/api/limited-drops/active');
        if (res.ok) {
          const data = await res.json();
          setDrop(data.drop || null);
        }
      } catch (err) {
        console.error('Failed to fetch active limited drop', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActiveDrop();
  }, []);

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

  const discountBadge = drop
    ? drop.discountType === 'fixed'
      ? `ETB ${drop.discountValue.toLocaleString()} OFF`
      : `${drop.discountValue}% OFF`
    : '';

  return (
    <div className="mx-auto max-w-7xl w-full px-4 pt-28 pb-16 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-[#A89880] hover:text-[#C9A96E] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C9A96E] border-t-transparent animate-spin mb-4" />
          <p className="font-serif text-lg font-bold text-[#F5F0E8]">Loading Limited Drop...</p>
        </div>
      ) : !drop || timeLeft.ended ? (
        /* Inactive or Expired State */
        <div className="flex flex-col items-center justify-center text-center py-24 px-4 bg-[#141414] border border-[#2A2420] rounded-2xl max-w-2xl mx-auto shadow-2xl">
          <div className="h-14 w-14 rounded-full bg-[#1A1A1A] border border-[#2A2420] flex items-center justify-center text-[#C9A96E] mb-5">
            <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
          </div>
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[#C9A96E] mb-2">
            Limited Drop
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8] mb-3">
            No Active Drop Right Now
          </h1>
          <p className="font-sans text-sm text-[#A89880] max-w-md leading-relaxed mb-8">
            Our exclusive limited drops and flash sales are time-sensitive events. Explore our full boutique catalog in the meantime or check back soon for our next drop.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-[#C9A96E] hover:bg-[#b8955b] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] transition-all duration-300 shadow-md"
          >
            <span>Explore All Footwear</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Active Drop Page Content */
        <div className="space-y-12">
          {/* Hero Campaign Header Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#C9A96E]/50 bg-gradient-to-r from-[#1A140E] via-[#141210] to-[#1A140E] p-6 sm:p-10 shadow-2xl">
            {/* Ambient gold glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#C9A96E]/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-[#C9A96E]/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left Column: Titles & Badges */}
              <div className="max-w-2xl space-y-3">
                <div className="flex items-center flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1208] border border-[#C9A96E]/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#C9A96E] shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A93C] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5A93C]" />
                    </span>
                    ⚡ Active Limited Drop
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A96E]/15 border border-[#C9A96E]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#C9A96E]">
                    <Flame className="h-3.5 w-3.5 text-[#C9A96E]" />
                    {discountBadge}
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F5F0E8] leading-tight">
                  {drop.title}
                </h1>

                {drop.description && (
                  <p className="font-sans text-sm sm:text-base text-[#A89880] leading-relaxed max-w-xl">
                    {drop.description}
                  </p>
                )}

                <div className="pt-1 text-xs text-[#A89880]">
                  Promotional pricing automatically applied at checkout while supplies last.
                </div>
              </div>

              {/* Right Column: High-Impact Countdown Timer */}
              <div className="flex flex-col sm:items-center lg:items-end shrink-0 bg-[#0D0D0D]/90 border border-[#2A2420] p-5 rounded-xl shadow-inner">
                <span className="text-xs font-sans font-bold tracking-widest uppercase text-[#A89880] flex items-center gap-1.5 mb-2.5">
                  <Clock className="h-4 w-4 text-[#C9A96E] animate-pulse" />
                  Campaign Closes In
                </span>

                <div className="flex items-center gap-2 font-mono">
                  {/* Days */}
                  <div className="flex flex-col items-center bg-[#141414] border border-[#C9A96E]/40 rounded-lg p-2.5 min-w-[56px]">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#A89880] uppercase tracking-wider mt-1">Days</span>
                  </div>
                  <span className="text-[#C9A96E] font-bold text-lg">:</span>

                  {/* Hours */}
                  <div className="flex flex-col items-center bg-[#141414] border border-[#C9A96E]/40 rounded-lg p-2.5 min-w-[56px]">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#A89880] uppercase tracking-wider mt-1">Hours</span>
                  </div>
                  <span className="text-[#C9A96E] font-bold text-lg">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center bg-[#141414] border border-[#C9A96E]/40 rounded-lg p-2.5 min-w-[56px]">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#A89880] uppercase tracking-wider mt-1">Mins</span>
                  </div>
                  <span className="text-[#C9A96E] font-bold text-lg">:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center bg-[#141414] border border-[#C9A96E]/40 rounded-lg p-2.5 min-w-[56px]">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#C9A96E] leading-none">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[#A89880] uppercase tracking-wider mt-1">Secs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Heading & Product Count */}
          <div className="flex items-center justify-between border-b border-[#2A2420] pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#F5F0E8]">
                Featured Drop Styles
              </h2>
              <p className="font-sans text-xs text-[#A89880] mt-1">
                Strictly limited inventory available at promotional pricing.
              </p>
            </div>
            <span className="font-sans text-xs font-semibold text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-3 py-1 rounded-full">
              {drop.products.length} {drop.products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>

          {/* Product Grid */}
          {drop.products.length === 0 ? (
            <div className="text-center py-20 bg-[#141414] border border-[#2A2420] rounded-xl p-8">
              <p className="text-[#A89880] text-sm">No items currently assigned to this drop.</p>
              <Link
                href="/shop"
                className="mt-4 inline-block text-[#C9A96E] font-bold text-xs uppercase tracking-wider underline hover:text-[#b8955b]"
              >
                Browse All Shoes &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {drop.products.map((product) => {
                const effectiveProduct: Product = {
                  ...product,
                  originalPrice: product.originalPrice ?? product.price,
                  price: product.dropPrice ?? product.price,
                  onSale: true,
                  isLimitedDrop: true,
                  dropDiscountBadge: discountBadge,
                };

                return (
                  <div key={product.id} className="flex flex-col">
                    <ProductCard
                      product={effectiveProduct}
                      onQuickView={(p) => setQuickViewProduct(p)}
                    />

                    {/* Stock Alert notice */}
                    <div className="mt-2 px-1 text-xs">
                      {product.stock !== undefined && product.stock <= 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#FF6B6B]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Sold Out
                        </span>
                      ) : product.stock !== undefined && product.stock <= 5 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#FFA500]">
                          <Flame className="h-3.5 w-3.5 text-[#FFA500]" />
                          Only {product.stock} left in stock!
                        </span>
                      ) : (
                        <span className="text-[#A89880]">
                          In Stock {product.stock !== undefined ? `(${product.stock} pairs available)` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Shared Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
