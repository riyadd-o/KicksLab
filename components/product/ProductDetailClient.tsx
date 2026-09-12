'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, ShoppingBag, Truck, ShieldCheck, RefreshCw, Ruler } from 'lucide-react';
import { useCartStore, useWishlistStore, useUiStore } from '@/lib/store';
import StarRating from '@/components/ui/StarRating';
import SizeSelector from '@/components/ui/SizeSelector';
import QuantityPicker from '@/components/ui/QuantityPicker';
import ProductCard from '@/components/product/ProductCard';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductDetailClientProps {
  product: any;
  relatedProducts: any[];
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
}: ProductDetailClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ average: number; count: number } | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Zustand stores
  const addToCart = useCartStore((state) => state.addToCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const wishlist = useWishlistStore((state) => state.wishlist);
  const setCartOpen = useUiStore((state) => state.setCartOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset local interactive state if product slug changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setSizeWarning(false);
  }, [product.id, product.slug]);

  const isWishlisted = mounted && wishlist.some((item) => item.id === product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeWarning(true);
      return;
    }
    setSizeWarning(false);
    addToCart(product, selectedSize, quantity);
    setCartOpen(true);
  };

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || '/images/placeholder.jpg'];

  const sizes = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes.map((s: any) => (typeof s === 'string' ? parseInt(s, 10) : s))
    : [38, 39, 40, 41, 42, 43, 44, 45];

  const isDrop = Boolean(product.isLimitedDrop || product.isDropItem);
  const hasDiscount = Boolean((product.onSale || isDrop) && product.originalPrice && product.originalPrice > product.price);

  return (
    <div className="mx-auto max-w-7xl w-full px-4 pt-24 sm:pt-28 pb-12 sm:px-6 lg:px-8">
      {/* Back to Boutique link */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-[#A89880] hover:text-[#C9A96E] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to boutique collection
        </Link>
      </div>

      {/* Main Product Hero / Viewport Compact Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* ========================================================
            LEFT COLUMN: SHOWCASE PRODUCT IMAGE
           ======================================================== */}
        <div className="lg:col-span-6">
          {/* Main Showcase Image */}
          <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] overflow-hidden rounded-2xl border border-[#2A2420] bg-[#141414] shadow-md">
            <Image
              src={images[0] || '/images/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover object-center"
            />

            {/* Badges */}
            <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap gap-1.5">
              {isDrop && (
                <span className="inline-flex items-center gap-1 bg-[#16120C]/95 text-[#C9A96E] border border-[#C9A96E]/70 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
                  <span className="text-[#E5A93C] text-[10px] leading-none">⚡</span> LIMITED DROP
                </span>
              )}
              {product.isNew && (
                <span className="bg-[#1B7943] text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                  NEW
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: DETAILS & CUSTOMIZATION
           ======================================================== */}
        <div className="lg:col-span-6 flex flex-col space-y-4 sm:space-y-5">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                {product.category}
              </span>
              {product.gender && (
                <span className="font-sans text-[11px] text-[#A89880] uppercase tracking-wider">
                  &bull; {product.gender}
                </span>
              )}
            </div>
            
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F5F0E8] leading-tight">
              {product.name}
            </h1>

            {/* Rating & Price Header */}
            <div className="mt-2.5 flex items-center justify-between border-b border-[#2A2420] pb-3.5">
              {reviewStats && reviewStats.count > 0 ? (
                <a
                  href="#reviews-section"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity group cursor-pointer"
                >
                  <StarRating rating={reviewStats.average} size={15} />
                  <span className="font-sans text-xs font-semibold text-[#A89880] group-hover:text-[#C9A96E] transition-colors">
                    {reviewStats.average.toFixed(1)} ({reviewStats.count} {reviewStats.count === 1 ? 'Review' : 'Reviews'})
                  </span>
                </a>
              ) : (product.reviewsCount && product.reviewsCount > 0 && product.rating > 0) ? (
                <a
                  href="#reviews-section"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity group cursor-pointer"
                >
                  <StarRating rating={product.rating} size={15} />
                  <span className="font-sans text-xs font-semibold text-[#A89880] group-hover:text-[#C9A96E] transition-colors">
                    {product.rating.toFixed(1)} ({product.reviewsCount} {product.reviewsCount === 1 ? 'Review' : 'Reviews'})
                  </span>
                </a>
              ) : (
                <a
                  href="#reviews-section"
                  className="flex items-center gap-1.5 text-xs text-[#A89880] hover:text-[#C9A96E] transition-colors cursor-pointer"
                >
                  <span className="font-sans text-xs text-[#A89880] hover:text-[#C9A96E]">No reviews yet</span>
                </a>
              )}

              <div className="flex items-baseline gap-2.5">
                {hasDiscount ? (
                  <>
                    <span className="font-serif text-xl sm:text-2xl font-bold text-[#C9A96E]">
                      ETB {product.price.toLocaleString()}.00
                    </span>
                    <span className="font-sans text-xs sm:text-sm text-[#A89880] line-through">
                      ETB {product.originalPrice.toLocaleString()}.00
                    </span>
                    {product.dropDiscountBadge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#C9A96E] bg-[#C9A96E]/15 border border-[#C9A96E]/40 px-2 py-0.5 rounded-full">
                        {product.dropDiscountBadge}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-serif text-xl sm:text-2xl font-bold text-[#F5F0E8]">
                    ETB {product.price.toLocaleString()}.00
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="font-sans text-xs sm:text-sm text-[#A89880] leading-relaxed line-clamp-3">
                {product.description}
              </p>
            </div>
          )}

          {/* Size Selector + Size Guide Button */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8]">
                Select Size (EU)
              </span>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="inline-flex items-center gap-1 font-sans text-xs text-[#C9A96E] hover:text-[#b8955b] underline cursor-pointer transition-colors"
              >
                <Ruler size={13} />
                <span>Size Guide</span>
              </button>
            </div>

            <SizeSelector
              sizes={sizes}
              selectedSize={selectedSize}
              onSizeSelect={(size) => {
                setSelectedSize(size);
                setSizeWarning(false);
              }}
            />

            <AnimatePresence>
              {sizeWarning && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-[#FF6B6B] font-semibold"
                >
                  Please select your shoe size before adding to bag.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Quantity & CTA Row */}
          <div className="pt-2 border-t border-[#2A2420] space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity Picker */}
              <div className="shrink-0">
                <QuantityPicker
                  quantity={quantity}
                  onChange={setQuantity}
                  max={product.stock !== undefined ? product.stock : 10}
                />
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock !== undefined && product.stock <= 0}
                className="flex-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-[#C9A96E] hover:bg-[#b8955b] font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                {product.stock !== undefined && product.stock <= 0 ? 'Out of Stock' : 'Add to Shopping Bag'}
              </button>

              {/* Wishlist CTA */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                    : 'border-[#2A2420] bg-[#141414] text-[#F5F0E8] hover:border-[#C9A96E] hover:text-[#C9A96E]'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-[#C9A96E]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Premium Value Highlights */}
          <div className="border-t border-[#2A2420] pt-4 grid grid-cols-3 gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#C9A96E] shrink-0" />
              <span className="font-sans text-[11px] text-[#A89880] leading-tight">
                Free Delivery Over 5K
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C9A96E] shrink-0" />
              <span className="font-sans text-[11px] text-[#A89880] leading-tight">
                Authentic Guarantee
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#C9A96E] shrink-0" />
              <span className="font-sans text-[11px] text-[#A89880] leading-tight">
                Easy Return Policy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          CUSTOMER REVIEWS SECTION
         ======================================================== */}
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        onRatingLoaded={(avg, count) => setReviewStats({ average: avg, count })}
      />

      {/* ========================================================
          DYNAMIC "YOU MAY ALSO LIKE" SECTION
         ======================================================== */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#2A2420]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                Curated Recommendations
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#F5F0E8]">
                You May Also Like
              </h2>
            </div>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] hover:underline"
            >
              View All {product.category} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {relatedProducts.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </div>
  );
}
