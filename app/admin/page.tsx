'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, DollarSign, Box, Clock, Loader2, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    products: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, prodRes] = await Promise.all([
        fetch('/api/admin/dashboard', { cache: 'no-store' }),
        fetch('/api/products?limit=3', { cache: 'no-store' }),
      ]);

      if (dashRes.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!dashRes.ok) {
        const errorData = await dashRes.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to load dashboard metrics.');
      }

      const dashData = await dashRes.json();
      if (dashData.metrics) {
        setMetrics(dashData.metrics);
      }
      if (Array.isArray(dashData.recentOrders)) {
        setRecentOrders(dashData.recentOrders);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const items = Array.isArray(prodData) ? prodData : prodData.products || [];
        setTopProducts(items.slice(0, 3));
      }
    } catch (err: any) {
      console.error('Admin dashboard fetch error:', err);
      setError(err.message || 'An error occurred while loading dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Error Banner if any */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards (Single source of truth on Admin Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Orders */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[#A89880] text-xs font-semibold uppercase tracking-wider mb-1">Total Orders</p>
            <h3 className="text-[#F5F0E8] text-2xl font-black">
              {loading ? <Loader2 className="animate-spin text-[#C9A96E]" size={24} /> : metrics.totalOrders}
            </h3>
            <p className="text-[11px] text-[#A89880] mt-1">Across all customers</p>
          </div>
          <div className="p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl text-[#C9A96E]">
            <Package size={22} />
          </div>
        </div>

        {/* 2. Total Revenue */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[#A89880] text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
            <h3 className="text-[#F5F0E8] text-2xl font-black">
              {loading ? (
                <Loader2 className="animate-spin text-[#C9A96E]" size={24} />
              ) : (
                `ETB ${metrics.totalRevenue.toLocaleString()}`
              )}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1">Excludes cancelled & refunded</p>
          </div>
          <div className="p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl text-[#C9A96E]">
            <DollarSign size={22} />
          </div>
        </div>

        {/* 3. Products */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[#A89880] text-xs font-semibold uppercase tracking-wider mb-1">Products</p>
            <h3 className="text-[#F5F0E8] text-2xl font-black">
              {loading ? <Loader2 className="animate-spin text-[#C9A96E]" size={24} /> : metrics.products}
            </h3>
            <p className="text-[11px] text-[#A89880] mt-1">Active catalog count</p>
          </div>
          <div className="p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl text-[#C9A96E]">
            <Box size={22} />
          </div>
        </div>

        {/* 4. Pending Orders */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[#A89880] text-xs font-semibold uppercase tracking-wider mb-1">Pending Orders</p>
            <h3 className="text-[#F5F0E8] text-2xl font-black">
              {loading ? <Loader2 className="animate-spin text-[#C9A96E]" size={24} /> : metrics.pendingOrders}
            </h3>
            <p className={`text-[11px] mt-1 ${metrics.pendingOrders > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics.pendingOrders > 0 ? 'Requires fulfillment action' : 'All caught up'}
            </p>
          </div>
          <div
            className={`p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl ${
              metrics.pendingOrders > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            <Clock size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-[#2A2420] flex justify-between items-center">
            <h2 className="text-[#F5F0E8] font-serif font-bold text-lg">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[#C9A96E] text-xs font-bold uppercase tracking-widest hover:underline">
              View All Orders →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans whitespace-nowrap">
              <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2420]/60">
                {recentOrders.map((order) => {
                  const status = (order.status || 'PENDING').toUpperCase();
                  let statusColor = 'text-[#A89880] border-[#2A2420] bg-[#1A1A1A]';
                  if (status === 'PENDING') statusColor = 'text-amber-400 border-amber-400/30 bg-amber-400/10';
                  else if (status === 'PROCESSING') statusColor = 'text-blue-400 border-blue-400/30 bg-blue-400/10';
                  else if (status === 'PACKED') statusColor = 'text-purple-400 border-purple-400/30 bg-purple-400/10';
                  else if (status === 'SHIPPED') statusColor = 'text-sky-400 border-sky-400/30 bg-sky-400/10';
                  else if (status === 'DELIVERED') statusColor = 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
                  else if (status === 'CANCELLED') statusColor = 'text-red-400 border-red-400/30 bg-red-400/10';
                  else if (status === 'REFUNDED') statusColor = 'text-zinc-400 border-zinc-400/30 bg-zinc-400/10';

                  return (
                    <tr key={order.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#F5F0E8]">{order.orderNumber || order.id}</td>
                      <td className="px-6 py-4 text-[#A89880]">
                        <div className="text-[#F5F0E8] font-medium text-xs">{order.customerName || 'Guest'}</div>
                        <div className="text-[11px] text-[#A89880]">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-[#A89880]">{order.items?.length || 1}</td>
                      <td className="px-6 py-4 font-semibold text-[#F5F0E8]">
                        ETB {(order.total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#A89880]">
                      No orders found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Catalog Showcase */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-[#2A2420] flex justify-between items-center">
            <h2 className="text-[#F5F0E8] font-serif font-bold text-lg">Featured Catalog</h2>
            <Link href="/admin/products" className="text-[#C9A96E] text-xs font-bold uppercase tracking-widest hover:underline">
              Manage
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.map((product) => {
              const imageSrc =
                Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : '/placeholder-shoe.png';
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A]/40 border border-[#2A2420]/40 hover:bg-[#1A1A1A] transition-colors"
                >
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-[#0D0D0D] border border-[#2A2420]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F5F0E8] font-bold text-sm truncate">{product.name}</p>
                    <p className="text-[#A89880] text-[11px] capitalize">{product.category || 'Footwear'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#C9A96E] font-bold text-sm">ETB {(product.price || 0).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && !loading && (
              <p className="text-xs text-[#A89880] text-center py-6">No products found.</p>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
