"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";

interface ProfilePhotoUploadProps {
  photoUrl: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

export default function ProfilePhotoUpload({
  photoUrl,
  onUploadSuccess,
  onRemove,
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result;

        const res = await fetch("/api/upload?folder=profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64Data }),
        });

        const data = await res.json();
        if (res.ok) {
          onUploadSuccess(data.url);
        } else {
          setError(data.error || "Failed to upload image.");
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-start gap-6">
      {/* Photo Preview */}
      <div className="relative group shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#2A2420] bg-[#1A1A1A] flex items-center justify-center relative">
          {isUploading ? (
            <Loader2 className="animate-spin text-[#C9A96E]" size={28} />
          ) : photoUrl ? (
            <Image
              src={photoUrl}
              alt="Profile Photo"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <User className="text-[#5C5248]" size={40} />
          )}

          {/* Hover overlay to trigger upload */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[#F5F0E8] focus:outline-none"
          >
            <Camera size={24} />
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col justify-center gap-2 pt-2">
        <h4 className="text-[#F5F0E8] font-bold text-sm">Profile Photo</h4>
        <p className="text-[#A89880] text-xs max-w-xs">
          Recommended: Square image, at least 400x400px. Max size 5MB.
        </p>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold uppercase tracking-widest text-[#C9A96E] hover:text-[#E8C896] transition-colors"
          >
            {photoUrl ? "Change Photo" : "Upload Photo"}
          </button>

          {photoUrl && (
            <button
              type="button"
              disabled={isUploading}
              onClick={onRemove}
              className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
