'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Heart, ShoppingBag } from 'lucide-react';
import { useWishlistStore, useCartStore, useUiStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistDrawer() {
  const [mounted, setMounted] = useState(false);
  const wishlistOpen = useUiStore((state) => state.wishlistOpen);
  const setWishlistOpen = useUiStore((state) => state.setWishlistOpen);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  
  const wishlist = useWishlistStore((state) => state.wishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (wishlistOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [wishlistOpen]);

  const handleMoveToCart = (product: any) => {
    const defaultSize = product.sizes[0] || 40;
    addToCart(product, defaultSize, 1);
    removeFromWishlist(product.id);
    setWishlistOpen(false);
    setCartOpen(true);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {wishlistOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWishlistOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[100] flex h-full w-full max-w-md flex-col bg-[#141414] shadow-2xl border-l border-[#2A2420]"
          >
            {/* Header */}
            <div className="flex h-20 items-center justify-between border-b border-[#2A2420] px-6">
              <div className="flex items-center gap-2.5">
                <Heart className="h-5 w-5 text-[#C9A96E] fill-gold" />
                <h2 className="font-serif text-lg font-bold text-[#F5F0E8]">
                  My Wishlist ({wishlist.length})
                </h2>
              </div>
              <button
                onClick={() => setWishlistOpen(false)}
                className="rounded-full p-2 text-[#F5F0E8] hover:bg-[#1A1A1A] hover:text-[#C9A96E] transition-colors duration-200"
                aria-label="Close wishlist"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {wishlist.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-[#0D0D0D] p-6 border border-[#2A2420] mb-4">
                    <Heart className="h-10 w-10 text-[#A89880]" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Your wishlist is empty</h3>
                  <p className="font-sans text-sm text-[#A89880] mt-2 max-w-xs leading-relaxed">
                    Save items you love to your wishlist, so they are always at your fingertips.
                  </p>
                  <button
                    onClick={() => setWishlistOpen(false)}
                    className="mt-6 rounded-lg bg-[#C9A96E] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors duration-300"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                wishlist.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-xl border border-[#2A2420] bg-[#0D0D0D] p-4 transition-shadow hover:shadow-md"
                  >
                    {/* Item Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#141414] border border-[#2A2420]">
                      <Image
                        src={product.images?.[0] ?? (product as any).image ?? '/images/placeholder.jpg'}
                        alt={product.name ?? 'Product'}
                        fill
                        sizes="80px"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm font-bold text-[#F5F0E8] truncate">
                        <Link
                          href={`/shop/${product.slug}`}
                          onClick={() => setWishlistOpen(false)}
                          className="hover:text-[#C9A96E] transition-colors"
                        >
                          {product.name}
                        </Link>
                      </h4>
                      <p className="font-sans text-xs text-[#A89880] mt-0.5 uppercase tracking-wider">
                        {product.category}
                      </p>
                      
                      {/* Move to Cart button */}
                      <button
                        onClick={() => handleMoveToCart(product)}
                        className="mt-2.5 flex items-center gap-1.5 rounded bg-[#C9A96E] px-2.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors duration-200"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        Add to Bag
                      </button>
                    </div>

                    {/* Price & Delete */}
                    <div className="flex flex-col items-end justify-between self-stretch">
                      <span className="font-serif text-sm font-bold text-[#F5F0E8]">
                        ETB {product.price.toLocaleString()}.00
                      </span>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="rounded p-1.5 text-[#A89880] hover:bg-red-950/35 hover:text-red-500 transition-colors duration-200"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
