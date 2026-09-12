'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to request password reset.');
      } else {
        setMessage(data.message || 'Password reset link sent to your email.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <span className="text-[#F5F0E8] font-bold text-3xl tracking-tight">
            Kicks<span className="text-[#C9A96E]">Lab</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#F5F0E8]">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-[#A89880]">
          Enter your email address and we&apos;ll send you a password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#141414] py-8 px-6 shadow-2xl rounded-2xl border border-[#2A2420] sm:px-10">
          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400 font-medium">{message}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248] pointer-events-none" />
                <input
                  type="email"
                  required
                  name="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full bg-[#0D0D0D] border rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:outline-none transition-colors ${
                    error ? 'border-red-500/80 focus:border-red-500' : 'border-[#2A2420] focus:border-[#C9A96E]'
                  }`}
                />
              </div>
              {error && (
                <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/signin" className="inline-flex items-center gap-1.5 text-xs text-[#A89880] hover:text-[#C9A96E] transition-colors">
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
