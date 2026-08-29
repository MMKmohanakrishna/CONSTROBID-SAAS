"use client";
import React from 'react';
import QualityForm from '../../../components/monitoring/QualityForm';
import Link from 'next/link';

export default function QualityPage() {
  // project context could be passed; for demo show form without projectId
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quality Tracking</h2>
        <Link href="/monitoring/" className="px-3 py-1 bg-[#70153a] text-white rounded">Dashboard</Link>
      </div>
      <div className="max-w-2xl">
        <QualityForm projectId={''} />
      </div>
    </div>
  );
}
