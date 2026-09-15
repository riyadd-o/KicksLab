'use client';

import { useState } from 'react';
import { Search, Package, Clock, Truck, MapPin, CheckCircle, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPaymentMethodName, isCashPayment, isDigitalPayment } from '@/lib/payment';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [orderIdError, setOrderIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<'search' | 'status'>('search');
  const [foundOrderObj, setFoundOrderObj] = useState<any>(null);

  const [existingRefund, setExistingRefund] = useState<any>(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundDetails, setRefundDetails] = useState('');
  const [refundMethod, setRefundMethod] = useState<'TELEBIRR' | 'CBE' | 'EBIRR' | 'AWASH_BIRR' | ''>('');
  const [refundAccountName, setRefundAccountName] = useState('');
  const [refundPhoneNumber, setRefundPhoneNumber] = useState('');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');

  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const REFUND_POLICY = {
    windowDays: 7,
    eligibleReasons: ["Wrong size", "Damaged item", "Wrong item received", "Other"],
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrderIdError('');
    setEmailError('');

    let hasError = false;

    if (!orderId.trim()) {
      setOrderIdError('Required');
      hasError = true;
    } else if (!/^KL-\d+$/.test(orderId)) {
      setOrderIdError('Order ID must start with "KL-" followed by digits.');
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError('Required');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address.');
        hasError = true;
      }
    }

    if (hasError) return;

    setIsSearching(true);

    // Fetch from API
    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId.trim())}&email=${encodeURIComponent(email.trim())}`);

      if (res.ok) {
        const foundOrder = await res.json();
        
        let currentStage = 0;
        const status = foundOrder.status?.toUpperCase();
        if (status === 'PROCESSING') {
          currentStage = 1;
        } else if (status === 'PACKED') {
          currentStage = 2;
        } else if (status === 'SHIPPED') {
          currentStage = 3;
        } else if (status === 'DELIVERED') {
          currentStage = 4;
        }

        const orderDate = foundOrder.date || foundOrder.createdAt?.split('T')[0] || 'Recent';

        const getStageDate = (stageIndex: number) => {
          if (stageIndex === 0) return orderDate;
          if (stageIndex < currentStage) return 'Completed';
          if (stageIndex === currentStage) return 'In Progress';
          return 'Pending';
        };

        setExistingRefund(foundOrder.refund || null);
        setRefundSuccess('');
        setShowRefundForm(false);
        setRefundMethod('');
        setRefundAccountName(foundOrder.customerName || '');
        setRefundPhoneNumber(foundOrder.customerPhone || '');
        setRefundAccountNumber('');
        setCancelSuccess('');
        setCancelModalOpen(false);

        setFoundOrderObj(foundOrder);
        setTrackingData({
          id: orderId,
          status: status,
          paymentMethod: foundOrder.paymentMethod,
          currentStage: currentStage,
          stages: [
            {
              label: 'Order Placed',
              date: getStageDate(0),
              icon: <Package className="h-5 w-5" />,
            },
            {
              label: 'Processing',
              date: getStageDate(1),
              icon: <Clock className="h-5 w-5" />,
            },
            {
              label: 'Packed',
              date: getStageDate(2),
              icon: <Package className="h-5 w-5" />,
            },
            {
              label: 'Shipped',
              date: getStageDate(3),
              icon: <Truck className="h-5 w-5" />,
            },
            {
              label: 'Delivered',
              date: getStageDate(4),
              icon: <CheckCircle className="h-5 w-5" />,
            },
          ],
        });
        setView('status');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Unable to find an order matching these details.');
        setTrackingData(null);
        setFoundOrderObj(null);
      }
    } catch (e) {
      setError('A network error occurred. Please try again later.');
      setTrackingData(null);
      setFoundOrderObj(null);
    }
    setIsSearching(false);
  };

  const submitRefundRequest = async () => {
    setRefundError('');
    if (!refundReason) {
      setRefundError('Reason is required.');
      return;
    }

    const pm = (foundOrderObj?.paymentMethod || trackingData?.paymentMethod || '').trim().toUpperCase();
    const isCod = pm === 'CASH_ON_DELIVERY' || pm === 'COD' || pm.includes('CASH');

    if (isCod) {
      if (!refundMethod) {
        setRefundError('Please select a refund method.');
        return;
      }
      if (!refundAccountName.trim()) {
        setRefundError('Account Holder Name is required.');
        return;
      }
      if (refundMethod === 'CBE') {
        if (!refundAccountNumber.trim()) {
          setRefundError('CBE Account Number is required.');
          return;
        }
      } else {
        if (!refundPhoneNumber.trim()) {
          const methodName = refundMethod === 'TELEBIRR' ? 'Telebirr' : refundMethod === 'EBIRR' ? 'eBirr' : 'Awash Birr';
          setRefundError(`${methodName} Phone Number is required.`);
          return;
        }
      }
    }
    
    const orderDate = new Date(foundOrderObj.createdAt || foundOrderObj.date || Date.now());
    const daysSince = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > REFUND_POLICY.windowDays) {
      setRefundError('Sorry, the 7-day refund window for this order has passed.');
      return;
    }

    try {
      const payload: any = {
        orderId: foundOrderObj.id,
        reason: refundReason,
        description: refundDetails,
        email: email.trim().toLowerCase(),
        source: 'track-order'
      };

      if (isCod) {
        payload.refundMethod = refundMethod;
        payload.refundAccountName = refundAccountName.trim();
        if (refundMethod === 'CBE') {
          payload.refundAccountNumber = refundAccountNumber.trim();
        } else {
          payload.refundPhoneNumber = refundPhoneNumber.trim();
        }
      }

      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit refund.");
      }

      const newRefund = data.refund || data;
      setRefundSuccess(`Your request ID is ${newRefund.refundNumber || newRefund.id}. Our team will review it and contact you at ${newRefund.customerEmail || email} within 2–3 business days.`);
      setShowRefundForm(false);
      setExistingRefund(newRefund);
    } catch (e: any) {
      setRefundError(e.message || "Failed to submit refund.");
    }
  };

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      setCancelError('');
      const res = await fetch('/api/orders/track/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: trackingData.id,
          email: email.trim().toLowerCase(),
          reason: cancelReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order.');
      }

      setCancelSuccess('Your order has been successfully cancelled.');
      setCancelModalOpen(false);
      setTrackingData((prev: any) => ({ ...prev, status: 'CANCELLED' }));
      setFoundOrderObj((prev: any) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col pt-32 pb-12">
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 flex-1">
        
        <AnimatePresence mode="wait">
          {view === 'status' && trackingData ? (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setView('search')}
                className="text-[#C9A96E] hover:text-[#C9A96E]-hover flex items-center gap-2 mb-6 font-sans text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft size={16} /> Back to Search
              </button>

              {/* Cancellation Success Banner */}
              {cancelSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-4 rounded-lg mb-6 flex items-center justify-between">
                  <span>{cancelSuccess}</span>
                  <button onClick={() => setCancelSuccess('')} className="text-emerald-400 text-xs underline">Dismiss</button>
                </div>
              )}

              {/* Cancellation/Refund Banners */}
              {trackingData.status === 'CANCELLED' && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-4 rounded-lg mb-6 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Order Cancelled</p>
                    <p className="text-xs text-red-500/80">This order has been cancelled and will not be processed further. If payment was made, refunds follow our store policy.</p>
                  </div>
                </div>
              )}

              {/* Delivered / Review Banner */}
              {trackingData.status === 'DELIVERED' && (
                <div className="bg-[#1A1A1A] border border-[#C9A96E]/40 text-[#F5F0E8] p-4 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <p className="text-sm font-bold text-[#F5F0E8]">Package Delivered! ⭐</p>
                    <p className="text-xs text-[#A89880]">Help fellow sneaker enthusiasts by writing a verified buyer review.</p>
                  </div>
                  <a
                    href="/account/reviews"
                    className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold text-xs px-4 py-2 rounded-lg uppercase tracking-wider transition-colors inline-block text-center shrink-0"
                  >
                    Write a Review
                  </a>
                </div>
              )}

              {trackingData.status === 'REFUNDED' && (
                <div className="bg-gray-500/10 border border-gray-500/30 text-gray-400 text-sm p-4 rounded-lg mb-6 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Order Refunded</p>
                    <p className="text-xs text-gray-400/80">A full refund has been issued for this order.</p>
                  </div>
                </div>
              )}

              {/* Refund Request Status Card */}
              {existingRefund && (
                <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 shadow-xl mb-6">
                  <h3 className="font-serif text-lg font-bold text-[#F5F0E8] mb-4 flex items-center gap-2">
                    🔄 Refund Request Status
                  </h3>
                  <div className="space-y-3 font-sans text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#A89880]">Ref Number:</span>
                      <span className="text-[#C9A96E] font-mono font-bold">{existingRefund.refundNumber || existingRefund.id || 'Pending Ref'}</span>
                    </div>
                    {existingRefund.chapaRefundRef && (
                      <div className="flex justify-between">
                        <span className="text-[#A89880]">Chapa Reference:</span>
                        <span className="text-[#4ADE80] font-mono font-bold text-xs">{existingRefund.chapaRefundRef}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#A89880]">Reason:</span>
                      <span className="text-[#F5F0E8] font-semibold">{existingRefund.reason || 'Refund requested'}</span>
                    </div>
                    {existingRefund.refundMethod && (
                      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2A2420] space-y-1.5 my-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A89880]">Refund Method:</span>
                          <span className="text-[#C9A96E] font-bold">
                            {existingRefund.refundMethod === 'AWASH_BIRR' ? 'Awash Birr' : existingRefund.refundMethod === 'EBIRR' ? 'eBirr' : existingRefund.refundMethod}
                          </span>
                        </div>
                        {existingRefund.refundAccountName && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#A89880]">Account Holder:</span>
                            <span className="text-[#F5F0E8] font-semibold">{existingRefund.refundAccountName}</span>
                          </div>
                        )}
                        {existingRefund.refundPhoneNumber && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#A89880]">Phone Number:</span>
                            <span className="text-[#F5F0E8] font-mono">{existingRefund.refundPhoneNumber}</span>
                          </div>
                        )}
                        {existingRefund.refundAccountNumber && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#A89880]">Account Number:</span>
                            <span className="text-[#F5F0E8] font-mono">{existingRefund.refundAccountNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#A89880]">Submitted:</span>
                      <span className="text-[#F5F0E8] font-semibold">
                        {existingRefund.createdAt
                          ? (isNaN(new Date(existingRefund.createdAt).getTime())
                              ? new Date().toLocaleDateString()
                              : new Date(existingRefund.createdAt).toLocaleDateString())
                          : new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#2A2420]">
                      <span className="text-[#A89880]">Status:</span>
                      {(() => {
                        const s = String(existingRefund.status || 'PENDING').toUpperCase();
                        let badgeClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
                        let label = 'Refund Requested';
                        if (s === 'PENDING') {
                          badgeClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
                          label = 'Refund Requested';
                        } else if (s === 'APPROVED') {
                          badgeClass = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
                          label = 'Refund Approved';
                        } else if (s === 'PROCESSING') {
                          badgeClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
                          label = 'Refund Processing';
                        } else if (s === 'REFUNDED') {
                          badgeClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
                          label = 'Refund Completed';
                        } else if (s === 'REJECTED') {
                          badgeClass = 'bg-red-500/10 border-red-500/30 text-red-400';
                          label = 'Refund Rejected';
                        } else if (s === 'FAILED') {
                          badgeClass = 'bg-red-500/10 border-red-500/30 text-red-400';
                          label = 'Refund Failed';
                        } else if (s === 'REVERSED') {
                          badgeClass = 'bg-purple-500/10 border-purple-500/30 text-purple-400';
                          label = 'Refund Reversed';
                        }
                        return (
                          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="bg-[#1A1A1A] p-4 rounded-lg mt-4 border border-[#2A2420]">
                      {String(existingRefund.status).toUpperCase() === 'PENDING' && (
                        <p className="text-[#A89880] text-sm">Our team is reviewing your refund request. You will receive an email update once processed.</p>
                      )}
                      {String(existingRefund.status).toUpperCase() === 'APPROVED' && (
                        <p className="text-indigo-300 text-sm">Your refund request has been approved by KicksLab and is ready for payment processing.</p>
                      )}
                      {String(existingRefund.status).toUpperCase() === 'PROCESSING' && (
                        <p className="text-blue-300 text-sm">⏳ Your refund has been submitted to payment provider and is currently being processed. You will receive an email confirmation once completed.</p>
                      )}
                      {String(existingRefund.status).toUpperCase() === 'REFUNDED' && (
                        <p className="text-emerald-400 text-sm">✅ Your refund of ETB {existingRefund.amount?.toLocaleString()} has been successfully completed.</p>
                      )}
                      {String(existingRefund.status).toUpperCase() === 'REJECTED' && (
                        <p className="text-red-400 text-sm">❌ Your refund request was reviewed. Decision note: {existingRefund.rejectionReason || "Request requirements not met"}.</p>
                      )}
                      {(String(existingRefund.status).toUpperCase() === 'FAILED' || String(existingRefund.status).toUpperCase() === 'REVERSED') && (
                        <p className="text-red-400 text-sm">⚠️ Your refund could not be completed at this time. Our support team has been notified.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Section: Payment-Specific Actions */}
              {(() => {
                const pm = foundOrderObj?.paymentMethod || '';
                const isDigital = isDigitalPayment(foundOrderObj);
                const isCodOrder = isCashPayment(pm);
                const isCancelledOrRefunded = trackingData.status === 'CANCELLED' || trackingData.status === 'REFUNDED';

                const canCancelCod =
                  isCodOrder &&
                  !isCancelledOrRefunded &&
                  ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED'].includes(trackingData.status);

                const canRequestRefund =
                  (isDigital || (isCodOrder && trackingData.status === 'DELIVERED')) &&
                  !isCancelledOrRefunded &&
                  !existingRefund &&
                  ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(trackingData.status);

                const showRequestRefundBtn = canRequestRefund && !showRefundForm && !refundSuccess;

                if (isCancelledOrRefunded) return null;

                return (
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* COD Orders: Cancel Order (Prior to Delivery) */}
                    {canCancelCod && (
                      <button
                        onClick={() => {
                          setCancelError('');
                          setCancelModalOpen(true);
                        }}
                        className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 transition-colors rounded-lg px-6 py-3 font-bold text-xs uppercase tracking-wider flex-1 shadow-lg cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    {/* Request Refund Button (Chapa Orders & Delivered COD Orders) */}
                    {showRequestRefundBtn && (
                      <button
                        onClick={() => setShowRefundForm(true)}
                        className="bg-transparent border border-[#2A2420] text-[#F5F0E8] hover:bg-[#1A1A1A] hover:border-[#C9A96E] transition-colors rounded-lg px-6 py-3 font-bold text-xs uppercase tracking-wider flex-1 shadow-lg cursor-pointer"
                      >
                        Request Refund
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Refund Request Inline Form */}
              {!existingRefund && ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(trackingData.status) && (
                <div className="mb-6">
                  {refundSuccess && (
                    <div className="border-l-2 border-[#C9A96E] bg-[#1A1A1A] rounded-lg p-4 shadow-xl">
                      <p className="text-[#F5F0E8] text-sm font-semibold flex items-center gap-2">
                        <CheckCircle size={16} className="text-[#C9A96E]" /> Refund request submitted
                      </p>
                      <p className="text-[#A89880] text-xs mt-1 leading-relaxed">
                        {refundSuccess}
                      </p>
                    </div>
                  )}

                  {showRefundForm && !refundSuccess && (
                    <div className="bg-[#141414] border border-[#C9A96E]/50 rounded-xl p-6 shadow-xl">
                      <div className="flex justify-between items-center border-b border-[#2A2420] pb-4 mb-6">
                        <h3 className="font-serif text-xl font-bold text-[#F5F0E8]">Request a Refund</h3>
                        <button onClick={() => setShowRefundForm(false)} className="text-[#A89880] hover:text-[#F5F0E8] text-sm">Cancel</button>
                      </div>
                      
                      <div className="mb-6 bg-[#1A1A1A] p-4 rounded-lg border border-[#2A2420]">
                        <p className="text-[#F5F0E8] font-semibold text-sm">Order: {trackingData.id} · ETB {foundOrderObj?.total?.toLocaleString()}</p>
                      </div>

                      <div className="space-y-5">
                        {/* Step 1: Refund Reason */}
                        <div>
                          <label className="block text-[#A89880] text-xs font-semibold mb-2">Refund Reason *</label>
                          <select 
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm appearance-none"
                          >
                            <option value="" disabled>Select a reason</option>
                            {REFUND_POLICY.eligibleReasons.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2: Refund Method & Destination (COD ONLY) */}
                        {(() => {
                          const pm = foundOrderObj?.paymentMethod || trackingData?.paymentMethod || '';
                          const isCod = isCashPayment(pm);
                          if (!isCod) return null;

                          return (
                            <div className="pt-2 border-t border-[#2A2420] space-y-4">
                              <div>
                                <h4 className="text-sm font-serif font-bold text-[#F5F0E8]">Refund Method / Refund Destination</h4>
                                <p className="text-xs text-[#A89880] mt-0.5">Choose where you would like to receive your refund.</p>
                              </div>

                              {/* Method Cards */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {[
                                  { id: 'TELEBIRR', label: 'Telebirr' },
                                  { id: 'CBE', label: 'CBE' },
                                  { id: 'EBIRR', label: 'eBirr' },
                                  { id: 'AWASH_BIRR', label: 'Awash Birr' },
                                ].map((m) => {
                                  const isSelected = refundMethod === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => setRefundMethod(m.id as any)}
                                      className={`py-3 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                                        isSelected
                                          ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E] shadow-sm'
                                          : 'border-[#2A2420] bg-[#1A1A1A] text-[#A89880] hover:text-[#F5F0E8] hover:border-[#3E3832]'
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Destination Input Fields */}
                              {refundMethod && (
                                <div className="space-y-3 bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2420]">
                                  <div>
                                    <label className="block text-[#A89880] text-xs font-semibold mb-1.5">
                                      Account Holder Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={refundAccountName}
                                      onChange={(e) => setRefundAccountName(e.target.value)}
                                      placeholder="Full name matching account"
                                      className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                                    />
                                  </div>

                                  {refundMethod === 'CBE' ? (
                                    <div>
                                      <label className="block text-[#A89880] text-xs font-semibold mb-1.5">
                                        CBE Account Number *
                                      </label>
                                      <input
                                        type="text"
                                        value={refundAccountNumber}
                                        onChange={(e) => setRefundAccountNumber(e.target.value)}
                                        placeholder="e.g. 1000123456789"
                                        className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-[#A89880] text-xs font-semibold mb-1.5">
                                        {refundMethod === 'TELEBIRR'
                                          ? 'Telebirr Phone Number *'
                                          : refundMethod === 'EBIRR'
                                          ? 'eBirr Phone Number *'
                                          : 'Awash Birr Phone Number *'}
                                      </label>
                                      <input
                                        type="text"
                                        value={refundPhoneNumber}
                                        onChange={(e) => setRefundPhoneNumber(e.target.value)}
                                        placeholder="09XXXXXXXX or +2519XXXXXXXX"
                                        className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Review / Confirmation section */}
                              {refundReason && refundMethod && refundAccountName && (refundAccountNumber || refundPhoneNumber) && (
                                <div className="bg-[#141414] border border-[#C9A96E]/30 rounded-xl p-4 text-xs space-y-2">
                                  <p className="font-bold text-[#C9A96E] uppercase tracking-wider text-[11px]">Review Refund Information</p>
                                  <div className="flex justify-between">
                                    <span className="text-[#A89880]">Refund Amount:</span>
                                    <span className="text-[#F5F0E8] font-bold">ETB {foundOrderObj?.total?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#A89880]">Reason:</span>
                                    <span className="text-[#F5F0E8]">{refundReason}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#A89880]">Refund Method:</span>
                                    <span className="text-[#F5F0E8] font-semibold">
                                      {refundMethod === 'AWASH_BIRR' ? 'Awash Birr' : refundMethod === 'EBIRR' ? 'eBirr' : refundMethod}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#A89880]">Account Holder:</span>
                                    <span className="text-[#F5F0E8]">{refundAccountName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#A89880]">{refundMethod === 'CBE' ? 'Account Number:' : 'Phone Number:'}</span>
                                    <span className="text-[#F5F0E8] font-mono">{refundMethod === 'CBE' ? refundAccountNumber : refundPhoneNumber}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {refundError && (
                          <p className="text-red-400 text-xs">{refundError}</p>
                        )}

                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/90 text-xs p-3 rounded-lg flex gap-2 items-start mt-2">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <p>Refund requests must be made within {REFUND_POLICY.windowDays} days of delivery.</p>
                        </div>

                        <button 
                          onClick={submitRefundRequest}
                          className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-xs py-3.5 rounded-lg transition-colors mt-2"
                        >
                          Submit Refund Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Header & Timeline Card */}
              <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-8 shadow-xl">
                <div className="mb-8 pb-6 border-b border-[#2A2420] flex justify-between items-center">
                  <div>
                    <p className="text-xs font-sans text-[#A89880] uppercase tracking-wider">Order ID</p>
                    <p className="font-bold text-[#F5F0E8] text-lg">{trackingData.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-sans text-[#A89880] uppercase tracking-wider">Status</p>
                    <p className="font-bold text-[#C9A96E] text-lg">
                      {trackingData.status === 'CANCELLED'
                        ? 'Cancelled'
                        : trackingData.status === 'REFUNDED'
                        ? 'Refunded'
                        : trackingData.status === 'PACKED'
                        ? 'Packed'
                        : trackingData.status === 'SHIPPED'
                        ? 'Shipped'
                        : trackingData.status === 'DELIVERED'
                        ? 'Delivered'
                        : trackingData.status === 'PROCESSING'
                        ? 'Processing'
                        : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-8 relative">
                    {trackingData.stages.map((stage: any, index: number) => {
                      const isCompleted = index < trackingData.currentStage;
                      const isCurrent = index === trackingData.currentStage;
                      const isCancelledOrRefunded = trackingData.status === 'CANCELLED' || trackingData.status === 'REFUNDED';

                      return (
                        <div key={index} className="flex gap-6 items-start">
                          {/* Icon Node */}
                          <div
                            className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
                              isCancelledOrRefunded
                                ? index === 0
                                  ? 'bg-[#1A1A1A] border-text-secondary text-[#A89880]'
                                  : 'bg-[#1A1A1A] border-[#2A2420] text-[#5C5248]'
                                : isCurrent
                                ? 'bg-[#1A1A1A] border-[#C9A96E] text-[#C9A96E] shadow-[0_0_15px_rgba(201,169,110,0.3)]'
                                : isCompleted
                                ? 'bg-[#1A1A1A] border-[#C9A96E] text-[#C9A96E]'
                                : 'bg-[#1A1A1A] border-[#2A2420] text-[#5C5248]'
                            }`}
                          >
                            {!isCancelledOrRefunded && isCompleted ? <Check className="h-5 w-5" /> : stage.icon}
                          </div>

                          {/* Details */}
                          <div className="pt-2 flex-1">
                            <h4
                              className={`font-serif text-lg font-bold ${
                                isCancelledOrRefunded
                                  ? index === 0
                                    ? 'text-[#F5F0E8]'
                                    : 'text-[#5C5248]'
                                  : isCurrent
                                  ? 'text-[#C9A96E]'
                                  : isCompleted
                                  ? 'text-[#F5F0E8]'
                                  : 'text-[#5C5248]'
                              }`}
                            >
                              {stage.label}
                            </h4>
                            <p className={`font-sans text-xs mt-1 ${
                              isCancelledOrRefunded
                                ? index === 0
                                  ? 'text-[#A89880]'
                                  : 'text-[#5C5248]'
                                : isCompleted || isCurrent
                                ? 'text-[#A89880]'
                                : 'text-[#5C5248]'
                            }`}>
                              {isCancelledOrRefunded && index > 0 ? 'Cancelled' : stage.date}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>



              {/* Order items Summary */}
              {foundOrderObj && (
                <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 shadow-xl mt-6">
                  <h3 className="font-serif text-lg font-bold text-[#F5F0E8] mb-4 border-b border-[#2A2420] pb-2">
                    Order Items Summary
                  </h3>
                  <div className="space-y-4">
                    {foundOrderObj.items && Array.isArray(foundOrderObj.items) ? (
                      foundOrderObj.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <img
                            src={item.image || 'https://via.placeholder.com/150'}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover border border-[#2A2420]"
                          />
                          <div className="flex-1 text-sm">
                            <p className="text-[#F5F0E8] font-bold">{item.name}</p>
                            <p className="text-[#A89880] text-xs">Size: {item.size} • Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#F5F0E8]">
                              ETB {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#A89880] text-sm">Item details unavailable.</p>
                    )}
                    
                    <div className="border-t border-[#2A2420] pt-4 mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#A89880]">Payment Method:</span>
                        <span className="text-[#F5F0E8] font-semibold">
                          {formatPaymentMethodName(foundOrderObj.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#A89880]">Payment Status:</span>
                        <span className={`font-bold uppercase ${
                          foundOrderObj.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {foundOrderObj.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#2A2420] flex justify-between items-center">
                        <span className="text-sm text-[#A89880]">Total Amount:</span>
                        <span className="text-lg font-bold text-[#C9A96E]">
                          ETB {foundOrderObj.total?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8]">
                  Track Your Order
                </h1>
                <p className="font-sans text-sm text-[#A89880] mt-3 max-w-md mx-auto">
                  Enter your order ID below to receive real-time updates on your shipment status.
                </p>
              </div>

              {/* Search Form */}
              <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 shadow-xl mb-10">
                <form onSubmit={handleTrack} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-[#A89880] text-xs font-semibold mb-2">Order ID *</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. KL-123456"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg pl-12 pr-4 py-3.5 text-[#F5F0E8] placeholder-text-secondary/60 focus:border-[#C9A96E] focus:outline-none transition-colors font-sans text-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A89880]" />
                      </div>
                      {orderIdError && (
                        <p className="text-red-400 text-xs mt-1">{orderIdError}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[#A89880] text-xs font-semibold mb-2">Billing Email *</label>
                      <input
                        type="email"
                        placeholder="email used at checkout"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3.5 text-[#F5F0E8] placeholder-text-secondary/60 focus:border-[#C9A96E] focus:outline-none transition-colors font-sans text-sm"
                      />
                      {emailError && (
                        <p className="text-red-400 text-xs mt-1">{emailError}</p>
                      )}
                    </div>
                  </div>
                  {error && (
                    <p className="text-red-400 text-xs mt-1">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-sans text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-lg transition-colors flex items-center justify-center w-full sm:w-auto self-end mt-2"
                  >
                    {isSearching ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                        Tracking...
                      </span>
                    ) : (
                      'Track My Order'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Order Confirmation Modal */}
        {cancelModalOpen && trackingData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle size={24} />
                <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Cancel Order #{trackingData.id}?</h3>
              </div>
              <p className="text-xs text-[#A89880] leading-relaxed">
                Are you sure you want to cancel this order? This action cannot be undone. Once cancelled, your items will be restored to inventory.
              </p>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-1.5">Reason for Cancellation (Optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why do you wish to cancel this order?..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-xl p-3 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none resize-none h-20"
                />
              </div>

              {cancelError && (
                <p className="text-red-400 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{cancelError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={isCancelling}
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A89880] hover:text-[#F5F0E8] transition-colors"
                >
                  Keep Order
                </button>
                <button
                  disabled={isCancelling}
                  onClick={handleCancelOrder}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
