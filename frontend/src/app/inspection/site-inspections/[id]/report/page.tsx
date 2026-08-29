'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function InspectionReportPage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const { setNotification } = useNotification();
  const [data, setData] = useState<any>({ report: {} });
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

  const save = async () => {
    const report = data.report || {};
    try {
      await apiRequest(`/inspection/site-inspections/${id}/report`, { method: 'POST', body: JSON.stringify({ report }) });
      setNotification({
        type: 'success',
        message: 'Saved'
      });
    } catch (e) {
      setNotification({
        type: 'error',
        message: 'Save failed'
      });
    }
  };


  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white rounded-2xl glass-card border border-white/30 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-[var(--primary)]">Inspection Report</h2>
        <textarea aria-label="Inspection report" className="w-full h-64 p-3 border rounded mt-4" value={JSON.stringify(data.report || {}, null, 2)} onChange={(e) => setData({ ...data, report: JSON.parse(e.target.value || '{}') })} />
        <div className="mt-4">
          <button onClick={save} className="px-4 py-2 bg-[var(--primary)] text-white rounded">Save & Submit</button>
        </div>
      </div>
    </div>
  );
}
