'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated as Admin
    fetch('/api/admin/auth/me')
      .then((res) => {
        if (res.ok) {
          window.location.href = '/admin';
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};

      if (!res.ok) {
        setError(data.error || 'Invalid admin credentials.');
        setLoading(false);
        return;
      }
      
      window.location.href = '/admin';
    } catch (err) {
      console.error("Admin login error:", err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#141414] border border-[#2A2420] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#F5F0E8]">KicksLab Admin</h2>
          <p className="mt-2 text-sm text-[#C9A96E] font-semibold tracking-widest uppercase">Owner Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-[#A89880] mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors text-sm"
              placeholder="email@example.com"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A89880] mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 pr-10 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none transition-colors text-sm"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A89880] hover:text-[#C9A96E] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/admin/forgot-password" className="text-xs font-semibold text-[#C9A96E] hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-sm py-3.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
