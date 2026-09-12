'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Box, Tags, UserCheck,
  Ticket, Megaphone, BarChart3, RotateCcw, Settings, LogOut, Menu, X, Truck, Star
} from 'lucide-react';

const ADMIN_NAV = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Products', href: '/admin/products', icon: Box },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Customers', href: '/admin/customers', icon: UserCheck },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Promotions', href: '/admin/promotions', icon: Megaphone },
  { name: 'Shipping Settings', href: '/admin/shipping', icon: Truck },
  { name: 'Sales Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isPublicAdminRoute =
    pathname?.startsWith('/admin/login') ||
    pathname?.startsWith('/admin/forgot-password') ||
    pathname?.startsWith('/admin/reset-password');

  useEffect(() => {
    if (isPublicAdminRoute) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/auth/me')
      .then((res) => {
        if (!res.ok) {
          window.location.href = '/admin/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setAdmin(data.user);
        } else if (!isPublicAdminRoute) {
          window.location.href = '/admin/login';
        }
      })
      .catch(() => {
        if (!isPublicAdminRoute) {
          window.location.href = '/admin/login';
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pathname, isPublicAdminRoute]);

  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex font-sans text-[#F5F0E8]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 
                         bg-[#0A0A0A] border-r border-[#2A2420] z-50 
                         transform transition-transform duration-300 flex flex-col 
                         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <Link href="/admin" className="font-serif text-2xl font-bold text-[#C9A96E]">
            KicksLab
            <span className="text-xs text-[#A89880] ml-2 font-sans tracking-widest uppercase">
              Admin
            </span>
          </Link>
          <button className="md:hidden text-[#F5F0E8]" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg 
                            transition-colors text-sm ${isActive
                    ? 'bg-[#1A1A1A] text-[#C9A96E]'
                    : 'text-[#A89880] hover:bg-[#141414] hover:text-[#F5F0E8]'
                  }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2A2420]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left 
                       text-red-400 hover:bg-[#141414] rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#0A0A0A] border-b border-[#2A2420] 
                           flex items-center justify-between px-4 sm:px-6 
                           sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#F5F0E8]" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="font-serif text-xl font-bold hidden sm:block">
              {ADMIN_NAV.find(n =>
                pathname === n.href ||
                (n.href !== '/admin' && pathname.startsWith(n.href))
              )?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{admin?.name}</p>
              <p className="text-xs text-[#C9A96E] uppercase tracking-widest">Admin</p>
            </div>
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#C9A96E] shrink-0 bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-[#C9A96E] text-sm font-bold">
                {admin?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
