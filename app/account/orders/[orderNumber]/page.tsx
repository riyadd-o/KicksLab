'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CreditCard, MapPin, Package, Calendar, ShieldCheck, AlertCircle, Star } from 'lucide-react';

export default function CustomerOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const fetchOrderDetail = () => {
    fetch(`/api/customer/orders/${orderNumber}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('Forbidden: You are not authorized to view this order.');
          if (res.status === 404) throw new Error('Order not found.');
          throw new Error('Failed to load order details.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.order) setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderNumber]);

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      setCancelError('');
      const res = await fetch(`/api/customer/orders/${orderNumber}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order.');
      }

      setCancelSuccess('Order has been successfully cancelled.');
      setCancelModalOpen(false);
      if (data.order) {
        setOrder(data.order);
      } else {
        fetchOrderDetail();
      }
    } catch (err: any) {
      setCancelError(err.message || 'An error occurred while cancelling.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SHIPPED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PACKED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'PROCESSING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'REFUNDED':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#A89880]">Loading order breakdown...</div>;
  }

  if (error || !order) {
    return (
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-8 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-red-400" />
        <h2 className="text-lg font-bold text-[#F5F0E8]">{error || 'Order not found.'}</h2>
        <p className="text-xs text-[#A89880]">You can only view orders associated with your customer account.</p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 bg-[#1F1C18] hover:bg-[#2A2420] text-[#F5F0E8] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#2A2420]"
        >
          <ArrowLeft size={14} />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const pm = (order.paymentMethod || '').trim().toUpperCase();
  const isCodOrder = pm === 'CASH_ON_DELIVERY' || pm === 'COD' || pm.includes('CASH');
  const isCancellable = isCodOrder && ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Cancellation Success Notification */}
      {cancelSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-4 rounded-2xl flex items-center justify-between">
          <span>{cancelSuccess}</span>
          <button onClick={() => setCancelSuccess('')} className="text-emerald-400 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Cancelled Banner */}
      {order.status === 'CANCELLED' && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-bold">This Order Has Been Cancelled</p>
            <p className="text-xs opacity-80">This order will not be processed further. If payment was completed, any refund will follow the store refund policy.</p>
          </div>
        </div>
      )}

      {/* Delivered / Review Banner */}
      {order.status === 'DELIVERED' && (
        <div className="bg-[#1A1A1A] border border-[#C9A96E]/40 text-[#F5F0E8] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Star size={20} className="text-[#C9A96E] fill-[#C9A96E] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#F5F0E8]">Your Order Has Been Delivered! ⭐</p>
              <p className="text-xs text-[#A89880]">Share your impressions and help other buyers by writing a review.</p>
            </div>
          </div>
          <Link
            href="/account/reviews"
            className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold text-xs px-4 py-2 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>Write a Review</span>
          </Link>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl">
        <div>
          <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-[#A89880] hover:text-[#C9A96E] mb-2 transition-colors">
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#F5F0E8]">Order #{order.orderNumber}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-[#A89880] mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isCancellable && (
            <button
              onClick={() => {
                setCancelError('');
                setCancelModalOpen(true);
              }}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <span>Cancel Order</span>
            </button>
          )}

          <Link
            href="/track-order"
            className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-md"
          >
            <Package size={14} />
            <span>Track Order</span>
          </Link>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Cancel Order #{order.orderNumber}?</h3>
            </div>
            <p className="text-xs text-[#A89880] leading-relaxed">
              Are you sure you want to cancel this order? This action cannot be undone. Once cancelled, your items will be released back to inventory.
            </p>

            <div>
              <label className="block text-[#A89880] text-xs font-semibold mb-1.5">Cancellation Reason (Optional)</label>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] pb-3 border-b border-[#2A2420]">
              Ordered Items ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-[#2A2420]">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                  <div className="relative w-16 h-16 bg-[#0D0D0D] border border-[#2A2420] rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#F5F0E8] truncate">{item.name}</h4>
                    {order.status === 'DELIVERED' && (
                      <Link
                        href="/account/reviews"
                        className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-[#C9A96E] hover:underline"
                      >
                        <Star size={11} className="fill-[#C9A96E]" />
                        Review this item
                      </Link>
                    )}
                    <p className="text-xs text-[#A89880] mt-0.5">
                      Size: <span className="text-[#F5F0E8] font-semibold">{item.size}</span> · Qty: <span className="text-[#F5F0E8] font-semibold">{item.quantity}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-[#A89880] block">ETB {item.price?.toLocaleString()} each</span>
                    <span className="text-sm font-extrabold text-[#C9A96E]">
                      ETB {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-2 pb-3 border-b border-[#2A2420]">
              <MapPin size={16} />
              <span>Shipping Information</span>
            </h3>

            <div className="text-xs text-[#D4CEB8] space-y-1">
              <p className="font-bold text-[#F5F0E8] text-sm">{order.customerName}</p>
              <p>{order.streetAddress}</p>
              <p>{order.city}</p>
              <p className="text-[#A89880]">Phone: {order.customerPhone}</p>
              <p className="text-[#A89880]">Email: {order.customerEmail}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Order Summary */}
        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] pb-3 border-b border-[#2A2420]">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-[#A89880]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#F5F0E8] font-medium">ETB {order.subtotal?.toLocaleString()}</span>
              </div>

              {order.couponDiscount && (
                <div className="flex justify-between text-[#C9A96E]">
                  <span>Discount ({order.couponDiscount}%)</span>
                  <span>-ETB {Math.round((order.subtotal * order.couponDiscount) / 100).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping ({order.shippingMethod || 'Standard'})</span>
                <span className="text-[#F5F0E8] font-medium">
                  {order.shippingCost === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `ETB ${order.shippingCost?.toLocaleString()}`}
                </span>
              </div>

              <div className="pt-3 border-t border-[#2A2420] flex justify-between items-center text-sm">
                <span className="font-bold text-[#F5F0E8]">Final Total</span>
                <span className="text-lg font-black text-[#C9A96E]">ETB {order.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Refund Status or Request Card */}
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] flex items-center justify-between pb-3 border-b border-[#2A2420]">
              <span>Refund Management</span>
              <ShieldCheck size={16} />
            </h3>

            {order.refund ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A89880]">Refund Reference:</span>
                  <span className="font-mono font-bold text-[#C9A96E]">{order.refund.refundNumber}</span>
                </div>
                {order.refund.chapaRefundRef && (
                  <div className="flex justify-between">
                    <span className="text-[#A89880]">Chapa Reference:</span>
                    <span className="font-mono text-[#4ADE80] font-bold">{order.refund.chapaRefundRef}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#A89880]">Reason:</span>
                  <span className="text-[#F5F0E8] font-semibold">{order.refund.reason}</span>
                </div>
                {order.refund.refundMethod && (
                  <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-[#2A2420] space-y-1 my-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#A89880]">Refund Method:</span>
                      <span className="text-[#C9A96E] font-bold">
                        {order.refund.refundMethod === 'AWASH_BIRR' ? 'Awash Birr' : order.refund.refundMethod === 'EBIRR' ? 'eBirr' : order.refund.refundMethod}
                      </span>
                    </div>
                    {order.refund.refundAccountName && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#A89880]">Account Holder:</span>
                        <span className="text-[#F5F0E8] font-semibold">{order.refund.refundAccountName}</span>
                      </div>
                    )}
                    {order.refund.refundPhoneNumber && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#A89880]">Phone Number:</span>
                        <span className="text-[#F5F0E8] font-mono">{order.refund.refundPhoneNumber}</span>
                      </div>
                    )}
                    {order.refund.refundAccountNumber && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#A89880]">Account Number:</span>
                        <span className="text-[#F5F0E8] font-mono">{order.refund.refundAccountNumber}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#2A2420]">
                  <span className="text-[#A89880]">Status:</span>
                  {(() => {
                    const s = String(order.refund.status).toUpperCase();
                    let badgeClass = 'bg-red-500/10 border-red-500/30 text-red-400';
                    let label = order.refund.status;
                    if (s === 'PENDING') {
                      badgeClass = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
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
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <div className="bg-[#0D0D0D] p-3 rounded-xl border border-[#2A2420] text-[#D4CEB8] leading-relaxed">
                  {String(order.refund.status).toUpperCase() === 'PENDING' && (
                    <p>Our team is reviewing your refund request. Updates will be sent to <strong>{order.customerEmail}</strong>.</p>
                  )}
                  {String(order.refund.status).toUpperCase() === 'APPROVED' && (
                    <p className="text-indigo-300">Your refund has been approved by KicksLab and is queued for payment provider processing.</p>
                  )}
                  {String(order.refund.status).toUpperCase() === 'PROCESSING' && (
                    <p className="text-blue-300">⏳ Your refund has been submitted to Chapa and is currently processing. Confirmation will be emailed upon completion.</p>
                  )}
                  {String(order.refund.status).toUpperCase() === 'REFUNDED' && (
                    <p className="text-emerald-400">✅ Refund of ETB {order.refund.amount?.toLocaleString()} completed via {order.refund.paymentMethod}.</p>
                  )}
                  {String(order.refund.status).toUpperCase() === 'REJECTED' && (
                    <p className="text-red-400">❌ Request rejected: {order.refund.rejectionReason || "Decision note pending."}</p>
                  )}
                  {(String(order.refund.status).toUpperCase() === 'FAILED' || String(order.refund.status).toUpperCase() === 'REVERSED') && (
                    <p className="text-red-400">⚠️ Refund could not be completed by payment provider. Support team is reviewing.</p>
                  )}
                </div>
              </div>
            ) : (order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'COD') && order.paymentStatus !== 'PAID' ? (
              <div className="space-y-3 text-xs">
                <p className="text-[#A89880]">
                  Refunds are not applicable for unpaid Cash on Delivery orders.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-[#A89880]">
                  Eligible for refund request within 7 days of order placement.
                </p>
                <Link
                  href={`/track-order`}
                  className="w-full bg-[#1F1C18] hover:bg-[#C9A96E] text-[#F5F0E8] hover:text-[#0D0D0D] text-xs font-bold py-2.5 rounded-xl border border-[#2A2420] transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} />
                  <span>Request Refund via Order Portal</span>
                </Link>
              </div>
            )}
          </div>

          {/* Payment Details Card */}
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-2 pb-3 border-b border-[#2A2420]">
              <CreditCard size={16} />
              <span>Payment Details</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A89880]">Method</span>
                <span className="text-[#F5F0E8] font-semibold">
                  {order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'COD'
                    ? 'Cash on Delivery'
                    : order.paymentMethod || 'Chapa Online'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#A89880]">Status</span>
                <span className={`font-bold uppercase ${order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {order.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}
                </span>
              </div>

              {(order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'COD') && order.paymentStatus !== 'PAID' && (
                <div className="pt-2 border-t border-[#2A2420] text-[#D4CEB8]">
                  <p className="text-[11px] text-amber-400 font-semibold mb-0.5">Pay when delivered</p>
                  <p className="text-[11px] text-[#A89880]">Please have cash ready upon order arrival.</p>
                </div>
              )}

              {order.paymentReference && (
                <div className="pt-2 border-t border-[#2A2420]">
                  <span className="text-[#A89880] block mb-0.5">Chapa Reference (tx_ref)</span>
                  <span className="font-mono text-[11px] text-[#C9A96E] break-all">{order.paymentReference}</span>
                </div>
              )}

              {order.chapaRefId && (
                <div>
                  <span className="text-[#A89880] block mb-0.5">Chapa Ref ID</span>
                  <span className="font-mono text-[11px] text-[#D4CEB8] break-all">{order.chapaRefId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
