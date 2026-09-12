import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showText?: boolean;
}

export default function StarRating({ rating, size = 16, showText = false }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center space-x-1">
      {/* Full Stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="fill-cognac text-cognac"
        />
      ))}

      {/* Half Star */}
      {hasHalf && (
        <StarHalf
          size={size}
          className="fill-cognac text-cognac"
        />
      )}

      {/* Empty Stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-border-beige fill-transparent"
        />
      ))}

      {showText && (
        <span className="font-sans text-xs font-medium text-muted-brown pl-1.5">
          {rating.toFixed(1)} / 5.0
        </span>
      )}
    </div>
  );
}
