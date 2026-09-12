'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Search,
  CheckCircle2,
  Clock,
  EyeOff,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
  ShieldCheck,
  Filter
} from 'lucide-react';
import StarRating from '@/components/ui/StarRating';

interface AdminReview {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    category: string;
  };
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  isFeatured?: boolean;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  hidden: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'HIDDEN'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (ratingFilter !== 'ALL') params.set('rating', ratingFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch admin reviews', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ratingFilter, searchQuery]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Feature on Homepage Toggle
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update featured status.');

      setActionMessage({
        type: 'success',
        text: !currentFeatured ? 'Review marked as Featured on Homepage.' : 'Featured status removed from Homepage.',
      });
      fetchReviews();
      if (selectedReview?.id === id) {
        setSelectedReview({ ...selectedReview, isFeatured: !currentFeatured });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Status Change (Approve, Hide, Pending)
  const handleUpdateStatus = async (id: string, newStatus: 'PENDING' | 'APPROVED' | 'HIDDEN') => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');

      setActionMessage({
        type: 'success',
        text: `Review status set to ${newStatus.toLowerCase()}.`,
      });
      fetchReviews();
      if (selectedReview?.id === id) {
        setSelectedReview({ ...selectedReview, status: newStatus });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Review
  const handleDeleteReview = async () => {
    if (!deleteTargetId) return;
    setActionLoadingId(deleteTargetId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTargetId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete review.');

      setActionMessage({ type: 'success', text: 'Review permanently deleted.' });
      setDeleteTargetId(null);
      if (selectedReview?.id === deleteTargetId) {
        setSelectedReview(null);
      }
      fetchReviews();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Deletion failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E8]">
            Product Reviews Moderation
          </h1>
          <p className="text-xs text-[#A89880] mt-1">
            Review customer feedback, approve verified testimonials, or hide inappropriate comments.
          </p>
        </div>

        <button
          onClick={() => fetchReviews()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2420] text-xs font-semibold text-[#A89880] hover:text-[#F5F0E8] transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#C9A96E]' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border border-red-500/30 text-red-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5">
          <p className="text-xs text-[#A89880] uppercase tracking-wider font-semibold">Total Reviews</p>
          <p className="font-serif text-3xl font-bold text-[#F5F0E8] mt-2">{stats.total}</p>
          <p className="text-[11px] text-[#A89880] mt-1">All submitted reviews</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Pending</p>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#F5F0E8] mt-2">{stats.pending}</p>
          <p className="text-[11px] text-amber-400/80 mt-1">Awaiting moderation</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Published</p>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#F5F0E8] mt-2">{stats.approved}</p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Live on store products</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Hidden</p>
            <EyeOff size={16} className="text-zinc-400" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#F5F0E8] mt-2">{stats.hidden}</p>
          <p className="text-[11px] text-zinc-400/80 mt-1">Archived / Hidden</p>
        </div>
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89880]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, reviewer, or review text..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2420] bg-[#0D0D0D] text-xs text-[#F5F0E8] placeholder-[#5C5346] focus:border-[#C9A96E] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89880] hover:text-[#F5F0E8]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#0D0D0D] border border-[#2A2420] rounded-xl p-1">
            {(['ALL', 'PENDING', 'APPROVED', 'HIDDEN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === st
                    ? 'bg-[#C9A96E] text-[#0D0D0D]'
                    : 'text-[#A89880] hover:text-[#F5F0E8]'
                }`}
              >
                {st === 'APPROVED' ? 'Published' : st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Rating Dropdown */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-[#0D0D0D] border border-[#2A2420] text-xs text-[#F5F0E8] rounded-xl px-3 py-2 focus:border-[#C9A96E] focus:outline-none"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Review Table */}
      <div className="bg-[#141414] border border-[#2A2420] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0A0A] border-b border-[#2A2420] text-[#A89880] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4 sm:px-6">Product</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Rating</th>
                <th className="py-4 px-4 max-w-xs">Review</th>
                <th className="py-4 px-4">Verified</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Featured</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2A2420]">
              {reviews.map((r) => {
                const isItemLoading = actionLoadingId === r.id;

                return (
                  <tr key={r.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    {/* Product */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-[#1F1C18] border border-[#2A2420] shrink-0">
                          <Image
                            src={r.product?.images?.[0] || '/images/placeholder.jpg'}
                            alt={r.product?.name || 'Product'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/shop/${r.product?.slug}`}
                            target="_blank"
                            className="font-bold text-[#F5F0E8] hover:text-[#C9A96E] truncate block max-w-[160px]"
                          >
                            {r.product?.name}
                          </Link>
                          <span className="text-[10px] text-[#A89880] uppercase tracking-wider">
                            {r.product?.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#F5F0E8]">{r.authorName}</p>
                      <p className="text-[11px] text-[#A89880] font-mono truncate max-w-[140px]">
                        {r.authorEmail}
                      </p>
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StarRating rating={r.rating} size={13} />
                      <span className="font-mono text-[11px] text-[#A89880] ml-1">
                        {r.rating}/5
                      </span>
                    </td>

                    {/* Review Snippet */}
                    <td className="py-4 px-4 max-w-xs">
                      {r.title && (
                        <p className="font-bold text-[#F5F0E8] truncate">
                          &ldquo;{r.title}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-[#A89880] line-clamp-2 mt-0.5">
                        {r.comment}
                      </p>
                    </td>

                    {/* Verified */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {r.isVerifiedPurchase ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A89880]">Standard</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {r.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                          Published
                        </span>
                      )}
                      {r.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-500/30">
                          Pending
                        </span>
                      )}
                      {r.status === 'HIDDEN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Featured on Homepage */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {r.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleToggleFeatured(r.id, Boolean(r.isFeatured))}
                          disabled={isItemLoading}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            r.isFeatured
                              ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/50 hover:bg-[#C9A96E]/30'
                              : 'bg-[#1F1C18] text-[#A89880] border border-[#2A2420] hover:text-[#C9A96E] hover:border-[#C9A96E]/40'
                          }`}
                          title={
                            r.isFeatured
                              ? 'Featured on Homepage Boutique Reviews (Click to unfeature)'
                              : 'Click to Feature on Homepage Boutique Reviews'
                          }
                        >
                          <Star size={12} className={r.isFeatured ? 'fill-[#C9A96E]' : ''} />
                          <span>{r.isFeatured ? 'Featured' : 'Feature'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#5C5248] italic">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-[#A89880]">
                      {formatDate(r.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => setSelectedReview(r)}
                          className="p-1.5 rounded-lg text-[#A89880] hover:text-[#F5F0E8] hover:bg-[#1F1C18] transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Approve Button (shown if PENDING or HIDDEN) */}
                        {r.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                            disabled={isItemLoading}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors disabled:opacity-50"
                            title="Approve Review"
                          >
                            <Check size={15} />
                          </button>
                        )}

                        {/* Hide Button (shown if APPROVED or PENDING) */}
                        {r.status !== 'HIDDEN' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'HIDDEN')}
                            disabled={isItemLoading}
                            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-colors disabled:opacity-50"
                            title="Hide Review"
                          >
                            <EyeOff size={15} />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTargetId(r.id)}
                          disabled={isItemLoading}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {reviews.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#A89880]">
                    No reviews found matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          DETAIL MODAL
         ======================================================== */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#2A2420] bg-[#141414] p-6 sm:p-8 text-[#F5F0E8] shadow-2xl">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 text-[#A89880] hover:text-[#F5F0E8]"
            >
              <X size={20} />
            </button>

            <div className="mb-6 pb-4 border-b border-[#2A2420]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E]">
                Review Details
              </span>
              <h3 className="font-serif text-xl font-bold text-[#F5F0E8] mt-1">
                {selectedReview.product?.name}
              </h3>
              <p className="text-xs text-[#A89880] mt-0.5">
                Submitted on {formatDate(selectedReview.createdAt)}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0D0D0D] border border-[#2A2420]">
                <div>
                  <p className="text-[10px] uppercase text-[#A89880] font-semibold">Reviewer</p>
                  <p className="font-bold text-[#F5F0E8] mt-0.5">{selectedReview.authorName}</p>
                  <p className="text-zinc-400 font-mono mt-0.5">{selectedReview.authorEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#A89880] font-semibold">Rating & Verification</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={selectedReview.rating} size={14} />
                    <span className="font-mono">({selectedReview.rating}/5)</span>
                  </div>
                  {selectedReview.isVerifiedPurchase && (
                    <span className="mt-1 text-emerald-400 inline-flex items-center gap-1 font-semibold">
                      <ShieldCheck size={12} /> Verified Buyer
                    </span>
                  )}
                </div>
              </div>

              {selectedReview.title && (
                <div>
                  <p className="text-[10px] uppercase text-[#A89880] font-semibold">Headline</p>
                  <p className="font-serif text-base font-bold text-[#F5F0E8] mt-1">
                    &ldquo;{selectedReview.title}&rdquo;
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase text-[#A89880] font-semibold">Comment</p>
                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#2A2420] text-sm text-[#F5F0E8] mt-1 leading-relaxed whitespace-pre-line">
                  {selectedReview.comment}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#2A2420] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A89880]">Status:</span>
                <span className="text-xs font-bold text-[#F5F0E8] uppercase">
                  {selectedReview.status}
                </span>
                {selectedReview.status === 'APPROVED' && selectedReview.isFeatured && (
                  <span className="text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/20 px-2 py-0.5 rounded-full">
                    ★ Featured
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedReview.status === 'APPROVED' && (
                  <button
                    onClick={() => handleToggleFeatured(selectedReview.id, Boolean(selectedReview.isFeatured))}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                      selectedReview.isFeatured
                        ? 'bg-[#C9A96E] text-[#0D0D0D] hover:bg-[#b8955b]'
                        : 'bg-[#1F1C18] text-[#A89880] border border-[#2A2420] hover:text-[#C9A96E] hover:border-[#C9A96E]'
                    }`}
                  >
                    <Star size={13} className={selectedReview.isFeatured ? 'fill-current' : ''} />
                    <span>{selectedReview.isFeatured ? 'Featured on Home' : 'Feature on Home'}</span>
                  </button>
                )}
                {selectedReview.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReview.id, 'APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Approve
                  </button>
                )}
                {selectedReview.status !== 'HIDDEN' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReview.id, 'HIDDEN')}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#F5F0E8] text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Hide
                  </button>
                )}
                <button
                  onClick={() => {
                    setDeleteTargetId(selectedReview.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
         ======================================================== */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#141414] p-6 text-[#F5F0E8] shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">
                Confirm Deletion
              </h3>
            </div>

            <p className="text-xs text-[#A89880] leading-relaxed">
              Are you sure you want to permanently delete this review? This action cannot be undone and will automatically recalculate the product rating.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl border border-[#2A2420] text-xs font-semibold text-[#A89880] hover:text-[#F5F0E8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={actionLoadingId === deleteTargetId}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {actionLoadingId === deleteTargetId ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
