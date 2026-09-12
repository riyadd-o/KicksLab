'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ShieldCheck, CheckCircle, AlertTriangle, ArrowLeft, Loader2, Package } from 'lucide-react';

function GuestReviewForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('A valid guest review link is required. Please check the link from your delivery email.');
      setLoading(false);
      return;
    }

    fetch(`/api/reviews/guest?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to verify review permission.');
        }
        setOrderInfo(data);
        if (data.preferredProductId) {
          setSelectedProductId(data.preferredProductId);
        } else if (data.items && data.items.length > 0) {
          const firstUnreviewed = data.items.find((i: any) => !i.alreadyReviewed) || data.items[0];
          setSelectedProductId(firstUnreviewed.productId);
        }
      })
      .catch((err) => {
        setError(err.message || 'Invalid or expired review authorization.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProductId) return;

    if (!comment.trim() || comment.trim().length < 5) {
      setFormError('Please write at least 5 characters in your review comment.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const res = await fetch('/api/reviews/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          productId: selectedProductId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#F5F0E8] space-y-4">
        <Loader2 className="animate-spin text-[#C9A96E]" size={40} />
        <p className="text-sm text-[#A89880]">Verifying your verified purchase authorization...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#141414] border border-red-500/30 rounded-2xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#F5F0E8]">Review Authorization Unavailable</h2>
        <p className="text-sm text-[#A89880] leading-relaxed">{error}</p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C9A96E] hover:text-[#E2C792] transition-colors"
          >
            <ArrowLeft size={16} /> Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#141414] border border-emerald-500/30 rounded-2xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <CheckCircle size={36} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#F5F0E8]">Review Submitted!</h2>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
          <ShieldCheck size={16} /> Verified Buyer Review
        </div>
        <p className="text-sm text-[#A89880] leading-relaxed">
          Thank you, <strong className="text-[#F5F0E8]">{orderInfo?.customerName}</strong>! Your review for Order{' '}
          <strong className="text-[#C9A96E]">#{orderInfo?.orderNumber}</strong> has been submitted. It will appear on the product page as soon as our moderation team approves it.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto bg-[#C9A96E] hover:bg-[#B8985D] text-[#0D0D0D] text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl transition-colors"
          >
            Explore More Kicks
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto bg-[#1A1A1A] hover:bg-[#2A2420] border border-[#2A2420] text-[#F5F0E8] text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl transition-colors"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  const selectedItem = orderInfo?.items?.find((i: any) => i.productId === selectedProductId) || orderInfo?.items?.[0];

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-10 bg-[#141414] border border-[#2A2420] rounded-2xl shadow-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#C9A96E] text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck size={18} /> Verified Guest Purchase
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F0E8]">Write a Product Review</h1>
        <p className="text-xs text-[#A89880] mt-2">
          Order <span className="text-[#F5F0E8] font-bold">#{orderInfo?.orderNumber}</span> · Reviewing as{' '}
          <span className="text-[#F5F0E8] font-medium">{orderInfo?.customerEmail}</span>
        </p>
      </div>

      {/* Select Item to Review if multiple */}
      {orderInfo?.items && orderInfo.items.length > 1 && (
        <div>
          <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-3">
            Choose an Item to Review:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderInfo.items.map((item: any) => {
              const isSelected = item.productId === selectedProductId;
              return (
                <button
                  type="button"
                  key={item.productId}
                  disabled={item.alreadyReviewed}
                  onClick={() => setSelectedProductId(item.productId)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    item.alreadyReviewed
                      ? 'opacity-40 border-[#2A2420] bg-[#1A1A1A]/30 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 ring-1 ring-[#C9A96E]'
                      : 'border-[#2A2420] bg-[#1A1A1A] hover:border-[#5C5248]'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-[#0D0D0D]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#F5F0E8] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#A89880]">Size: {item.size || 'N/A'}</p>
                    {item.alreadyReviewed && (
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">✓ Reviewed</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Product Card */}
      {selectedItem && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2420]">
          <img
            src={selectedItem.image}
            alt={selectedItem.name}
            className="w-16 h-16 rounded-lg object-cover bg-[#0D0D0D] border border-[#2A2420]"
          />
          <div>
            <h3 className="text-sm font-bold text-[#F5F0E8]">{selectedItem.name}</h3>
            <p className="text-xs text-[#A89880]">
              {selectedItem.size ? `Size: ${selectedItem.size} · ` : ''}
              ETB {(selectedItem.price || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {selectedItem?.alreadyReviewed ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle size={18} />
          <span>You have already submitted a review for this product from your order. Thank you!</span>
        </div>
      ) : (
        /* Review Submission Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={filled ? 'text-[#C9A96E] fill-[#C9A96E]' : 'text-[#5C5248]'}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-[#C9A96E] ml-2">
                {rating} / 5 {rating === 5 ? 'Exceptional' : rating === 4 ? 'Great' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
              Review Headline (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Incredibly comfortable and stylish!"
              maxLength={100}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
              Review Comments *
            </label>
            <textarea
              required
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about the fit, quality, comfort, and aesthetics of your new footwear..."
              maxLength={2000}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-xl p-4 text-sm text-[#F5F0E8] placeholder-[#5C5248] focus:border-[#C9A96E] focus:outline-none transition-colors resize-none"
            />
            <p className="text-right text-[11px] text-[#5C5248] mt-1">{comment.length} / 2000</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#C9A96E] hover:bg-[#B8985D] disabled:opacity-50 text-[#0D0D0D] font-bold text-xs uppercase tracking-widest py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Submitting Review...
              </>
            ) : (
              'Submit Verified Review'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function GuestReviewPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#C9A96E]" size={36} />
          </div>
        }
      >
        <GuestReviewForm />
      </Suspense>
    </div>
  );
}
