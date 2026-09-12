'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, CheckCircle, AlertCircle, Save, Shield, Globe, ArrowRight } from 'lucide-react';

export default function CustomerProfilePage() {
  const [formData, setFormData] = useState({
    memberId: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    country: 'Ethiopia',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customer/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setFormData({
            memberId: data.user.memberId || 'N/A',
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            gender: data.user.gender || '',
            country: data.user.country || 'Ethiopia',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          country: formData.country,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to update profile.');
      } else {
        setMessage('Profile details updated successfully.');
      }
    } catch (err) {
      setError('An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#A89880]">Loading profile details...</div>;
  }

  return (
    <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header & Member ID Badge */}
      <div className="pb-6 border-b border-[#2A2420] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F5F0E8]">Profile Details</h1>
          <p className="text-xs text-[#A89880]">Manage your personal account credentials and contact info</p>
        </div>

        <div className="bg-[#1F1C18] border border-[#C9A96E]/40 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <Shield size={18} className="text-[#C9A96E]" />
          <div>
            <span className="text-[10px] text-[#A89880] uppercase tracking-wider block font-semibold">Member ID</span>
            <span className="text-sm font-extrabold text-[#C9A96E] tracking-widest">{formData.memberId}</span>
          </div>
        </div>
      </div>

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

      {/* Delivery Addresses Info Card */}
      <div className="bg-[#1F1C18] border border-[#2A2420] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E] shrink-0 mt-0.5">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F0E8]">Delivery Addresses</h3>
            <p className="text-xs text-[#A89880] mt-0.5">
              Manage your delivery locations and default shipping address in the dedicated Saved Addresses tab.
            </p>
          </div>
        </div>
        <Link
          href="/account/addresses"
          className="bg-[#141414] hover:bg-[#26211C] border border-[#C9A96E]/40 text-[#C9A96E] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-center"
        >
          <span>Manage Addresses</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Account Info Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
              <input
                type="tel"
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Country (Read-Only) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
              Country
            </label>
            <div className="relative">
              <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9A96E]" />
              <input
                type="text"
                readOnly
                value={formData.country}
                className="w-full bg-[#1A1816] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#C9A96E] font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#2A2420] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
