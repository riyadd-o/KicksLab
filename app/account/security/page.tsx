'use client';

import { useState } from 'react';
import { Lock, Shield, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function CustomerSecurityPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/customer/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to update password.');
      } else {
        setMessage('Password updated successfully.');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setError('An error occurred while updating password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="pb-6 border-b border-[#2A2420]">
        <h1 className="text-xl font-bold text-[#F5F0E8] flex items-center gap-2">
          <Shield size={22} className="text-[#C9A96E]" />
          <span>Security & Password</span>
        </h1>
        <p className="text-xs text-[#A89880]">Change your password to keep your KicksLab customer account secure</p>
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

      <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#2A2420] flex justify-start">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
