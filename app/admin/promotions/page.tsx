'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Search,
  X,
  Check,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

const DEFAULT_BANNER_CONFIG = {
  bannerActive: true,
  discountPercentage: 50,
  couponCode: 'BLACKFRIDAY',
  bannerText: '🖤 BLACK FRIDAY — UP TO 50% OFF SITEWIDE',
  buttonText: 'SHOP NOW',
  bannerLink: '/shop',
};

interface ProductOption {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
}

interface LimitedDropItem {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  bannerImage: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'INACTIVE';
  productCount: number;
  products?: { id: string; productId: string; product: ProductOption }[];
}

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'drops' | 'banner'>('drops');

  // ----------------------------------------------------
  // Limited Drops State
  // ----------------------------------------------------
  const [drops, setDrops] = useState<LimitedDropItem[]>([]);
  const [dropsLoading, setDropsLoading] = useState(true);
  const [dropsError, setDropsError] = useState('');
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDropId, setEditingDropId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDiscountType, setModalDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [modalDiscountValue, setModalDiscountValue] = useState<number | string>(20);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalProductIds, setModalProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ----------------------------------------------------
  // Black Friday Banner State (Preserved)
  // ----------------------------------------------------
  const [bannerActive, setBannerActive] = useState(DEFAULT_BANNER_CONFIG.bannerActive);
  const [discountPercentage, setDiscountPercentage] = useState<number | string>(DEFAULT_BANNER_CONFIG.discountPercentage);
  const [couponCode, setCouponCode] = useState(DEFAULT_BANNER_CONFIG.couponCode);
  const [bannerText, setBannerText] = useState(DEFAULT_BANNER_CONFIG.bannerText);
  const [buttonText, setButtonText] = useState(DEFAULT_BANNER_CONFIG.buttonText);
  const [bannerLink, setBannerLink] = useState(DEFAULT_BANNER_CONFIG.bannerLink);

  const [validationError, setValidationError] = useState('');
  const [bannerApiError, setBannerApiError] = useState('');
  const [bannerSaved, setBannerSaved] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);

  // Fetch Drops
  const fetchDrops = async () => {
    try {
      setDropsLoading(true);
      const res = await fetch(`/api/admin/limited-drops?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDrops(data.drops || []);
      } else {
        setDropsError('Failed to load limited drops.');
      }
    } catch (err: any) {
      setDropsError(err?.message || 'Error loading drops');
    } finally {
      setDropsLoading(false);
    }
  };

  // Fetch Products for Drop Selection
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setAllProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load products for drop creation', e);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch Banner Configuration
  const fetchBannerPromotions = async () => {
    try {
      setBannerLoading(true);
      const res = await fetch(`/api/promotions?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const config = await res.json();
        setBannerActive(config.bannerActive ?? DEFAULT_BANNER_CONFIG.bannerActive);
        const perc = config.discountPercentage ?? DEFAULT_BANNER_CONFIG.discountPercentage;
        setDiscountPercentage(perc);
        setCouponCode(config.couponCode ?? DEFAULT_BANNER_CONFIG.couponCode);
        setBannerText(config.bannerText ?? `🖤 BLACK FRIDAY — UP TO ${perc}% OFF SITEWIDE`);
        setButtonText(config.buttonText ?? DEFAULT_BANNER_CONFIG.buttonText);
        setBannerLink(config.bannerLink ?? DEFAULT_BANNER_CONFIG.bannerLink);
      }
    } catch (err) {
      console.error('Failed to load banner promotions:', err);
    } finally {
      setBannerLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
    fetchProducts();
    fetchBannerPromotions();
  }, []);

  // Format date helper for datetime-local
  const toLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const openCreateModal = () => {
    setEditingDropId(null);
    setModalTitle('');
    setModalDescription('');
    setModalDiscountType('percentage');
    setModalDiscountValue(20);

    const now = new Date();
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setModalStartDate(toLocalISOString(now));
    setModalEndDate(toLocalISOString(oneWeekLater));
    setModalIsActive(true);
    setModalProductIds([]);
    setProductSearch('');
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (drop: LimitedDropItem) => {
    setEditingDropId(drop.id);
    setModalTitle(drop.title);
    setModalDescription(drop.description || '');
    setModalDiscountType((drop.discountType as any) || 'percentage');
    setModalDiscountValue(drop.discountValue);
    setModalStartDate(toLocalISOString(new Date(drop.startDate)));
    setModalEndDate(toLocalISOString(new Date(drop.endDate)));
    setModalIsActive(drop.isActive);
    setProductSearch('');
    setModalError('');

    // Fetch drop with full product details
    try {
      const res = await fetch(`/api/admin/limited-drops/${drop.id}`);
      if (res.ok) {
        const fullDrop = await res.json();
        const pIds = fullDrop.products?.map((p: any) => p.productId) || [];
        setModalProductIds(pIds);
      } else {
        setModalProductIds([]);
      }
    } catch {
      setModalProductIds([]);
    }

    setIsModalOpen(true);
  };

  const handleProductToggle = (productId: string) => {
    setModalProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSaveDrop = async () => {
    if (!modalTitle.trim()) {
      setModalError('Title is required.');
      return;
    }

    const discVal = Number(modalDiscountValue);
    if (isNaN(discVal) || discVal <= 0) {
      setModalError('Valid discount value is required.');
      return;
    }

    if (modalDiscountType === 'percentage' && discVal > 100) {
      setModalError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (!modalStartDate || !modalEndDate) {
      setModalError('Both start date and end date are required.');
      return;
    }

    if (new Date(modalStartDate) >= new Date(modalEndDate)) {
      setModalError('End date must be after the start date.');
      return;
    }

    if (modalProductIds.length === 0) {
      setModalError('Please select at least one product for this drop.');
      return;
    }

    setModalSaving(true);
    setModalError('');

    try {
      const payload = {
        title: modalTitle.trim(),
        description: modalDescription.trim() || null,
        discountType: modalDiscountType,
        discountValue: discVal,
        startDate: new Date(modalStartDate).toISOString(),
        endDate: new Date(modalEndDate).toISOString(),
        isActive: modalIsActive,
        productIds: modalProductIds,
      };

      const endpoint = editingDropId
        ? `/api/admin/limited-drops/${editingDropId}`
        : `/api/admin/limited-drops`;
      const method = editingDropId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save drop');
      }

      setIsModalOpen(false);
      await fetchDrops();
    } catch (err: any) {
      setModalError(err?.message || 'Error saving drop');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteDrop = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Limited Drop? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/limited-drops/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete drop.');
        return;
      }
      await fetchDrops();
    } catch (err: any) {
      alert(err?.message || 'Error deleting drop');
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------------------------
  // Banner Handlers (Preserved)
  // ----------------------------------------------------
  const handlePercentageChange = (valStr: string) => {
    setDiscountPercentage(valStr);
    const num = Number(valStr);
    if (!valStr || isNaN(num) || num <= 0 || num > 100) {
      setValidationError('Discount percentage must be a number between 1 and 100.');
    } else {
      setValidationError('');
      setBannerText(`🖤 BLACK FRIDAY — UP TO ${num}% OFF SITEWIDE`);
    }
  };

  const handleSaveBanner = async () => {
    const numPerc = Number(discountPercentage);
    if (isNaN(numPerc) || numPerc <= 0 || numPerc > 100) {
      setValidationError('Please fix errors before saving. Discount percentage must be between 1 and 100.');
      return;
    }

    setValidationError('');
    setBannerApiError('');
    setBannerSaving(true);

    const config = {
      bannerActive,
      discountPercentage: numPerc,
      couponCode: couponCode || 'BLACKFRIDAY',
      bannerText,
      buttonText,
      bannerLink,
    };

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBannerSaved(true);
        await fetchBannerPromotions();
        setTimeout(() => setBannerSaved(false), 3000);
      } else {
        setBannerApiError(data.error || 'Failed to save promotion changes.');
      }
    } catch (err: any) {
      setBannerApiError(err?.message || 'Error saving changes.');
    } finally {
      setBannerSaving(false);
    }
  };

  // Filter products for modal search
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Promotions & Drops Hub</h2>
        <p className="text-[#A89880] text-xs mt-1">
          Manage dynamic flash sale campaigns, limited drops, and sitewide announcement banners.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#2A2420] gap-4">
        <button
          onClick={() => setActiveTab('drops')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'drops'
              ? 'border-[#C9A96E] text-[#C9A96E]'
              : 'border-transparent text-[#A89880] hover:text-[#F5F0E8]'
          }`}
        >
          <Flame className="h-4 w-4" />
          Limited Drops & Flash Sales
        </button>

        <button
          onClick={() => setActiveTab('banner')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'banner'
              ? 'border-[#C9A96E] text-[#C9A96E]'
              : 'border-transparent text-[#A89880] hover:text-[#F5F0E8]'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Black Friday Banner
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: LIMITED DROPS & FLASH SALES */}
      {/* ==================================================== */}
      {activeTab === 'drops' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-4 rounded-xl border border-[#2A2420]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Active & Scheduled Drops</h3>
              <p className="font-sans text-xs text-[#A89880] mt-0.5">
                Drop campaigns automatically show on the homepage when status is LIVE.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C9A96E] hover:bg-[#b0925c] text-[#0D0D0D] font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              Create Limited Drop
            </button>
          </div>

          {dropsLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C9A96E]"></div>
            </div>
          ) : dropsError ? (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
              {dropsError}
            </div>
          ) : drops.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#141414] border border-[#2A2420] rounded-xl space-y-4">
              <Flame className="h-10 w-10 text-[#A89880]/50 mx-auto" />
              <h4 className="font-serif text-lg font-bold text-[#F5F0E8]">No Limited Drops Found</h4>
              <p className="font-sans text-xs text-[#A89880] max-w-md mx-auto">
                Launch your first limited drop campaign to feature exclusive promotional footwear on the homepage.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C9A96E] hover:bg-[#b0925c] text-[#0D0D0D] font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Launch First Drop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drops.map((drop) => {
                const isLive = drop.status === 'LIVE';
                const isScheduled = drop.status === 'SCHEDULED';
                const isEnded = drop.status === 'ENDED';

                return (
                  <div
                    key={drop.id}
                    className={`rounded-xl border p-5 transition-all duration-300 bg-[#141414] ${
                      isLive
                        ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/5'
                        : 'border-[#2A2420]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Status Badge */}
                          {isLive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#8B0000]/20 border border-[#FF6B6B]/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#FF6B6B]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B6B] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B6B]"></span>
                              </span>
                              LIVE DROP
                            </span>
                          )}
                          {isScheduled && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/60 border border-blue-600/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-300">
                              <Clock className="h-3 w-3" />
                              SCHEDULED
                            </span>
                          )}
                          {isEnded && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#2A2420] border border-[#3D352E] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#A89880]">
                              ENDED
                            </span>
                          )}
                          {!drop.isActive && (
                            <span className="inline-flex items-center rounded-full bg-yellow-950/60 border border-yellow-700/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                              DISABLED
                            </span>
                          )}

                          {/* Discount badge */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A96E]/15 border border-[#C9A96E]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#C9A96E]">
                            {drop.discountType === 'fixed'
                              ? `ETB ${drop.discountValue.toLocaleString()} OFF`
                              : `${drop.discountValue}% OFF`}
                          </span>

                          <span className="text-xs text-[#A89880] flex items-center gap-1">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            {drop.productCount} {drop.productCount === 1 ? 'Product' : 'Products'}
                          </span>
                        </div>

                        <h4 className="font-serif text-lg font-bold text-[#F5F0E8]">{drop.title}</h4>
                        {drop.description && (
                          <p className="font-sans text-xs text-[#A89880] line-clamp-2 max-w-2xl">
                            {drop.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#A89880] pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#C9A96E]" />
                            Start: {new Date(drop.startDate).toLocaleString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#C9A96E]" />
                            End: {new Date(drop.endDate).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => openEditModal(drop)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2420] hover:border-[#C9A96E] text-[#F5F0E8] hover:text-[#C9A96E] text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          disabled={deletingId === drop.id}
                          onClick={() => handleDeleteDrop(drop.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/40 hover:border-red-600 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === drop.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: BLACK FRIDAY BANNER (PRESERVED) */}
      {/* ==================================================== */}
      {activeTab === 'banner' && (
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 space-y-6">
          <h3 className="text-[#F5F0E8] font-serif font-bold text-lg border-b border-[#2A2420] pb-3">
            BLACK FRIDAY ANNOUNCEMENT BANNER
          </h3>

          {/* Banner Active Toggle */}
          <div className="flex items-center justify-between bg-[#1A1A1A] p-4 rounded-lg border border-[#2A2420]">
            <div>
              <p className="text-[#F5F0E8] text-sm font-semibold">Enable Black Friday Promotion</p>
              <p className="text-[#A89880] text-xs mt-0.5">
                Controls whether the Black Friday announcement and Claim Offer button appear in the header.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBannerActive(!bannerActive)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                bannerActive ? 'bg-[#C9A96E]' : 'bg-[#2A2420]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  bannerActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Promotion Discount Percentage */}
          <div>
            <label className="block text-[#C9A96E] text-xs font-semibold mb-2 uppercase tracking-wider">
              Promotion Discount Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none transition-colors"
                placeholder="e.g. 10, 20, 30, 40, 50"
              />
              <span className="absolute right-4 top-3 text-[#A89880] text-sm font-bold">%</span>
            </div>
            <p className="text-[#A89880] text-xs mt-1.5">
              This percentage automatically updates the Black Friday banner text and configures the active discount code (
              <code className="text-[#C9A96E]">BLACKFRIDAY</code>).
            </p>
            {validationError && (
              <p className="text-red-400 text-xs mt-1 font-semibold">⚠️ {validationError}</p>
            )}
          </div>

          {/* Banner Message Edit */}
          <div>
            <label className="block text-[#A89880] text-xs font-semibold mb-2 uppercase tracking-wider">
              Banner Announcement Text
            </label>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none transition-colors"
              placeholder="🖤 BLACK FRIDAY — UP TO 50% OFF SITEWIDE"
            />
          </div>

          {/* Button Text & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A89880] text-xs font-semibold mb-2 uppercase tracking-wider">
                Link Text
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none transition-colors"
                placeholder="SHOP NOW"
              />
            </div>

            <div>
              <label className="block text-[#A89880] text-xs font-semibold mb-2 uppercase tracking-wider">
                Link Destination
              </label>
              <input
                type="text"
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none transition-colors"
                placeholder="/shop"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-[#2A2420]">
            <p className="text-[#A89880] text-xs font-semibold mb-2 uppercase tracking-wider">
              Header Banner Preview
            </p>
            <div
              className="rounded-lg px-4 py-3 flex items-center justify-between transition-colors border border-[#C9A96E]/30 shadow-lg"
              style={{
                background: 'linear-gradient(90deg, #4A341B 0%, #121212 100%)',
              }}
            >
              <p className="text-[#F5F0E8] text-xs sm:text-sm font-semibold tracking-wider uppercase truncate">
                {bannerText || `🖤 BLACK FRIDAY — UP TO ${discountPercentage}% OFF SITEWIDE`}&nbsp;
                {buttonText && (
                  <span className="underline underline-offset-2 text-[#C9A96E]">{buttonText}</span>
                )}
              </p>

              <div className="flex items-center gap-3">
                <span className="bg-[#C9A96E] text-[#0D0D0D] text-xs font-bold px-3 py-1 rounded-full">
                  🎁 Claim Offer
                </span>
                {!bannerActive && (
                  <span className="text-red-400 text-xs font-medium bg-red-950/50 px-2 py-0.5 rounded border border-red-800/50">
                    (Disabled)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Save Banner */}
          <div>
            <button
              type="button"
              disabled={bannerSaving}
              onClick={handleSaveBanner}
              className="bg-[#C9A96E] hover:bg-[#b0925c] text-[#0D0D0D] font-bold tracking-widest uppercase text-xs sm:text-sm px-8 py-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {bannerSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {bannerSaved && (
              <p className="text-green-400 text-sm mt-2 font-semibold">
                ✓ Black Friday promotion settings saved successfully!
              </p>
            )}
            {bannerApiError && (
              <p className="text-red-400 text-sm mt-2 font-semibold">⚠️ {bannerApiError}</p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CREATE / EDIT DROP MODAL */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#141414] border border-[#2A2420] rounded-2xl shadow-2xl p-6 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2A2420] pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#F5F0E8]">
                  {editingDropId ? 'Edit Limited Drop' : 'Create New Limited Drop'}
                </h3>
                <p className="font-sans text-xs text-[#A89880] mt-0.5">
                  Configure campaign timing, promotional discount, and attached products.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A89880] hover:text-[#F5F0E8] p-1.5 rounded-lg border border-[#2A2420] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#C9A96E] mb-1.5">
                  Drop Campaign Title *
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Midnight Obsidian Flash Drop"
                  className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A89880] mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="e.g. Ultra-limited release available for 48 hours only. Strictly limited inventory."
                  className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2 text-sm text-[#F5F0E8] focus:border-[#C9A96E] outline-none resize-none"
                />
              </div>

              {/* Discount Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A89880] mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={modalDiscountType}
                    onChange={(e) => setModalDiscountType(e.target.value as any)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (ETB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A89880] mb-1.5">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={modalDiscountValue}
                      onChange={(e) => setModalDiscountValue(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#A89880]">
                      {modalDiscountType === 'percentage' ? '%' : 'ETB'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timing Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A89880] mb-1.5">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#A89880] mb-1.5">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
                  />
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2420]">
                <div>
                  <p className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wider">Campaign Status</p>
                  <p className="text-[11px] text-[#A89880]">Enable or temporarily disable this campaign</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalIsActive(!modalIsActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    modalIsActive ? 'bg-[#C9A96E]' : 'bg-[#2A2420]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      modalIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Product Selection */}
              <div className="space-y-2 pt-2 border-t border-[#2A2420]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#C9A96E]">
                    Select Products ({modalProductIds.length} selected) *
                  </label>
                  {modalProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setModalProductIds([])}
                      className="text-[11px] text-[#FF6B6B] hover:underline font-semibold"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Product Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A89880]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name or category..."
                    className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F5F0E8] focus:border-[#C9A96E] outline-none"
                  />
                </div>

                {/* Products List */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-[#0D0D0D] border border-[#2A2420] rounded-xl">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-4 text-xs text-[#A89880]">No products match your search.</p>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = modalProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleProductToggle(p.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#C9A96E]/20 border border-[#C9A96E]'
                              : 'bg-[#141414] hover:bg-[#1A1A1A] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[#1A1A1A]">
                              <Image
                                src={p.images?.[0] || '/images/placeholder.jpg'}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif text-xs font-bold text-[#F5F0E8] truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-[#A89880]">
                                {p.category} • ETB {p.price.toLocaleString()} • Stock: {p.stock}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D]'
                                : 'border-[#2A2420] bg-[#1A1A1A]'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2420]">
              <button
                type="button"
                disabled={modalSaving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-[#2A2420] text-xs font-bold uppercase tracking-wider text-[#A89880] hover:text-[#F5F0E8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalSaving}
                onClick={handleSaveDrop}
                className="px-6 py-2.5 rounded-lg bg-[#C9A96E] hover:bg-[#b0925c] text-xs font-bold uppercase tracking-wider text-[#0D0D0D] transition-colors disabled:opacity-50"
              >
                {modalSaving ? 'Saving Drop...' : editingDropId ? 'Update Drop' : 'Create Drop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
