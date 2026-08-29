"use client";
import React, { useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function SiteVisitForm({ projectId, onDone }: { projectId?: string; onDone?: () => void }) {
  const [visitDate, setVisitDate] = useState<string>('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await monitoringApi.createVisit({ projectId, visitDate: visitDate || undefined, geoLocation: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : undefined, notes });
      setVisitDate(''); setLat(''); setLng(''); setNotes('');
      if (onDone) onDone();
    } catch (err) {
      alert('Failed to create site visit');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="visitDate" className="block text-sm">Visit Date</label>
        <input id="visitDate" type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full border rounded p-2" aria-label="Visit date" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="lat" className="block text-sm">Latitude</label>
          <input id="lat" type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 12.9716" className="w-full border rounded p-2" aria-label="Latitude" />
        </div>
        <div>
          <label htmlFor="lng" className="block text-sm">Longitude</label>
          <input id="lng" type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 77.5946" className="w-full border rounded p-2" aria-label="Longitude" />
        </div>
      </div>
      <div>
        <label htmlFor="visitNotes" className="block text-sm">Notes</label>
        <textarea id="visitNotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded p-2" rows={4} placeholder="Describe observations, issues or actions" aria-label="Visit notes" />
      </div>
      <div>
        <button type="submit" className="px-4 py-2 bg-[#70153a] text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Create Visit'}</button>
      </div>
    </form>
  );
}
