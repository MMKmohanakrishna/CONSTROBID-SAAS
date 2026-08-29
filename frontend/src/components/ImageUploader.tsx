"use client";

import React, { useCallback, useState, useRef, useEffect } from 'react';

type UploadResult = { url: string; publicId: string | null };

export default function ImageUploader({
  onUploadComplete,
  maxFiles = 10,
}: {
  onUploadComplete?: (items: UploadResult[]) => void;
  maxFiles?: number;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/uploads';

  const onFilesAdded = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, maxFiles - selectedFiles.length);
    const newPreviews = arr.map((f) => URL.createObjectURL(f));
    setSelectedFiles((s) => [...s, ...arr]);
    setPreviews((p) => [...p, ...newPreviews]);
    // auto-start upload
    uploadFiles(arr);
  }, [maxFiles, selectedFiles.length]);

  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await uploadSingle(file, (p) => setProgress(Math.round(p))); // per-file progress
        results.push(res);
      } catch (err) {
        console.error('Upload failed for', file.name, err);
        alert(`Upload failed for ${file.name}: ${String(err)}`);
      }
    }

    setUploading(false);
    setProgress(0);
    if (onUploadComplete) onUploadComplete(results);
  };

  const uploadSingle = (file: File, onProgress?: (percent: number) => void): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('images', file);

      xhr.open('POST', API_URL, true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            // server returns an array even when single file uploaded
            const item = Array.isArray(json) ? json[0] : json;
            resolve({ url: item.url, publicId: item.publicId || null });
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(fd);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFilesAdded(e.dataTransfer.files);
  };

  const handleBrowse = () => {
    inputRef.current?.click();
  };

  const removePreview = (index: number) => {
    setSelectedFiles((s) => s.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (progressRef.current) {
      // update width imperatively to avoid inline JSX style prop
      progressRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-xl p-4 bg-white border-[#7A002C]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-primary">Upload photos</h4>
            <p className="text-xs text-gray-500">Drag & drop images here or browse files. JPG, PNG, WEBP supported. Max {maxFiles} files.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBrowse} className="px-3 py-2 bg-[#7A002C] text-white rounded-xl">Browse Files</button>
          </div>
        </div>

        <label htmlFor="project-photos" className="sr-only">Upload project photos</label>
        <input id="project-photos" ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => onFilesAdded(e.target.files)} aria-label="Upload project photos" title="Upload project photos" />

        <div className="mt-3 grid grid-cols-3 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border bg-white">
              <img src={p} alt={`preview-${i}`} className="w-full h-28 object-cover" />
              <button onClick={() => removePreview(i)} className="absolute top-2 right-2 bg-white/80 rounded-full p-1" aria-label={`Remove image ${i + 1}`} title={`Remove image ${i + 1}`}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {uploading && (
          <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div ref={progressRef} className="h-2 bg-[#7A002C]" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
