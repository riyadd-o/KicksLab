import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore, useWishlistStore, useUiStore } from "@/lib/store";

export default function QuickViewModal({ product, onClose }: any) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const wishlist = useWishlistStore((state) => state.wishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  useEffect(() => {
    setMounted(true);
    if (product?.slug) {
      router.prefetch(`/shop/${product.slug}`);
    }
  }, [product?.slug, router]);

  if (!product) return null;

  const isWishlisted = mounted && wishlist.some((item) => item.id === product.id);
  const sizesList = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : [38, 39, 40, 41, 42, 43];

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    
    addToCart(product, selectedSize, 1);
    
    onClose();
    setCartOpen(true);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isDrop = Boolean(product.isLimitedDrop || product.isDropItem);
  const hasDiscount = Boolean((product.onSale || isDrop) && product.originalPrice && product.originalPrice > product.price);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Container */}
      <div
        className="relative z-10 bg-[#141414] border border-[#2A2420] rounded-2xl w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="relative h-[280px] md:h-full min-h-[350px] bg-[#1A1A1A]">
          <Image
            src={product.images?.[0] ?? product.image ?? '/images/placeholder.jpg'}
            alt={product.name ?? 'Product'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          {(product.isLimitedDrop || product.isDropItem) && (
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1 bg-[#16120C]/95 text-[#C9A96E] border border-[#C9A96E]/70 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
                <span className="text-[#E5A93C] text-[10px] leading-none">⚡</span> LIMITED DROP
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[#C9A96E] text-xs tracking-widest uppercase font-semibold">
                  {product.category}
                </span>
                {(product.isLimitedDrop || product.isDropItem) && (
                  <span className="inline-flex items-center gap-1 bg-[#16120C] text-[#C9A96E] border border-[#C9A96E]/60 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full">
                    <span>⚡</span> Limited Drop
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[#A89880] hover:text-[#F5F0E8] p-1 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="text-[#F5F0E8] text-2xl font-serif font-bold mt-1 mb-2">
              {product.name}
            </h2>

            {/* Pricing with Effective Promotion support */}
            <div className="flex items-baseline flex-wrap gap-2.5 mb-4">
              {hasDiscount ? (
                <>
                  <span className="text-[#C9A96E] text-2xl font-bold font-serif">
                    ETB {product.price.toLocaleString()}.00
                  </span>
                  <span className="text-[#A89880] text-sm line-through font-sans">
                    ETB {product.originalPrice.toLocaleString()}.00
                  </span>
                  {(product.dropDiscountBadge || product.isLimitedDrop || product.isDropItem) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E] bg-[#C9A96E]/15 border border-[#C9A96E]/40 px-2 py-0.5 rounded-full">
                      {product.dropDiscountBadge || 'LIMITED DROP DEAL'}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[#C9A96E] text-2xl font-bold font-serif">
                  ETB {product.price.toLocaleString()}.00
                </span>
              )}
            </div>

            <p className="text-[#A89880] text-sm leading-relaxed mb-6 line-clamp-3">
              {product.description}
            </p>

            {/* Sizes */}
            <div>
              <span className="text-xs font-semibold text-[#F5F0E8] uppercase tracking-wider mb-2 block">
                Select Size
              </span>
              <div className="flex flex-wrap gap-2">
                {sizesList.slice(0, 6).map((size: number) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`border text-xs sm:text-sm w-9 h-9 sm:w-10 sm:h-10 rounded transition-colors font-medium ${
                      selectedSize === size
                        ? 'border-[#C9A96E] bg-[#C9A96E] text-[#0D0D0D] font-bold'
                        : 'border-[#2A2420] text-[#A89880] hover:border-[#C9A96E] hover:text-[#C9A96E]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="text-[#FF6B6B] text-xs mt-2 font-medium">
                  Please select your shoe size before adding to bag.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#2A2420]">
            <button
              onClick={handleAddToCart}
              disabled={(product.stock || 0) === 0}
              className={`flex-1 font-semibold tracking-widest uppercase text-xs sm:text-sm py-3 px-4 rounded-lg transition-all ${
                (product.stock || 0) === 0
                  ? 'bg-[#1A1A1A] text-[#A89880] cursor-not-allowed opacity-50 border border-[#2A2420]'
                  : 'bg-[#C9A96E] hover:bg-[#b8955b] text-[#0D0D0D]'
              }`}
            >
              {(product.stock || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button
              onClick={handleWishlistClick}
              className={`p-3 rounded-lg border transition-colors ${
                isWishlisted
                  ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/10'
                  : 'border-[#2A2420] text-[#A89880] hover:border-[#C9A96E] hover:text-[#C9A96E]'
              }`}
              aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              title="Wishlist"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-[#C9A96E]' : ''}`} />
            </button>

            <Link
              href={`/shop/${product.slug}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/shop/${product.slug}`);
                onClose();
              }}
              prefetch={true}
              className="flex items-center justify-center border border-[#2A2420] hover:border-[#C9A96E] text-[#F5F0E8] hover:text-[#C9A96E] text-xs sm:text-sm px-4 py-3 rounded-lg transition-all whitespace-nowrap cursor-pointer"
            >
              Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
