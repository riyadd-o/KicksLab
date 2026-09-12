'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';

function AdminResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center py-12 px-4 font-sans">
        <div className="max-w-md w-full bg-[#141414] border border-[#2A2420] rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#F5F0E8]">Password Reset Complete</h2>
          <p className="text-xs text-[#A89880] leading-relaxed">
            Your Administrator password has been successfully updated. You can now log in using your new credentials.
          </p>
          <Link
            href="/admin/login"
            className="inline-block w-full bg-[#C9A96E] hover:bg-[#b09259] text-[#0D0D0D] font-bold tracking-widest uppercase text-xs py-3.5 rounded-lg transition-colors"
          >
            Log In Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#141414] border border-[#2A2420] rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-bold text-[#F5F0E8]">Set New Password</h2>
          <p className="text-xs text-[#C9A96E] font-semibold tracking-widest uppercase">
            Admin Account Credentials
          </p>
        </div>

        {!token && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-400 text-center">
            No valid reset token found in URL. Please check your reset link or request a new one.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-[#A89880] mb-2" htmlFor="newPassword">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 pl-10 pr-10 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors text-sm"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <Lock size={18} className="absolute left-3 top-3.5 text-[#5C5248]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A89880] hover:text-[#C9A96E] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A89880] mb-2" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 pl-10 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors text-sm"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <Lock size={18} className="absolute left-3 top-3.5 text-[#5C5248]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#C9A96E] hover:bg-[#b09259] text-[#0D0D0D] font-bold tracking-widest uppercase text-xs py-3.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-[#2A2420]">
          <Link
            href="/admin/login"
            className="text-xs text-[#A89880] hover:text-[#C9A96E] transition-colors"
          >
            Back to Admin Login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-[#C9A96E] text-xs">
        Loading password reset portal...
      </div>
    }>
      <AdminResetPasswordContent />
    </Suspense>
  );
}
