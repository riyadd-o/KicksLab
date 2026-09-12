'use client';

interface SizeSelectorProps {
  sizes: number[];
  selectedSize: number | null;
  onSizeSelect: (size: number) => void;
}

export default function SizeSelector({
  sizes,
  selectedSize,
  onSizeSelect,
}: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {sizes.map((size) => {
        const isSelected = selectedSize === size;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onSizeSelect(size)}
            className={`flex h-12 min-w-12 items-center justify-center rounded-lg border font-sans text-sm font-semibold tracking-wider transition-all duration-300 ${
              isSelected
                ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0D] shadow-sm scale-[1.03]'
                : 'border-[#2A2420] bg-[#141414] text-[#F5F0E8] hover:border-[#C9A96E] hover:text-[#C9A96E]'
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
