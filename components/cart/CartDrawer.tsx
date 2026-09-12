'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore, useUiStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const cartOpen = useUiStore((state) => state.cartOpen);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const shippingCost = useCartStore((state) => state.shippingCost);
  const shippingMethod = useCartStore((state) => state.shippingMethod);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when cart is open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
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
                <ShoppingBag className="h-5 w-5 text-[#C9A96E]" />
                <h2 className="font-serif text-lg font-bold text-[#F5F0E8]">
                  Shopping Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full p-2 text-[#F5F0E8] hover:bg-[#1A1A1A] hover:text-[#C9A96E] transition-colors duration-200"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-[#0D0D0D] p-6 border border-[#2A2420] mb-4">
                    <ShoppingBag className="h-10 w-10 text-[#A89880]" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Your bag is empty</h3>
                  <p className="font-sans text-sm text-[#A89880] mt-2 max-w-xs leading-relaxed">
                    Explore our exquisite collection of premium shoes and find your perfect pair.
                  </p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-6 rounded-lg bg-[#C9A96E] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors duration-300"
                  >
                    Shop Collection
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex items-center gap-4 rounded-xl border border-[#2A2420] bg-[#0D0D0D] p-4 transition-shadow hover:shadow-md"
                  >
                    {/* Item Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#141414] border border-[#2A2420]">
                      <Image
                        src={item.product.images?.[0] ?? (item.product as any).image ?? '/images/placeholder.jpg'}
                        alt={item.product.name ?? 'Product'}
                        fill
                        sizes="80px"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm font-bold text-[#F5F0E8] truncate">
                        <Link
                          href={`/shop/${item.product.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="hover:text-[#C9A96E] transition-colors"
                        >
                          {item.product.name}
                        </Link>
                      </h4>
                      <p className="font-sans text-xs text-[#A89880] mt-0.5">
                        Size: <span className="font-semibold text-[#F5F0E8]">{item.size}</span>
                      </p>

                      {/* Quantity Incrementor */}
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-[#2A2420] rounded bg-[#141414] overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            className="px-2 py-1 text-xs text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-[#F5F0E8] min-w-[20px] text-center select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            disabled={item.quantity >= (item.product.stock || 0)}
                            className="px-2 py-1 text-xs text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Price & Delete */}
                    <div className="flex flex-col items-end justify-between self-stretch">
                      <span className="font-serif text-sm font-bold text-[#F5F0E8]">
                        ETB {(item.product.price * item.quantity).toLocaleString()}.00
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="rounded p-1.5 text-[#A89880] hover:bg-red-950/35 hover:text-red-500 transition-colors duration-200"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary (only if items present) */}
            {cart.length > 0 && (
              <div className="border-t border-[#2A2420] bg-[#141414] px-6 py-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-sans text-sm text-[#A89880]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#F5F0E8]">ETB {subtotal.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm text-[#A89880]">
                    <span>Shipping</span>
                    <span className="font-semibold text-[#F5F0E8]">
                      {!shippingMethod
                        ? 'Calculated at checkout'
                        : shippingCost === 0
                        ? 'FREE'
                        : `ETB ${shippingCost.toLocaleString()}.00`}
                    </span>
                  </div>
                  <div className="border-t border-[#2A2420] my-2 pt-2 flex justify-between font-serif text-base font-bold text-[#F5F0E8]">
                    <span>Total</span>
                    <span>ETB {total.toLocaleString()}.00</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9A96E] py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors duration-300 shadow-md"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setCartOpen(false)}
                    className="flex w-full items-center justify-center rounded-lg border border-[#2A2420] bg-[#0D0D0D] py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-[#F5F0E8] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors duration-300"
                  >
                    View Shopping Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
