'use client';

import { useState, useEffect } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, CheckCircle, AlertCircle,
  Home, Building2, Users, Tag, Star, Loader2, X, Phone, User
} from 'lucide-react';

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  streetAddress: string;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt: string;
}

const LABEL_OPTIONS = [
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Office', label: 'Office', icon: Building2 },
  { value: 'Family', label: 'Family', icon: Users },
  { value: 'Other', label: 'Other', icon: Tag },
];

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    city: '',
    streetAddress: '',
    postalCode: '',
    isDefault: false,
  });

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/customer/addresses');
      if (!res.ok) throw new Error('Failed to load saved addresses.');
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      fullName: '',
      phone: '',
      city: '',
      streetAddress: '',
      postalCode: '',
      isDefault: addresses.length === 0,
    });
    setError('');
    setMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label || 'Home',
      fullName: addr.fullName,
      phone: addr.phone,
      city: addr.city,
      streetAddress: addr.streetAddress,
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault,
    });
    setError('');
    setMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City is required.');
      return;
    }
    if (!formData.streetAddress.trim()) {
      setError('Street Address is required.');
      return;
    }

    setActionLoading(true);

    try {
      if (editingAddress) {
        // PUT update
        const res = await fetch(`/api/customer/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to update address.');
        setMessage('Address updated successfully.');
      } else {
        // POST create
        const res = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to save address.');
        setMessage('New address added successfully.');
      }

      closeModal();
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setError('');
    setMessage('');
    setActionLoading(true);
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to set default.');
      setMessage('Default delivery address updated.');
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to set default.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    setMessage('');
    setActionLoading(true);
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete address.');
      setMessage('Address deleted successfully.');
      setDeletingId(null);
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    } finally {
      setActionLoading(false);
    }
  };

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'Office':
        return <Building2 size={13} className="text-[#C9A96E]" />;
      case 'Family':
        return <Users size={13} className="text-[#C9A96E]" />;
      case 'Other':
        return <Tag size={13} className="text-[#C9A96E]" />;
      default:
        return <Home size={13} className="text-[#C9A96E]" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-12 text-center text-[#A89880] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#C9A96E]" size={32} />
        <p className="text-xs uppercase tracking-wider font-semibold">Loading Saved Addresses...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-[#2A2420] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F5F0E8] flex items-center gap-2">
            <MapPin size={22} className="text-[#C9A96E]" />
            <span>Saved Addresses</span>
          </h1>
          <p className="text-xs text-[#A89880] mt-1">
            Manage your delivery locations and choose a default address for faster checkout.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shadow-md shrink-0"
        >
          <Plus size={16} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400 font-medium">{message}</p>
        </div>
      )}

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="py-14 text-center border-2 border-dashed border-[#2A2420] rounded-2xl p-8 space-y-4">
          <div className="w-14 h-14 bg-[#1F1C18] border border-[#C9A96E]/30 rounded-2xl flex items-center justify-center mx-auto text-[#C9A96E]">
            <MapPin size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F0E8]">No Saved Delivery Addresses</h3>
            <p className="text-xs text-[#A89880] max-w-sm mx-auto mt-1">
              You haven&apos;t added any delivery addresses yet. Save an address now to enjoy one-click checkout.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg"
          >
            <Plus size={15} />
            <span>Add Your First Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative bg-[#0D0D0D] border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                addr.isDefault
                  ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/5'
                  : 'border-[#2A2420] hover:border-[#3E352B]'
              }`}
            >
              <div>
                {/* Top row: Label + Default badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-[#1F1C18] border border-[#2A2420] px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#D4CEB8]">
                    {getLabelIcon(addr.label)}
                    <span>{addr.label}</span>
                  </span>

                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-[#C9A96E] text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                      <Star size={10} className="fill-[#C9A96E]" />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                {/* Recipient Details */}
                <div className="space-y-1.5 text-xs text-[#D4CEB8]">
                  <p className="text-sm font-bold text-[#F5F0E8] flex items-center gap-2">
                    <span>{addr.fullName}</span>
                  </p>
                  <p className="flex items-center gap-2 text-[#A89880]">
                    <Phone size={13} className="text-[#5C5248] shrink-0" />
                    <span>{addr.phone}</span>
                  </p>
                  <div className="pt-2 border-t border-[#1C1814] text-xs leading-relaxed">
                    <p className="text-[#F5F0E8] font-medium">{addr.streetAddress}</p>
                    <p className="text-[#A89880]">
                      {addr.city}
                      {addr.postalCode ? `, ${addr.postalCode}` : ''}
                    </p>
                    <p className="text-[#A89880] text-[11px]">Ethiopia 🇪🇹</p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-[#1C1814] flex items-center justify-between gap-2">
                <div>
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={actionLoading}
                      className="text-[11px] font-semibold text-[#A89880] hover:text-[#C9A96E] transition-colors inline-flex items-center gap-1"
                    >
                      <Star size={12} />
                      <span>Set as Default</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#C9A96E] font-medium inline-flex items-center gap-1">
                      <CheckCircle size={12} />
                      <span>Default Address</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(addr)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg bg-[#1F1C18] hover:bg-[#2A2420] text-[#D4CEB8] hover:text-[#F5F0E8] transition-colors border border-[#2A2420]"
                    title="Edit address"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => setDeletingId(addr.id)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
                    title="Delete address"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2420]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F0E8]">
                    {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                  </h3>
                  <p className="text-[11px] text-[#A89880]">
                    {editingAddress ? 'Update address information below' : 'Save this address for fast delivery checkout'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-[#A89880] hover:text-[#F5F0E8] p-1.5 rounded-lg hover:bg-[#1F1C18] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Address Label Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                  Address Label
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {LABEL_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formData.label === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, label: opt.value })}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#C9A96E]/15 border-[#C9A96E] text-[#C9A96E]'
                            : 'bg-[#0D0D0D] border-[#2A2420] text-[#A89880] hover:text-[#F5F0E8] hover:border-[#3E352B]'
                        }`}
                      >
                        <Icon size={14} className="mb-1" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                    Recipient Name *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5248]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5248]" />
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* City & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                    City / Region *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Addis Ababa"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl px-3 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                    Postal Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="1000"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl px-3 py-2.5 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-[11px] font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                  Street Address & House / Building *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Bole Sub-City, Woreda 03, House 450"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl px-3 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Default Address Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#0D0D0D] border-[#2A2420] text-[#C9A96E] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#C9A96E]"
                  />
                  <span className="text-xs text-[#D4CEB8] font-medium">
                    Set as default delivery address
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#2A2420] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-[#2A2420] text-[#A89880] hover:text-[#F5F0E8] hover:bg-[#1F1C18] text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  <span>{editingAddress ? 'Save Changes' : 'Add Address'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#F5F0E8]">Delete Address?</h3>
              <p className="text-xs text-[#A89880]">
                Are you sure you want to remove this delivery address? Existing past orders will not be affected.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-[#2A2420] text-[#A89880] hover:text-[#F5F0E8] hover:bg-[#1F1C18] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-md"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
