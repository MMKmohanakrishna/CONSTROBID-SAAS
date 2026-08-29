'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

export default function InspectionDetail() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const json = await apiRequest(`/inspection/site-inspections/${id}`);
      setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const start = async () => {
    try {
      await apiRequest(`/inspection/site-inspections/${id}/start`, { method: 'POST' });
      await fetchData();
    } catch (e) { console.error(e); }
  };

  const complete = async () => {
    try {
      await apiRequest(`/inspection/site-inspections/${id}/complete`, { method: 'POST' });
      await fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Not found</div>;

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white rounded-2xl glass-card border border-white/30 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--primary)]">{data.companyName || 'Inspection'}</h2>
            <div className="text-sm text-gray-500">Status: {data.inspectionStatus}</div>
          </div>
          <div className="space-x-2">
            <button onClick={start} className="px-3 py-1 bg-amber-500 text-white rounded">Start</button>
            <button onClick={complete} className="px-3 py-1 bg-green-600 text-white rounded">Complete</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold">Property Details</h3>
            <div className="text-sm text-gray-600">{data.propertyType} • {data.projectCategory}</div>
            <div className="mt-2 text-sm">Address: {data.address}</div>
            <div className="text-sm">City: {data.city}</div>
            <div className="text-sm">Plot Area: {data.plotArea} • Built-up: {data.builtUpArea}</div>
          </div>
          <div>
            <h3 className="font-bold">Measurements</h3>
            <div className="text-sm">Floors: {data.floors} • Bedrooms: {data.bedrooms} • Bathrooms: {data.bathrooms}</div>
            <h3 className="mt-4 font-bold">Files</h3>
            <div className="text-sm">Photos: {(data.photos || []).length}</div>
            <div className="text-sm">Videos: {(data.videos || []).length}</div>
            <div className="text-sm">Documents: {(data.documents || []).length}</div>
          </div>
        </div>

        <div className="mt-6">
          <a href={`/inspection/site-inspections/${id}/report`} className="px-3 py-2 bg-[var(--primary)] text-white rounded">Open Report</a>
        </div>
      </div>
    </div>
  );
}
