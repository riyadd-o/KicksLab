'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowRight, ShoppingBag, Truck, RefreshCw, Heart } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/lib/store';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const couponCode = useCartStore((state) => state.couponCode);
  const discountPercentage = useCartStore((state) => state.discountPercentage);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCouponStore = useCartStore((state) => state.removeCoupon);
  const selectedZone = useCartStore((state) => state.selectedZone);
  const setSelectedZone = useCartStore((state) => state.setSelectedZone);
  const shippingMethod = useCartStore((state) => state.shippingMethod);
  const shippingCost = useCartStore((state) => state.shippingCost);
  
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
  const [shippingError, setShippingError] = useState(false);

  // Dynamic shipping options state
  const [zones, setZones] = useState<any[]>([]);
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const router = useRouter();
  
  const wishlist = useWishlistStore((state) => state.wishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  useEffect(() => {
    setMounted(true);
    const fetchShipping = async () => {
      try {
        const res = await fetch('/api/shipping');
        if (res.ok) {
          const data = await res.json();
          setZones(data.zones || []);
          setShippingSettings(data.settings || null);
          if (data.zones && data.zones.length > 0 && !selectedZone) {
            setSelectedZone(data.zones[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching shipping config:', err);
      }
    };
    fetchShipping();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercentage / 100));
  const qualifyingSubtotal = Math.max(0, subtotal - discountAmount);

  // Check if free shipping applies
  const isFreeShipping = Boolean(
    shippingSettings?.freeShippingEnabled &&
    qualifyingSubtotal >= (shippingSettings?.freeShippingThreshold || 0)
  );

  const activeShippingCost = isFreeShipping ? 0 : (selectedZone ? selectedZone.fee : shippingCost);
  const total = subtotal - discountAmount + activeShippingCost;

  const freeShippingThreshold = shippingSettings?.freeShippingThreshold || 5000;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - qualifyingSubtotal);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponMessage({ text: data.error || 'Invalid coupon code', type: 'error' });
        return;
      }

      const { coupon } = data;
      const type = coupon.discountType;
      const amount = coupon.value;
      const percentage = type === 'fixed' ? (amount / subtotal) * 100 : amount;

      applyCoupon(code, percentage);
      const saved = Math.round(subtotal * (percentage / 100));
      setCouponMessage({ text: `Coupon applied! You saved ETB ${saved.toLocaleString()}`, type: 'success' });
      setCouponInput('');
    } catch (err) {
      console.error(err);
      setCouponMessage({ text: 'Error applying coupon', type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    removeCouponStore();
    setCouponMessage({ text: '', type: '' });
  };

  const handleProceedToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!shippingMethod) {
      setShippingError(true);
      return;
    }
    setShippingError(false);
    router.push('/checkout');
  };

  if (!mounted) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-32 bg-[#0D0D0D] text-[#F5F0E8]">
        <span className="font-serif text-xl font-bold tracking-widest animate-pulse text-[#C9A96E]">KicksLab</span>
        <span className="font-sans text-xs text-[#A89880] mt-1 uppercase tracking-wider">Loading Shopping Bag...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 pt-32 pb-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8] mb-8">
        Your Shopping Bag
      </h1>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-[#141414] border border-[#2A2420] rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="rounded-full bg-[#0D0D0D] border border-[#2A2420] p-6 text-[#C9A96E] mb-4">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#F5F0E8]">Your bag is currently empty</h2>
          <p className="font-sans text-sm text-[#A89880] mt-2 max-w-xs leading-relaxed">
            Fill your bag with premium luxury leather footwear from our boutique collection.
          </p>
          <Link
            href="/shop"
            className="mt-6 rounded-lg bg-[#C9A96E] px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors duration-300 shadow-md"
          >
            Shop Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================
              CART ITEMS LIST (Left 8 cols)
             ======================================================== */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Progress Banner */}
            {shippingSettings?.freeShippingEnabled && (
              <div className="border border-[#C9A96E]/30 rounded-xl p-4 bg-[#141414] flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-[#C9A96E] shrink-0" />
                  {isFreeShipping ? (
                    <span className="font-sans text-sm font-semibold text-green-400">
                      🎉 Congratulations! You qualify for <span className="underline">FREE Shipping</span>!
                    </span>
                  ) : (
                    <span className="font-sans text-xs sm:text-sm text-[#F5F0E8]">
                      Add <span className="font-bold text-[#C9A96E]">ETB {amountNeededForFreeShipping.toLocaleString()}.00</span> more to unlock <span className="font-bold text-green-400">FREE Delivery</span>!
                    </span>
                  )}
                </div>
              </div>
            )}

            {cart.map((item) => {
              const inWishlist = wishlist.some((w) => w.id === item.product.id);
              return (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-xl border border-[#2A2420] bg-[#141414] p-5 transition-shadow hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#0D0D0D] border border-[#2A2420]">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="96px"
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 self-stretch flex flex-col justify-between">
                    <div>
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                        {item.product.category}
                      </span>
                      <h3 className="font-serif text-base font-bold text-[#F5F0E8] mt-0.5 truncate">
                        <Link href={`/shop/${item.product.slug}`} className="hover:text-[#C9A96E] transition-colors">
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="font-sans text-xs text-[#A89880] mt-1">
                        Size: <span className="font-bold text-[#F5F0E8]">{item.size}</span>
                      </p>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-6 mt-4 sm:mt-0">
                      {/* Quantity control */}
                      <div className="flex items-center border border-[#2A2420] rounded bg-[#0D0D0D] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          className="px-3 py-1.5 text-sm font-semibold text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-semibold text-[#F5F0E8] min-w-[24px] text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          disabled={item.quantity >= (item.product.stock || 0)}
                          className="px-3 py-1.5 text-sm font-semibold text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>

                      {/* Move to Wishlist / Remove */}
                      <div className="flex items-center gap-4 text-xs font-sans">
                        <button
                          onClick={() => toggleWishlist(item.product)}
                          className="flex items-center gap-1 text-[#A89880] hover:text-[#C9A96E] transition-colors"
                        >
                          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-gold text-[#C9A96E]' : ''}`} />
                          <span className="hidden sm:inline">
                            {inWishlist ? 'Wishlisted' : 'Move to Wishlist'}
                          </span>
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          className="flex items-center gap-1 text-[#A89880] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="sm:self-stretch flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-[#2A2420]/50 pt-3 sm:pt-0 w-full sm:w-auto">
                    <span className="sm:hidden font-sans text-xs text-[#A89880]">Total:</span>
                    <span className="font-serif text-lg font-bold text-[#F5F0E8]">
                      ETB {(item.product.price * item.quantity).toLocaleString()}.00
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Shopping benefits banner */}
            <div className="border border-dashed border-[#2A2420] rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#141414]/40">
              <div className="flex gap-3">
                <Truck className="h-5 w-5 text-[#C9A96E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-xs font-bold text-[#F5F0E8]">Express Options</h4>
                  <p className="font-sans text-[11px] text-[#A89880] mt-0.5">Choose Dire Dawa express or regional delivery options.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <RefreshCw className="h-5 w-5 text-[#C9A96E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-xs font-bold text-[#F5F0E8]">Premium Returns</h4>
                  <p className="font-sans text-[11px] text-[#A89880] mt-0.5">Complimentary 30-day exchange with prepaid shipping label.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ORDER SUMMARY SIDEBAR (Right 4 cols)
             ======================================================== */}
          <div className="lg:col-span-4 rounded-xl border border-[#2A2420] bg-[#141414] p-6 space-y-6">
            <h2 className="font-serif text-lg font-bold text-[#F5F0E8] border-b border-[#2A2420] pb-4">
              Order Summary
            </h2>
            
            {/* Dynamic Shipping Zone Selection */}
            <div className="mt-6 space-y-3 pb-6 border-b border-[#2A2420]">
              <p className="text-[#F5F0E8] text-xs tracking-widest uppercase font-semibold mb-3">
                Select Shipping Location
              </p>

              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id || shippingMethod === zone.name;
                return (
                  <label
                    key={zone.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-[#C9A96E] bg-[#1A1A1A]' : 'border-[#2A2420] bg-[#141414]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#C9A96E]' : 'border-[#2A2420]'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#C9A96E]" />}
                      </div>
                      <div>
                        <p className="text-[#F5F0E8] text-sm font-medium">{zone.name}</p>
                        <p className="text-[#A89880] text-xs">{zone.city}</p>
                      </div>
                    </div>
                    <span className="text-[#C9A96E] font-semibold text-sm">
                      {isFreeShipping ? (
                        <span className="text-green-400 font-bold">FREE</span>
                      ) : (
                        `ETB ${zone.fee.toLocaleString()}`
                      )}
                    </span>
                    <input
                      type="radio"
                      name="shippingZone"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedZone(zone, isFreeShipping ? 0 : zone.fee);
                        setShippingError(false);
                      }}
                    />
                  </label>
                );
              })}

              {/* Validation error */}
              {shippingError && !selectedZone && (
                <p className="text-red-400 text-xs mt-1">
                  Please select a shipping location to continue.
                </p>
              )}
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between font-sans text-sm text-[#A89880]">
                <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-semibold text-[#F5F0E8]">ETB {subtotal.toLocaleString()}.00</span>
              </div>

              {couponCode && (
                <div className="flex justify-between font-sans text-sm text-[#C9A96E]">
                  <span>Discount ({couponCode})</span>
                  <span className="font-semibold">-ETB {discountAmount.toLocaleString()}.00</span>
                </div>
              )}

              <div className="flex justify-between font-sans text-sm text-[#A89880]">
                <span>Shipping</span>
                <span className="font-semibold text-[#F5F0E8]">
                  {isFreeShipping ? (
                    <span className="text-green-400 font-bold">FREE</span>
                  ) : activeShippingCost > 0 ? (
                    `ETB ${activeShippingCost.toLocaleString()}.00`
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              
              <div className="border-t border-[#2A2420] my-2 pt-4 flex justify-between font-serif text-lg font-bold text-[#F5F0E8]">
                <span>Grand Total</span>
                <span>ETB {total.toLocaleString()}.00</span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-[#2A2420] pt-6">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">Have a promo code?</h3>
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#C9A96E]/30 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-[#C9A96E]">
                    <span className="font-bold text-sm">{couponCode}</span>
                    <span className="text-xs bg-[#C9A96E]/20 px-2 py-0.5 rounded">-{discountPercentage}%</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-[#A89880] hover:text-red-400">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none rounded-lg px-4 py-3 text-sm"
                  />
                  <button type="submit" className="bg-border hover:bg-border-light text-[#F5F0E8] px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                    Apply
                  </button>
                </form>
              )}
              {couponMessage.text && (
                <p className={`mt-2 text-xs ${couponMessage.type === 'success' ? 'text-[#C9A96E]' : 'text-red-400'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={handleProceedToCheckout}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-4 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  !shippingMethod ? 'opacity-50 cursor-not-allowed bg-[#C9A96E] text-[#0D0D0D]' : 'bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] hover:shadow-lg'
                }`}
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/shop"
                className="flex w-full items-center justify-center rounded-lg border border-[#2A2420] bg-[#0D0D0D] hover:bg-[#1A1A1A] py-4 font-sans text-xs font-bold uppercase tracking-widest text-[#F5F0E8] transition-colors duration-300 mt-2.5"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
