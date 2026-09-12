'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MessageSquare, 
  PackageCheck, 
  CheckCircle2, 
  Clock, 
  EyeOff, 
  Edit3, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import ReviewFormModal from '@/components/product/ReviewFormModal';

interface WaitingReview {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  purchasedSize: string;
  orderNumber: string;
  orderDate: string;
}

interface CustomerReview {
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
  rating: number;
  title: string | null;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  displayStatus: string;
  createdAt: string;
  updatedAt: string;
  isVerifiedPurchase: boolean;
}

export default function CustomerReviewsPage() {
  const [waitingReviews, setWaitingReviews] = useState<WaitingReview[]>([]);
  const [myReviews, setMyReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string>('');
  const [activeProductName, setActiveProductName] = useState<string>('');
  const [activeExistingReview, setActiveExistingReview] = useState<{
    id: string;
    rating: number;
    title: string | null;
    comment: string;
  } | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/customer/reviews');
      if (!res.ok) {
        throw new Error('Failed to load your reviews.');
      }
      const data = await res.json();
      setWaitingReviews(data.waitingReviews || []);
      setMyReviews(data.myReviews || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openWriteModal = (item: WaitingReview) => {
    setActiveProductId(item.productId);
    setActiveProductName(item.productName);
    setActiveExistingReview(null);
    setModalOpen(true);
  };

  const openEditModal = (review: CustomerReview) => {
    setActiveProductId(review.productId);
    setActiveProductName(review.product.name);
    setActiveExistingReview({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    });
    setModalOpen(true);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#A89880]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A96E] mb-3" />
        <p className="text-xs font-semibold uppercase tracking-wider">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Page Title */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E8]">
          My Reviews
        </h1>
        <p className="font-sans text-xs text-[#A89880] mt-1">
          Share impressions on delivered sneakers and track your published ratings.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-500/30 p-4 text-red-300 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          SECTION 1: ITEMS WAITING FOR YOUR REVIEW
         ======================================================== */}
      <section className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-5 border-b border-[#2A2420] mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F5F0E8] flex items-center gap-2">
              <PackageCheck className="text-[#C9A96E]" size={20} />
              Items Waiting for Your Review
            </h2>
            <p className="text-xs text-[#A89880] mt-1">
              Delivered purchases eligible for a verified buyer review.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20 px-2.5 py-1 rounded-full">
            {waitingReviews.length}
          </span>
        </div>

        {waitingReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitingReviews.map((item) => (
              <div
                key={item.productId + item.orderNumber}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#2A2420] bg-[#0D0D0D] hover:border-[#3E3832] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2420] shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/shop/${item.productSlug}`}
                      className="text-sm font-bold text-[#F5F0E8] hover:text-[#C9A96E] transition-colors truncate block"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-[#A89880] mt-0.5">
                      Size: <span className="text-[#F5F0E8] font-medium">{item.purchasedSize}</span>
                    </p>
                    <p className="text-[11px] text-[#5C5346] mt-0.5 font-mono">
                      Order #{item.orderNumber}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openWriteModal(item)}
                  className="rounded-xl bg-[#C9A96E] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0D0D] hover:bg-[#C9A96E]/90 transition-colors shrink-0 shadow-xs"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#A89880]">
            <CheckCircle2 className="h-8 w-8 text-[#5C5346] mx-auto mb-2" />
            <p>You have reviewed all your delivered purchases!</p>
          </div>
        )}
      </section>

      {/* ========================================================
          SECTION 2: YOUR REVIEWS
         ======================================================== */}
      <section className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-5 border-b border-[#2A2420] mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F5F0E8] flex items-center gap-2">
              <MessageSquare className="text-[#C9A96E]" size={20} />
              Your Reviews
            </h2>
            <p className="text-xs text-[#A89880] mt-1">
              Feedback submitted by your account across all products.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#1F1C18] text-[#F5F0E8] border border-[#2A2420] px-2.5 py-1 rounded-full">
            {myReviews.length}
          </span>
        </div>

        {myReviews.length > 0 ? (
          <div className="space-y-4">
            {myReviews.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-xl border border-[#2A2420] bg-[#0D0D0D] space-y-4 hover:border-[#3E3832] transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2420] shrink-0">
                      <Image
                        src={r.product?.images?.[0] || '/images/placeholder.jpg'}
                        alt={r.product?.name || 'Product'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/shop/${r.product?.slug}`}
                        className="text-sm font-bold text-[#F5F0E8] hover:text-[#C9A96E] transition-colors"
                      >
                        {r.product?.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={r.rating} size={14} />
                        <span className="text-xs text-[#A89880]">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges & Action */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {r.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        Published
                      </span>
                    )}
                    {r.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-500/20">
                        <Clock size={12} className="text-amber-400" />
                        Pending Review
                      </span>
                    )}
                    {r.status === 'HIDDEN' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <EyeOff size={12} />
                        Hidden
                      </span>
                    )}

                    <button
                      onClick={() => openEditModal(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#A89880] hover:text-[#C9A96E] hover:bg-[#1A1A1A] border border-[#2A2420] transition-colors"
                    >
                      <Edit3 size={13} />
                      <span>Edit Review</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="pl-1 space-y-1">
                  {r.title && (
                    <h4 className="font-serif text-sm font-bold text-[#F5F0E8]">
                      &ldquo;{r.title}&rdquo;
                    </h4>
                  )}
                  <p className="text-xs text-[#A89880] leading-relaxed whitespace-pre-line">
                    {r.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#A89880]">
            <MessageSquare className="h-8 w-8 text-[#5C5346] mx-auto mb-2" />
            <p>You have not written any reviews yet.</p>
          </div>
        )}
      </section>

      {/* Write / Edit Review Modal */}
      <ReviewFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={activeProductId}
        productName={activeProductName}
        existingReview={activeExistingReview}
        onSuccess={() => {
          fetchReviews();
        }}
      />
    </div>
  );
}
