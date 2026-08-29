'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function CreateInspection() {
  const { token } = useAuth();
  const router = useRouter();
  const { setNotification } = useNotification();
  const [form, setForm] = useState<any>({ projectId: '', clientId: '', inspectionDate: '', city: '', address: '', propertyType: '', projectCategory: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const json = await apiRequest('/inspection/site-inspections', { method: 'POST', body: JSON.stringify(form) });
      router.push(`/inspection/site-inspections/${json._id}`);
    } catch (e) {
      setNotification({
        type: 'error',
        message: 'Error creating inspection'
      });
      console.error(e);
    } finally { setLoading(false); }
  };


  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white rounded-2xl glass-card border border-white/30 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-[var(--primary)]">Create Inspection</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input className="w-full p-3 border rounded" placeholder="Project ID" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
          <input className="w-full p-3 border rounded" placeholder="Client ID" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
          <input aria-label="Inspection date" type="datetime-local" className="w-full p-3 border rounded" value={form.inspectionDate} onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })} />
          <input className="w-full p-3 border rounded" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="w-full p-3 border rounded" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="w-full p-3 border rounded" placeholder="Property Type" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} />
          <textarea className="w-full p-3 border rounded" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--primary)] text-white rounded" disabled={loading}>Create</button>
            <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
