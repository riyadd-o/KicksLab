'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, ExternalLink, Calendar, CreditCard } from 'lucide-react';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error('Error fetching orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SHIPPED':
      case 'PACKED':
      case 'PROCESSING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-amber-500/10 text-amber-400';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#A89880]">Loading order history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#2A2420]">
          <div>
            <h1 className="text-xl font-bold text-[#F5F0E8]">My Orders</h1>
            <p className="text-xs text-[#A89880]">View and track all your previous purchases</p>
          </div>
          <span className="text-xs font-semibold text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 rounded-full self-start sm:self-auto">
            {orders.length} Total Orders
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-[#A89880] space-y-4">
            <ShoppingBag size={48} className="mx-auto text-[#5C5248]" />
            <h3 className="text-base font-bold text-[#F5F0E8]">No orders found</h3>
            <p className="text-xs text-[#A89880] max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Explore our luxury sneaker collection to make your first purchase.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition-colors shadow-md mt-2"
            >
              <span>Browse Shop</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[#0D0D0D] border border-[#2A2420] rounded-xl p-5 hover:border-[#C9A96E]/40 transition-colors space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2A2420]/60">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-base text-[#F5F0E8]">#{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#A89880]">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Items preview & Payment summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#D4CEB8]">
                      {order.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#A89880]">
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} />
                        {order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'COD'
                          ? 'Cash on Delivery'
                          : order.paymentMethod || 'Chapa'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${getPaymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}
                      </span>
                      {order.paymentReference && (
                        <span className="font-mono text-[10px] text-[#C9A96E]">Ref: {order.paymentReference}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2A2420]/40">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-[#A89880] block">Order Total</span>
                      <span className="text-base font-black text-[#C9A96E]">ETB {order.total?.toLocaleString()}</span>
                    </div>

                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="bg-[#1F1C18] hover:bg-[#C9A96E] text-[#F5F0E8] hover:text-[#0D0D0D] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#2A2420] transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>View Details</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
