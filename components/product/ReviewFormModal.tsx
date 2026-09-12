'use client';

import { useState, useEffect } from 'react';
import { Star, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
  } | null;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor - Not what I expected',
  2: 'Fair - Could be better',
  3: 'Good - Meets expectations',
  4: 'Very Good - Recommended',
  5: 'Excellent - Exceeded expectations',
};

export default function ReviewFormModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  existingReview,
  onSuccess,
}: ReviewFormModalProps) {
  const isEditing = !!existingReview?.id;

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state if existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setTitle('');
      setComment('');
    }
    setError(null);
    setSuccessMessage(null);
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError('Please provide your review thoughts.');
      return;
    }

    if (trimmedComment.length > 2000) {
      setError('Your review cannot exceed 2000 characters.');
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 100) {
      setError('Review headline cannot exceed 100 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const url = isEditing
        ? `/api/customer/reviews/${existingReview.id}`
        : `/api/products/${productId}/reviews`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: trimmedTitle || null,
          comment: trimmedComment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSuccessMessage(
        isEditing
          ? 'Review updated! It will be reviewed by moderation.'
          : 'Thank you! Your verified review has been submitted for moderation.'
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#2A2420] bg-[#141414] p-6 sm:p-8 shadow-2xl text-[#F5F0E8]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 text-[#A89880] hover:text-[#F5F0E8] transition-colors p-1 rounded-lg hover:bg-[#1F1C18]"
          aria-label="Close review dialog"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
            {isEditing ? 'Update Review' : 'Verified Buyer Review'}
          </span>
          <h2 id="modal-headline" className="mt-1 font-serif text-2xl font-bold text-[#F5F0E8]">
            {isEditing ? 'Edit Your Review' : 'Write a Review'}
          </h2>
          <p className="mt-1 text-xs text-[#A89880] line-clamp-1 font-medium">
            {productName}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-4 text-emerald-300 text-xs font-semibold animate-in zoom-in-95">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-500/30 p-4 text-red-300 text-xs font-medium animate-in zoom-in-95">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Stars Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-2">
              Your Rating <span className="text-[#C9A96E]">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center space-x-1.5"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeStarRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-[#C9A96E]"
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        size={28}
                        className={`transition-colors duration-150 ${
                          isFilled
                            ? 'fill-[#C9A96E] text-[#C9A96E]'
                            : 'text-[#3E3832] fill-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="font-sans text-xs text-[#A89880] font-medium pl-2">
                {RATING_LABELS[activeStarRating] || ''}
              </span>
            </div>
          </div>

          {/* Headline / Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="review-title" className="block text-xs font-bold uppercase tracking-wider text-[#F5F0E8]">
                Review Headline <span className="text-xs text-[#A89880] font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[10px] text-[#A89880]">
                {title.length}/100
              </span>
            </div>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="e.g., Unbelievable comfort and sleek silhouette"
              className="w-full rounded-xl border border-[#2A2420] bg-[#0D0D0D] px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5346] focus:border-[#C9A96E] focus:outline-none focus:ring-1 focus:ring-[#C9A96E] transition-all"
            />
          </div>

          {/* Review Text */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="review-comment" className="block text-xs font-bold uppercase tracking-wider text-[#F5F0E8]">
                Your Review <span className="text-[#C9A96E]">*</span>
              </label>
              <span className="text-[10px] text-[#A89880]">
                {comment.length}/2000
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              required
              placeholder="Tell others about the comfort, materials, fit, and how they feel on foot..."
              className="w-full rounded-xl border border-[#2A2420] bg-[#0D0D0D] px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#5C5346] focus:border-[#C9A96E] focus:outline-none focus:ring-1 focus:ring-[#C9A96E] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Moderation Note */}
          <p className="text-[11px] text-[#A89880] leading-relaxed">
            All reviews undergo verification by our concierge team to maintain community authenticity. 
            {isEditing && ' Modifying your review will temporarily move it to Pending Review until re-moderated.'}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#2A2420] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#A89880] hover:bg-[#1A1A1A] hover:text-[#F5F0E8] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A96E] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Submit Review'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
