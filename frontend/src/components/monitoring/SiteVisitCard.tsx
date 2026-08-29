"use client";
import React from 'react';

export default function SiteVisitCard({ visit }: { visit: any }) {
  return (
    <div className="p-3 border rounded">
      <div className="text-sm text-gray-600">{visit.visitDate ? new Date(visit.visitDate).toLocaleString() : new Date(visit.createdAt).toLocaleString()}</div>
      <div className="font-medium">Inspector: {visit.inspectorId || 'N/A'}</div>
      <div className="mt-2">{visit.notes}</div>
      {visit.geoLocation && <div className="text-xs text-gray-500 mt-2">Lat: {visit.geoLocation.lat} Lng: {visit.geoLocation.lng}</div>}
    </div>
  );
}
