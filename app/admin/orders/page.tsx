'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, X, Eye, AlertCircle } from 'lucide-react';
import { formatPaymentMethodName, isCashPayment } from '@/lib/payment';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [internalNote, setInternalNote] = useState('');
  const [notification, setNotification] = useState('');
  const [codConfirmModal, setCodConfirmModal] = useState<any | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSaveOrder = async (updatedOrder: any) => {
    try {
      const res = await fetch(`/api/orders/${updatedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updatedOrder.status,
          internalNote: updatedOrder.internalNote
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setViewOrder(null);
        setNotification(`Order ${data.orderNumber} status updated to ${data.status} successfully.`);
        setTimeout(() => setNotification(''), 4000);
        // Dynamically refresh orders and metric cards immediately
        await fetchOrders();
      }
    } catch (err) {
      console.error("Failed to save order:", err);
    }
  };

  const handleMarkCodAsPaid = async () => {
    if (!codConfirmModal) return;
    setIsMarkingPaid(true);
    try {
      const res = await fetch(`/api/orders/${codConfirmModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_COD_PAID' }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCodConfirmModal(null);
        if (viewOrder && viewOrder.id === updated.id) {
          setViewOrder(updated);
        }
        setNotification(`Order #${updated.orderNumber} successfully marked as PAID.`);
        setTimeout(() => setNotification(''), 4000);
        await fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to mark Cash on Delivery order as paid.');
      }
    } catch (e) {
      console.error('Failed to mark COD order as paid:', e);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const applyStatusUpdate = () => {
    if (!viewOrder || !updateStatus) return;
    const updated = { ...viewOrder, status: updateStatus };
    handleSaveOrder(updated);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.orderNumber || o.id).toLowerCase().includes(search.toLowerCase()) || 
                          (o.customerName || '').toLowerCase().includes(search.toLowerCase());
    const isCOD = isCashPayment(o.paymentMethod);
    const matchesStatus = 
      statusFilter === 'All' ? true :
      statusFilter === 'COD' ? isCOD :
      statusFilter === 'CHAPA' ? !isCOD :
      statusFilter === 'PAID' ? o.paymentStatus === 'PAID' :
      statusFilter === 'UNPAID' ? (o.paymentStatus === 'PENDING' || o.paymentStatus === 'FAILED' || !o.paymentStatus) :
      (o.status || 'PENDING').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-4 rounded-xl font-bold flex items-center justify-between shadow-lg">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="p-1 hover:opacity-75 text-emerald-400">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[#A89880] text-xs font-semibold mb-2">Search Orders</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg pl-10 pr-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89880]" size={16} />
          </div>
        </div>
        <div className="w-full sm:w-56">
          <label className="block text-[#A89880] text-xs font-semibold mb-2">Filter Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm appearance-none"
          >
            <option value="All">All Orders</option>
            <option value="COD">💵 Cash on Delivery (COD)</option>
            <option value="CHAPA">💳 Chapa (Online Payment)</option>
            <option value="PAID">✓ Paid Payments Only</option>
            <option value="UNPAID">⏳ Pending/Failed Payment</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[#0A0A0A] border-b border-[#2A2420] text-[#A89880] uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold">Fulfillment</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map(order => {
                const status = order.status || 'Pending';
                let statusColor = 'text-[#A89880] border-[#2A2420] bg-[#1A1A1A]';
                if (status === 'Pending') statusColor = 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
                else if (status === 'Processing') statusColor = 'text-blue-400 border-blue-400/30 bg-blue-400/10';
                else if (status === 'Packed') statusColor = 'text-purple-400 border-purple-400/30 bg-purple-400/10';
                else if (status === 'Shipped') statusColor = 'text-orange-400 border-orange-400/30 bg-orange-400/10';
                else if (status === 'Out for Delivery') statusColor = 'text-teal-400 border-teal-400/30 bg-teal-400/10';
                else if (status === 'Delivered') statusColor = 'text-green-500 border-green-500/30 bg-green-500/10';
                else if (status === 'Cancelled') statusColor = 'text-red-500 border-red-500/30 bg-red-500/10';
                else if (status === 'Refunded') statusColor = 'text-gray-400 border-gray-400/30 bg-gray-400/10';

                return (
                  <tr key={order.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#F5F0E8]">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-[#F5F0E8]">{order.customerName || 'Guest'}</p>
                      <p className="text-[#A89880] text-xs">{order.customerEmail || order.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#A89880]">{order.date || order.createdAt?.split('T')[0] || '-'}</td>
                    <td className="px-6 py-4 text-[#A89880]">{order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1}</td>
                    <td className="px-6 py-4 font-semibold text-[#F5F0E8]">ETB {order.total?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isCashPayment(order.paymentMethod)
                            ? 'bg-[#C9A96E]/10 border-[#C9A96E]/30 text-[#C9A96E]'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                          {formatPaymentMethodName(order.paymentMethod)}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 text-[#A89880] bg-[#1A1A1A] rounded border border-[#2A2420]">
                          Provider: {order.paymentProvider && order.paymentProvider !== 'NONE' ? order.paymentProvider : (isCashPayment(order.paymentMethod) ? 'None' : 'Chapa')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${
                          order.paymentStatus === 'PAID'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                            : order.paymentStatus === 'FAILED'
                            ? 'text-red-400 border-red-500/30 bg-red-500/10'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        }`}>
                          {order.paymentStatus === 'PAID' ? '✓ PAID' : order.paymentStatus === 'FAILED' ? '✗ FAILED' : '⏳ PENDING'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border inline-block ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setViewOrder(order);
                          setUpdateStatus(order.status || 'PENDING');
                          setInternalNote(order.internalNote || '');
                        }}
                        className="text-[#C9A96E] hover:text-[#C9A96E]-hover font-bold text-xs uppercase tracking-widest px-3 py-1.5 border border-[#C9A96E]/30 hover:border-[#C9A96E] rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-[#A89880]">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Drawer / Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewOrder(null)} />
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border-l border-[#2A2420] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#2A2420] flex justify-between items-center sticky top-0 bg-[#0A0A0A] z-10">
              <div>
                <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Order Details</h2>
                <p className="text-[#A89880] text-xs font-sans">{viewOrder.orderNumber}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-[#A89880] hover:text-[#F5F0E8]">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-6 space-y-8">
              {notification && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm p-3 rounded-lg text-center font-bold">
                  {notification}
                </div>
              )}

              {/* Status Management */}
              <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5">
                <h3 className="text-[#F5F0E8] font-serif font-bold mb-4">Manage Status</h3>
                <div className="flex flex-col gap-3">
                  <select 
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm appearance-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button 
                    onClick={applyStatusUpdate}
                    className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-xs py-3 rounded-lg transition-colors"
                  >
                    Update Status
                  </button>

                </div>
              </div>



              {/* Customer Info */}
              <div>
                <h3 className="text-[#F5F0E8] font-serif font-bold mb-4 border-b border-[#2A2420] pb-2">Customer Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#A89880]">Name:</span><span className="text-[#F5F0E8] font-semibold">{viewOrder.customerName || 'Guest'}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Email:</span><span className="text-[#F5F0E8] font-semibold">{viewOrder.customerEmail || viewOrder.email || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Phone:</span><span className="text-[#F5F0E8] font-semibold">{viewOrder.customerPhone || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Address:</span><span className="text-[#F5F0E8] font-semibold text-right max-w-[200px] break-words">{viewOrder.streetAddress || 'N/A'}<br/>{viewOrder.city || ''}</span></div>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="text-[#F5F0E8] font-serif font-bold mb-4 border-b border-[#2A2420] pb-2">Payment & Shipping</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#A89880]">Payment Method:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      isCashPayment(viewOrder.paymentMethod)
                        ? 'bg-[#C9A96E]/10 border-[#C9A96E]/30 text-[#C9A96E]'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                      {formatPaymentMethodName(viewOrder.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#A89880]">Payment Provider:</span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8]">
                      {viewOrder.paymentProvider && viewOrder.paymentProvider !== 'NONE' ? viewOrder.paymentProvider : (isCashPayment(viewOrder.paymentMethod) ? 'None' : 'Chapa')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#A89880]">Payment Status:</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded border ${
                      viewOrder.paymentStatus === 'PAID' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : viewOrder.paymentStatus === 'FAILED'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {viewOrder.paymentStatus || 'PENDING'}
                    </span>
                  </div>

                  {/* COD Mark as Paid Button */}
                  {isCashPayment(viewOrder.paymentMethod) &&
                    viewOrder.paymentStatus !== 'PAID' && (
                      <div className="pt-2 pb-1">
                        <button
                          type="button"
                          onClick={() => setCodConfirmModal(viewOrder)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>✓ Mark as Paid (Cash Collected)</span>
                        </button>
                      </div>
                  )}

                  {viewOrder.paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-[#A89880]">Transaction Reference:</span>
                      <span className="text-[#C9A96E] font-mono text-xs font-semibold">{viewOrder.paymentReference}</span>
                    </div>
                  )}
                  {viewOrder.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-[#A89880]">Paid Date:</span>
                      <span className="text-[#F5F0E8] text-xs">{new Date(viewOrder.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between"><span className="text-[#A89880]">Shipping Zone:</span><span className="text-[#F5F0E8] font-semibold">{viewOrder.shippingZone || viewOrder.shippingMethod || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Subtotal:</span><span className="text-[#F5F0E8] font-semibold">ETB {viewOrder.subtotal?.toLocaleString() || 0}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Shipping Fee:</span><span className="text-[#F5F0E8] font-semibold">{viewOrder.shippingCost === 0 ? <span className="text-green-400 font-bold">FREE</span> : `ETB ${viewOrder.shippingCost?.toLocaleString() || 0}`}</span></div>
                  {viewOrder.coupon && (
                    <div className="flex justify-between"><span className="text-[#C9A96E]">Discount:</span><span className="text-[#C9A96E] font-semibold">-{viewOrder.coupon.discount}%</span></div>
                  )}
                  <div className="flex justify-between border-t border-[#2A2420] pt-2 mt-2"><span className="text-[#F5F0E8] font-bold">Total:</span><span className="text-[#F5F0E8] font-bold text-lg">ETB {viewOrder.total?.toLocaleString() || 0}</span></div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-[#F5F0E8] font-serif font-bold mb-4 border-b border-[#2A2420] pb-2">Items Ordered</h3>
                <div className="space-y-4">
                  {viewOrder.items && Array.isArray(viewOrder.items) ? viewOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-16 h-16 rounded object-cover border border-[#2A2420]" />
                      <div className="flex-1 text-sm">
                        <p className="text-[#F5F0E8] font-bold">{item.name}</p>
                        <p className="text-[#A89880]">Size: {item.size} • Qty: {item.quantity}</p>
                        <p className="text-[#C9A96E] font-bold">ETB {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-[#A89880] text-sm">Item details unavailable for legacy orders.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* COD Confirmation Modal */}
      {codConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">
              Mark this Cash on Delivery order as paid?
            </h3>
            <p className="text-xs text-[#A89880] leading-relaxed">
              Confirm that cash payment of <strong className="text-[#C9A96E]">ETB {codConfirmModal.total?.toLocaleString()}</strong> has been collected from <strong className="text-[#F5F0E8]">{codConfirmModal.customerName}</strong> for order <strong className="text-[#F5F0E8]">#{codConfirmModal.orderNumber}</strong>.
            </p>
            <div className="bg-[#1A1A1A] border border-amber-500/20 rounded-lg p-3 text-amber-400 text-xs">
              ⚠️ This will update the payment status to <strong>PAID</strong> while preserving the order fulfillment status.
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isMarkingPaid}
                onClick={() => setCodConfirmModal(null)}
                className="px-4 py-2.5 rounded-lg border border-[#2A2420] text-xs font-semibold text-[#A89880] hover:text-[#F5F0E8] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isMarkingPaid}
                onClick={handleMarkCodAsPaid}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isMarkingPaid ? 'Updating...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
