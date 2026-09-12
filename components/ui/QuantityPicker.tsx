'use client';

import { Plus, Minus } from 'lucide-react';

interface QuantityPickerProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityPicker({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: QuantityPickerProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-[#2A2420] bg-[#141414] overflow-hidden">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="flex h-11 w-11 items-center justify-center text-[#F5F0E8] hover:bg-[#1A1A1A] hover:text-[#C9A96E] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#F5F0E8] transition-colors duration-200"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      
      <span className="flex w-12 justify-center font-sans text-sm font-semibold text-[#F5F0E8] select-none">
        {quantity}
      </span>
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="flex h-11 w-11 items-center justify-center text-[#F5F0E8] hover:bg-[#1A1A1A] hover:text-[#C9A96E] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#F5F0E8] transition-colors duration-200"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
