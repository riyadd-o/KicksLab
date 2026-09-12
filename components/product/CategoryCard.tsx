'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  name: string;
  image: string;
  count: number;
}

export default function CategoryCard({ name, image, count }: CategoryCardProps) {
  return (
    <Link href={`/shop?category=${name}`} className="relative h-[280px] w-full overflow-hidden rounded-xl group cursor-pointer block border border-[#2A2420] bg-[#141414]">
      
      {/* Image */}
      <Image
        src={image}
        alt={name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Text */}
      <div className="absolute bottom-4 left-4">
        <p className="text-[#C9A96E] text-xs tracking-widest uppercase mb-1">
          {count} Products
        </p>
        <h3 className="text-[#F5F0E8] text-xl font-bold">{name}</h3>
        <div className="h-0.5 w-6 bg-[#C9A96E] mt-1.5" />
      </div>

    </Link>
  );
}
