'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  ChevronDown, 
  AlertCircle,
  LogIn,
  SlidersHorizontal,
  ThumbsUp
} from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import ReviewFormModal from './ReviewFormModal';

interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface DistributionItem {
  stars: number;
  count: number;
  percentage: number;
}

interface UserEligibility {
  isLoggedIn: boolean;
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  existingReview?: {
    id: string;
    status: string;
    rating: number;
    title: string | null;
    comment: string;
  } | null;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  onRatingLoaded?: (avg: number, count: number) => void;
}

export default function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  onRatingLoaded,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [userEligibility, setUserEligibility] = useState<UserEligibility>({
    isLoggedIn: false,
    hasPurchased: false,
    alreadyReviewed: false,
  });

  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestNotice, setGuestNotice] = useState(false);
  const [nonBuyerNotice, setNonBuyerNotice] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}/reviews?sort=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalReviews(data.totalReviews || 0);
        setAverageRating(data.averageRating || 0);
        setDistribution(data.distribution || []);
        if (data.userEligibility) {
          setUserEligibility(data.userEligibility);
        }
        if (onRatingLoaded) {
          onRatingLoaded(data.averageRating || 0, data.totalReviews || 0);
        }
      }
    } catch (e) {
      console.error('Failed to fetch reviews', e);
    } finally {
      setLoading(false);
    }
  }, [productId, sort, onRatingLoaded]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleWriteReviewClick = () => {
    setGuestNotice(false);
    setNonBuyerNotice(false);

    if (!userEligibility.isLoggedIn) {
      setGuestNotice(true);
      return;
    }

    if (!userEligibility.hasPurchased) {
      setNonBuyerNotice(true);
      return;
    }

    setIsModalOpen(true);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section id="reviews-section" className="mt-20 pt-16 border-t border-[#2A2420]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
            Customer Feedback
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E8]">
            Reviews & Ratings
          </h2>
          <p className="mt-2 text-sm text-[#A89880] max-w-xl">
            Verified experiences and fit impressions from KicksLab sneaker collectors.
          </p>
        </div>

        {/* Write a Review Button */}
        <div>
          {userEligibility.alreadyReviewed ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                You reviewed this product
              </span>
              <Link
                href="/account/reviews"
                className="text-xs font-bold uppercase tracking-wider text-[#A89880] hover:text-[#F5F0E8] underline"
              >
                Manage
              </Link>
            </div>
          ) : (
            <button
              onClick={handleWriteReviewClick}
              className="rounded-xl bg-[#C9A96E] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]/90 transition-all duration-300 shadow-md inline-flex items-center gap-2"
            >
              <MessageSquare size={16} />
              <span>Write a Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Notice Modal/Banner */}
      {guestNotice && (
        <div className="mb-8 p-5 rounded-2xl border border-[#C9A96E]/30 bg-[#1A1815] text-[#F5F0E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <LogIn className="h-5 w-5 text-[#C9A96E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#F5F0E8]">Sign in to write a review</h4>
              <p className="text-xs text-[#A89880] mt-0.5">
                Reviews are available exclusively to verified buyers who have received this product.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuestNotice(false)}
              className="text-xs text-[#A89880] hover:text-[#F5F0E8] px-3 py-1.5"
            >
              Dismiss
            </button>
            <Link
              href={`/signin?redirect=/shop/${productSlug}#reviews-section`}
              className="rounded-lg bg-[#C9A96E] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0D0D0D] hover:bg-[#C9A96E]/90 transition-colors shrink-0"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Non-Purchaser Notice */}
      {nonBuyerNotice && (
        <div className="mb-8 p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-[#F5F0E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#F5F0E8]">Verified Purchase Required</h4>
              <p className="text-xs text-[#A89880] mt-0.5">
                Reviews are available to customers who have purchased and received this product.
              </p>
            </div>
          </div>
          <button
            onClick={() => setNonBuyerNotice(false)}
            className="text-xs text-[#A89880] hover:text-[#F5F0E8] px-3 py-1.5 self-end sm:self-auto"
          >
            Got It
          </button>
        </div>
      )}

      {/* Breakdown and Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 rounded-2xl border border-[#2A2420] bg-[#141414] mb-12">
        {/* Left: Overall Score */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-4 lg:border-r lg:border-[#2A2420]">
          {totalReviews > 0 ? (
            <>
              <div className="font-serif text-6xl font-extrabold text-[#F5F0E8] tracking-tight">
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-3">
                <StarRating rating={averageRating} size={22} />
              </div>
              <p className="mt-2 text-sm font-semibold text-[#A89880]">
                Based on {totalReviews} {totalReviews === 1 ? 'verified review' : 'verified reviews'}
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 rounded-full font-medium">
                <ShieldCheck size={14} />
                100% Verified Purchases
              </div>
            </>
          ) : (
            <div className="py-4">
              <StarRating rating={0} size={22} />
              <h3 className="mt-4 font-serif text-xl font-bold text-[#F5F0E8]">
                No reviews yet
              </h3>
              <p className="mt-1 text-xs text-[#A89880] max-w-xs">
                Be the first to review this product once your order has been delivered.
              </p>
            </div>
          )}
        </div>

        {/* Right: Distribution Bars */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-3 px-2 sm:px-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A89880] mb-1">
            Rating Breakdown
          </h4>
          {[5, 4, 3, 2, 1].map((starLevel) => {
            const row = distribution.find((d) => d.stars === starLevel) || {
              stars: starLevel,
              count: 0,
              percentage: 0,
            };

            return (
              <div key={starLevel} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-[#F5F0E8] font-bold flex items-center gap-1 shrink-0">
                  {starLevel} <Star size={12} className="fill-[#C9A96E] text-[#C9A96E]" />
                </span>

                {/* Progress Bar Container */}
                <div className="flex-1 h-2.5 bg-[#1F1C18] rounded-full overflow-hidden border border-[#2A2420]">
                  <div
                    className="h-full bg-[#C9A96E] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>

                <span className="w-14 text-right text-[#A89880] font-mono shrink-0">
                  {row.count} ({row.percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List Toolbar */}
      {totalReviews > 0 && (
        <div className="flex items-center justify-between border-b border-[#2A2420] pb-4 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[#F5F0E8]">
            Customer Opinions ({totalReviews})
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#A89880]" />
            <span className="text-xs text-[#A89880]">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-[#141414] border border-[#2A2420] text-xs text-[#F5F0E8] rounded-lg px-3 py-1.5 focus:border-[#C9A96E] focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-[#2A2420] bg-[#141414] p-6 transition-all duration-200 hover:border-[#3E3832]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#1F1C18] border border-[#C9A96E]/40 flex items-center justify-center font-bold text-xs text-[#C9A96E]">
                  {r.authorName?.[0] || 'V'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F0E8] leading-none">
                    {r.authorName}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} />
                        Verified Buyer
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <StarRating rating={r.rating} size={14} />
                <span className="text-xs text-[#A89880]">{formatDate(r.createdAt)}</span>
              </div>
            </div>

            {/* Review Title */}
            {r.title && (
              <h5 className="font-serif text-base font-bold text-[#F5F0E8] mb-2">
                &ldquo;{r.title}&rdquo;
              </h5>
            )}

            {/* Review Comment */}
            <p className="text-sm text-[#A89880] leading-relaxed whitespace-pre-line font-sans">
              {r.comment}
            </p>
          </div>
        ))}

        {totalReviews === 0 && !loading && (
          <div className="text-center py-12 border border-dashed border-[#2A2420] rounded-2xl bg-[#141414]/50">
            <MessageSquare className="h-10 w-10 text-[#5C5346] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">
              No Approved Reviews Yet
            </h3>
            <p className="text-xs text-[#A89880] mt-1 max-w-sm mx-auto">
              Ordered this pair? Share your impressions once your package arrives to help fellow collectors.
            </p>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
        onSuccess={() => {
          fetchReviews();
        }}
      />
    </section>
  );
}
