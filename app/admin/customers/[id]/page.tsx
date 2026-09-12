'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Building, Calendar,
  ShoppingBag, CheckCircle, Clock, XCircle, DollarSign, ExternalLink, ShieldCheck
} from 'lucide-react';

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Customer not found.');
          throw new Error('Failed to load customer details.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.customer) setCustomer(data.customer);
        if (data.stats) setStats(data.stats);
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
    return <div className="py-16 text-center text-[#A89880] text-xs">Loading customer profile...</div>;
  }

  if (error || !customer) {
    return (
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto">
        <XCircle size={40} className="mx-auto text-red-400" />
        <h2 className="text-lg font-bold text-[#F5F0E8]">{error || 'Customer not found.'}</h2>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 bg-[#1F1C18] hover:bg-[#2A2420] text-[#F5F0E8] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#2A2420]"
        >
          <ArrowLeft size={14} />
          <span>Back to Customers</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-[#2A2420] rounded-xl p-6 shadow-xl">
        <div>
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1.5 text-xs text-[#A89880] hover:text-[#C9A96E] mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Customers List</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-serif text-[#F5F0E8]">{customer.name}</h1>
            <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              {customer.role}
            </span>
          </div>
          <p className="text-xs text-[#A89880] mt-1">
            Customer ID: <span className="font-mono text-[#D4CEB8]">{customer.id}</span>
          </p>
        </div>
      </div>

      {/* Customer Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 shadow-md">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89880]">Total Orders</span>
          <p className="text-xl font-black text-[#F5F0E8] mt-1">{stats?.totalOrders || 0}</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 shadow-md">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89880]">Paid Orders</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats?.paidOrders || 0}</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 shadow-md">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89880]">Pending Orders</span>
          <p className="text-xl font-black text-amber-400 mt-1">{stats?.pendingOrders || 0}</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 shadow-md">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89880]">Cancelled</span>
          <p className="text-xl font-black text-red-400 mt-1">{stats?.cancelledOrders || 0}</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 shadow-md">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A89880]">Total Lifetime Spent</span>
          <p className="text-xl font-black text-[#C9A96E] mt-1">ETB {(stats?.totalSpent || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information Panel */}
        <div className="lg:col-span-1 bg-[#141414] border border-[#2A2420] rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] pb-3 border-b border-[#2A2420] flex items-center gap-2">
            <User size={16} />
            <span>Customer Profile</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Member ID</span>
              <span className="font-mono text-[#C9A96E] font-extrabold text-sm tracking-wider">{customer.memberId || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Full Name</span>
              <span className="font-bold text-[#F5F0E8] text-sm">{customer.name}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Email Address</span>
              <span className="text-[#D4CEB8] font-medium">{customer.email}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Phone Number</span>
              <span className="text-[#D4CEB8] font-medium">{customer.phone || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Gender</span>
              <span className="text-[#D4CEB8] font-medium">{customer.gender || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Country</span>
              <span className="text-[#C9A96E] font-medium">{customer.country || 'Ethiopia'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">City / Region</span>
              <span className="text-[#D4CEB8] font-medium">{customer.city || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Street Address</span>
              <span className="text-[#D4CEB8] font-medium">{customer.streetAddress || customer.address || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Postal Code</span>
              <span className="text-[#D4CEB8] font-medium">{customer.postalCode || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-[#A89880] block text-[11px] uppercase tracking-wider">Registration Date</span>
              <span className="text-[#D4CEB8] font-medium">
                {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Saved Delivery Addresses Panel */}
          <div className="pt-4 border-t border-[#2A2420] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                <span>Saved Addresses</span>
              </span>
              <span className="bg-[#1F1C18] text-[#D4CEB8] px-2 py-0.5 rounded-full text-[10px] font-mono border border-[#2A2420]">
                {customer.savedAddresses?.length || 0}
              </span>
            </h4>

            {(!customer.savedAddresses || customer.savedAddresses.length === 0) ? (
              <p className="text-[11px] text-[#A89880] italic py-2">No saved delivery addresses found.</p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {customer.savedAddresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      addr.isDefault
                        ? 'bg-[#1F1C18] border-[#C9A96E]/50'
                        : 'bg-[#0D0D0D] border-[#2A2420]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F5F0E8] text-[11px] uppercase tracking-wider">
                        {addr.label || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-[#C9A96E] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-[#D4CEB8] text-[11px]">{addr.fullName} • {addr.phone}</p>
                    <p className="text-[#A89880] text-[11px] leading-tight">
                      {addr.streetAddress}, {addr.city} {addr.postalCode ? `(${addr.postalCode})` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Order History */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2420] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2420]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-2">
              <ShoppingBag size={16} />
              <span>Order History ({orders.length})</span>
            </h3>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-[#A89880] space-y-2">
              <ShoppingBag size={32} className="mx-auto text-[#5C5248]" />
              <p className="text-xs font-semibold text-[#F5F0E8]">No orders placed by this customer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0D0D0D] border-b border-[#2A2420] text-[#A89880] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2420]/60">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#F5F0E8]">#{order.orderNumber}</span>
                        {order.paymentReference && (
                          <span className="block text-[10px] font-mono text-[#C9A96E] truncate max-w-[120px]" title={order.paymentReference}>
                            Ref: {order.paymentReference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#A89880]">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[#D4CEB8] block">{order.paymentMethod}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${getPaymentBadge(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#C9A96E]">
                        ETB {order.total?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="bg-[#1F1C18] hover:bg-[#2A2420] text-[#F5F0E8] px-2.5 py-1 rounded border border-[#2A2420] transition-colors inline-flex items-center gap-1 text-[11px]"
                        >
                          <ExternalLink size={12} />
                          <span>View Order</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
