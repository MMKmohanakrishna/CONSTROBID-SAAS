'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function DesignDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    apiRequest(`/inspection/design/${id}`).then(setData).catch(console.error);
  }, [id]);

  const submit = async () => {
    await apiRequest(`/inspection/design/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'SUBMITTED' }) });
    const updated = await apiRequest(`/inspection/design/${id}`);
    setData(updated);
  };

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="text-xl font-bold text-[var(--primary)]">Design Package</h2>
        <div className="mt-4 text-sm text-gray-700 space-y-2">
          <div>Status: {data.status}</div>
          <div>Design files: {(data.designFiles || []).length}</div>
          <div>Floor plans: {(data.floorPlans || []).length}</div>
          <div>Elevations: {(data.elevations || []).length}</div>
        </div>
        <button onClick={submit} className="mt-4 px-4 py-2 bg-[#70153a] text-white rounded">
          Submit
        </button>
      </div>
    </div>
  );
}
