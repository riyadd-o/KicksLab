'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send password reset request.');
      } else {
        setMessage(data.message || 'If an account with that email exists, you will receive a password reset link.');
        setEmail('');
      }
    } catch (err) {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#141414] border border-[#2A2420] rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-bold text-[#F5F0E8]">Admin Password Reset</h2>
          <p className="text-xs text-[#C9A96E] font-semibold tracking-widest uppercase">
            Owner Account Security
          </p>
        </div>

        <p className="text-xs text-[#A89880] text-center leading-relaxed">
          Enter your registered Administrator email address. A secure password reset link will be sent to your inbox.
        </p>

        {/* Feedback Messages */}
        {message ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-400">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
            <p>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-[#A89880] mb-2" htmlFor="email">
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full bg-[#1A1A1A] border ${error ? 'border-red-500' : 'border-[#2A2420]'} rounded-lg px-4 py-3 pl-10 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors text-sm`}
                  placeholder="admin@example.com"
                  autoComplete="off"
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-[#5C5248]" />
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-400 font-medium">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A96E] hover:bg-[#b09259] text-[#0D0D0D] font-bold tracking-widest uppercase text-xs py-3.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="pt-2 text-center border-t border-[#2A2420]">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs text-[#A89880] hover:text-[#C9A96E] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Admin Login
          </Link>
        </div>

      </div>
    </div>
  );
}
