import React, { useState, useRef } from 'react';
import { Icons } from '../../constants';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxCount?: number;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxCount = 4,
  label = 'Visual Proof Attachments (Max 4)'
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    setErrorMsg(null);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files (JPEG, PNG, GIF, WebP) are supported.');
        continue;
      }
      // Check size (e.g. max 1MB each to avoid IndexedDB bloat)
      if (file.size > 1.2 * 1024 * 1024) {
        setErrorMsg('To ensure high performance, proof images must be under 1.2MB.');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (images.length + validFiles.length > maxCount) {
      setErrorMsg(`Maximum of ${maxCount} images can be attached.`);
      return;
    }

    const promises = validFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error('Failed to read image content'));
          }
        };
        reader.onerror = () => reject(new Error('File reader error'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(base64Images => {
        onChange([...images, ...base64Images]);
      })
      .catch(err => {
        console.error('Error converting images:', err);
        setErrorMsg('Failed to process image attachment.');
      });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
    setErrorMsg(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
          {label}
        </label>
        <span className="text-[10px] text-slate-500 font-semibold font-mono">
          {images.length} / {maxCount} loaded
        </span>
      </div>

      {/* Upload Drop Zone */}
      {images.length < maxCount && (
        <div
          id="image-dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`group border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-300 font-semibold">
              Drag & drop files or <span className="text-indigo-400 group-hover:underline">browse files</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Accepts PNG, JPG (Max 1.2MB per image to optimize database size)
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/10 px-3 py-1.5 rounded-lg font-medium">
          ⚠️ {errorMsg}
        </p>
      )}

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3.5 mt-2">
          {images.map((base64, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
              <img
                src={base64}
                alt={`Attachment Proof #${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="absolute top-1 right-1 p-1 rounded-md bg-slate-950/80 hover:bg-rose-600/90 text-slate-400 hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a1 1 0 001 1h3m-10 0h11m-10-4a1 1 0 001-1V3a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

