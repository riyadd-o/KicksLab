import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center flex-1 min-h-[60vh]">
      <AlertCircle className="h-12 w-12 text-[#C9A96E] mb-4" />
      <h1 className="font-serif text-3xl font-bold text-[#F5F0E8]">Product Not Found</h1>
      <p className="font-sans text-sm text-[#A89880] mt-2 max-w-sm">
        The sneaker or footwear style you are looking for does not exist or has been removed from our boutique catalog.
      </p>
      <Link
        href="/shop"
        className="mt-6 rounded-lg bg-[#C9A96E] px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#b8955b] transition-colors"
      >
        Return to Boutique Collection
      </Link>
    </div>
  );
}
