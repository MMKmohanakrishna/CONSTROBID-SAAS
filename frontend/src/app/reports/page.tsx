"use client";
import React from 'react';

export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ul className="mt-4 list-disc pl-6">
        <li><a className="text-blue-600" href="/api/reports/inspection/csv">Download Inspection CSV</a></li>
        <li><a className="text-blue-600" href="/api/reports/monitoring/csv">Download Monitoring CSV</a></li>
        <li><a className="text-blue-600" href="/api/reports/completion/csv">Download Completion CSV</a></li>
      </ul>
    </div>
  );
}
