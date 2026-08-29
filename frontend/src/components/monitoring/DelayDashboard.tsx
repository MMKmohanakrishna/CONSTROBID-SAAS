"use client";
import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function DelayDashboard() {
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    monitoringApi.listUpdates().then((u) => setUpdates(Array.isArray(u) ? u.filter((x: any) => /delay|delayed|delay/i.test(x.notes || '')) : [])).catch(() => setUpdates([]));
  }, []);

  const byReason = updates.reduce((acc: any, u: any) => { const r = (u.notes || 'Unspecified').slice(0,50); acc[r] = (acc[r] || 0) + 1; return acc; }, {});

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Delay Dashboard</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 border rounded">
          <div className="font-medium">Active Delays</div>
          <div className="text-2xl font-bold mt-2">{updates.length}</div>
        </div>
        <div className="p-3 border rounded">
          <div className="font-medium">Top Reasons</div>
          <ul className="mt-2 list-disc list-inside">
            {Object.entries(byReason).map(([r, count]) => (<li key={String(r)}>{r} — {String(count)}</li>))}
          </ul>
        </div>
      </div>
    </div>
  );
}
