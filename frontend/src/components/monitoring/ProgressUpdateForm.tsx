"use client";
import React, { useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function ProgressUpdateForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const [percent, setPercent] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await monitoringApi.createUpdate({ projectId, percentComplete: percent === '' ? undefined : Number(percent), notes });
      setPercent(''); setNotes('');
      if (onDone) onDone();
    } catch (err) {
      alert('Failed to submit update');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div>
        <label htmlFor="percentComplete" className="block text-sm">Percent Complete</label>
        <input
          id="percentComplete"
          name="percentComplete"
          type="number"
          min={0}
          max={100}
          value={percent as any}
          onChange={(e) => setPercent(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full border rounded p-2"
          placeholder="e.g., 50"
          aria-label="Percent complete"
        />
      </div>
      <div>
        <label htmlFor="updateNotes" className="block text-sm">Notes</label>
        <textarea
          id="updateNotes"
          name="updateNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Add details about progress, delays or issues"
          aria-label="Progress notes"
        />
      </div>
      <div>
        <button type="submit" className="px-3 py-2 bg-[#70153a] text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save Update'}</button>
      </div>
    </form>
  );
}
