"use client";
import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "border-green-500 bg-[#141414]",
    error:   "border-red-500 bg-[#141414]",
    info:    "border-[#C9A96E] bg-[#141414]",
  };
  const icons = {
    success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    error:   <X size={16} className="text-red-400 shrink-0" />,
    info:    <CheckCircle size={16} className="text-[#C9A96E] shrink-0" />,
  };

  return (
    // Fixed top-right — always visible regardless of scroll position
    <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 border-l-4 ${colors[type]} rounded-lg px-4 py-3 shadow-xl max-w-xs animate-slide-in-right`}>
      {icons[type]}
      <p className="text-[#F5F0E8] text-sm">{message}</p>
      <button onClick={onClose} className="text-[#5C5248] hover:text-[#F5F0E8] ml-1">
        <X size={14} />
      </button>
    </div>
  );
}
