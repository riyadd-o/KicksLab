'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye } from 'lucide-react';
import { Product } from '@/lib/products';
import { useWishlistStore, useUiStore } from '@/lib/store';
import StarRating from '../ui/StarRating';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  variant?: 'light' | 'dark';
}

export default function ProductCard({ product, onQuickView, variant = 'dark' }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const wishlist = useWishlistStore((state) => state.wishlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWishlisted = mounted && wishlist.some((item) => item.id === product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isDrop = Boolean(product.isLimitedDrop || (product as any).isDropItem);
  const isLight = variant === 'light';
  const hasSale = Boolean((product.onSale || product.isLimitedDrop || (product as any).isDropItem) && product.originalPrice && product.originalPrice > product.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${
        isLight
          ? isDrop
            ? 'bg-white border-[#C9A96E]/70 shadow-xs hover:border-[#C9A96E] hover:shadow-md'
            : 'bg-white border-[#EAEAEA] shadow-xs hover:border-[#CCCCCC] hover:shadow-md'
          : isDrop
            ? 'bg-[#141414] border-[#C9A96E]/40 hover:border-[#C9A96E] hover:shadow-[#C9A96E]/10'
            : 'bg-[#141414] border-[#2A2420] hover:shadow-gold/5'
      }`}
    >
      {/* Product Image Container */}
      <div
        className={`relative w-full overflow-hidden rounded-t-xl ${
          isLight
            ? 'h-[140px] sm:h-[155px] md:h-[165px] bg-[#F6F6F6]'
            : 'h-[170px] sm:h-[190px] md:h-[200px] xl:h-[190px] bg-[#1A1A1A]'
        }`}
      >
        <Image
          src={product.images?.[0] ?? (product as any).image ?? '/images/placeholder.jpg'}
          alt={product.name ?? 'Product'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          priority={false}
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute z-10 flex items-center justify-center rounded-full transition-colors duration-200 shadow-xs ${
            isLight
              ? 'top-2 right-2 h-7 w-7 bg-white/90 backdrop-blur-sm text-[#444444] border border-[#E5E5E5] hover:text-[#C9A96E] hover:border-[#C9A96E]'
              : 'top-2.5 right-2.5 h-7 w-7 sm:h-8 sm:w-8 bg-[#0D0D0D]/95 backdrop-blur-sm text-[#F5F0E8] hover:bg-[#1A1A1A] hover:text-[#C9A96E]'
          }`}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart
            className={`transition-colors ${
              isLight ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'
            } ${
              isWishlisted
                ? 'fill-[#C9A96E] text-[#C9A96E]'
                : isLight ? 'text-[#555555]' : 'text-[#F5F0E8]'
            }`}
          />
        </button>

        {/* Quick-view overlay click target */}
        {onQuickView && (
          <div 
            onClick={(e) => { e.preventDefault(); onQuickView(product); }}
            className="absolute inset-0 cursor-pointer z-[5]"
            aria-label="Quick View"
          />
        )}

        {/* Badges container */}
        <div className={`absolute left-2 z-10 flex flex-row flex-wrap items-center gap-1 pointer-events-none max-w-[85%] ${isLight ? 'top-2' : 'top-2.5'}`}>
          {isDrop && (
            <span
              className={`inline-flex items-center gap-1 font-bold tracking-wider uppercase rounded-full shadow-xs w-fit ${
                isLight
                  ? 'bg-[#856728] text-white text-[7.5px] sm:text-[8px] px-1.5 py-0.5'
                  : 'bg-[#16120C]/95 border border-[#C9A96E]/70 text-[#C9A96E] text-[7.5px] sm:text-[8px] px-2 py-0.5 shadow-md backdrop-blur-sm'
              }`}
            >
              {!isLight && <span className="text-[#E5A93C] text-[9px] leading-none">⚡</span>}
              LIMITED DROP
            </span>
          )}
          {product.isNew && (
            <span className="bg-[#1B7943] text-white text-[7.5px] sm:text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full shadow-xs w-fit">
              NEW
            </span>
          )}
          {(product.stock !== undefined && product.stock <= 0) && (
            <span className="bg-[#8B0000] text-white text-[7.5px] sm:text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full shadow-xs w-fit">
              OUT OF STOCK
            </span>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className={`flex flex-1 flex-col justify-between ${isLight ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4'}`}>
        <div>
          <Link href={`/shop/${product.slug}`} className="block">
            <h3
              className={`font-sans font-semibold transition-colors duration-200 line-clamp-1 ${
                isLight
                  ? 'text-xs sm:text-[13px] text-[#111111] group-hover:text-[#C9A96E]'
                  : 'text-xs sm:text-sm text-[#F5F0E8] group-hover:text-[#C9A96E]'
              }`}
            >
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className="mt-1 flex items-baseline flex-wrap gap-1.5">
            <span
              className={`font-sans font-bold ${
                isLight ? 'text-xs sm:text-[13px] text-[#111111]' : 'text-sm sm:text-base text-[#F5F0E8]'
              }`}
            >
              ETB {product.price.toLocaleString()}
            </span>
            {hasSale && (
              <span
                className={`font-sans line-through ${
                  isLight ? 'text-[10px] sm:text-[11px] text-[#888888]' : 'text-[11px] sm:text-xs text-[#A89880]'
                }`}
              >
                ETB {product.originalPrice!.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="mt-1.5 flex items-center gap-1">
          {product.reviewsCount && product.reviewsCount > 0 && product.rating > 0 ? (
            <>
              <span className="text-[#E5A93C] text-xs leading-none">★</span>
              <span
                className={`font-sans font-medium text-[11px] ${
                  isLight ? 'text-[#666666]' : 'text-[#A89880]'
                }`}
              >
                {product.rating.toFixed(1)}
              </span>
              <span className={`font-sans text-[10px] ${isLight ? 'text-[#999999]' : 'text-[#777777]'}`}>
                ({product.reviewsCount})
              </span>
            </>
          ) : (
            <span className={`font-sans text-[11px] ${isLight ? 'text-[#999999]' : 'text-[#A89880]'}`}>
              No reviews yet
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
