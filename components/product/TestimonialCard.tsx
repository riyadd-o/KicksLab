'use client';

import { Quote } from 'lucide-react';
import StarRating from '../ui/StarRating';

interface TestimonialCardProps {
  name: string;
  location?: string | null;
  quote: string;
  rating: number;
  title?: string | null;
  productName?: string | null;
}

export default function TestimonialCard({
  name,
  location,
  quote,
  rating,
  title,
  productName,
}: TestimonialCardProps) {
  return (
    <div className="relative flex flex-col rounded-xl border border-[#2A2420] bg-[#141414] p-6 sm:p-8 transition-all duration-300 hover:border-[#C9A96E]/40 hover:shadow-lg hover:shadow-black/50">
      {/* Editorial Quote Icon */}
      <Quote className="absolute right-6 top-6 sm:right-8 sm:top-8 h-8 w-8 text-[#2A2420] stroke-[1] pointer-events-none" />
      
      {/* Stars */}
      <div className="mb-3">
        <StarRating rating={rating} size={14} />
      </div>

      {/* Title if present */}
      {title && (
        <h4 className="font-serif text-base font-bold text-[#F5F0E8] mb-2 leading-snug">
          &ldquo;{title}&rdquo;
        </h4>
      )}

      {/* Quote text */}
      <blockquote className="flex-1 font-serif text-sm sm:text-base italic text-[#C8B8A8] leading-relaxed mb-6">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author info */}
      <div className="border-t border-[#2A2420] pt-4 mt-auto">
        <cite className="not-italic flex flex-col">
          <span className="font-sans text-xs sm:text-sm font-bold tracking-wider text-[#F5F0E8] uppercase">
            {name}
          </span>
          <span className="font-sans text-[11px] text-[#A89880] mt-0.5">
            {location ? location : productName ? `Verified Buyer • ${productName}` : 'Verified Buyer'}
          </span>
        </cite>
      </div>
    </div>
  );
}
