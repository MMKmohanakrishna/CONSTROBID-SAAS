"use client";
import React from 'react';

export default function MonitoringPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Project Monitoring Dashboard</h1>

      <div className="p-4 border rounded-md bg-white/80">
        <p className="text-sm text-gray-700">Monitoring widget unavailable. Placeholder KPIs will appear here.</p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600">This dashboard shows live KPIs for monitored projects. Use the navigation to view project lists and details.</p>
      </div>
    </div>
  );
}
