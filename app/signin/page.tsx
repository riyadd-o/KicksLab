'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/lib/store';

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data.user?.id) {
        useCartStore.getState().syncUser(data.user.id);
        useWishlistStore.getState().syncUser(data.user.id);
      }

      router.push('/account/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred during sign in. Please try again.');
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-[#A89880]">
          Access your orders, saved addresses, and profile details.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#141414] py-8 px-6 shadow-2xl rounded-2xl border border-[#2A2420] sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="on">
            <div>
              <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  name="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#C9A96E] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248] pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  required
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Signing In...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#A89880]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#C9A96E] font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
