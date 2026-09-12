'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store';

interface PromotionConfig {
  bannerActive: boolean;
  discountPercentage: number;
  couponCode: string;
  bannerText: string;
  buttonText: string;
  bannerLink: string;
}

const DEFAULT_CONFIG: PromotionConfig = {
  bannerActive: true,
  discountPercentage: 50,
  couponCode: 'BLACKFRIDAY',
  bannerText: '🖤 BLACK FRIDAY — UP TO 50% OFF SITEWIDE',
  buttonText: 'SHOP NOW',
  bannerLink: '/shop',
};

export default function BlackFridayBanner() {
  const pathname = usePathname();
  const [config, setConfig] = useState<PromotionConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/promotions?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setConfig({
          bannerActive: Boolean(data.bannerActive),
          discountPercentage: data.discountPercentage ?? DEFAULT_CONFIG.discountPercentage,
          couponCode: data.couponCode ?? DEFAULT_CONFIG.couponCode,
          bannerText: data.bannerText ?? DEFAULT_CONFIG.bannerText,
          buttonText: data.buttonText ?? DEFAULT_CONFIG.buttonText,
          bannerLink: data.bannerLink ?? DEFAULT_CONFIG.bannerLink,
        });
      }
    } catch (err) {
      console.error("Failed to load banner config:", err);
    } finally {
      setMounted(true);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Re-fetch when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchConfig();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleClaimOffer = async () => {
    try {
      if (!config.bannerActive) return;

      const codeToApply = config.couponCode || 'BLACKFRIDAY';
      const percentToApply = config.discountPercentage || 50;

      // Apply promotional coupon directly to cart store
      useCartStore.getState().applyCoupon(codeToApply, percentToApply, 'percentage', percentToApply);

      // Attempt clipboard copy as convenience
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(codeToApply);
        }
      } catch (err) {}

      setToast(`✓ Black Friday offer claimed! (${percentToApply}% OFF applied)`);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      console.error(err);
      setToast("Failed to claim offer.");
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (!mounted) return null;

  // Hide on admin/staff pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) return null;

  // If banner is INACTIVE, return null completely (0px width/height, 0 DOM container)
  if (!config.bannerActive) {
    return null;
  }

  return (
    <div className="relative flex items-center">
      {toast && (
        <div className="absolute top-full mt-2 left-0 bg-[#141414] border border-[#C9A96E] rounded-lg px-3 py-1.5 text-xs text-[#F5F0E8] shadow-xl whitespace-nowrap z-[100]">
          {toast}
        </div>
      )}

      {/* Sleek compact promotional container around promo text, link, and button ONLY */}
      <div
        className="inline-flex items-center gap-2.5 sm:gap-3 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-[#C9A96E]/30 shadow-md max-w-full text-xs"
        style={{
          background: "linear-gradient(90deg, #4A341B 0%, #121212 100%)",
        }}
      >
        <p className="font-semibold tracking-wider uppercase truncate text-[#F5F0E8] text-[11px] sm:text-xs">
          {config.bannerText}&nbsp;
          <Link
            href={config.bannerLink}
            className="underline underline-offset-2 text-[#C9A96E] hover:text-[#e0c388] transition hidden sm:inline ml-1 font-bold"
          >
            {config.buttonText}
          </Link>
        </p>

        <button
          onClick={handleClaimOffer}
          className="flex items-center gap-1 bg-[#C9A96E] hover:bg-[#b0925c] text-[#0D0D0D] text-[10px] sm:text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full transition-all duration-200 shrink-0 cursor-pointer shadow-sm"
        >
          🎁 Claim Offer
        </button>
      </div>
    </div>
  );
}
