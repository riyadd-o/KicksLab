'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle, MapPin, Globe, Hash } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/lib/store';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    country: 'Ethiopia',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!formData.gender.trim()) {
      setError('Please select your gender.');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to create account.');
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
      setError('An error occurred during registration. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-block mb-4">
          <span className="text-[#F5F0E8] font-bold text-3xl tracking-tight">
            Kicks<span className="text-[#C9A96E]">Lab</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#F5F0E8]">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-[#A89880]">
          Join KicksLab for permanent order history, faster checkout, and exclusive benefits.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-[#141414] py-8 px-6 shadow-2xl rounded-2xl border border-[#2A2420] sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
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
                  name="signup_fullname"
                  autoComplete="off"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
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
                  name="signup_email"
                  autoComplete="off"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone Row */}
            <div>
              <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
                <input
                  type="tel"
                  required
                  name="signup_phone"
                  autoComplete="off"
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Gender & Country Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                  Gender *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
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

            {/* Passwords */}
            <div>
              <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
                <input
                  type="password"
                  required
                  name="signup_password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5248]" />
                <input
                  type="password"
                  required
                  name="signup_confirm_password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#C9A96E] hover:bg-[#D4CEB8] text-[#0D0D0D] font-bold py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#A89880]">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#C9A96E] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

