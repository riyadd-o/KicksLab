'use client';
import { useState, useEffect } from 'react';
import { Check, X as XIcon, Eye, Search, Filter, AlertCircle, Info, ExternalLink, RefreshCw } from 'lucide-react';
import Toast from '@/components/shared/Toast';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [viewRefund, setViewRefund] = useState<any>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState<any>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<any>(null);
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState<any>(null);

  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');

  const [topBannerMessage, setTopBannerMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fetchRefunds = async () => {
    try {
      const res = await fetch('/api/admin/refunds');
      if (res.ok) {
        const data = await res.json();
        setRefunds(data);
      }
    } catch (e) {
      console.error("Failed to load refunds", e);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isCompletingCod, setIsCompletingCod] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!showApproveConfirm) return;

    try {
      const pm = (showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase();
      const isCod = pm === 'CASH_ON_DELIVERY' || pm === 'COD' || pm.includes('CASH');

      const res = await fetch(`/api/admin/refunds/${showApproveConfirm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      if (res.ok) {
        const updated = await res.json();
        if (isCod) {
          setTopBannerMessage(`COD refund approved for ${showApproveConfirm.order?.orderNumber || showApproveConfirm.orderId}. Status is APPROVED. Payout destination is available for manual payout.`);
          setToast({ message: `COD Refund Approved!`, type: 'success' });
        } else {
          setTopBannerMessage(`Refund request approved and submitted to Chapa for ${showApproveConfirm.order?.orderNumber || showApproveConfirm.orderId}. Status is now PROCESSING. Approval email sent.`);
          setToast({ message: `Refund submitted to Chapa (PROCESSING)`, type: 'success' });
        }
        fetchRefunds();
        if (viewRefund?.id === showApproveConfirm.id) {
          setViewRefund(updated);
        }
      } else {
        const err = await res.json();
        setToast({ message: err.error || "Failed to approve refund", type: 'error' });
      }
    } catch (e) {
      setToast({ message: "Failed to approve refund", type: 'error' });
    }
    setShowApproveConfirm(null);
  };

  const handleMarkCodPaid = async (refundItem: any) => {
    if (!refundItem) return;
    try {
      setIsCompletingCod(refundItem.id);
      const res = await fetch(`/api/admin/refunds/${refundItem.id}/complete-cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: `COD refund payout completed via ${refundItem.refundMethod || 'manual transfer'}` })
      });
      const data = await res.json();
      if (res.ok) {
        setTopBannerMessage(`COD refund payout marked as completed for ${refundItem.order?.orderNumber || refundItem.orderId}. Customer notified via email.`);
        setToast({ message: `COD Refund Paid & Completed!`, type: 'success' });
        fetchRefunds();
        if (viewRefund?.id === refundItem.id && data.refund) {
          setViewRefund(data.refund);
        }
        setShowMarkPaidConfirm(null);
      } else {
        setToast({ message: data.error || "Failed to mark COD refund as paid", type: 'error' });
      }
    } catch (e) {
      setToast({ message: "Error completing COD refund", type: 'error' });
    } finally {
      setIsCompletingCod(null);
    }
  };

  const handleVerifyChapa = async (refundItem: any) => {
    try {
      setIsVerifying(refundItem.id);
      const res = await fetch(`/api/admin/refunds/${refundItem.id}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message || "Chapa status verified", type: 'info' });
        fetchRefunds();
        if (viewRefund?.id === refundItem.id && data.refund) {
          setViewRefund(data.refund);
        }
      } else {
        setToast({ message: data.error || "Failed to verify with Chapa", type: 'error' });
      }
    } catch (e) {
      setToast({ message: "Error verifying with Chapa", type: 'error' });
    } finally {
      setIsVerifying(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectConfirm || !rejectionReason) return;

    try {
      const res = await fetch(`/api/admin/refunds/${showRejectConfirm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: `${rejectionReason}${rejectionNote ? ` - ${rejectionNote}` : ''}`
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setToast({ message: `Refund request rejected. Customer notified via email.`, type: 'info' });
        fetchRefunds();
        if (viewRefund?.id === showRejectConfirm.id) {
          setViewRefund(updated);
        }
      }
    } catch (e) {
      setToast({ message: "Failed to reject refund", type: 'error' });
    }

    setShowRejectConfirm(null);
    setRejectionReason('');
    setRejectionNote('');
  };

  // Stats calculation
  const totalRequests = refunds.length;
  const pendingRequests = refunds.filter(r => String(r.status).toUpperCase() === 'PENDING').length;
  const approvedRequests = refunds.filter(r => ['APPROVED', 'REFUNDED', 'PROCESSING'].includes(String(r.status).toUpperCase())).length;
  const rejectedRequests = refunds.filter(r => String(r.status).toUpperCase() === 'REJECTED').length;
  const totalRefundedAmount = refunds
    .filter(r => ['APPROVED', 'REFUNDED', 'PROCESSING'].includes(String(r.status).toUpperCase()))
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Filters
  const filteredRefunds = refunds.filter(r => {
    const matchesSearch = (r.order?.orderNumber || r.orderId || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.refundNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || String(r.status).toUpperCase() === statusFilter.toUpperCase();

    let matchesDate = true;
    if (dateFrom && dateTo) {
      const rDate = new Date(r.createdAt).getTime();
      if (rDate < new Date(dateFrom).getTime()) matchesDate = false;
      if (rDate > new Date(dateTo).getTime() + 86400000) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const aPending = String(a.status).toUpperCase() === 'PENDING';
    const bPending = String(b.status).toUpperCase() === 'PENDING';
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {topBannerMessage && (
        <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg p-3 flex items-center gap-3">
          <span className="text-[#C9A96E]">⚠</span>
          <p className="text-[#F5F0E8] text-sm">{topBannerMessage}</p>
          <button className="ml-auto text-[#C9A96E] hover:text-[#C9A96E]-hover" onClick={() => setTopBannerMessage('')}><XIcon size={16}/></button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Refund Management</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4">
          <p className="text-[#A89880] text-xs font-bold uppercase tracking-wider mb-1">Total Requests</p>
          <p className="text-[#F5F0E8] text-2xl font-bold">{totalRequests}</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4">
          <p className="text-[#A89880] text-xs font-bold uppercase tracking-wider mb-1">Pending</p>
          <p className="text-yellow-500 text-2xl font-bold">{pendingRequests}</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4">
          <p className="text-[#A89880] text-xs font-bold uppercase tracking-wider mb-1">Approved/Refunded</p>
          <p className="text-green-500 text-2xl font-bold">{approvedRequests}</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4">
          <p className="text-[#A89880] text-xs font-bold uppercase tracking-wider mb-1">Rejected</p>
          <p className="text-red-500 text-2xl font-bold">{rejectedRequests}</p>
        </div>
        <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-[#C9A96E] text-xs font-bold uppercase tracking-wider mb-1">Total Refunded</p>
          <p className="text-[#C9A96E] text-xl font-bold truncate">ETB {totalRefundedAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[#A89880] text-xs font-semibold mb-2">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Refund #, Order # or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg pl-10 pr-4 py-2 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89880]" size={16} />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-[#A89880] text-xs font-semibold mb-2">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-3 py-2 text-[#F5F0E8] text-sm appearance-none focus:outline-none">
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="w-32">
          <label className="block text-[#A89880] text-xs font-semibold mb-2">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-3 py-2 text-[#F5F0E8] text-sm focus:outline-none" />
        </div>
        <div className="w-32">
          <label className="block text-[#A89880] text-xs font-semibold mb-2">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-3 py-2 text-[#F5F0E8] text-sm focus:outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans whitespace-nowrap">
            <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
              <tr>
                <th className="px-6 py-4 font-semibold">Refund #</th>
                <th className="px-6 py-4 font-semibold">Order #</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Reason</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRefunds.map(refund => {
                const pm = (refund.paymentMethod || refund.order?.paymentMethod || '').trim().toUpperCase();
                const isCod = pm === 'CASH_ON_DELIVERY' || pm === 'COD' || pm.includes('CASH');
                return (
                  <tr key={refund.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#C9A96E] text-xs font-mono">{refund.refundNumber || refund.id}</td>
                    <td className="px-6 py-4 font-bold text-[#F5F0E8] font-mono">{refund.order?.orderNumber || refund.orderId}</td>
                    <td className="px-6 py-4 text-[#F5F0E8]">{refund.customerName || 'Customer'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        isCod
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      }`}>
                        {isCod ? 'COD' : 'Chapa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#F5F0E8]">ETB {refund.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-[#A89880] max-w-[150px] truncate">{refund.reason}</td>
                    <td className="px-6 py-4 text-[#A89880] text-xs">{new Date(refund.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${
                        String(refund.status).toUpperCase() === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                        String(refund.status).toUpperCase() === 'PROCESSING' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        String(refund.status).toUpperCase() === 'APPROVED' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                        String(refund.status).toUpperCase() === 'REFUNDED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        String(refund.status).toUpperCase() === 'REVERSED' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                        'bg-red-500/10 border-red-500/30 text-red-500'
                      }`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setViewRefund(refund)} className="text-[#C9A96E] hover:text-[#C9A96E]-hover p-1.5 hover:bg-[#1A1A1A] rounded transition-colors inline-flex" title="View">
                        <Eye size={16} />
                      </button>
                      {String(refund.status).toUpperCase() === 'PENDING' && (
                        <>
                          <button onClick={() => setShowApproveConfirm(refund)} className="text-green-400 hover:text-green-500 p-1.5 hover:bg-[#1A1A1A] rounded transition-colors inline-flex" title="Approve Refund">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setShowRejectConfirm(refund)} className="text-red-400 hover:text-red-500 p-1.5 hover:bg-[#1A1A1A] rounded transition-colors inline-flex" title="Reject">
                            <XIcon size={16} />
                          </button>
                        </>
                      )}
                      {/* COD Approved or Processing: Mark as Paid */}
                      {['APPROVED', 'PROCESSING'].includes(String(refund.status).toUpperCase()) && isCod && (
                        <button
                          onClick={() => setShowMarkPaidConfirm(refund)}
                          disabled={isCompletingCod === refund.id}
                          className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 rounded text-xs font-bold transition-colors inline-flex items-center gap-1"
                          title="Mark COD Refund as Paid"
                        >
                          <Check size={12} />
                          <span>{isCompletingCod === refund.id ? 'Processing...' : 'Mark Paid'}</span>
                        </button>
                      )}
                      {/* Chapa Processing: Sync with Chapa */}
                      {String(refund.status).toUpperCase() === 'PROCESSING' && !isCod && (
                        <button
                          onClick={() => handleVerifyChapa(refund)}
                          disabled={isVerifying === refund.id}
                          className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-[#1A1A1A] rounded transition-colors inline-flex"
                          title="Sync / Check Status with Chapa"
                        >
                          <RefreshCw size={16} className={isVerifying === refund.id ? "animate-spin" : ""} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRefunds.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-[#A89880]">No refund requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Refund Drawer */}
      {viewRefund && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewRefund(null)} />
          <div className="relative w-full max-w-md bg-[#0A0A0A] border-l border-[#2A2420] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#2A2420] flex justify-between items-center sticky top-0 bg-[#0A0A0A] z-10">
              <div>
                <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Refund Request</h2>
                <p className="text-[#C9A96E] text-xs font-mono font-bold">{viewRefund.refundNumber || viewRefund.id}</p>
              </div>
              <button onClick={() => setViewRefund(null)} className="text-[#A89880] hover:text-[#F5F0E8]">
                <XIcon size={24} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {viewRefund.status === 'PENDING' && (
                <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl p-4">
                  <h3 className="text-[#C9A96E] font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={16}/> Action Required
                  </h3>
                  <p className="text-xs text-[#A89880] mb-3">
                    {((viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                      (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                      (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase().includes('CASH'))
                      ? 'Review and approve Cash on Delivery refund request.'
                      : 'Review and submit refund request to Chapa.'}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setShowApproveConfirm(viewRefund)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                      {((viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                        (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                        (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase().includes('CASH'))
                        ? 'APPROVE COD REFUND'
                        : 'APPROVE & SUBMIT'}
                    </button>
                    <button onClick={() => setShowRejectConfirm(viewRefund)} className="flex-1 bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 font-bold py-2.5 rounded-lg text-sm transition-colors">REJECT</button>
                  </div>
                </div>
              )}

              {/* COD Approved: Action to mark as paid */}
              {viewRefund.status === 'APPROVED' &&
                ((viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                 (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                 (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase().includes('CASH')) && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <h3 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Check size={16}/> COD Refund Approved
                  </h3>
                  <p className="text-xs text-[#A89880] mb-3">
                    Refund is approved. Once you have executed the payout to the customer's chosen destination, click below to mark as paid.
                  </p>
                  <button
                    onClick={() => setShowMarkPaidConfirm(viewRefund)}
                    disabled={isCompletingCod === viewRefund.id}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    <span>{isCompletingCod === viewRefund.id ? 'Completing Payout...' : 'Mark Refund as Paid'}</span>
                  </button>
                </div>
              )}

              {/* Chapa Processing */}
              {viewRefund.status === 'PROCESSING' &&
                !((viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                  (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                  (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase().includes('CASH')) && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-blue-400 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw size={16} className={isVerifying === viewRefund.id ? "animate-spin" : ""}/> Chapa Processing
                  </h3>
                  <p className="text-xs text-[#A89880] mb-3">
                    Refund was submitted to Chapa. Query Chapa's verify endpoint to check if the transaction completed.
                  </p>
                  <button
                    onClick={() => handleVerifyChapa(viewRefund)}
                    disabled={isVerifying === viewRefund.id}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} className={isVerifying === viewRefund.id ? "animate-spin" : ""} />
                    <span>{isVerifying === viewRefund.id ? "Checking Chapa..." : "Check / Sync with Chapa"}</span>
                  </button>
                </div>
              )}

              {/* Customer & Order Information */}
              <div>
                <h3 className="text-[#F5F0E8] font-serif font-bold mb-3 border-b border-[#2A2420] pb-2 text-sm uppercase tracking-wider text-[#C9A96E]">Customer & Order</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#A89880]">Customer:</span><span className="text-[#F5F0E8] font-semibold">{viewRefund.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Email:</span><span className="text-[#F5F0E8] font-semibold">{viewRefund.customerEmail || 'N/A'}</span></div>
                  <div className="flex justify-between mt-2"><span className="text-[#A89880]">Order Number:</span><span className="text-[#C9A96E] font-mono font-semibold">{viewRefund.order?.orderNumber || viewRefund.orderId}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Amount:</span><span className="text-[#F5F0E8] font-semibold">ETB {viewRefund.amount?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Payment Method:</span><span className="text-[#F5F0E8] font-semibold uppercase">{viewRefund.paymentMethod || 'Chapa'}</span></div>
                  {viewRefund.chapaTxRef && (
                    <div className="flex justify-between"><span className="text-[#A89880]">Chapa Tx Ref:</span><span className="text-[#C9A96E] font-mono text-xs">{viewRefund.chapaTxRef}</span></div>
                  )}
                  {viewRefund.chapaRefundRef && (
                    <div className="flex justify-between"><span className="text-[#A89880]">Chapa Refund ID:</span><span className="text-[#4ADE80] font-mono text-xs">{viewRefund.chapaRefundRef}</span></div>
                  )}
                </div>
              </div>

              {/* COD Refund Destination Details */}
              {(viewRefund.refundMethod ||
                (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase().includes('CASH')) && (
                <div className="bg-[#141414] border border-[#C9A96E]/40 rounded-xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">COD Refund Destination Details</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#A89880]">Payment Method:</span>
                    <span className="text-[#F5F0E8] font-semibold">Cash on Delivery</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#A89880]">Refund Method:</span>
                    <span className="text-[#C9A96E] font-bold">
                      {viewRefund.refundMethod
                        ? viewRefund.refundMethod === 'AWASH_BIRR'
                          ? 'Awash Birr'
                          : viewRefund.refundMethod === 'EBIRR'
                          ? 'eBirr'
                          : viewRefund.refundMethod
                        : 'Manual Direct / Cash'}
                    </span>
                  </div>
                  {viewRefund.refundAccountName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#A89880]">Account Holder:</span>
                      <span className="text-[#F5F0E8] font-semibold">{viewRefund.refundAccountName}</span>
                    </div>
                  )}
                  {viewRefund.refundPhoneNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#A89880]">Destination (Phone):</span>
                      <span className="text-[#F5F0E8] font-mono font-bold">{viewRefund.refundPhoneNumber}</span>
                    </div>
                  )}
                  {viewRefund.refundAccountNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#A89880]">Destination (Account #):</span>
                      <span className="text-[#F5F0E8] font-mono font-bold">{viewRefund.refundAccountNumber}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-[#F5F0E8] font-serif font-bold mb-3 border-b border-[#2A2420] pb-2 text-sm uppercase tracking-wider text-[#C9A96E]">Request Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#A89880]">Reason:</span><span className="text-[#F5F0E8] font-semibold">{viewRefund.reason}</span></div>
                  <div className="flex justify-between"><span className="text-[#A89880]">Submitted:</span><span className="text-[#F5F0E8] font-semibold">{new Date(viewRefund.createdAt).toLocaleDateString()}</span></div>

                  {viewRefund.description && (
                    <div className="mt-4">
                      <span className="text-[#A89880] block mb-1">Customer Description:</span>
                      <div className="bg-[#1A1A1A] p-3 rounded border border-[#2A2420] text-[#F5F0E8] whitespace-pre-wrap">{viewRefund.description}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#2A2420] pt-4">
                <div className="bg-[#1A1A1A] border border-[#2A2420] rounded-lg p-3.5">
                  <p className="text-[#F5F0E8] font-bold text-xs mb-1">
                    LIFECYCLE POLICY: <span className="uppercase text-[#C9A96E]">{viewRefund.paymentMethod || 'Chapa'}</span>
                  </p>
                  <p className="text-[#A89880] text-xs leading-relaxed">
                    {((viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                      (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                      (viewRefund.paymentMethod || viewRefund.order?.paymentMethod || '').trim().toUpperCase().includes('CASH'))
                      ? 'Cash on Delivery refunds are sent via the chosen destination (Telebirr/CBE/eBirr/Awash Birr). Admin approves the request, transfers funds manually, and clicks "Mark as Paid" to complete and notify the customer.'
                      : 'Approving triggers automated server-side refund processing via Chapa and dispatches email update to customer.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark COD Refund as Paid Modal */}
      {showMarkPaidConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMarkPaidConfirm(null)} />
          <div className="relative bg-[#141414] border border-[#2A2420] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#F5F0E8] border-b border-[#2A2420] pb-3 flex items-center gap-2">
              <Check className="text-emerald-400" size={20} />
              Confirm COD Refund Payout
            </h3>

            <div className="bg-[#1A1A1A] border border-[#2A2420] rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A89880]">Order Number:</span>
                <span className="text-[#F5F0E8] font-mono font-bold">{showMarkPaidConfirm.order?.orderNumber || showMarkPaidConfirm.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A89880]">Refund Amount:</span>
                <span className="text-[#C9A96E] font-bold text-sm">ETB {showMarkPaidConfirm.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A89880]">Refund Method:</span>
                <span className="text-[#F5F0E8] font-bold">
                  {showMarkPaidConfirm.refundMethod === 'AWASH_BIRR' ? 'Awash Birr' : showMarkPaidConfirm.refundMethod === 'EBIRR' ? 'eBirr' : showMarkPaidConfirm.refundMethod || 'Cash on Delivery'}
                </span>
              </div>
              {showMarkPaidConfirm.refundAccountName && (
                <div className="flex justify-between">
                  <span className="text-[#A89880]">Account Holder:</span>
                  <span className="text-[#F5F0E8] font-semibold">{showMarkPaidConfirm.refundAccountName}</span>
                </div>
              )}
              {showMarkPaidConfirm.refundPhoneNumber && (
                <div className="flex justify-between">
                  <span className="text-[#A89880]">Phone Number:</span>
                  <span className="text-[#F5F0E8] font-mono font-bold text-[#4ADE80]">{showMarkPaidConfirm.refundPhoneNumber}</span>
                </div>
              )}
              {showMarkPaidConfirm.refundAccountNumber && (
                <div className="flex justify-between">
                  <span className="text-[#A89880]">CBE Account Number:</span>
                  <span className="text-[#F5F0E8] font-mono font-bold text-[#4ADE80]">{showMarkPaidConfirm.refundAccountNumber}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-[#A89880] leading-relaxed">
              <strong>Important:</strong> "Mark as Paid" means you have transferred/paid ETB {showMarkPaidConfirm.amount?.toLocaleString()} to the customer via the selected destination. This will change status to <strong>REFUNDED</strong> and send the <strong>Refund Completed</strong> email to the customer.
            </p>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowMarkPaidConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#2A2420] text-[#F5F0E8] hover:bg-[#1A1A1A] font-bold text-xs uppercase transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleMarkCodPaid(showMarkPaidConfirm)}
                disabled={isCompletingCod === showMarkPaidConfirm.id}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase transition-colors disabled:opacity-50"
              >
                {isCompletingCod === showMarkPaidConfirm.id ? 'PROCESSING...' : 'MARK AS PAID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowApproveConfirm(null)} />
          <div className="relative bg-[#141414] border border-[#2A2420] rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-serif font-bold text-[#F5F0E8] mb-4">
              {((showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                (showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                (showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase().includes('CASH'))
                ? 'Approve COD Refund Request'
                : 'Approve & Issue Refund'}
            </h3>
            <p className="text-[#A89880] text-sm mb-4">
              Approve refund of <strong className="text-[#F5F0E8]">ETB {showApproveConfirm.amount?.toLocaleString()}</strong> for Order <strong className="text-[#F5F0E8]">{showApproveConfirm.order?.orderNumber || showApproveConfirm.orderId}</strong>?
            </p>
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-xs text-left mb-6 flex items-start gap-2">
              <Check size={16} className="shrink-0 mt-0.5" />
              <p>
                {((showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase() === 'CASH_ON_DELIVERY' ||
                  (showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase() === 'COD' ||
                  (showApproveConfirm.paymentMethod || showApproveConfirm.order?.paymentMethod || '').trim().toUpperCase().includes('CASH'))
                  ? 'Transitions status to APPROVED and sends approval email. You can subsequently execute payout to the destination and mark as completed.'
                  : 'Will invoke Chapa payment Gateway refund API and notify customer via email.'}
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowApproveConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-[#2A2420] text-[#F5F0E8] hover:bg-[#1A1A1A] font-bold text-sm transition-colors">CANCEL</button>
              <button onClick={handleApprove} className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors">YES, APPROVE</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowRejectConfirm(null)} />
          <div className="relative bg-[#141414] border border-[#2A2420] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-serif font-bold text-[#F5F0E8] mb-6">Reject Refund Request</h3>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm appearance-none"
                >
                  <option value="" disabled>Select a reason</option>
                  <option value="Outside 7-day refund window">Outside 7-day refund window</option>
                  <option value="Item not eligible for refund">Item not eligible for refund</option>
                  <option value="No valid reason provided">No valid reason provided</option>
                  <option value="Duplicate request">Duplicate request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Additional Note (shown to customer)</label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Explain why this was rejected..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm min-h-[80px] resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowRejectConfirm(null)} className="flex-1 px-4 py-3 rounded-lg border border-[#2A2420] text-[#F5F0E8] hover:bg-[#1A1A1A] font-bold text-xs uppercase transition-colors">CANCEL</button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason}
                  className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CONFIRM REJECTION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
