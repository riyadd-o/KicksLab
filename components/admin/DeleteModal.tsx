"use client";
import { Trash2, X } from "lucide-react";

interface DeleteModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onConfirm:  () => void;
  title:      string;
  message:    string;
  isDeleting: boolean;
}

export default function DeleteModal({
  isOpen, onClose, onConfirm, title, message, isDeleting
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-[#141414] border border-[#2A2420] 
                      rounded-2xl p-6 w-full max-w-sm shadow-2xl">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 
                          flex items-center justify-center">
            <Trash2 size={24} className="text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[#F5F0E8] text-lg font-bold text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-[#A89880] text-sm text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 bg-[#1A1A1A] hover:bg-border border border-[#2A2420]
                       text-[#F5F0E8] font-semibold text-sm py-3 rounded-xl 
                       transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50
                       text-white font-semibold text-sm py-3 rounded-xl 
                       transition-colors disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5C5248] hover:text-[#F5F0E8] 
                     transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
