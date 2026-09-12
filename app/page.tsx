'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, RefreshCw, Truck } from 'lucide-react';
import { Product } from '@/lib/products';
import ProductCard from '@/components/product/ProductCard';
import CategoryCard from '@/components/product/CategoryCard';
import TestimonialCard from '@/components/product/TestimonialCard';
import LimitedDropSection from '@/components/product/LimitedDropSection';
import QuickViewModal from '@/components/product/QuickViewModal';
import { motion } from 'framer-motion';

interface FeaturedReview {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  quote: string;
  location: string | null;
  productName: string | null;
  productSlug: string | null;
  createdAt: string;
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#EAEAEA] bg-white shadow-xs">
      <div className="h-[140px] sm:h-[155px] md:h-[165px] bg-[#F4F4F4] animate-pulse w-full" />
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="h-3 bg-[#EAEAEA] rounded w-4/5 animate-pulse" />
        <div className="h-3 bg-[#F0F0F0] rounded w-1/2 animate-pulse" />
        <div className="h-2.5 bg-[#F5F5F5] rounded w-1/3 animate-pulse" />
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeDrop, setActiveDrop] = useState<any | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Active Limited Drop
    fetch('/api/limited-drops/active')
      .then(async (r) => (r.ok ? r.json() : { drop: null }))
      .then((data) => setActiveDrop(data.drop || null))
      .catch((e) => console.error("Error fetching active drop", e));

    // Dynamic Approved Featured Reviews for Boutique Reviews section
    fetch('/api/reviews/featured')
      .then(async (r) => (r.ok ? r.json() : { reviews: [] }))
      .then((data) => setFeaturedReviews(Array.isArray(data.reviews) ? data.reviews : []))
      .catch((e) => console.error("Error fetching featured reviews", e));

    // Fetch all collections in parallel for synchronized loading
    Promise.all([
      fetch('/api/products?featured=true').then(async (r) => (r.ok ? r.json() : [])),
      fetch('/api/products?topSelling=true').then(async (r) => (r.ok ? r.json() : [])),
      fetch('/api/products?onSale=true').then(async (r) => (r.ok ? r.json() : [])),
      fetch('/api/products').then(async (r) => (r.ok ? r.json() : [])),
    ])
      .then(([featuredData, topSellingData, saleData, allData]) => {
        const all: Product[] = Array.isArray(allData) ? allData : [];
        setAllProducts(all);

        const feat = Array.isArray(featuredData) && featuredData.length > 0 ? featuredData : all.slice(0, 6);
        const top = Array.isArray(topSellingData) && topSellingData.length > 0 ? topSellingData : all.slice(0, 6);
        const sale = Array.isArray(saleData) && saleData.length > 0 ? saleData : all.filter(p => p.onSale);

        setFeaturedProducts(feat.slice(0, 6));
        setTopSellingProducts(top.slice(0, 6));
        setSaleProducts(sale.slice(0, 6));
      })
      .catch((e) => {
        console.error("Error fetching homepage products", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Category list dynamically mapped from actual admin-added products
  const categoryNames = ['Sneakers', 'Heels', 'Boots', 'Loafers', 'Sandals'];
  const categoriesList = categoryNames.map((name) => {
    const categoryProducts = allProducts.filter(
      (p) => (p.category || '').trim().toLowerCase() === name.toLowerCase()
    );
    const repImage = categoryProducts[0]?.images?.[0] || '/images/hero-sneaker.jpg';
    return {
      name,
      count: categoryProducts.length,
      image: repImage,
    };
  });

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 🖼️ Hero Section */}
      <section className="relative w-full h-[270px] sm:h-[300px] lg:h-[330px] overflow-hidden bg-[#0D0D0D]">
        {/* Footwear Imagery Background */}
        <Image
          src="/images/hero-sneaker.jpg"
          alt="KicksLab Premium Footwear"
          fill
          sizes="100vw"
          className="object-cover object-right md:object-center"
          priority
        />

        {/* Ambient Dark Gradient on Left for Crisp Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 md:via-black/45 to-transparent" />

        {/* Hero Content (Minimal, Clean & Product-Led) */}
        <div className="relative z-10 mx-auto max-w-7xl h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16">
          {/* Eyebrow / Line */}
          <div className="flex items-center gap-2.5 mb-1.5 sm:mb-2">
            <span className="w-6 h-[1.5px] bg-[#C9A96E]" />
            <span className="font-sans text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold text-[#C9A96E]">
              NEW SEASON
            </span>
          </div>

          {/* Main Marketing Headline */}
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#F5F0E8] tracking-tight leading-tight mb-1.5 sm:mb-2 max-w-xl">
            Own Your Next Step.
          </h1>

          {/* Supporting Text */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-[#D4CEB8] max-w-md leading-relaxed mb-3.5 sm:mb-4">
            Discover premium sneakers for every occasion.
          </p>

          {/* CTA Button */}
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#C9A96E] hover:bg-[#b8955b] text-[#0D0D0D] font-sans font-bold text-xs uppercase tracking-wider px-5 py-2.5 sm:px-6 sm:py-3 shadow-md shadow-[#C9A96E]/20 transition-all duration-300 hover:scale-105"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Slider Dash Indicators (Bottom Right, matching reference image) */}
        <div className="absolute bottom-4 right-6 sm:right-12 flex items-center gap-2 z-20 pointer-events-none">
          <span className="w-6 h-1 bg-[#F5F0E8] rounded-full shadow-sm" />
          <span className="w-3 h-1 bg-[#F5F0E8]/35 rounded-full" />
        </div>
      </section>

      {/* ⚡ Compact Limited Drop / Flash Sale Promotion (Directly under Hero) */}
      <LimitedDropSection drop={activeDrop} onQuickView={setQuickViewProduct} />

      {/* 1. Featured Products Section (White surface matching reference) */}
      <section id="featured" className="bg-white pt-2 pb-6 sm:pb-8 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <h2 className="flex items-center gap-2 font-serif text-lg sm:text-xl md:text-2xl font-bold text-[#111111]">
              <span className="text-[#E5A93C] text-lg sm:text-xl">★</span>
              <span>Featured Products</span>
            </h2>
            <Link
              href="/shop"
              className="group flex items-center gap-1 font-sans text-xs font-medium text-[#777777] hover:text-[#C9A96E] transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 6-column grid of featured products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5 lg:gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="light"
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* 2. Top Selling Products Section (White surface matching reference) */}
      <section id="top-selling" className="bg-white py-6 sm:py-8 border-t border-[#EEEEEE] scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <h2 className="flex items-center gap-2 font-serif text-lg sm:text-xl md:text-2xl font-bold text-[#111111]">
              <span className="text-lg sm:text-xl">🔥</span>
              <span>Top Selling Products</span>
            </h2>
            <Link
              href="/shop?sort=top-selling"
              className="group flex items-center gap-1 font-sans text-xs font-medium text-[#777777] hover:text-[#C9A96E] transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 6-column grid of top selling products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5 lg:gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : topSellingProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="light"
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* 3. On Sale Products Section (White surface matching reference) */}
      <section id="on-sale" className="bg-white py-6 sm:py-8 border-t border-[#EEEEEE] scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <h2 className="flex items-center gap-2 font-serif text-lg sm:text-xl md:text-2xl font-bold text-[#111111]">
              <span className="text-lg sm:text-xl">🏷️</span>
              <span>On Sale</span>
            </h2>
            <Link
              href="/shop?filter=sale"
              className="group flex items-center gap-1 font-sans text-xs font-medium text-[#777777] hover:text-[#C9A96E] transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 6-column grid of on sale products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5 lg:gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : saleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="light"
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 sm:py-24 bg-[#0D0D0D]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
              Curated Silhouette
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8] mt-2">
              Browse Categories
            </h2>
            <div className="h-[2px] w-12 bg-[#C9A96E] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
            {categoriesList.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <CategoryCard name={cat.name} image={cat.image} count={cat.count} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Values / Benefits Section */}
      <section className="bg-[#141414] border-y border-[#2A2420] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: Sparkles, title: 'Premium Materials', desc: 'Quality you can feel' },
              { icon: ShieldCheck, title: 'Lasting Quality', desc: 'Built to endure every stride' },
              { icon: Truck, title: 'Complimentary Shipping', desc: 'Free delivery on select orders' },
              { icon: RefreshCw, title: 'Easy Exchanges', desc: '30-day returns period' },
            ].map((value, i) => (
              <div key={i} className="flex flex-col items-center text-center p-2">
                <div className="rounded-full bg-[#0D0D0D] border border-[#2A2420] p-3 text-[#C9A96E] mb-3.5">
                  <value.icon className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h4 className="font-serif text-sm font-bold text-[#F5F0E8]">{value.title}</h4>
                <p className="font-sans text-xs text-[#A89880] mt-1">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial / Story Section */}
      <section className="relative py-24 sm:py-32 bg-[#0D0D0D] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Story Image */}
            <div className="lg:col-span-6 w-full max-w-md lg:max-w-none mx-auto">
              <div className="relative w-full h-[400px] bg-[#141414] rounded-xl 
                              border border-[#2A2420] flex items-center justify-center overflow-hidden shadow-2xl">
                <Image
                  src="/images/brand-story.jpg"
                  alt="KicksLab Artisanal Legacy"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Story Text */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                Our Sartorial Legacy
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8] leading-tight">
                Premium Quality, Worn With Pride
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#A89880] leading-relaxed">
                At KicksLab, we believe a shoe is more than just footwear — it is a statement. We curate every pair with care, selecting only the finest styles built for comfort, durability, and elegance.
              </p>
              <p className="font-sans text-sm sm:text-base text-[#A89880] leading-relaxed">
                From the streets of Dire Dawa to the heart of Addis Ababa, KicksLab brings you footwear that matches your pace and your pride. Quality you can feel with every step.
              </p>
              <div className="pt-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] hover:bg-[#b8955b] text-[#0D0D0D] font-sans text-xs font-bold uppercase tracking-widest px-8 py-3.5 transition-colors duration-300"
                >
                  Shop the Collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Specifications */}
      <section className="py-16 bg-[#1A1A1A] border-t border-[#2A2420]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#F5F0E8] mb-2">Our Specifications</h2>
              <p className="font-sans text-sm text-[#A89880] max-w-md mx-auto md:mx-0">
                We offer top-tier service and convenience to ensure your shopping experience is smooth, secure and completely hassle-free.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <RefreshCw className="h-6 w-6 text-[#C9A96E] mx-auto md:mx-0 mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">7 Days easy Return</h3>
                <p className="font-sans text-sm text-[#A89880] mt-1">Change your mind? No worries. Return any item within 7 days.</p>
              </div>
              <div>
                <ShieldCheck className="h-6 w-6 text-[#C9A96E] mx-auto md:mx-0 mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">24/7 Customer Support</h3>
                <p className="font-sans text-sm text-[#A89880] mt-1">We're here for you. Get expert help with our customer support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Boutique Reviews Section (Dynamically fetched approved & featured reviews from DB) */}
      {featuredReviews.length > 0 && (
        <section className="py-20 sm:py-24 bg-[#141414] border-t border-[#2A2420]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                Verified Comfort
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8] mt-2">
                Boutique Reviews
              </h2>
              <div className="h-[2px] w-12 bg-[#C9A96E] mx-auto mt-4" />
            </div>

            <div
              className={`grid grid-cols-1 gap-8 ${
                featuredReviews.length === 1
                  ? 'max-w-md mx-auto'
                  : featuredReviews.length === 2
                  ? 'md:grid-cols-2 max-w-4xl mx-auto'
                  : 'md:grid-cols-3'
              }`}
            >
              {featuredReviews.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  <TestimonialCard
                    name={t.name}
                    location={t.location}
                    quote={t.quote}
                    rating={t.rating}
                    title={t.title}
                    productName={t.productName}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
