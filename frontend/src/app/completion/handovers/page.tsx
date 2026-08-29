"use client";
import React, { useEffect, useState } from 'react';
import { completionApi } from '../../../lib/api';

export default function HandoversPage() {
  const [handovers, setHandovers] = useState<any[]>([]);

  useEffect(() => { /* no list endpoint provided; reuse verifications as placeholder */ completionApi.listVerifications().then(()=>{}).catch(()=>{}); }, []);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#70153a]">Handover Certificates</h2>
      <div className="mt-4 text-sm text-gray-500">Certificate management and signing available via project handover endpoints.</div>
    </div>
  );
}
