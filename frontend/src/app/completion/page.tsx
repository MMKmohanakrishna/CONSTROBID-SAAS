"use client";
import React, { useEffect, useState } from 'react';
import { completionApi } from '../../lib/api';

export default function CompletionDashboard() {
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    // lightweight summary: counts
    Promise.all([completionApi.listRequests(), completionApi.getHandover?.('')]).then(() => {
      completionApi.listRequests().then((r) => setSummary((s: any) => ({ ...s, requests: Array.isArray(r) ? r.length : 0 }))).catch(()=>{});
    }).catch(()=>{});
  }, []);


  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-[#70153a]">Completion Dashboard</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded shadow-sm">
          <div className="text-sm text-gray-500">Completion Requests</div>
          <div className="text-2xl font-bold">{summary.requests ?? '—'}</div>
        </div>
        <div className="p-4 border rounded shadow-sm">
          <div className="text-sm text-gray-500">Open Punch Items</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="p-4 border rounded shadow-sm">
          <div className="text-sm text-gray-500">Pending Handover</div>
          <div className="text-2xl font-bold">—</div>
        </div>
      </div>
    </div>
  );
}
