'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Send } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { FaTiktok } from 'react-icons/fa';

const XIcon = ({ className = "" }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'KicksLab',
    storeEmail: 'KicksLab@gmail.com',
    storePhone: '09-91-28-95-26'
  });

  useEffect(() => {
    const saved = localStorage.getItem('kl_store_settings');
    if (saved) {
      try {
        setStoreSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {}
    }
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/staff') || pathname === '/login' || pathname === '/register') return null;

  return (
    <footer className="border-t border-[#2A2420] bg-[#141414] text-[#F5F0E8]">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col space-y-6">
            <Link href="/" className="group flex flex-col">
              <span className="font-sans text-2xl font-bold tracking-tight text-[#F5F0E8]">
                {storeSettings.storeName.replace('Lab', '')}<span className="text-[#C9A96E]">{storeSettings.storeName.includes('Lab') ? 'Lab' : ''}</span>
              </span>
              <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#A89880] -mt-1 pl-0.5">
                Luxury Footwear
              </span>
            </Link>
            <p className="text-sm font-sans text-[#A89880] leading-relaxed max-w-xs">
              Curating premium footwear with quality materials. Designed for those who walk in elegance.
            </p>
            <div className="flex flex-col space-y-1 mt-2 font-sans text-sm text-[#A89880]">
              <a href={`mailto:${storeSettings.storeEmail}`} className="hover:text-[#C9A96E] transition-colors">{storeSettings.storeEmail}</a>
              <a href={`tel:${storeSettings.storePhone}`} className="hover:text-[#C9A96E] transition-colors">{storeSettings.storePhone}</a>
            </div>
            <div className="flex space-x-3">
              <a href="#" className="p-2 rounded-full border border-[#2A2420] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors duration-300" aria-label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full border border-[#2A2420] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors duration-300" aria-label="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a href="https://t.me/KicksLab" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-[#2A2420] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors duration-300" aria-label="Telegram">
                <Send className="h-4 w-4" />
              </a>
              <a href="https://tiktok.com/@KicksLab" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-[#2A2420] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors duration-300" aria-label="TikTok">
                <FaTiktok className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-serif text-base font-semibold tracking-wider text-[#F5F0E8] uppercase mb-6">
              Quick Links
            </h3>
            <ul className="space-y-4">
              <li><Link href="/" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Home</Link></li>
              <li><Link href="/shop" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Shop All</Link></li>
              <li><Link href="/about" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">About Us</Link></li>
              <li><Link href="/our-story" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Our Story</Link></li>
              <li><Link href="/size-guide" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Size Guide</Link></li>
              <li><Link href="/contact" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Contact Us</Link></li>
              <li><Link href="/track-order" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Track Order</Link></li>
              <li><Link href="/promotions" className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors">Promotions</Link></li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h3 className="font-serif text-base font-semibold tracking-wider text-[#F5F0E8] uppercase mb-6">
              Shop Categories
            </h3>
            <ul className="space-y-4">
              {['Sneakers', 'Heels', 'Boots', 'Loafers', 'Sandals'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/shop?category=${cat}`}
                    className="font-sans text-sm text-[#A89880] hover:text-[#C9A96E] transition-colors duration-300"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter -> Register */}
          <div className="flex flex-col space-y-6">
            <h3 className="font-serif text-base font-semibold tracking-wider text-[#F5F0E8] uppercase mb-6">
              Join the Club
            </h3>
            <p className="text-sm font-sans text-[#A89880] leading-relaxed">
              Create an account to track your orders, save your wishlist, and get exclusive access to private sales.
            </p>
            <div className="flex flex-col space-y-3 pt-2">
              <Link
                href="/register"
                className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-sans text-xs font-semibold tracking-widest uppercase py-3.5 rounded-lg transition-colors duration-300 text-center flex items-center justify-center"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-[#2A2420] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-sans text-[#A89880]">
            &copy; {new Date().getFullYear()} {storeSettings.storeName}. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs font-sans text-[#A89880]">
            <Link href="/privacy" className="hover:text-[#C9A96E] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#C9A96E] transition-colors">Terms of Service</Link>
            <Link href="/shipping-returns" className="hover:text-[#C9A96E] transition-colors">Shipping & Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
