'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ban, X } from 'lucide-react';
import DeleteModal from '@/components/admin/DeleteModal';
import Toast from '@/components/shared/Toast';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    discount: 10,
    minOrder: 0,
    usageLimit: '',
    perCustomerLimit: '1',
    expiry: '',
    active: true
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {
      console.error("Failed to fetch coupons", e);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.type,
      value: parseFloat(formData.discount.toString()),
      minOrder: formData.minOrder !== null && formData.minOrder !== undefined && String(formData.minOrder).trim() !== "" ? parseFloat(String(formData.minOrder)) : null,
      usageLimit: formData.usageLimit !== null && formData.usageLimit !== undefined && String(formData.usageLimit).trim() !== "" ? parseInt(String(formData.usageLimit), 10) : null,
      perCustomerLimit: formData.perCustomerLimit !== null && formData.perCustomerLimit !== undefined && String(formData.perCustomerLimit).trim() !== "" ? parseInt(String(formData.perCustomerLimit), 10) : null,
      expiry: formData.expiry && String(formData.expiry).trim() !== "" ? formData.expiry : null,
      active: formData.active
    };

    try {
      if (editCoupon) {
        const res = await fetch(`/api/admin/coupons/${editCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error || "Failed to update coupon");
        setToast({ message: 'Coupon updated successfully!', type: 'success' });
      } else {
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error || "Failed to create coupon");
        setToast({ message: 'Coupon added successfully!', type: 'success' });
      }
      fetchCoupons();
      setShowModal(false);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCoupon) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteCoupon.id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'Coupon deleted successfully.', type: 'info' });
        fetchCoupons();
      } else {
        throw new Error("Failed to delete coupon");
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
    setIsDeleting(false);
    setDeleteCoupon(null);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Coupons</h2>
        <button 
          onClick={() => { 
            setEditCoupon(null); 
            setFormData({
              code: '',
              type: 'percentage',
              discount: 10,
              minOrder: 0,
              usageLimit: '',
              perCustomerLimit: '1',
              expiry: '',
              active: true
            }); 
            setShowModal(true); 
          }}
          className="bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-xs px-5 py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans whitespace-nowrap">
            <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
              <tr>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Discount</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Total Usage</th>
                <th className="px-6 py-4 font-semibold">Per Customer</th>
                <th className="px-6 py-4 font-semibold">Expiry</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#C9A96E]">{coupon.code}</td>
                  <td className="px-6 py-4 font-semibold text-[#F5F0E8]">
                    <span className="text-[#F5F0E8]">
                      {coupon.discountType === 'percentage' ? `${coupon.value}%` : `ETB ${coupon.value}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize text-[#A89880]">{coupon.discountType}</td>
                  <td className="px-6 py-4 text-[#A89880]">
                    <span className="text-[#F5F0E8] font-semibold">{coupon.usageCount || 0}</span>
                    <span className="text-xs text-[#7A6E5F]">
                      {coupon.usageLimit !== null && coupon.usageLimit !== undefined ? ` / ${coupon.usageLimit}` : ' / ∞ (Unlimited)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#A89880]">
                    {coupon.perCustomerLimit !== null && coupon.perCustomerLimit !== undefined ? (
                      <span className="px-2.5 py-1 rounded text-xs bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/30 font-medium">
                        {coupon.perCustomerLimit === 1 ? '1 use per customer' : `${coupon.perCustomerLimit} uses / customer`}
                      </span>
                    ) : (
                      <span className="text-xs text-[#7A6E5F] italic">Unlimited</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#A89880]">{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const isExpired = coupon.expiry ? new Date(coupon.expiry).getTime() < new Date().getTime() : false;
                      const isLimitReached = coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit;
                      const isActive = coupon.active && !isExpired && !isLimitReached;
                      return (
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${isActive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-gray-500/10 border-gray-500/30 text-gray-500'}`}>
                          {isActive ? 'Active' : (isLimitReached ? 'Limit Reached' : (isExpired ? 'Expired' : 'Inactive'))}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          setCopied(coupon.code);
                          setTimeout(() => setCopied(null), 2000);
                        }}
                        className="text-[#C9A96E] border border-[#C9A96E]/40 hover:bg-[#C9A96E]/10 text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                      >
                        {copied === coupon.code ? '✓ Copied!' : 'Copy Code'}
                      </button>
                      <button 
                        onClick={() => { 
                          setEditCoupon(coupon); 
                          setFormData({
                            code: coupon.code,
                            type: coupon.discountType,
                            discount: coupon.value,
                            minOrder: coupon.minOrder ?? 0,
                            usageLimit: coupon.usageLimit !== null && coupon.usageLimit !== undefined ? String(coupon.usageLimit) : '',
                            perCustomerLimit: coupon.perCustomerLimit !== null && coupon.perCustomerLimit !== undefined ? String(coupon.perCustomerLimit) : '',
                            expiry: coupon.expiry ? new Date(coupon.expiry).toISOString().split('T')[0] : '',
                            active: coupon.active
                          }); 
                          setShowModal(true); 
                        }}
                        className="text-[#C9A96E] hover:text-[#C9A96E]-hover p-2 hover:bg-[#1A1A1A] rounded transition-colors inline-flex"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => toggleStatus(coupon.id, coupon.active)}
                        className={`p-1.5 hover:bg-[#1A1A1A] rounded transition-colors inline-flex ${coupon.active ? 'text-red-400 hover:text-red-500' : 'text-green-400 hover:text-green-500'}`} 
                        title={coupon.active ? "Deactivate Coupon" : "Activate Coupon"}
                      >
                        <Ban size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteCoupon(coupon)}
                        className="text-red-400 hover:text-red-500 p-2 hover:bg-[#1A1A1A] rounded transition-colors inline-flex"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#A89880]">
                    <div className="text-3xl mb-2">🎟️</div>
                    <p className="font-semibold text-sm">No coupons found</p>
                    <p className="text-xs text-[#5C5248]">Create your first coupon using the button above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#141414] border border-[#2A2420] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2A2420] flex justify-between items-center bg-[#141414] shrink-0">
              <h3 className="text-[#F5F0E8] font-serif text-xl font-bold">{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#A89880] hover:text-[#F5F0E8]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Code (Uppercase) *</label>
                <input required autoFocus type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A89880] text-xs font-semibold mb-2">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (ETB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A89880] text-xs font-semibold mb-2">Value *</label>
                  <input required type="number" min="1" value={formData.discount} onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Min Order Amount (ETB)</label>
                <input type="number" min="0" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: parseFloat(e.target.value) || 0})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" />
              </div>

              {/* Usage Configuration Section */}
              <div className="p-4 bg-[#1A1A1A]/80 border border-[#2A2420] rounded-xl space-y-3">
                <h4 className="text-[#C9A96E] text-xs font-bold uppercase tracking-wider">Usage Rules & Limits</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A89880] text-xs font-semibold mb-1">
                      Total Uses Limit
                      <span className="block text-[10px] text-[#7A6E5F] font-normal">Blank = Unlimited</span>
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="e.g. 500" 
                      value={formData.usageLimit} 
                      onChange={e => setFormData({...formData, usageLimit: e.target.value})} 
                      className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm placeholder-[#5C5248]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[#A89880] text-xs font-semibold mb-1">
                      Per Customer Limit
                      <span className="block text-[10px] text-[#7A6E5F] font-normal">Blank = Unlimited</span>
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="e.g. 1" 
                      value={formData.perCustomerLimit} 
                      onChange={e => setFormData({...formData, perCustomerLimit: e.target.value})} 
                      className="w-full bg-[#141414] border border-[#2A2420] rounded-lg px-3 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm placeholder-[#5C5248]" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-1">
                  Expiry Date <span className="text-[10px] text-[#7A6E5F] font-normal">(Optional)</span>
                </label>
                <input type="date" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${ formData.active ? 'bg-[#C9A96E]' : 'bg-border'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${ formData.active ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="text-[#F5F0E8] text-sm">Active</span>
              </label>
              <button type="submit" className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-sm py-3.5 rounded-lg transition-colors mt-4">
                Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deleteCoupon}
        onClose={() => setDeleteCoupon(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon ${deleteCoupon?.code || ''}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
