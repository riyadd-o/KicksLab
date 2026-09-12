'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  ShoppingBag, DollarSign, Calendar, Phone, MapPin, Eye, UserCheck
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalCustomerRevenue: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = () => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      filter,
      sortBy,
      sortOrder,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    fetch(`/api/admin/customers?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch customers.');
        return res.json();
      })
      .then((data) => {
        if (data.customers) setCustomers(data.customers);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, filter, sortBy, sortOrder, pagination.page]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-serif text-[#F5F0E8]">Customers</h1>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E]">
              {stats.totalCustomers} Registered Customers
            </span>
          </div>
          <p className="text-xs text-[#A89880] mt-1">
            Manage registered customer accounts, analyze purchasing habits, and view order histories.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">Total Registered</p>
            <p className="text-2xl font-black text-[#F5F0E8] mt-1">{stats.totalCustomers}</p>
          </div>
          <div className="p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl text-[#C9A96E]">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">Active Customers</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.activeCustomers}</p>
            <span className="text-[10px] text-[#A89880]">With at least 1 placed order</span>
          </div>
          <div className="p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl text-emerald-400">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">Total Customer Revenue</p>
            <p className="text-2xl font-black text-[#C9A96E] mt-1">ETB {stats.totalCustomerRevenue.toLocaleString()}</p>
            <span className="text-[10px] text-[#A89880]">Excludes guest checkouts</span>
          </div>
          <div className="p-3 bg-[#1F1C18] border border-[#2A2420] rounded-xl text-[#C9A96E]">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters, Sorting */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-lg pl-10 pr-4 py-2 text-xs text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Order Filter */}
          <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-1.5 text-xs text-[#A89880]">
            <Filter size={14} className="text-[#C9A96E]" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-transparent text-[#F5F0E8] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#141414]">All Customers</option>
              <option value="with_orders" className="bg-[#141414]">Customers with Orders</option>
              <option value="no_orders" className="bg-[#141414]">Customers with No Orders</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-1.5 text-xs text-[#A89880]">
            <ArrowUpDown size={14} className="text-[#C9A96E]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[#F5F0E8] focus:outline-none cursor-pointer"
            >
              <option value="createdAt" className="bg-[#141414]">Registration Date</option>
              <option value="name" className="bg-[#141414]">Name</option>
              <option value="orderCount" className="bg-[#141414]">Order Count</option>
              <option value="totalSpent" className="bg-[#141414]">Total Spent</option>
              <option value="latestOrderDate" className="bg-[#141414]">Latest Order</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={toggleSortOrder}
            title={`Sort ${sortOrder.toUpperCase()}`}
            className="bg-[#0D0D0D] hover:bg-[#1F1C18] border border-[#2A2420] text-[#C9A96E] p-2 rounded-lg text-xs font-bold transition-colors uppercase"
          >
            {sortOrder}
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#A89880] text-xs">Loading customer records...</div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-[#A89880] space-y-2">
            <Users size={36} className="mx-auto text-[#5C5248]" />
            <p className="text-sm font-semibold text-[#F5F0E8]">No registered customers found</p>
            <p className="text-xs text-[#A89880]">Try adjusting your search query or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#2A2420] text-[#A89880] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Total Spent</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2420]/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[#C9A96E] font-bold text-xs bg-[#1F1C18] px-2.5 py-1 rounded-md border border-[#C9A96E]/30">
                        {c.memberId || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#F5F0E8]">{c.name}</div>
                      <div className="text-[11px] text-[#A89880]">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#D4CEB8]">
                      {c.phone || <span className="text-[#5C5248]">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-[#D4CEB8]">
                      {c.gender || <span className="text-[#5C5248]">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-[#D4CEB8]">
                      <div>{c.city || 'Ethiopia'}</div>
                      <div className="text-[10px] text-[#5C5248] truncate max-w-[120px]" title={c.streetAddress || c.address}>
                        {c.streetAddress || c.address || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#A89880]">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#F5F0E8]">
                      {c.orderCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#C9A96E]">
                      ETB {c.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="bg-[#1F1C18] hover:bg-[#C9A96E] text-[#F5F0E8] hover:text-[#0D0D0D] px-3 py-1.5 rounded-lg border border-[#2A2420] transition-colors inline-flex items-center gap-1 font-semibold"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && customers.length > 0 && (
          <div className="bg-[#0D0D0D] border-t border-[#2A2420] px-4 py-3 flex items-center justify-between text-xs text-[#A89880]">
            <div>
              Showing <span className="text-[#F5F0E8] font-bold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="text-[#F5F0E8] font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="text-[#F5F0E8] font-bold">{pagination.total}</span> customers
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg bg-[#141414] border border-[#2A2420] hover:border-[#C9A96E] disabled:opacity-40 disabled:hover:border-[#2A2420] text-[#F5F0E8] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-[#F5F0E8] px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg bg-[#141414] border border-[#2A2420] hover:border-[#C9A96E] disabled:opacity-40 disabled:hover:border-[#2A2420] text-[#F5F0E8] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
