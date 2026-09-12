'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, X, ChevronDown, RotateCcw } from 'lucide-react';
import { getMockData } from '@/lib/mock-data';
import { Product } from '@/lib/products';
import ProductCard from '@/components/product/ProductCard';
import QuickViewModal from '@/components/product/QuickViewModal';

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Categories & Sizes lists
  const categories = ['Sneakers', 'Heels', 'Boots', 'Loafers', 'Sandals'];
  const allSizes = Array.from({ length: 11 }, (_, i) => 36 + i); // 36 to 46

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const searchQuery = searchParams.get('search') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedGender && selectedGender !== 'All') params.set('gender', selectedGender);
      if (searchQuery) params.set('search', searchQuery);
      if (maxPrice) params.set('maxPrice', maxPrice.toString());

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, selectedGender, searchQuery, maxPrice]);

  // Sync Category with Query Parameter on load / navigation
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams]);

  // Handle Size Toggle
  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedGender('All');
    setSelectedSizes([]);
    setMaxPrice(20000);
    setSortBy('featured');
    router.push('/shop');
  };

  const handleSearchChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set('search', val);
    } else {
      params.delete('search');
    }
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  // Filtering Logic (Client-side filtering for Sizes and Sorting, since server doesn't support sizes query directly yet)
  const filteredProducts = products
    .filter((product) => {
      // Size Filter
      if (selectedSizes.length > 0) {
        const hasSize = selectedSizes.some((size) => (product.sizes || []).some((s: any) => Number(s) === size));
        if (!hasSize) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sorting Logic
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') {
        const aNew = a.isNew ? 1 : 0;
        const bNew = b.isNew ? 1 : 0;
        return bNew - aNew;
      }
      // default: Featured (a.featured first)
      const aFeat = a.featured ? 1 : 0;
      const bFeat = b.featured ? 1 : 0;
      return bFeat - aFeat;
    });

  return (
    <div className="mx-auto max-w-7xl w-full px-4 pt-28 pb-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-[#2A2420] pb-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8]">
            Boutique Collection
          </h1>
          <p className="font-sans text-sm text-[#A89880] mt-1.5">
            Discover premium luxury footwear designed for absolute stride and elegance.
          </p>
        </div>

        {/* Sorting Dropdown & Count */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          <span className="font-sans text-xs text-[#A89880] whitespace-nowrap">
            Showing <span className="font-bold text-[#F5F0E8]">{filteredProducts.length}</span> of {products.length} products
          </span>
          {/* ... omitting unchanged lines for replacement_file_content ... */}

          <div className="relative flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-[#A89880] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0D0D0D] border border-[#2A2420] rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#F5F0E8] focus:outline-none focus:border-[#C9A96E] cursor-pointer pr-8 appearance-none relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23C9A96E\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem 1.25rem', backgroundRepeat: 'no-repeat' }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* ========================================================
            DESKTOP FILTERS (Visible on lg screens)
           ======================================================== */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#F5F0E8] flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#C9A96E]" />
              Filter Collection
            </h2>
            <button
              onClick={resetFilters}
              className="font-sans text-xs font-semibold text-[#C9A96E] hover:text-[#C9A96E]-hover transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Gender Filter */}
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">
              Gender
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'All', value: 'All' },
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setSelectedGender(g.value)}
                  className={`w-full text-left font-sans text-sm py-1.5 transition-colors ${
                    selectedGender === g.value
                      ? "text-[#C9A96E] font-bold" 
                      : "text-[#A89880] hover:text-[#F5F0E8]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="border-t border-[#2A2420] pt-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">
              Category
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left font-sans text-sm py-1 transition-colors ${
                  selectedCategory === null
                    ? 'text-[#C9A96E] font-bold'
                    : 'text-[#A89880] hover:text-[#F5F0E8]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left font-sans text-sm py-1 transition-colors flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'text-[#C9A96E] font-bold'
                      : 'text-[#A89880] hover:text-[#F5F0E8]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] text-[#A89880] bg-[#1A1A1A] border border-[#2A2420] px-1.5 py-0.5 rounded">
                    {products.filter((p) => p.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="border-t border-[#2A2420] pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8]">
                Max Price
              </h3>
              <span className="font-serif text-sm font-bold text-[#C9A96E]">
                ETB {maxPrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={20000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-gold bg-border h-1 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between font-sans text-[10px] text-[#A89880] mt-2">
              <span>ETB 5,000</span>
              <span>ETB 20,000</span>
            </div>
          </div>

          {/* Size Filter */}
          <div className="border-t border-[#2A2420] pt-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">
              Shoe Sizes
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {allSizes.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`flex aspect-square items-center justify-center rounded border font-sans text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]'
                        : 'border-[#2A2420] bg-[#141414] text-[#F5F0E8] hover:border-[#C9A96E] hover:text-[#C9A96E]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ========================================================
            MOBILE FILTER TRIGGER
           ======================================================== */}
        <div className="lg:hidden flex gap-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#2A2420] bg-[#141414] py-3 font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] active:bg-[#1A1A1A] transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#C9A96E]" />
            Filters & Refinement
          </button>
        </div>

        {/* ========================================================
            PRODUCT GRID
           ======================================================== */}
        <main className="flex-1 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, category, or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none rounded-lg px-4 py-3"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89880] hover:text-[#C9A96E] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 min-h-[60vh]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col overflow-hidden rounded-xl border border-[#2A2420] bg-[#141414] h-[300px]">
                  <div className="h-[180px] bg-[#1A1A1A]"></div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div className="h-3 w-14 bg-[#2A2420] rounded"></div>
                    <div className="h-4 w-3/4 bg-[#2A2420] rounded"></div>
                    <div className="h-3 w-1/3 bg-[#2A2420] rounded mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-[#141414] border border-[#2A2420] rounded-2xl p-8 min-h-[50vh]">
              <SlidersHorizontal className="h-10 w-10 text-[#A89880] mb-4" />
              <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">
                {searchQuery ? `No products found for "${searchQuery}"` : 'No products found matching your criteria'}
              </h3>
              <p className="font-sans text-sm text-[#A89880] mt-2 max-w-sm">
                Try a different search term, widen your price range, or browse all products.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-lg bg-[#C9A96E] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors duration-300"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 min-h-[60vh]">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickView={(p) => setQuickViewProduct(p)} 
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MOBILE FILTERS DRAWER (Visible on sm/md screens when triggered)
         ======================================================== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs">
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-[#141414] py-4 pb-12 shadow-xl border-l border-[#2A2420]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-[#2A2420]">
              <h2 className="font-serif text-lg font-bold text-[#F5F0E8]">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-2 text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-6 space-y-8">
              {/* Reset button */}
              <button
                onClick={() => {
                  resetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="w-full text-center rounded-lg border border-[#2A2420] bg-[#0D0D0D] py-2 font-sans text-xs font-semibold text-[#C9A96E] hover:bg-[#1A1A1A] transition-colors"
              >
                Reset All Filters
              </button>

              {/* Gender */}
              <div>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">Gender</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'All', value: 'All' },
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                  ].map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setSelectedGender(g.value)}
                      className={`w-full text-left font-sans text-sm py-1 transition-colors ${
                        selectedGender === g.value ? 'text-[#C9A96E] font-bold' : 'text-[#A89880]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">Category</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left font-sans text-sm py-1 transition-colors ${
                      selectedCategory === null ? 'text-[#C9A96E] font-bold' : 'text-[#A89880]'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left font-sans text-sm py-1 transition-colors flex items-center justify-between ${
                        selectedCategory === cat ? 'text-[#C9A96E] font-bold' : 'text-[#A89880]'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] text-[#A89880] bg-[#1A1A1A] border border-[#2A2420] px-1.5 py-0.5 rounded">
                        {products.filter((p) => p.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="border-t border-[#2A2420] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8]">Max Price</h3>
                  <span className="font-serif text-sm font-bold text-[#C9A96E]">ETB {maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={20000}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-gold bg-border h-1 rounded cursor-pointer"
                />
              </div>

              {/* Sizes */}
              <div className="border-t border-[#2A2420] pt-6">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-4">Shoe Sizes</h3>
                <div className="grid grid-cols-4 gap-2">
                  {allSizes.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`flex aspect-square items-center justify-center rounded border font-sans text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]'
                            : 'border-[#2A2420] bg-[#141414] text-[#F5F0E8]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto px-4 pt-4 border-t border-[#2A2420]">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-lg bg-[#C9A96E] py-3 text-center font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors"
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
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

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center py-32 bg-[#0D0D0D] text-[#F5F0E8]">
        <span className="font-serif text-xl font-bold tracking-widest animate-pulse text-[#C9A96E]">KicksLab</span>
        <span className="font-sans text-xs text-[#A89880] mt-1 uppercase tracking-wider">Loading Boutique Collection...</span>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
