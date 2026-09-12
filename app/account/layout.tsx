'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, User, Shield, MessageSquare, LogOut, Loader2, Star, MapPin } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/lib/store';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setCustomer(data.user);
        } else {
          router.push('/signin');
        }
      })
      .catch(() => {
        router.push('/signin');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      useCartStore.getState().detachUser();
      useWishlistStore.getState().detachUser();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/signin');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-[#F5F0E8]">
        <Loader2 className="animate-spin text-[#C9A96E]" size={36} />
      </div>
    );
  }

  if (!customer) return null;

  const navItems = [
    { label: 'Overview', href: '/account/dashboard', icon: LayoutDashboard },
    { label: 'My Orders', href: '/account/orders', icon: ShoppingBag },
    { label: 'My Reviews', href: '/account/reviews', icon: Star },
    { label: 'Profile Details', href: '/account/profile', icon: User },
    { label: 'Saved Addresses', href: '/account/addresses', icon: MapPin },
    { label: 'Security & Password', href: '/account/security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 shadow-xl sticky top-8">
            <div className="mb-6 pb-6 border-b border-[#2A2420]">
              <p className="text-xs text-[#A89880] uppercase tracking-wider font-semibold">Logged in as</p>
              <h3 className="text-base font-bold text-[#F5F0E8] truncate mt-1">{customer.name}</h3>
              <p className="text-xs text-[#A89880] truncate">{customer.email}</p>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/account/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-[#C9A96E] text-[#0D0D0D] shadow-md font-bold'
                        : 'text-[#A89880] hover:text-[#F5F0E8] hover:bg-[#1F1C18]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-[#2A2420]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 transition-colors"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
