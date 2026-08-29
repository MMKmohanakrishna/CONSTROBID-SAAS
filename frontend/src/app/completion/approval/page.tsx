"use client";
import React, { useState } from 'react';
import { completionApi } from '../../../lib/api';

export default function ClientApprovalPage() {
  const [certificateId, setCertificateId] = useState('');

  async function sign() {
    try {
      await completionApi.signHandover(certificateId, { role: 'CLIENT', name: 'Client' });
      alert('Signed');
    } catch (err) { alert('Failed to sign'); }
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#70153a]">Client Approval</h2>
      <div className="mt-4">
        <label htmlFor="certificateId" className="block text-sm">Certificate ID</label>
        <input id="certificateId" title="Certificate ID" placeholder="Enter certificate id to sign" value={certificateId} onChange={(e)=>setCertificateId(e.target.value)} className="w-full border rounded p-2" />
        <div className="mt-2"><button onClick={sign} className="px-3 py-2 rounded bg-[#efc975]">Sign Certificate</button></div>
      </div>
    </div>
  );
}
