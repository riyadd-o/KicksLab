'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Heart, Menu, X, Search, User, Loader2 } from 'lucide-react';
import { useCartStore, useWishlistStore, useUiStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import BlackFridayBanner from './BlackFridayBanner';

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [customerUser, setCustomerUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  const cart = useCartStore((state) => state.cart);
  const wishlist = useWishlistStore((state) => state.wishlist);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const setWishlistOpen = useUiStore((state) => state.setWishlistOpen);

  useEffect(() => {
    setMounted(true);
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setCustomerUser(data.user);
        } else {
          setCustomerUser(null);
        }
      })
      .catch(() => {
        setCustomerUser(null);
      });
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/shop') {
      setSearchQuery(searchParams.get('search') || '');
    } else {
      setShowDropdown(false);
    }
  }, [pathname, searchParams]);

  // Debounced search query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setShowDropdown(false);
  }, [pathname]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setShowDropdown(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      setShowDropdown(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const handleResultClick = (product: any) => {
    setShowDropdown(false);
    setMobileSearchOpen(false);
    router.push(`/shop/${product.slug}`);
  };

  // Shopping-focused navigation links with smooth scroll anchors and icons
  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Featured', href: '/#featured', icon: '⭐' },
    { label: 'Top Selling', href: '/#top-selling', icon: '🔥' },
    { label: 'On Sale', href: '/#on-sale', icon: '🏷️' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/') {
      if (pathname === '/') {
        e.preventDefault();
        setMobileMenuOpen(false);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.history.pushState(null, '', '/');
        }, 80);
      } else {
        setMobileMenuOpen(false);
      }
      return;
    }

    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (pathname === '/') {
        e.preventDefault();
        setMobileMenuOpen(false);
        // Timeout ensures mobile menu collapse animation does not cancel or displace smooth scroll
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            const navbarHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - navbarHeight;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
            window.history.pushState(null, '', href);
          }
        }, 100);
      } else {
        setMobileMenuOpen(false);
      }
      return;
    }

    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined' && window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - navbarHeight;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) return null;

  return (
    <header className="relative z-40 bg-transparent flex flex-col">
      {/* ─── SINGLE TOP ROW ────────────────────────────────────────────────────────── */}
      {/* Left: Compact Black Friday Banner (if active) | Right: Track Order & Sign In */}
      <div className="bg-[#0D0D0D] border-b border-[#2A2420]/40 text-[#F5F0E8] text-xs py-1.5 sm:py-2 px-3 sm:px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left/Center: Compact Promotional Banner (renders null if inactive) */}
          <div className="flex items-center min-w-0 flex-1 sm:flex-initial">
            <BlackFridayBanner />
          </div>

          {/* Right: Customer Auth / Track order actions */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-auto text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
            <Link
              href="/track-order"
              className="text-[#A89880] hover:text-[#C9A96E] transition-colors inline-flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Track Order</span>
            </Link>

            {customerUser ? (
              <Link
                href="/account/dashboard"
                className="text-[#F5F0E8] hover:text-[#C9A96E] transition-colors hidden sm:inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <User size={13} className="text-[#C9A96E]" />
                <span>Account</span>
              </Link>
            ) : (
              <Link
                href="/signin"
                className="text-[#A89880] hover:text-[#C9A96E] transition-colors hidden sm:inline-flex cursor-pointer whitespace-nowrap"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* ─── MAIN LUXURY HEADER ROW ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F0E8] group-hover:text-[#C9A96E] transition-colors duration-300">
            Kicks<span className="text-[#C9A96E]">Lab</span>
          </span>
        </Link>

        {/* Desktop Navigation Links - Shifted right with balanced spacing */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10 ml-8 lg:ml-12 xl:ml-16">
          {navLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/' && (!mounted || !window.location.hash)
              : pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.12em] font-semibold transition-colors duration-300 relative group whitespace-nowrap ${
                  isActive ? 'text-[#C9A96E]' : 'text-[#F5F0E8] hover:text-[#C9A96E]'
                }`}
              >
                {link.icon && <span className="text-[13px] leading-none">{link.icon}</span>}
                <span>{link.label}</span>
                <span className={`absolute -bottom-1.5 left-0 h-[1.5px] bg-[#C9A96E] transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            );
          })}
        </div>

        {/* Right: Search + Icons */}
        <div className="flex items-center gap-3.5 sm:gap-5 shrink-0 ml-auto">
          {/* Desktop Search Bar with Live Dropdown */}
          <div ref={searchContainerRef} className="hidden md:block relative">
            <div className="flex items-center bg-[#1A1A1A] border border-[#2A2420] rounded-full px-3.5 py-1.5 w-[160px] lg:w-[220px] focus-within:w-[260px] focus-within:border-[#C9A96E] transition-all duration-200">
              <Search size={15} className="text-[#5C5248] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="bg-transparent text-[#F5F0E8] text-xs placeholder-[#666666] outline-none w-full"
                autoComplete="off"
              />
              {isSearching ? (
                <Loader2 size={13} className="text-[#C9A96E] animate-spin shrink-0" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                  className="text-[#666666] hover:text-[#F5F0E8] text-xs shrink-0"
                >
                  &times;
                </button>
              ) : null}
            </div>

            {/* Desktop Autocomplete Results Dropdown */}
            {showDropdown && searchQuery.trim() && (
              <div className="absolute top-full mt-2 right-0 w-[300px] sm:w-[340px] bg-[#141414] border border-[#2A2420] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-md">
                {searchResults.length > 0 ? (
                  <div>
                    <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#A89880] border-b border-[#2A2420]/60 flex justify-between items-center">
                      <span>Products ({searchResults.length})</span>
                      <span className="text-[#C9A96E]">Instant Matches</span>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto divide-y divide-[#2A2420]/40">
                      {searchResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleResultClick(prod)}
                          className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#1F1C18] cursor-pointer transition-colors group"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2420] shrink-0">
                            <Image
                              src={prod.images?.[0] || prod.image || '/images/placeholder.jpg'}
                              alt={prod.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#F5F0E8] group-hover:text-[#C9A96E] truncate transition-colors">
                              {prod.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#A89880] uppercase tracking-wider">{prod.category}</span>
                              <span className="text-[10px] text-[#2A2420]">&bull;</span>
                              <span className="text-xs font-bold text-[#C9A96E]">ETB {prod.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 border-t border-[#2A2420] bg-[#0D0D0D]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDropdown(false);
                          router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                        }}
                        className="w-full text-center text-xs font-bold text-[#C9A96E] hover:text-[#b8955b] py-1.5 transition-colors"
                      >
                        View all results in shop &rarr;
                      </button>
                    </div>
                  </div>
                ) : !isSearching ? (
                  <div className="p-5 text-center">
                    <p className="text-xs text-[#A89880]">No products found matching &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/shop');
                      }}
                      className="mt-2 text-xs font-bold text-[#C9A96E] hover:underline"
                    >
                      Browse full collection
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Mobile Search Toggle Button */}
          <button 
            className="md:hidden p-1.5 text-[#F5F0E8] hover:text-[#C9A96E] transition-colors"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => setWishlistOpen(true)}
            className="relative p-1.5 hover:text-[#C9A96E] text-[#F5F0E8] transition-colors duration-300"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5 stroke-[1.5]" />
            {mounted && wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A96E] text-[9px] font-bold text-[#0D0D0D]">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-1.5 hover:text-[#C9A96E] text-[#F5F0E8] transition-colors duration-300"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A96E] text-[9px] font-bold text-[#0D0D0D]">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 md:hidden text-[#F5F0E8] hover:text-[#C9A96E] transition-colors duration-300"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expand with Live Autocomplete */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            ref={mobileSearchContainerRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden px-4 pb-3"
          >
            <div className="relative">
              <div className="flex items-center bg-[#1A1A1A] border border-[#2A2420] rounded-full px-4 py-2.5 w-full focus-within:border-[#C9A96E] transition-colors">
                <Search size={16} className="text-[#5C5248] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className="bg-transparent text-[#F5F0E8] text-sm placeholder-[#666666] outline-none w-full"
                  autoFocus
                />
                {isSearching && <Loader2 size={15} className="text-[#C9A96E] animate-spin shrink-0" />}
              </div>

              {/* Mobile Autocomplete Results Dropdown */}
              {showDropdown && searchQuery.trim() && (
                <div className="mt-2 w-full bg-[#141414] border border-[#2A2420] rounded-2xl shadow-2xl overflow-hidden py-2 z-50">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-[#2A2420]/40 max-h-[280px] overflow-y-auto">
                      {searchResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleResultClick(prod)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1F1C18] cursor-pointer"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2420] shrink-0">
                            <Image
                              src={prod.images?.[0] || prod.image || '/images/placeholder.jpg'}
                              alt={prod.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#F5F0E8] truncate">{prod.name}</p>
                            <p className="text-xs font-bold text-[#C9A96E] mt-0.5">ETB {prod.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isSearching ? (
                    <div className="p-4 text-center text-xs text-[#A89880]">
                      No products found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#141414] border-t border-[#2A2420] mt-2 rounded-xl p-4 space-y-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center gap-2 text-sm uppercase tracking-wider font-semibold text-[#F5F0E8] hover:text-[#C9A96E] py-1.5 transition-colors"
              >
                {link.icon && <span>{link.icon}</span>}
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="pt-3 border-t border-[#2A2420] flex flex-col gap-2.5 text-xs">
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#F5F0E8] hover:text-[#C9A96E] flex items-center gap-2 py-1"
              >
                <span>📦</span>
                <span>Track Order</span>
              </Link>

              {customerUser ? (
                <Link
                  href="/account/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F5F0E8] hover:text-[#C9A96E] flex items-center gap-2 py-1"
                >
                  <User size={14} className="text-[#C9A96E]" />
                  <span>Account</span>
                </Link>
              ) : (
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#A89880] hover:text-[#C9A96E] flex items-center gap-2 py-1"
                >
                  <User size={14} className="text-[#C9A96E]" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={
      <header className="relative z-40 bg-transparent py-5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-[#F5F0E8] font-bold text-xl">KicksLab</div>
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  );
}
