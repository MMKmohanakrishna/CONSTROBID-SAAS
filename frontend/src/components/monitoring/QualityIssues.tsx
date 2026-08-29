"use client";
import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function QualityIssues({ projectId }: { projectId?: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    monitoringApi.listUpdates({ projectId }).then((u) => {
      const q = Array.isArray(u) ? u.filter((x: any) => /QUALITY|quality|quality check|quality:/i.test(x.notes || '')) : [];
      setItems(q);
    }).catch(() => setItems([]));
  }, [projectId]);

  return (
    <div className="space-y-3">
      {items.length ? items.map((it) => (
        <div key={it._id} className="p-3 border rounded">
          <div className="text-xs text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
          <div className="mt-1">{it.notes}</div>
        </div>
      )) : <div className="text-sm text-gray-500">No quality issues recorded.</div>}
    </div>
  );
}
