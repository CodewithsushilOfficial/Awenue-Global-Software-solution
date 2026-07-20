"use client";

import { useState, useEffect } from 'react';
import { ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';

interface ImageUrlFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  altValue?: string;
  onAltChange?: (alt: string) => void;
  showAlt?: boolean;
  placeholder?: string;
  className?: string;
}

type PreviewState = 'empty' | 'loading' | 'valid' | 'invalid-url' | 'load-error';

function validateImageUrl(raw: string): boolean {
  if (!raw.trim()) return false;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function ImageUrlField({
  value,
  onChange,
  label = 'Image URL',
  altValue,
  onAltChange,
  showAlt = false,
  placeholder = 'https://example.com/image.jpg',
  className = '',
}: ImageUrlFieldProps) {
  const [previewState, setPreviewState] = useState<PreviewState>('empty');
  const [previewSrc, setPreviewSrc] = useState<string>('');

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setPreviewState('empty');
      setPreviewSrc('');
      return;
    }
    if (!validateImageUrl(trimmed)) {
      setPreviewState('invalid-url');
      setPreviewSrc('');
      return;
    }
    setPreviewState('loading');
    setPreviewSrc(trimmed);
  }, [value]);

  const handleImageLoad = () => setPreviewState('valid');
  const handleImageError = () => setPreviewState('load-error');

  const handleRemove = () => {
    onChange('');
    setPreviewState('empty');
    setPreviewSrc('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent placeholder:text-white/25"
          />
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              title="Remove image"
              className="flex-shrink-0 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-text-muted mt-1">
          Enter a publicly accessible HTTPS image URL. Preview updates instantly.
        </p>
      </div>

      {showAlt && onAltChange && (
        <div>
          <label className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1">
            Image Alt Text
          </label>
          <input
            type="text"
            value={altValue ?? ''}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Describe the image for accessibility and SEO"
            className="w-full bg-surface-base border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-accent placeholder:text-white/25"
          />
        </div>
      )}

      <div>
        <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1.5">
          Live Preview
        </span>
        <div className="rounded-xl border border-white/10 bg-surface-base overflow-hidden min-h-[120px] flex items-center justify-center relative">
          {previewSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="Preview"
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`w-full max-h-[200px] object-cover rounded-xl transition-opacity duration-300 ${
                previewState === 'valid' ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
            />
          )}

          {previewState === 'empty' && (
            <div className="flex flex-col items-center gap-2 text-white/20 py-6">
              <ImageIcon size={28} />
              <span className="text-[11px] font-medium">No image selected</span>
            </div>
          )}

          {previewState === 'loading' && (
            <div className="flex flex-col items-center gap-2 text-text-muted py-6">
              <Loader2 size={20} className="animate-spin text-accent" />
              <span className="text-[11px]">Loading preview...</span>
            </div>
          )}

          {previewState === 'invalid-url' && (
            <div className="flex flex-col items-center gap-2 text-amber-400/70 py-6 px-4 text-center">
              <AlertCircle size={20} />
              <span className="text-[11px] font-medium">Please enter a valid image URL (must start with https://)</span>
            </div>
          )}

          {previewState === 'load-error' && (
            <div className="flex flex-col items-center gap-2 text-rose-400/70 py-6 px-4 text-center">
              <AlertCircle size={20} />
              <span className="text-[11px] font-medium">
                Image could not be loaded. Check that the URL is publicly accessible.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
