'use client';

import { useState, useEffect, useTransition } from 'react';
import { Download, TrendingUp, ShoppingBag, DollarSign, Package, Calendar, Loader2, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#C9A96E', '#A89880', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: '#10B981',
  SHIPPED: '#3B82F6',
  PACKED: '#8B5CF6',
  PROCESSING: '#F59E0B',
  PENDING: '#C9A96E',
  CANCELLED: '#EF4444',
  REFUNDED: '#6B7280',
};

export default function AdminReportsPage() {
  const [range, setRange] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportData, setReportData] = useState<{
    summary: {
      totalRevenue: number;
      totalOrders: number;
      completedOrders: number;
      averageOrderValue: number;
      totalUnitsSold: number;
    };
    revenueData: Array<{ name: string; revenue: number; orders: number }>;
    statusData: Array<{ name: string; value: number }>;
    topProducts: Array<{ name: string; revenue: number; units: number }>;
    categoryData: Array<{ name: string; sales: number; revenue: number }>;
    orderDetails: Array<any>;
  }>({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      averageOrderValue: 0,
      totalUnitsSold: 0,
    },
    revenueData: [],
    statusData: [],
    topProducts: [],
    categoryData: [],
    orderDetails: [],
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/admin/reports?range=${range}`;
      if (range === 'custom' && customFrom) {
        url += `&from=${encodeURIComponent(customFrom)}`;
        if (customTo) url += `&to=${encodeURIComponent(customTo)}`;
      }

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to load reports data.');
      }

      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err.message || 'Error loading sales reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom' || (customFrom && customTo)) {
      fetchReports();
    }
  }, [range, customFrom, customTo]);

  // Real CSV Export functionality
  const exportCSV = () => {
    if (!reportData.orderDetails || reportData.orderDetails.length === 0) {
      alert('No sales data available to export for the selected range.');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'City',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Items Count',
      'Total Amount (ETB)',
    ];

    const rows = reportData.orderDetails.map((order) => [
      `"${order.orderNumber}"`,
      `"${order.date}"`,
      `"${order.customerName?.replace(/"/g, '""') || ''}"`,
      `"${order.customerEmail?.replace(/"/g, '""') || ''}"`,
      `"${order.city?.replace(/"/g, '""') || ''}"`,
      `"${order.paymentMethod || ''}"`,
      `"${order.paymentStatus || ''}"`,
      `"${order.status || ''}"`,
      order.itemsCount,
      order.total,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `KicksLab_Sales_Report_${range}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProductRevenue = reportData.topProducts.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#141414] border border-[#2A2420] p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Sales & Revenue Reports</h2>
          <p className="text-xs text-[#A89880] mt-1">
            Real-time analytics, revenue breakdowns, and performance metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Preset Range Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full sm:w-44 bg-[#1A1A1A] border border-[#2A2420] rounded-xl px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-xs font-semibold uppercase tracking-wider appearance-none cursor-pointer"
            >
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="3months">Past 3 Months</option>
              <option value="year">Past 12 Months</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2420] rounded-xl px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
              />
              <span className="text-[#A89880] text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2A2420] rounded-xl px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
              />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2.5 bg-[#1A1A1A] hover:bg-[#1F1C18] border border-[#2A2420] text-[#A89880] hover:text-[#C9A96E] rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#C9A96E]' : ''} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            disabled={loading || reportData.orderDetails.length === 0}
            className="bg-[#C9A96E] hover:bg-[#B8985D] disabled:opacity-50 text-[#0D0D0D] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#C9A96E]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A89880]">Total Revenue</span>
            <div className="p-2 rounded-xl bg-[#C9A96E]/10 text-[#C9A96E]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#F5F0E8]">
              ETB {reportData.summary.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#A89880] mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-[#10B981]" />
              <span>Excluding cancelled/refunded</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#C9A96E]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A89880]">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#F5F0E8]">
              {reportData.summary.totalOrders}
            </h3>
            <p className="text-[11px] text-[#A89880] mt-1">
              {reportData.summary.completedOrders} completed delivery
            </p>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#C9A96E]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A89880]">Average Order Value</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#F5F0E8]">
              ETB {reportData.summary.averageOrderValue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#A89880] mt-1">Per active order</p>
          </div>
        </div>

        {/* Total Units Sold */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#C9A96E]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A89880]">Units Sold</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-[#F5F0E8]">
              {reportData.summary.totalUnitsSold}
            </h3>
            <p className="text-[11px] text-[#A89880] mt-1">Items fulfilled / in progress</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue Over Time */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#F5F0E8] font-serif font-bold text-lg">Revenue Over Time</h3>
              <p className="text-xs text-[#A89880] mt-0.5">Real sales timeline for the selected period</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#C9A96E]">
              ETB {reportData.summary.totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                <Loader2 className="animate-spin text-[#C9A96E] mr-2" size={20} /> Loading timeline...
              </div>
            ) : reportData.revenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                No revenue records in this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2420" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#A89880"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A2420' }}
                  />
                  <YAxis
                    stroke="#A89880"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A2420' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: '#2A2420',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`ETB ${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C9A96E"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#141414', stroke: '#C9A96E', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#C9A96E' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Orders by Status */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#F5F0E8] font-serif font-bold text-lg">Orders by Status</h3>
              <p className="text-xs text-[#A89880] mt-0.5">Real order distribution breakdown</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#F5F0E8]">
              {reportData.summary.totalOrders} Orders
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                <Loader2 className="animate-spin text-[#C9A96E] mr-2" size={20} /> Loading status data...
              </div>
            ) : reportData.statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                No order status records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {reportData.statusData.map((entry, index) => {
                      const color = STATUS_COLORS[entry.name] || COLORS[index % COLORS.length];
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: '#2A2420',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#2A2420]">
            {reportData.statusData.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-[#A89880]">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s.name] || COLORS[idx % COLORS.length] }}
                />
                <span className="font-semibold text-[#F5F0E8]">{s.name}:</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Top Products by Revenue */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#F5F0E8] font-serif font-bold text-lg">Top Products by Revenue</h3>
              <p className="text-xs text-[#A89880] mt-0.5">Highest earning items in catalog</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                <Loader2 className="animate-spin text-[#C9A96E] mr-2" size={20} /> Loading products...
              </div>
            ) : reportData.topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                No product sales found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.topProducts.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2420" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#A89880"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A2420' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#A89880"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A2420' }}
                    width={110}
                  />
                  <Tooltip
                    cursor={{ fill: '#1F1C18' }}
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: '#2A2420',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`ETB ${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#C9A96E" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Sales by Category */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#F5F0E8] font-serif font-bold text-lg">Sales by Category</h3>
              <p className="text-xs text-[#A89880] mt-0.5">Quantity of items purchased per category</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                <Loader2 className="animate-spin text-[#C9A96E] mr-2" size={20} /> Loading categories...
              </div>
            ) : reportData.categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#A89880] text-xs">
                No category records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.categoryData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2420" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#A89880"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A2420' }}
                  />
                  <YAxis
                    stroke="#A89880"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A2420' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#1F1C18' }}
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: '#2A2420',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} Units Sold`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#A89880" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Summary Product Sales Table */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#2A2420] flex items-center justify-between">
          <div>
            <h3 className="text-[#F5F0E8] font-serif font-bold text-lg">Product Performance Breakdown</h3>
            <p className="text-xs text-[#A89880] mt-0.5">Real sales and contribution margin per product</p>
          </div>
          <span className="text-xs text-[#A89880]">
            {reportData.topProducts.length} unique products sold
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans whitespace-nowrap">
            <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
              <tr>
                <th className="px-6 py-4 font-semibold">Product Name</th>
                <th className="px-6 py-4 font-semibold">Units Sold</th>
                <th className="px-6 py-4 font-semibold">Total Revenue</th>
                <th className="px-6 py-4 font-semibold">% Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2420]/40">
              {reportData.topProducts.map((p, idx) => {
                const percent =
                  totalProductRevenue > 0
                    ? ((p.revenue / totalProductRevenue) * 100).toFixed(1)
                    : '0.0';
                return (
                  <tr key={idx} className="hover:bg-[#1A1A1A]/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#F5F0E8]">{p.name}</td>
                    <td className="px-6 py-4 text-[#A89880] font-mono">{p.units}</td>
                    <td className="px-6 py-4 font-semibold text-[#F5F0E8] font-mono">
                      ETB {p.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-[#C9A96E] font-bold font-mono">
                      {percent}%
                    </td>
                  </tr>
                );
              })}
              {reportData.topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#A89880] text-xs">
                    No product sales recorded in the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
