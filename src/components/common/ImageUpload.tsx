"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MdClose, MdCloudUpload } from "react-icons/md";

interface ImageUploadProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** Existing remote image URL (for edit mode) */
  currentUrl?: string | null;
  /** Currently selected local file (controlled) */
  file?: File;
  onChange: (file: File | undefined) => void;
  accept?: string;
  helperText?: string;
  error?: string;
}

export function ImageUpload({
  label = "Image",
  required,
  disabled,
  currentUrl,
  file,
  onChange,
  accept = "image/*",
  helperText,
  error,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = previewUrl || currentUrl || null;

  const clear = () => {
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="text-gray-700 mb-2 flex text-xs sm:text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {displayUrl ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
            {file && !disabled && (
              <button
                type="button"
                onClick={clear}
                className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm text-slate-700 hover:text-red-600"
                aria-label="Remove selected image"
              >
                <MdClose className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary-subtle flex flex-col items-center justify-center text-slate-500 hover:text-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdCloudUpload className="w-8 h-8" />
            <span className="text-xs mt-1">Upload</span>
          </button>
        )}

        <div className="flex-1 min-w-0">
          {displayUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-primary-subtle text-primary hover:bg-primary-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdCloudUpload className="w-4 h-4" />
                Change image
              </button>
              {file && !disabled && (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          )}
          {!displayUrl && (
            <p className="text-xs text-slate-500 mt-1">
              Click the upload area to choose an image.
            </p>
          )}
          {file && (
            <p className="text-xs text-slate-500 mt-1 truncate">
              {file.name} &middot; {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
          {!file && currentUrl && (
            <p className="text-xs text-slate-500 mt-1">
              Current image will be kept if no new file is selected.
            </p>
          )}
          {helperText && !error && (
            <p className="text-xs text-slate-500 mt-1">{helperText}</p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          onChange(f);
        }}
      />
    </div>
  );
}

export default ImageUpload;
