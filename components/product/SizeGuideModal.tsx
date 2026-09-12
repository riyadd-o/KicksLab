'use client';

import React, { useEffect } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIZE_CHART = [
  { eu: 36, usm: '-', usw: '5', uk: '3', cm: '22.5' },
  { eu: 37, usm: '-', usw: '6', uk: '4', cm: '23.5' },
  { eu: 38, usm: '5', usw: '7', uk: '5', cm: '24.5' },
  { eu: 39, usm: '6', usw: '8', uk: '6', cm: '25.0' },
  { eu: 40, usm: '7', usw: '9', uk: '6.5', cm: '25.5' },
  { eu: 41, usm: '8', usw: '10', uk: '7.5', cm: '26.5' },
  { eu: 42, usm: '9', usw: '11', uk: '8.5', cm: '27.0' },
  { eu: 43, usm: '10', usw: '-', uk: '9.5', cm: '28.0' },
  { eu: 44, usm: '11', usw: '-', uk: '10.5', cm: '28.5' },
  { eu: 45, usm: '12', usw: '-', uk: '11.5', cm: '29.5' },
  { eu: 46, usm: '13', usw: '-', uk: '12', cm: '30.0' },
];

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#141414] border border-[#2A2420] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A2420] bg-[#16120C]">
          <div className="flex items-center gap-2.5">
            <Ruler className="h-5 w-5 text-[#C9A96E]" />
            <div>
              <h3 className="font-serif text-xl font-bold text-[#F5F0E8]">Footwear Size Guide</h3>
              <p className="font-sans text-xs text-[#A89880]">International sizing & foot measurement conversion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A89880] hover:text-[#F5F0E8] hover:bg-[#1F1C18] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="font-sans text-xs sm:text-sm text-[#A89880] leading-relaxed bg-[#0D0D0D] border border-[#2A2420] p-3.5 rounded-xl">
            💡 <strong className="text-[#F5F0E8]">Fit Guidance:</strong> KicksLab sneakers are true to size. If you are between sizes, we recommend ordering one size up for athletic sneakers and your exact size for loafers.
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#2A2420]">
            <table className="w-full text-left text-xs sm:text-sm font-sans">
              <thead className="bg-[#1A1A1A] text-xs uppercase tracking-wider text-[#F5F0E8] border-b border-[#2A2420]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold text-[#C9A96E]">EU</th>
                  <th scope="col" className="px-4 py-3 font-bold">US Men</th>
                  <th scope="col" className="px-4 py-3 font-bold">US Women</th>
                  <th scope="col" className="px-4 py-3 font-bold">UK</th>
                  <th scope="col" className="px-4 py-3 font-bold">Foot (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2420] bg-[#0D0D0D]">
                {SIZE_CHART.map((row) => (
                  <tr key={row.eu} className="hover:bg-[#1A1A1A]/60 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-[#C9A96E]">{row.eu}</td>
                    <td className="px-4 py-2.5 text-[#F5F0E8]">{row.usm}</td>
                    <td className="px-4 py-2.5 text-[#F5F0E8]">{row.usw}</td>
                    <td className="px-4 py-2.5 text-[#A89880]">{row.uk}</td>
                    <td className="px-4 py-2.5 text-[#A89880]">{row.cm} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#2A2420] bg-[#0D0D0D] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#C9A96E] hover:bg-[#b8955b] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
