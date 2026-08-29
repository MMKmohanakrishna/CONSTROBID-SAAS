"use client";
import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function MonitoringWidget() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    monitoringApi.summary()
      .then((d) => { if (mounted) setData(d); })
      .catch((e) => { if (mounted) setError(String(e.message || e)); });
    return () => { mounted = false; };
  }, []);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="p-4 bg-[#70153a] text-white rounded">
        <div className="text-sm">Projects Under Monitoring</div>
        <div className="text-2xl font-bold">{data.projectsUnderMonitoring}</div>
      </div>
      <div className="p-4 bg-[#efc975] text-black rounded">
        <div className="text-sm">Total Updates</div>
        <div className="text-2xl font-bold">{data.totalUpdates}</div>
      </div>
      <div className="p-4 bg-white text-black rounded border">
        <div className="text-sm">Site Visits</div>
        <div className="text-2xl font-bold">{data.totalVisits}</div>
      </div>
      <div className="p-4 bg-white text-black rounded border">
        <div className="text-sm">Delayed Projects</div>
        <div className="text-2xl font-bold">{data.delayedCount}</div>
      </div>
    </div>
  );
}
