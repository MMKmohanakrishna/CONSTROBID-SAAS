"use client";
import React, { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(()=>{
    fetch('/api/inspection/dashboard', { credentials: 'include' }).then(r=>r.ok? r.json():null).then(setData).catch(()=>setData(null));
  },[]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <pre className="mt-4 bg-gray-100 p-4 rounded">{data ? JSON.stringify(data, null, 2) : 'No data'}</pre>
    </div>
  );
}
