'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function CreateDesign() {
  const router = useRouter();
  const { setNotification } = useNotification();
  const [form, setForm] = useState<any>({ projectId: '', comments: '' });

  const submit = async (event: any) => {
    event.preventDefault();
    try {
      const json = await apiRequest('/inspection/design', { method: 'POST', body: JSON.stringify(form) });
      router.push(`/inspection/design/${json._id}`);
    } catch (error) {
      setNotification({ type: 'error', message: 'Error' });
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white rounded-2xl glass-card border border-white/30 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-[var(--primary)]">New Design Package</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            aria-label="Project ID"
            className="w-full p-3 border rounded"
            placeholder="Project ID"
            value={form.projectId}
            onChange={(event) => setForm({ ...form, projectId: event.target.value })}
          />
          <textarea
            aria-label="Comments"
            className="w-full p-3 border rounded"
            placeholder="Comments"
            value={form.comments}
            onChange={(event) => setForm({ ...form, comments: event.target.value })}
          />
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#70153a] text-white rounded">Create</button>
            <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
