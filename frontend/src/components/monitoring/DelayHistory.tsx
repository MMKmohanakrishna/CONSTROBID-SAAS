"use client";
import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function DelayHistory({ projectId }: { projectId?: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    monitoringApi.listUpdates({ projectId }).then((u) => {
      const delays = Array.isArray(u) ? u.filter((x: any) => /delay|delayed|DELAY|FLAGGED|FLAG/i.test(x.notes || '')) : [];
      setItems(delays);
    }).catch(() => setItems([]));
  }, [projectId]);

  return (
    <div className="space-y-3">
      {items.length ? items.map((it) => (
        <div key={it._id} className="p-3 border rounded">
          <div className="text-xs text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
          <div className="font-medium">{it.percentComplete !== undefined ? `Progress ${it.percentComplete}%` : 'Delay'}</div>
          <div className="mt-1">{it.notes}</div>
        </div>
      )) : <div className="text-sm text-gray-500">No delay history.</div>}
    </div>
  );
}
