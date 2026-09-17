'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import {
  Check, CreditCard, ChevronRight, ShoppingBag, ArrowLeft, Calendar,
  CheckCircle, Loader2, User, Banknote, MapPin, Plus, Star, Edit2,
  Home, Building2, Users, Tag, X, Phone, Smartphone, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CustomerPaymentMethod,
  PAYMENT_METHOD_OPTIONS,
  formatPaymentMethodName,
  isCashPayment,
} from '@/lib/payment';

interface ShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);

  // Steps: 1 = Shipping Info, 2 = Review & Payment, 3 = Confirmation
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [rewardCoupon, setRewardCoupon] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<ShippingDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Ethiopia 🇪🇹',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod | ''>('');
  const [paymentMethodError, setPaymentMethodError] = useState<string>('');
  const [chapaRef, setChapaRef] = useState<string>('');
  const [confirmedTotal, setConfirmedTotal] = useState<string>('');
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState<string>('');

  const [customerUser, setCustomerUser] = useState<Record<string, unknown> | null>(null);
  const [existingAccountFound, setExistingAccountFound] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [guestBypassEmail, setGuestBypassEmail] = useState('');
  const isUserLoggedIn = isLoggedIn || !!customerUser;

  // Saved addresses state for authenticated customer
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [editingCheckoutAddress, setEditingCheckoutAddress] = useState<any | null>(null);
  const [editCheckoutForm, setEditCheckoutForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    streetAddress: '',
    postalCode: '',
    label: 'Home',
  });
  const [savingEditAddress, setSavingEditAddress] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fetch customer profile & saved addresses if authenticated
    setLoadingAddresses(true);
    fetch('/api/customer/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCustomerUser(data.user);
          // Only prefill customer contact details (name, email, phone) - NOT legacy User.address
          setFormData((prev) => ({
            ...prev,
            name: prev.name || data.user.name || '',
            email: prev.email || data.user.email || '',
            phone: prev.phone || data.user.phone || '',
          }));

          return fetch('/api/customer/addresses');
        }
        return null;
      })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((addrData) => {
        if (addrData?.addresses) {
          setSavedAddresses(addrData.addresses);
          if (addrData.addresses.length > 0) {
            const defaultAddr = addrData.addresses.find((a: any) => a.isDefault) || addrData.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              name: defaultAddr.fullName || prev.name,
              phone: defaultAddr.phone || prev.phone,
              address: defaultAddr.streetAddress,
              city: defaultAddr.city,
              postalCode: defaultAddr.postalCode || '',
            }));
          } else {
            setSelectedAddressId('new');
          }
        }
      })
      .catch((err) => console.error('Error fetching customer profile or addresses:', err))
      .finally(() => setLoadingAddresses(false));

    // Read URL query params (e.g., return from Chapa verification or COD placement)
    const urlParams = new URLSearchParams(window.location.search);
    const queryStep = urlParams.get('step');
    const queryOrderNumber = urlParams.get('orderNumber');
    const queryError = urlParams.get('error');
    const queryRef = urlParams.get('ref') || urlParams.get('chapaRef');
    const queryTotal = urlParams.get('total');
    const queryMethod = urlParams.get('method') || urlParams.get('paymentMethod');

    if (queryError) {
      setErrorMessage(decodeURIComponent(queryError));
    }

    if (queryMethod === 'cod' || queryMethod === 'CASH_ON_DELIVERY') {
      setConfirmedPaymentMethod('CASH_ON_DELIVERY');
    }

    if (queryStep === '3' && queryOrderNumber) {
      setStep(3);
      setOrderId(queryOrderNumber);
      if (queryRef) setChapaRef(queryRef);
      if (queryTotal) setConfirmedTotal(queryTotal);
      clearCart();

      // Fetch latest order details if ref, total, or paymentMethod is missing
      fetch(`/api/orders?orderNumber=${encodeURIComponent(queryOrderNumber)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((orderData) => {
          if (orderData) {
            const refToUse = orderData.chapaRefId || orderData.paymentReference || '';
            if (refToUse) setChapaRef(refToUse);
            if (orderData.total) setConfirmedTotal(String(orderData.total));
            if (orderData.paymentMethod) setConfirmedPaymentMethod(formatPaymentMethodName(orderData.paymentMethod));
          }
        })
        .catch((err) => console.error('Error fetching confirmed order:', err));
    }

    // Disable autofill on all inputs after mount
    const inputs = document.querySelectorAll(
      'input[data-form-type="other"]'
    );
    inputs.forEach((input) => {
      input.setAttribute('readonly', 'true');
      setTimeout(() => {
        input.removeAttribute('readonly');
      }, 100);
    });

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsRedirecting(false);
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [clearCart]);

  const selectedZone = useCartStore((state) => state.selectedZone);
  const setSelectedZone = useCartStore((state) => state.setSelectedZone);
  const shippingMethod = useCartStore((state) => state.shippingMethod);
  const shippingCost = useCartStore((state) => state.shippingCost);
  const setShipping = useCartStore((state) => state.setShipping);
  const [shippingError, setShippingError] = useState(false);

  const [zones, setZones] = useState<any[]>([]);
  const [shippingSettings, setShippingSettings] = useState<any>(null);

  // Coupon state
  const couponCode = useCartStore((state) => state.couponCode);
  const discountPercentage = useCartStore((state) => state.discountPercentage);
  const couponDiscountType = useCartStore((state) => state.couponDiscountType);
  const couponDiscountValue = useCartStore((state) => state.couponDiscountValue);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const res = await fetch('/api/shipping');
        if (res.ok) {
          const data = await res.json();
          setZones(data.zones || []);
          setShippingSettings(data.settings || null);
        }
      } catch (err) {
        console.error('Error loading shipping configuration:', err);
      }
    };
    fetchShipping();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discountAmount = 0;
  if (couponCode) {
    if (couponDiscountType === 'fixed') {
      discountAmount = Math.min(couponDiscountValue, subtotal);
    } else if (discountPercentage > 0) {
      discountAmount = Math.round(subtotal * (discountPercentage / 100));
    } else if (couponDiscountValue > 0) {
      discountAmount = Math.round(subtotal * (couponDiscountValue / 100));
    }
  }

  const qualifyingSubtotal = Math.max(0, subtotal - discountAmount);

  const isFreeShipping = Boolean(
    shippingSettings?.freeShippingEnabled &&
    qualifyingSubtotal >= (shippingSettings?.freeShippingThreshold || 0)
  );

  const activeShippingCost = isFreeShipping ? 0 : (selectedZone ? selectedZone.fee : shippingCost);
  const total = subtotal - discountAmount + activeShippingCost;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setIsValidatingCoupon(true);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponError(data.error || 'Invalid or expired coupon code.');
        return;
      }
      const { coupon } = data;
      const percent = coupon.discountType === 'percentage' ? coupon.value : 0;
      applyCoupon(coupon.code, percent, coupon.discountType, coupon.value);
      setCouponInput('');
    } catch (err) {
      setCouponError('Failed to apply coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setExistingAccountFound(false);
    }
  };

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    const clean = emailToCheck.trim().toLowerCase();
    if (!clean || !clean.includes('@') || isUserLoggedIn) {
      setExistingAccountFound(false);
      return false;
    }
    if (guestBypassEmail === clean) {
      setExistingAccountFound(false);
      return false;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        const exists = Boolean(data.exists);
        setExistingAccountFound(exists);
        return exists;
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }
    return false;
  };

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      name: addr.fullName,
      phone: addr.phone,
      address: addr.streetAddress,
      city: addr.city,
      postalCode: addr.postalCode || '',
    }));
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setFormData((prev) => ({
      ...prev,
      name: (customerUser as any)?.name || prev.name,
      phone: (customerUser as any)?.phone || prev.phone,
      address: '',
      city: '',
      postalCode: '',
    }));
  };

  const openEditCheckoutAddress = (addr: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCheckoutAddress(addr);
    setEditCheckoutForm({
      fullName: addr.fullName,
      phone: addr.phone,
      city: addr.city,
      streetAddress: addr.streetAddress,
      postalCode: addr.postalCode || '',
      label: addr.label || 'Home',
    });
  };

  const handleSaveEditedAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheckoutAddress) return;
    setSavingEditAddress(true);
    try {
      const res = await fetch(`/api/customer/addresses/${editingCheckoutAddress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCheckoutForm),
      });
      const data = await res.json();
      if (res.ok && data.address) {
        setSavedAddresses((prev) =>
          prev.map((a) => (a.id === data.address.id ? data.address : a))
        );
        if (selectedAddressId === data.address.id) {
          setFormData((prev) => ({
            ...prev,
            name: data.address.fullName,
            phone: data.address.phone,
            address: data.address.streetAddress,
            city: data.address.city,
            postalCode: data.address.postalCode || '',
          }));
        }
        setEditingCheckoutAddress(null);
      }
    } catch (err) {
      console.error('Error saving edited address:', err);
    } finally {
      setSavingEditAddress(false);
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) {
      setShippingError(true);
      return;
    }
    setShippingError(false);

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!isUserLoggedIn && guestBypassEmail !== cleanEmail) {
      const exists = await checkEmailExists(cleanEmail);
      if (exists) {
        setExistingAccountFound(true);
        return;
      }
    }

    // If authenticated customer added a new address and opted to save it for future
    if (isUserLoggedIn && selectedAddressId === 'new' && saveForFuture) {
      try {
        const res = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: newAddressLabel || 'Home',
            fullName: formData.name,
            phone: formData.phone,
            city: formData.city,
            streetAddress: formData.address,
            postalCode: formData.postalCode || null,
            isDefault: savedAddresses.length === 0,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.address) {
            setSavedAddresses((prev) => [data.address, ...prev]);
            setSelectedAddressId(data.address.id);
          }
        }
      } catch (err) {
        console.error('Error saving new address during checkout:', err);
      }
    }

    setPaymentMethodError('');
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting || isRedirecting) return;

    if (!selectedZone) {
      setShippingError(true);
      setErrorMessage('Please select your shipping location.');
      return;
    }

    if (!paymentMethod) {
      setPaymentMethodError('Please select your payment method.');
      return;
    }

    setPaymentMethodError('');
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // 1. Cash on Delivery (COD) Flow
      // 1. Cash on Delivery Flow
      if (paymentMethod === 'CASH') {
        const orderPayload = {
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          streetAddress: formData.address,
          city: formData.city,
          items: cart.map(item => ({
            productId: item.product?.id || (item as any).productId || (item as any).id,
            name: item.product?.name || (item as any).name,
            image: item.product?.images?.[0] || (item as any).image || '',
            size: item.size != null ? String(item.size) : 'Standard',
            quantity: item.quantity,
            price: item.product?.price || (item as any).price
          })),
          subtotal,
          shippingZoneId: selectedZone?.id,
          shippingZoneName: selectedZone?.name,
          shippingCost: activeShippingCost,
          total,
          paymentMethod: 'CASH',
          couponCode: couponCode || null,
          couponDiscount: discountPercentage > 0 ? discountPercentage : (couponDiscountValue > 0 ? couponDiscountValue : null),
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to place Cash order.");
        }

        clearCart();
        setOrderId(data.orderNumber);
        setConfirmedTotal(String(data.total));
        setConfirmedPaymentMethod('Cash');
        setStep(3);

        window.history.replaceState(
          {},
          '',
          `/checkout?step=3&orderNumber=${encodeURIComponent(data.orderNumber)}&method=cash&total=${encodeURIComponent(String(data.total))}`
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Digital Gateway Flow (Telebirr, CBE Birr, E-Birr via Chapa)
      const orderPayload = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        streetAddress: formData.address,
        city: formData.city,
        items: cart.map(item => ({
          productId: item.product?.id || (item as any).productId || (item as any).id,
          name: item.product?.name || (item as any).name,
          image: item.product?.images?.[0] || (item as any).image || '',
          size: item.size != null ? String(item.size) : 'Standard',
          quantity: item.quantity,
          price: item.product?.price || (item as any).price
        })),
        subtotal,
        shippingZoneId: selectedZone?.id,
        shippingZoneName: selectedZone?.name,
        shippingCost: activeShippingCost,
        total,
        paymentMethod,
        couponCode: couponCode || null,
        couponDiscount: discountPercentage > 0 ? discountPercentage : (couponDiscountValue > 0 ? couponDiscountValue : null),
      };

      const res = await fetch("/api/payments/chapa/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = {};
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("[Checkout Payment Error] Non-JSON API response from /api/payments/chapa/initialize:", text);
        throw new Error(`Server returned HTML error (${res.status}). Please check server logs.`);
      }

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to initialize payment.");
      }

      // Smoothly navigate directly to the external Chapa checkout portal.
      // Do not clear the cart early or unmount checkout, preventing empty-page and footer flash.
      setIsRedirecting(true);
      window.location.assign(data.checkoutUrl);
    } catch (error: any) {
      console.error("[Checkout Payment Error]", error);
      setErrorMessage(error.message || "Failed to place order. Please try again.");
      setIsRedirecting(false);
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-32 bg-[#0D0D0D] text-[#F5F0E8]">
        <span className="font-serif text-xl font-bold tracking-widest animate-pulse text-[#C9A96E]">KicksLab</span>
        <span className="font-sans text-xs text-[#A89880] mt-1 uppercase tracking-wider">Loading Checkout...</span>
      </div>
    );
  }

  // Safe-guard for steps 1 and 2 if cart is empty (suppressed while submitting or redirecting)
  if (!isSubmitting && !isRedirecting && cart.length === 0 && step < 3) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center flex-1">
        <ShoppingBag className="h-12 w-12 text-[#C9A96E] mb-4" />
        <h1 className="font-serif text-2xl font-bold text-[#F5F0E8]">Checkout is empty</h1>
        <p className="font-sans text-sm text-[#A89880] mt-2 max-w-xs">
          Your shopping bag is empty. Please add items to your bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="mt-6 rounded-lg bg-[#C9A96E] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 pt-32 pb-12 sm:px-6 lg:px-8">
      {/* Seamless transition overlay to prevent footer flash during Chapa redirect */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[100] bg-[#0D0D0D]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center">
            <Loader2 className="h-9 w-9 animate-spin text-[#C9A96E] mb-4" />
            <h3 className="font-serif text-lg font-bold text-[#F5F0E8] mb-1">
              Redirecting to {paymentMethod ? formatPaymentMethodName(paymentMethod) : 'Payment'}
            </h3>
            <p className="text-xs text-[#A89880]">
              Connecting to secure checkout, please wait...
            </p>
          </div>
        </div>
      )}

      {/* Checkout Steps Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-4 sm:gap-8 font-sans text-xs font-bold uppercase tracking-wider text-[#A89880]">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#C9A96E]' : ''}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${step > 1 ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]' : step === 1 ? 'border-[#C9A96E]' : 'border-[#2A2420]'}`}>
              {step > 1 ? <Check className="h-3 w-3" /> : '1'}
            </span>
            <span>Shipping</span>
          </div>
          <ChevronRight className="h-4 w-4 text-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#C9A96E]' : ''}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${step > 2 ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]' : step === 2 ? 'border-[#C9A96E]' : 'border-[#2A2420]'}`}>
              {step > 2 ? <Check className="h-3 w-3" /> : '2'}
            </span>
            <span>Review</span>
          </div>
          <ChevronRight className="h-4 w-4 text-border" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#C9A96E]' : ''}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${step === 3 ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]' : 'border-[#2A2420]'}`}>
              3
            </span>
            <span>Success</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 3 ? (
          // ========================================================
          // STEP 3: ORDER CONFIRMATION / PAYMENT SUCCESS
          // ========================================================
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] min-h-[100dvh] bg-[#0D0D0D] flex items-center justify-center px-4 py-6 overflow-y-auto"
          >
            <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 w-full max-w-md my-auto shadow-2xl">

              {/* Success Icon */}
              <div className="flex justify-center mb-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  confirmedPaymentMethod === 'CASH_ON_DELIVERY' || confirmedPaymentMethod === 'COD'
                    ? 'bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E]'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                  <CheckCircle size={28} />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-[#F5F0E8] text-2xl font-bold text-center mb-1">
                {confirmedPaymentMethod === 'CASH_ON_DELIVERY' || confirmedPaymentMethod === 'COD'
                  ? '✓ Order Confirmed'
                  : '✓ Payment Successful'}
              </h1>
              <p className="text-[#A89880] text-sm text-center mb-5">
                {isCashPayment(confirmedPaymentMethod)
                  ? `Your order #${orderId} has been placed successfully.`
                  : 'Thank you for shopping at KicksLab!'}
              </p>

              {/* Order & Payment Summary Card */}
              <div className="bg-[#1A1A1A] border border-[#2A2420] rounded-xl p-4 space-y-2.5 mb-5 font-sans text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#2A2420]">
                  <span className="text-[#A89880]">Order Number</span>
                  <span className="text-[#F5F0E8] font-bold font-mono text-sm">#{orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A89880]">Payment Method</span>
                  <span className="text-[#F5F0E8] font-semibold">
                    {formatPaymentMethodName(confirmedPaymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A89880]">Payment Status</span>
                  {isCashPayment(confirmedPaymentMethod) ? (
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Pending — Pay when delivered
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      PAID
                    </span>
                  )}
                </div>
                {chapaRef && !isCashPayment(confirmedPaymentMethod) && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#A89880]">Transaction Reference</span>
                    <span className="text-[#C9A96E] font-mono font-semibold">{chapaRef}</span>
                  </div>
                )}
                {confirmedTotal && (
                  <div className="flex justify-between items-center pt-2 border-t border-[#2A2420]">
                    <span className="text-[#A89880] font-semibold">
                      {isCashPayment(confirmedPaymentMethod) ? 'Total Amount' : 'Total Paid'}
                    </span>
                    <span className="text-[#C9A96E] font-bold text-sm">ETB {Number(confirmedTotal).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Delivery estimate */}
              <div className="bg-[#1A1A1A] border border-[#2A2420] rounded-lg p-3 flex items-center gap-2 mb-4">
                <Calendar size={15} className="text-[#C9A96E] shrink-0" />
                <p className="text-[#F5F0E8] text-xs">
                  Estimated Delivery: <strong className="text-[#C9A96E]">3–5 Business Days</strong>
                </p>
              </div>

              {/* COD Callout Note */}
              {isCashPayment(confirmedPaymentMethod) && (
                <div className="bg-[#1C1917] border border-[#78350F]/50 rounded-lg p-3.5 mb-5 text-center">
                  <p className="text-[#FCD34D] text-xs font-bold mb-0.5">💵 Cash Payment on Delivery</p>
                  <p className="text-[#D4CEB8] text-[11px] leading-relaxed">
                    Please have ETB {Number(confirmedTotal).toLocaleString()} ready in cash when your order arrives.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className={`grid gap-3 ${
                  isCashPayment(confirmedPaymentMethod) || !chapaRef
                    ? 'grid-cols-1'
                    : 'grid-cols-2'
                }`}>
                  <Link
                    href="/track-order"
                    className="w-full bg-[#1A1A1A] hover:bg-[#262626] text-[#F5F0E8] border border-[#2A2420] hover:border-[#C9A96E]/50 font-semibold text-xs py-3 px-4 rounded-lg text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    Track Order
                  </Link>
                  {chapaRef && !isCashPayment(confirmedPaymentMethod) && (
                    <a
                      href={
                        chapaRef.startsWith('KL-TX')
                          ? `https://checkout.chapa.co/checkout/test-payment-receipt/${chapaRef}`
                          : `https://chapa.link/payment-receipt/${chapaRef}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#1A1A1A] hover:bg-[#262626] text-[#C9A96E] border border-[#C9A96E]/30 hover:border-[#C9A96E] font-semibold text-xs py-3 px-4 rounded-lg text-center transition-all flex items-center justify-center gap-1.5"
                    >
                      View Receipt ↗
                    </a>
                  )}
                </div>

                <Link
                  href="/shop"
                  className="block w-full bg-[#C9A96E] hover:bg-[#b09259] text-[#0D0D0D] font-bold tracking-widest uppercase text-xs py-3.5 text-center rounded-lg transition-all duration-300 shadow-md"
                >
                  Continue Shopping
                </Link>
              </div>

            </div>
          </motion.div>
        ) : (
          // ========================================================
          // STEP 1 & 2: SHIPPING AND REVIEW FORM LAYOUT
          // ========================================================
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            {/* Form Side (Left 7 cols) */}
            <div className="lg:col-span-7">
              {step === 1 && (
                <motion.div
                  key="shipping-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 space-y-6"
                >
                  <h2 className="font-serif text-xl font-bold text-[#F5F0E8] border-b border-[#2A2420] pb-4">
                    Shipping Information
                  </h2>

                  <form onSubmit={handleShippingSubmit} className="space-y-5 font-sans text-sm" autoComplete="off" data-form-type="other" data-lpignore="true" data-1p-ignore="true">
                    {/* AUTHENTICATED CUSTOMER FLOW */}
                    {isUserLoggedIn ? (
                      <div className="space-y-6">
                        {/* 1. Contact Info Preview */}
                        <div className="bg-[#0D0D0D] border border-[#2A2420] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-[#A89880] uppercase tracking-wider font-semibold block">
                              Account Information
                            </span>
                            <span className="font-bold text-[#F5F0E8] text-sm">
                              {(customerUser as any)?.name || formData.name || 'Valued Customer'}
                            </span>
                            <span className="text-[#A89880] block mt-0.5">
                              {formData.email || (customerUser as any)?.email}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#C9A96E] font-medium bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 rounded-lg self-start sm:self-auto">
                            Logged In
                          </div>
                        </div>

                        {/* 2. Delivery Address Selector */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-1.5">
                              <MapPin size={15} />
                              <span>Select Delivery Address</span>
                            </h3>

                            {savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                              <button
                                type="button"
                                onClick={handleSelectNewAddress}
                                className="text-xs font-semibold text-[#C9A96E] hover:text-[#D4CEB8] transition-colors inline-flex items-center gap-1"
                              >
                                <Plus size={13} />
                                <span>+ New Address</span>
                              </button>
                            )}
                          </div>

                          {loadingAddresses ? (
                            <div className="p-8 border border-[#2A2420] rounded-xl text-center flex flex-col items-center justify-center gap-2">
                              <Loader2 className="animate-spin text-[#C9A96E]" size={24} />
                              <span className="text-xs text-[#A89880]">Loading your saved addresses...</span>
                            </div>
                          ) : savedAddresses.length > 0 ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {savedAddresses.map((addr) => {
                                  const isSelected = selectedAddressId === addr.id;
                                  return (
                                    <div
                                      key={addr.id}
                                      onClick={() => handleSelectSavedAddress(addr)}
                                      className={`relative rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                                        isSelected
                                          ? 'border-[#C9A96E] bg-[#1F1C18] shadow-md shadow-[#C9A96E]/10'
                                          : 'border-[#2A2420] bg-[#0D0D0D] hover:border-[#3E352B]'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-[#C9A96E]' : 'border-[#443B33]'
                                              }`}
                                            >
                                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />}
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5F0E8]">
                                              {addr.label || 'Home'}
                                            </span>
                                          </div>

                                          {addr.isDefault && (
                                            <span className="inline-flex items-center gap-1 text-[9px] bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-[#C9A96E] px-1.5 py-0.5 rounded font-bold uppercase">
                                              <Star size={9} className="fill-[#C9A96E]" />
                                              Default
                                            </span>
                                          )}
                                        </div>

                                        <div className="space-y-0.5 text-xs text-[#D4CEB8]">
                                          <p className="font-semibold text-[#F5F0E8]">{addr.fullName}</p>
                                          <p className="text-[11px] text-[#A89880]">{addr.phone}</p>
                                          <p className="text-[11px] text-[#D4CEB8] leading-tight mt-1">
                                            {addr.streetAddress}, {addr.city}
                                            {addr.postalCode ? ` (${addr.postalCode})` : ''}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mt-3 pt-2 border-t border-[#2A2420]/60 flex items-center justify-between text-[11px]">
                                        <span className="text-[#A89880]">
                                          {isSelected ? '✓ Selected for delivery' : 'Click to select'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => openEditCheckoutAddress(addr, e)}
                                          className="text-[#C9A96E] hover:underline inline-flex items-center gap-1 font-semibold"
                                        >
                                          <Edit2 size={11} />
                                          <span>Edit</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Card to toggle adding new address */}
                              <div
                                onClick={handleSelectNewAddress}
                                className={`rounded-xl p-3 border border-dashed transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold ${
                                  selectedAddressId === 'new'
                                    ? 'border-[#C9A96E] bg-[#1F1C18] text-[#C9A96E]'
                                    : 'border-[#2A2420] bg-[#0D0D0D]/50 text-[#A89880] hover:text-[#F5F0E8] hover:border-[#3E352B]'
                                }`}
                              >
                                <Plus size={14} />
                                <span>Deliver to a Different Address</span>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* 3. New Address Form (if selectedAddressId === 'new' or no saved addresses) */}
                        {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                          <div className="bg-[#0D0D0D] border border-[#2A2420] rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-[#2A2420] pb-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F0E8] flex items-center gap-1.5">
                                <Plus size={14} className="text-[#C9A96E]" />
                                <span>Enter New Delivery Address</span>
                              </h4>
                              {savedAddresses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectSavedAddress(savedAddresses[0])}
                                  className="text-xs text-[#A89880] hover:text-[#F5F0E8] transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Recipient Name */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">
                                  Recipient Full Name *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  name="name"
                                  placeholder="e.g. John Doe"
                                  className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                                />
                              </div>

                              {/* Phone */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">
                                  Delivery Phone Number *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={formData.phone}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9+]/g, '');
                                    setFormData((prev) => ({ ...prev, phone: val }));
                                  }}
                                  placeholder="+251 9XX XXX XXX"
                                  className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                                />
                              </div>

                              {/* Street Address */}
                              <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">
                                  Street Address & House / Building *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  name="address"
                                  placeholder="e.g. Bole Sub-City, Woreda 03, House 450"
                                  className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                                />
                              </div>

                              {/* City */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">
                                  City *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.city}
                                  onChange={handleInputChange}
                                  name="city"
                                  placeholder="e.g. Addis Ababa"
                                  className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                                />
                              </div>

                              {/* Postal Code */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">
                                  Postal Code (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={formData.postalCode}
                                  onChange={handleInputChange}
                                  name="postalCode"
                                  placeholder="1000"
                                  className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3.5 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                                />
                              </div>
                            </div>

                            {/* Label Selector & Save For Future */}
                            <div className="pt-2 border-t border-[#2A2420] space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs text-[#A89880] font-semibold">Address Label:</span>
                                {['Home', 'Office', 'Family', 'Other'].map((lbl) => (
                                  <button
                                    type="button"
                                    key={lbl}
                                    onClick={() => setNewAddressLabel(lbl)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                      newAddressLabel === lbl
                                        ? 'bg-[#C9A96E]/20 border-[#C9A96E] text-[#C9A96E]'
                                        : 'bg-[#141414] border-[#2A2420] text-[#A89880] hover:text-[#F5F0E8]'
                                    }`}
                                  >
                                    {lbl}
                                  </button>
                                ))}
                              </div>

                              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={saveForFuture}
                                  onChange={(e) => setSaveForFuture(e.target.checked)}
                                  className="w-4 h-4 rounded bg-[#141414] border-[#2A2420] text-[#C9A96E] accent-[#C9A96E] cursor-pointer"
                                />
                                <span className="text-xs text-[#D4CEB8] font-medium">
                                  Save this address to my account for future orders
                                </span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* GUEST CUSTOMER FLOW */
                      <div className="space-y-4">
                        {/* Full Name */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="name" className="font-semibold text-[#F5F0E8]">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            autoComplete="new-name"
                            className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-text-secondary/65 focus:border-[#C9A96E] focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="email" className="font-semibold text-[#F5F0E8]">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="john@example.com"
                            autoComplete="new-email"
                            className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-text-secondary/65 focus:border-[#C9A96E] focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Phone Number */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="phone" className="font-semibold text-[#F5F0E8]">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            id="phone"
                            name="phone"
                            required
                            value={formData.phone}
                            onKeyDown={(e) => {
                              const allowed = [
                                'Backspace','Delete','Tab','Escape','Enter',
                                'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
                                'Home','End','+'
                              ];
                              if (allowed.includes(e.key)) return;
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9+]/g, '');
                              setFormData((prev) => ({ ...prev, phone: val }));
                            }}
                            placeholder="+251 9XX XXX XXX"
                            autoComplete="new-tel"
                            className="w-full bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none rounded-lg px-4 py-3"
                          />
                        </div>

                        {/* Street Address */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="address" className="font-semibold text-[#F5F0E8]">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Enter Street Name & House No."
                            autoComplete="new-address"
                            className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-text-secondary/65 focus:border-[#C9A96E] focus:outline-none transition-colors"
                          />
                        </div>

                        {/* City & Country & Postal Code */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="city" className="font-semibold text-[#F5F0E8]">
                              City *
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              required
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="Addis Ababa"
                              autoComplete="new-city"
                              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-text-secondary/65 focus:border-[#C9A96E] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label htmlFor="country" className="font-semibold text-[#F5F0E8]">
                              Country *
                            </label>
                            <input
                              type="text"
                              id="country"
                              name="country"
                              value={formData.country}
                              readOnly
                              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:outline-none cursor-not-allowed opacity-70"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label htmlFor="postalCode" className="font-semibold text-[#F5F0E8]">
                              Postal Code (Optional)
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleInputChange}
                              placeholder="1000"
                              autoComplete="new-postal"
                              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-text-secondary/65 focus:border-[#C9A96E] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Existing Account Prompt: Appears ONLY after clicking Continue to Order Review */}
                    {existingAccountFound && !isUserLoggedIn && (
                      <div className="mt-4 p-4 rounded-xl bg-[#1A1A1A] border border-[#C9A96E]/50 shadow-xl text-[#F5F0E8] space-y-3 animate-fadeIn">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#C9A96E]/10 text-[#C9A96E] shrink-0 mt-0.5">
                            <User size={18} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-[#F5F0E8]">An account already exists with this email.</h4>
                            <p className="text-xs text-[#A89880] mt-1 leading-relaxed">
                              Sign in to access your account and saved information, or continue checking out as a guest.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-1 pl-11">
                          <Link
                            href="/signin?redirect=/checkout"
                            className="px-4 py-2.5 bg-[#C9A96E] hover:bg-[#b09259] text-[#0D0D0D] font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Sign In
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanEmail = formData.email.trim().toLowerCase();
                              setGuestBypassEmail(cleanEmail);
                              setExistingAccountFound(false);
                              setStep(2);
                            }}
                            className="px-4 py-2.5 bg-[#262626] hover:bg-[#38312B] text-[#F5F0E8] font-semibold text-xs rounded-lg uppercase tracking-wider transition-colors border border-[#3A322C]"
                          >
                            Continue as Guest
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={checkingEmail}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9A96E] hover:bg-[#C9A96E]-hover disabled:opacity-60 py-3.5 text-[#0D0D0D] font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-300"
                      >
                        {checkingEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            Continue to Order Review
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="review-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 space-y-6"
                >
                  <h2 className="font-serif text-xl font-bold text-[#F5F0E8] border-b border-[#2A2420] pb-4">
                    Review Your Order
                  </h2>

                  <div className="space-y-6 font-sans text-sm">
                    {/* Shipping Address Summary */}
                    <div className="space-y-2.5 bg-[#0D0D0D]/40 border border-[#2A2420]/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[#F5F0E8] uppercase text-xs tracking-wider">
                          Shipping Address
                        </h3>
                        <button
                          onClick={() => setStep(1)}
                          className="text-xs font-semibold text-[#C9A96E] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-[#A89880] leading-relaxed">
                        <strong className="text-[#F5F0E8]">{formData.name}</strong><br />
                        {formData.address}<br />
                        {formData.city}, {formData.postalCode}, {formData.country}<br />
                        Email: {formData.email}
                      </p>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-[#F5F0E8] uppercase text-xs tracking-wider">
                          How would you like to pay?
                        </h3>
                        <p className="text-[#A89880] text-xs mt-1">
                          Select your preferred payment method.
                        </p>
                      </div>

                      {/* 4 Customer Payment Options */}
                      <div className="grid grid-cols-1 gap-3">
                        {PAYMENT_METHOD_OPTIONS.map((opt) => {
                          const isSelected = paymentMethod === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                setPaymentMethod(opt.id);
                                setPaymentMethodError('');
                              }}
                              className={`cursor-pointer border rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all shadow-md ${
                                isSelected
                                  ? 'border-[#C9A96E] bg-[#1A1A1A] ring-1 ring-[#C9A96E]/30'
                                  : 'border-[#2A2420] bg-[#141414] hover:border-[#C9A96E]/40'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 p-1.5 bg-white shadow-sm transition-all overflow-hidden ${
                                  isSelected
                                    ? 'ring-2 ring-[#C9A96E]'
                                    : 'border border-[#2A2420]'
                                }`}>
                                  <Image
                                    src={opt.logoSrc}
                                    alt={opt.name}
                                    width={44}
                                    height={44}
                                    className="object-contain w-full h-full"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-[#F5F0E8] text-base">{opt.name}</p>
                                    {opt.badge && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                        opt.id === 'CASH'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                          : 'bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/30'
                                      }`}>
                                        {opt.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[#A89880] text-xs mt-0.5">
                                    {opt.description}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                                isSelected ? 'border-[#C9A96E]' : 'border-[#2A2420]'
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Payment Method Validation Error */}
                      {paymentMethodError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                          <span className="text-sm">⚠️</span>
                          <span className="font-semibold">{paymentMethodError}</span>
                        </div>
                      )}

                      {/* Informational Callout when Cash is selected */}
                      {paymentMethod === 'CASH' && (
                        <div className="bg-[#1C1917] border border-[#78350F]/50 text-[#FCD34D] text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                          <span className="text-base">💵</span>
                          <p>Pay in cash when your order is delivered. No online card details required.</p>
                        </div>
                      )}

                      {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg">
                          ⚠️ {errorMessage}
                        </div>
                      )}
                    </div>

                    {/* Back & Submit buttons */}
                    <div className="flex items-center gap-4 pt-4">
                      <button
                        onClick={() => setStep(1)}
                        disabled={isSubmitting || isRedirecting}
                        className="flex items-center gap-1.5 rounded-lg border border-[#2A2420] bg-[#0D0D0D] hover:bg-[#1A1A1A] px-5 py-3.5 text-[#F5F0E8] font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-300 disabled:opacity-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                      </button>

                      <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting || isRedirecting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3.5 bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-sans text-xs font-bold uppercase tracking-widest shadow-md transition-colors duration-300 disabled:opacity-70 cursor-pointer"
                      >
                        {isSubmitting || isRedirecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isRedirecting
                              ? `Redirecting to ${formatPaymentMethodName(paymentMethod)}...`
                              : paymentMethod === 'CASH'
                              ? 'Placing Order...'
                              : `Connecting to ${formatPaymentMethodName(paymentMethod)}...`}
                          </>
                        ) : !paymentMethod ? (
                          <>
                            Place Order
                            <ChevronRight className="h-4 w-4" />
                          </>
                        ) : paymentMethod === 'CASH' ? (
                          <>
                            Place Order (Cash on Delivery)
                            <ChevronRight className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Pay with {formatPaymentMethodName(paymentMethod)} (ETB {total.toLocaleString('en-ET', { minimumFractionDigits: 2 })})
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar Summary (Right 5 cols) */}
            <div className="lg:col-span-5 bg-[#141414] border border-[#2A2420] rounded-xl p-6 space-y-6">
              <h3 className="font-serif text-lg font-bold text-[#F5F0E8] border-b border-[#2A2420] pb-4">
                Cart Overview
              </h3>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
                {cart.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-[#0D0D0D] border border-[#2A2420]">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover object-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0 font-sans text-xs">
                      <h4 className="font-bold text-[#F5F0E8] truncate">{item.product.name}</h4>
                      <p className="text-[#A89880] mt-0.5">Size: {item.size} &bull; Qty: {item.quantity}</p>
                    </div>
                    <span className="font-serif text-sm font-bold text-[#F5F0E8] shrink-0">
                      ETB {(item.product.price * item.quantity).toLocaleString()}.00
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial calculations */}
              <div className="border-t border-[#2A2420] pt-4 space-y-2.5">
                <div className="flex justify-between font-sans text-xs text-[#A89880]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#F5F0E8]">ETB {subtotal.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Dynamic Shipping Zone Selection */}
                <div className="mt-4 pt-4 border-t border-[#2A2420]">
                  <p className="text-[#F5F0E8] text-xs tracking-widest uppercase font-semibold mb-3">
                    Shipment Location
                  </p>

                  <div className="space-y-2">
                    {zones.map((zone) => {
                      const isSelected = selectedZone?.id === zone.id || shippingMethod === zone.name;
                      return (
                        <label
                          key={zone.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? 'border-[#C9A96E] bg-[#1A1A1A]' : 'border-[#2A2420] bg-[#141414]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#C9A96E]' : 'border-[#2A2420]'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#C9A96E]" />}
                            </div>
                            <div>
                              <span className="text-[#F5F0E8] text-sm block font-medium">{zone.name}</span>
                              <span className="text-[#A89880] text-[11px] block">{zone.city}</span>
                            </div>
                          </div>
                          <span className="text-[#C9A96E] text-xs font-semibold">
                            {isFreeShipping ? (
                              <span className="text-green-400 font-bold">FREE</span>
                            ) : (
                              `ETB ${zone.fee.toLocaleString()}`
                            )}
                          </span>
                          <input
                            type="radio"
                            name="checkoutShippingZone"
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
                  </div>

                  {/* Validation */}
                  {shippingError && !selectedZone && (
                    <p className="text-red-400 text-xs mt-2 font-medium">
                      Please select your shipping location.
                    </p>
                  )}
                </div>

                {/* Coupon Code Section */}
                <div className="mt-4 pt-4 border-t border-[#2A2420]">
                  <p className="text-[#F5F0E8] text-xs tracking-widest uppercase font-semibold mb-2">
                    Coupon Code
                  </p>
                  {couponCode ? (
                    <div className="bg-[#1A1815] border border-[#C9A96E]/40 rounded-lg p-3.5 flex justify-between items-center shadow-inner">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🎁</span>
                          <span className="text-[#C9A96E] font-bold text-xs uppercase tracking-wider">
                            {couponCode.toUpperCase().includes('BLACK') ? 'Black Friday Offer' : 'Applied Coupon'}
                          </span>
                          <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ✓ Applied
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-[#F5F0E8] font-bold">{couponCode}</span>
                          <span className="text-emerald-400 font-semibold">
                            {discountPercentage > 0 ? `${discountPercentage}% OFF` : ''} (-ETB {discountAmount.toLocaleString('en-ET', { minimumFractionDigits: 2 })})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeCoupon();
                          setCouponInput('');
                          setCouponError('');
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="flex-1 bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs text-[#F5F0E8] uppercase placeholder:normal-case placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={isValidatingCoupon || !couponInput.trim()}
                          className="bg-[#C9A96E] hover:bg-[#b09259] text-[#0D0D0D] font-bold text-xs px-4 py-2 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {isValidatingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-400 text-xs font-medium">
                          {couponError}
                        </p>
                      )}
                    </form>
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between font-sans text-xs text-[#C9A96E] pt-2 border-t border-[#2A2420]/20">
                    <span>Discount</span>
                    <span className="font-semibold">-ETB {discountAmount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between font-sans text-xs text-[#A89880]">
                  <span>Shipping</span>
                  <span className="font-semibold text-[#F5F0E8]">
                    {isFreeShipping ? (
                      <span className="text-green-400 font-bold">FREE</span>
                    ) : activeShippingCost > 0 ? (
                      `ETB ${activeShippingCost.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                {/* Divider + Total */}
                <div className="border-t border-[#2A2420] mt-4 pt-4 
                                flex justify-between items-center">
                  <span className="text-[#F5F0E8] font-bold text-base">Total</span>
                  <span className="text-[#F5F0E8] font-bold text-base">
                    ETB {total.toLocaleString('en-ET', {
                      minimumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Inline Address Edit Modal for Checkout */}
      {editingCheckoutAddress && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2420]">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#C9A96E]" />
                <h3 className="text-sm font-bold text-[#F5F0E8]">Edit Delivery Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCheckoutAddress(null)}
                className="text-[#A89880] hover:text-[#F5F0E8] p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAddress} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1">
                  Address Label
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Home', 'Office', 'Family', 'Other'].map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setEditCheckoutForm({ ...editCheckoutForm, label: lbl })}
                      className={`py-1.5 px-2 rounded-lg border text-center font-semibold transition-all ${
                        editCheckoutForm.label === lbl
                          ? 'bg-[#C9A96E]/20 border-[#C9A96E] text-[#C9A96E]'
                          : 'bg-[#0D0D0D] border-[#2A2420] text-[#A89880] hover:text-[#F5F0E8]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCheckoutForm.fullName}
                    onChange={(e) => setEditCheckoutForm({ ...editCheckoutForm, fullName: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editCheckoutForm.phone}
                    onChange={(e) => setEditCheckoutForm({ ...editCheckoutForm, phone: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1">
                  Street Address & House / Building *
                </label>
                <input
                  type="text"
                  required
                  value={editCheckoutForm.streetAddress}
                  onChange={(e) => setEditCheckoutForm({ ...editCheckoutForm, streetAddress: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCheckoutForm.city}
                    onChange={(e) => setEditCheckoutForm({ ...editCheckoutForm, city: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={editCheckoutForm.postalCode}
                    onChange={(e) => setEditCheckoutForm({ ...editCheckoutForm, postalCode: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#2A2420] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCheckoutAddress(null)}
                  disabled={savingEditAddress}
                  className="px-3 py-2 rounded-lg border border-[#2A2420] text-[#A89880] hover:text-[#F5F0E8] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditAddress}
                  className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEditAddress ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Save Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
