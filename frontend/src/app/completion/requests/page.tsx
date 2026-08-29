"use client";
import React, { useEffect, useState } from 'react';
import { completionApi } from '../../../lib/api';

export default function CompletionRequestsPage() {
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { completionApi.listRequests().then((r) => setList(Array.isArray(r) ? r : [])).catch(()=>setList([])); }, []);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#70153a]">Completion Requests</h2>
      <div className="mt-4 space-y-3">
        {list.length ? list.map((req) => (
          <div key={req._id} className="p-3 border rounded">
            <div className="text-sm text-gray-500">{new Date(req.requestedAt).toLocaleString()}</div>
            <div className="font-medium">Status: {req.status}</div>
            <div className="text-sm">{req.notes}</div>
          </div>
        )) : <div className="text-sm text-gray-500">No requests yet.</div>}
      </div>
    </div>
  );
}
