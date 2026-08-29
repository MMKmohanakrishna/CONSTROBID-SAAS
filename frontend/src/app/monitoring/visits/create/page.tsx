"use client";
import React from 'react';
import SiteVisitForm from '../../../../components/monitoring/SiteVisitForm';

export default function CreateVisitPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Create Site Visit</h2>
      <SiteVisitForm onDone={() => { window.location.href = '/monitoring/visits'; }} />
    </div>
  );
}
