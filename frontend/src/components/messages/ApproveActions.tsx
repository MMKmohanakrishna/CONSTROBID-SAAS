"use client";
import React from 'react';
import { apiRequest } from '@/lib/api';

export default function ApproveActions({ projectId }: { projectId?: string }) {
  async function approve() {
    if (!projectId) return;
    await apiRequest(
  '/messages/approve',
  {
    method: 'POST',
    body: JSON.stringify({ projectId })
  }
);
    // TODO: toast
  }

  async function requestChanges() {
    if (!projectId) return;
    await apiRequest(
  '/messages/request-changes',
  {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      notes: 'Please revise the foundation plan'
    })
  }
);
  }

  return (
    <div className="flex items-center gap-2">
      
      <button onClick={approve} className="px-3 py-1 rounded-lg bg-green-500 text-white">Approve</button>
    </div>
  );
}
