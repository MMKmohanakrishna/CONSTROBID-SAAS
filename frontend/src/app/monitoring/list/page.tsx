"use client";
import React from 'react';
import MonitoringList from '../../../components/monitoring/MonitoringList';

export default function MonitoringListPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Monitored Projects</h2>
      <MonitoringList />
    </div>
  );
}
