"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Link, X } from "lucide-react";

interface ImageUploaderProps {
  value: string;           // current image src (url or base64)
  onChange: (src: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image compression function ──────────────────────────────
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      const QUALITY = 0.75; // 75% quality

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = document.createElement("img") as HTMLImageElement;
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Scale down maintaining aspect ratio
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context failed");

          ctx.drawImage(img, 0, 0, width, height);

          // Output as compressed JPEG
          const compressed = canvas.toDataURL("image/jpeg", QUALITY);
          resolve(compressed);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // ── Handle file selection ────────────────────────────────────
  const handleFile = async (file: File) => {
    setError("");

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP).");
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      
      const res = await fetch("/api/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ data: compressed }),
      });
      const { url } = await res.json();
      if (!res.ok) throw new Error("Upload failed");
      
      onChange(url);

      // Show size reduction info in console for dev
      const originalKB = Math.round(file.size / 1024);
      const compressedKB = Math.round((compressed.length * 3) / 4 / 1024);
      console.log(`Image compressed: ${originalKB}KB → ~${compressedKB}KB`);
    } catch {
      setError("Failed to process image. Please try another file.");
    } finally {
      setCompressing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlApply = () => {
    if (!urlInput.trim()) {
      setError("Please enter an image URL.");
      return;
    }
    if (!urlInput.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) {
      setError("URL must be a direct image link ending in .jpg, .png, .webp, etc.");
      return;
    }
    setError("");
    onChange(urlInput.trim());
  };

  return (
    <div className="space-y-3">
      <label className="text-[#F5F0E8] text-sm font-medium">
        Product Image *
      </label>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("upload"); setError(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm 
                      font-medium transition-all border ${
            mode === "upload"
              ? "bg-[#C9A96E] text-[#0D0D0D] border-[#C9A96E]"
              : "bg-[#1A1A1A] text-[#A89880] border-[#2A2420] hover:border-[#C9A96E]"
          }`}
        >
          <Upload size={14} />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => { setMode("url"); setError(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm 
                      font-medium transition-all border ${
            mode === "url"
              ? "bg-[#C9A96E] text-[#0D0D0D] border-[#C9A96E]"
              : "bg-[#1A1A1A] text-[#A89880] border-[#2A2420] hover:border-[#C9A96E]"
          }`}
        >
          <Link size={14} />
          Image URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 
                      text-center cursor-pointer transition-all ${
            dragging
              ? "border-[#C9A96E] bg-[#C9A96E]/5"
              : "border-[#2A2420] hover:border-[#C9A96E]/50 bg-[#141414]"
          }`}
        >
          {compressing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#C9A96E] 
                              border-t-transparent rounded-full animate-spin" />
              <p className="text-[#A89880] text-sm">Compressing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={28} className="text-[#C9A96E]" />
              <p className="text-[#F5F0E8] text-sm font-medium">
                Drop image here or click to browse
              </p>
              <p className="text-[#5C5248] text-xs">
                JPG, PNG, WebP · Max 10MB · Auto-compressed to ~800px
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* URL mode */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setError(""); }}
            placeholder="https://example.com/shoe-image.jpg"
            className="flex-1 bg-[#1A1A1A] border border-[#2A2420] 
                       text-[#F5F0E8] placeholder-text-muted
                       focus:border-[#C9A96E] focus:outline-none 
                       rounded-lg px-4 py-3 text-sm"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleUrlApply}
            className="bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] 
                       font-semibold text-sm px-4 py-3 rounded-lg 
                       transition-all whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {/* Image preview */}
      {value && (
        <div className="relative">
          <div className="relative w-full h-48 rounded-xl overflow-hidden 
                          border border-[#2A2420] bg-[#141414]">
            <Image
              src={value}
              alt="Product preview"
              fill
              sizes="400px"
              className="object-contain"
              onError={() => {
                setError("Could not load image. Check the URL or try uploading.");
                onChange("");
              }}
            />
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => { onChange(""); setUrlInput(""); setError(""); }}
            className="absolute top-2 right-2 w-7 h-7 bg-[#0D0D0D]/80 
                       hover:bg-red-500 text-[#F5F0E8] rounded-full 
                       flex items-center justify-center transition-all"
          >
            <X size={14} />
          </button>
          <p className="text-[#5C5248] text-xs mt-1 text-center">
            ✓ Image ready
            {value.startsWith("data:") && " · Compressed & saved"}
          </p>
        </div>
      )}
    </div>
  );
}
