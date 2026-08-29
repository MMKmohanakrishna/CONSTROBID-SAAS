"use client";
import React from 'react';

export default function FilePreviewCard({ url, name }: { url: string; name?: string }) {
  return (
    <div className="p-3 rounded-lg bg-white border flex items-center gap-3">
      <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">PDF</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{name || 'File'}</div>
        <div className="text-xs text-slate-500">Preview only — download disabled</div>
      </div>
      <button className="text-xs text-[#6B0F2D]">View</button>
    </div>
  );
}
