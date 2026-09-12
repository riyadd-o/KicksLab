'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Clock, ShieldCheck, Truck, Sparkles, CheckCircle } from 'lucide-react';

export default function AccountDashboardPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/customer/profile').then((r) => r.json()),
      fetch('/api/customer/orders').then((r) => r.json()),
    ])
      .then(([profData, orderData]) => {
        if (profData.user) setCustomer(profData.user);
        if (orderData.orders) setOrders(orderData.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-[#A89880]">Loading dashboard...</div>;
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const recentOrders = orders.slice(0, 3);

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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E1B18] via-[#141414] to-[#1E1B18] border border-[#2A2420] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Sparkles size={240} className="text-[#C9A96E]" />
        </div>

        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E]">Welcome Back</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F0E8] mt-1">
            Hello, {customer?.name}
          </h1>
          <p className="text-sm text-[#A89880] mt-2 max-w-xl">
            Welcome to your KicksLab personal dashboard. Track your orders, manage shipping details, and access exclusive member privileges.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-[#2A2420]">
            <Link
              href="/shop"
              className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-md"
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/account/orders"
              className="bg-[#1F1C18] hover:bg-[#2A2420] text-[#F5F0E8] text-xs font-semibold px-5 py-2.5 rounded-xl border border-[#2A2420] uppercase tracking-wider transition-colors inline-flex items-center gap-2"
            >
              <span>View All Orders ({orders.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between text-[#A89880]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag size={18} className="text-[#C9A96E]" />
          </div>
          <p className="text-2xl font-black text-[#F5F0E8] mt-2">{orders.length}</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between text-[#A89880]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Investment</span>
            <Sparkles size={18} className="text-[#C9A96E]" />
          </div>
          <p className="text-2xl font-black text-[#C9A96E] mt-2">ETB {totalSpent.toLocaleString()}</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between text-[#A89880]">
            <span className="text-xs font-semibold uppercase tracking-wider">Member Since</span>
            <Clock size={18} className="text-[#C9A96E]" />
          </div>
          <p className="text-sm font-bold text-[#F5F0E8] mt-3">
            {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2A2420]">
          <div>
            <h2 className="text-base font-bold text-[#F5F0E8]">Recent Orders</h2>
            <p className="text-xs text-[#A89880]">Your most recent purchases</p>
          </div>
          {orders.length > 0 && (
            <Link href="/account/orders" className="text-xs text-[#C9A96E] font-semibold hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-[#A89880] space-y-3">
            <ShoppingBag size={32} className="mx-auto text-[#5C5248]" />
            <p className="text-sm">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/shop"
              className="inline-block text-xs font-semibold text-[#C9A96E] hover:underline uppercase tracking-wider"
            >
              Start Shopping Now →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#0D0D0D] border border-[#2A2420] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#C9A96E]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#F5F0E8]">#{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#A89880] mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {order.items?.length || 0} item(s)
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#A89880] block">Total</span>
                    <span className="text-sm font-extrabold text-[#C9A96E]">ETB {order.total?.toLocaleString()}</span>
                  </div>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="bg-[#1F1C18] hover:bg-[#2A2420] text-[#F5F0E8] text-xs font-semibold px-4 py-2 rounded-lg border border-[#2A2420] transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exclusive Member Benefits */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-[#F5F0E8] mb-1">KicksLab Member Benefits</h2>
        <p className="text-xs text-[#A89880] mb-6">Privileges available to registered customers</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0D0D0D] border border-[#2A2420] p-4 rounded-xl flex items-start gap-3">
            <CheckCircle size={20} className="text-[#C9A96E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wider">Permanent Order Archive</h4>
              <p className="text-xs text-[#A89880] mt-0.5">Access full order history and digital receipts anytime.</p>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#2A2420] p-4 rounded-xl flex items-start gap-3">
            <Truck size={20} className="text-[#C9A96E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wider">Express Checkout</h4>
              <p className="text-xs text-[#A89880] mt-0.5">Pre-filled shipping details for lightning-fast orders.</p>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#2A2420] p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck size={20} className="text-[#C9A96E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wider">Verified Account Security</h4>
              <p className="text-xs text-[#A89880] mt-0.5">Protected credentials with single-use reset links.</p>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#2A2420] p-4 rounded-xl flex items-start gap-3">
            <Sparkles size={20} className="text-[#C9A96E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wider">Chapa Instant Verification</h4>
              <p className="text-xs text-[#A89880] mt-0.5">Seamless live payment verification for all orders.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
