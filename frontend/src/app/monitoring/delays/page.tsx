"use client";
import React from 'react';
import DelayDashboard from '../../../components/monitoring/DelayDashboard';
import Link from 'next/link';

export default function DelaysPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Delay Tracking</h2>
        <Link href="/monitoring/" className="px-3 py-1 bg-[#70153a] text-white rounded">Dashboard</Link>
      </div>
      <DelayDashboard />
    </div>
  );
}
